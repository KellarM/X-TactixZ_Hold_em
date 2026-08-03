// ============================================================
// POST-FLOP CERTIFICATION AUDIT WORKER
// 
// Runs Monte Carlo simulation for a given flop (3 fixed community cards).
// For each round:
//   1. Shuffles the 29 remaining cards (Fisher-Yates CSPRNG)
//   2. Deals Turn + River (with burn cards, matching live game protocol)
//   3. Evaluates all 10 Card hands and 7 Rank positions
//   4. Tracks wins
//
// Reports: observed win % vs true odds from probability matrix,
// observed RTP at various target RTP values.
//
// Also supports Full Enumeration mode (all 406 Turn+River combos)
// for exact baseline comparison.
// ============================================================

const RANK_LABELS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_LABELS = ['clubs','diamonds','hearts','spades'];

function enc(rankLabel, suitLabel) {
  return RANK_LABELS.indexOf(rankLabel) * 4 + SUIT_LABELS.indexOf(suitLabel);
}

// Fixed player hands
const HANDS = [
  [enc('A','diamonds'), enc('10','hearts')],
  [enc('K','clubs'),    enc('K','spades')],
  [enc('Q','clubs'),    enc('J','spades')],
  [enc('Q','spades'),   enc('10','spades')],
  [enc('J','clubs'),    enc('9','clubs')],
  [enc('8','diamonds'), enc('6','diamonds')],
  [enc('7','diamonds'), enc('7','spades')],
  [enc('4','hearts'),   enc('2','hearts')],
  [enc('3','clubs'),    enc('3','hearts')],
  [enc('A','hearts'),   enc('5','diamonds')],
];

const PLAYER_SET = new Set(HANDS.flat());
const DECK32 = [];
for (let r = 0; r < 13; r++)
  for (let s = 0; s < 4; s++) {
    const c = r * 4 + s;
    if (!PLAYER_SET.has(c)) DECK32.push(c);
  }

const HAND_LABELS = ['A♦10♥','K♣K♠','Q♣J♠','Q♠10♠','J♣9♣','8♦6♦','7♦7♠','4♥2♥','3♣3♥','A♥5♦'];
const RANK_NAMES = ['1 Pair', '2 Pair', '3 Of A Kind', 'Straight', 'Flush', 'Full House', '4 Of A Kind'];

// ── Precomputed 7-choose-5 combos ─────────────────────────────
const COMBOS_7_5 = [
  [0,1,2,3,4],[0,1,2,3,5],[0,1,2,3,6],[0,1,2,4,5],[0,1,2,4,6],
  [0,1,2,5,6],[0,1,3,4,5],[0,1,3,4,6],[0,1,3,5,6],[0,1,4,5,6],
  [0,2,3,4,5],[0,2,3,4,6],[0,2,3,5,6],[0,2,4,5,6],[0,3,4,5,6],
  [1,2,3,4,5],[1,2,3,4,6],[1,2,3,5,6],[1,2,4,5,6],[1,3,4,5,6],
  [2,3,4,5,6]
];

const B1=14, B2=196, B3=2744, B4=38416, B5=537824;

// ── Card encoding helpers (for decoding flop from message) ──
const SUIT_SYMBOLS = { clubs:'♣', diamonds:'♦', hearts:'♥', spades:'♠' };

function cardLabel(c) {
  return RANK_LABELS[c >> 2] + SUIT_SYMBOLS[SUIT_LABELS[c & 3]];
}

function parseCard(label) {
  // Parse labels like "A♦", "10♣", "2♥"
  const suitMap = { '♣':'clubs', '♦':'diamonds', '♥':'hearts', '♠':'spades' };
  const suit = suitMap[label.slice(-1)];
  const rank = label.slice(0, -1);
  return enc(rank, suit);
}

// ── Inlined 5-card strength evaluation ───────────────────────
function eval5(c0, c1, c2, c3, c4) {
  const r0=c0>>2, r1=c1>>2, r2=c2>>2, r3=c3>>2, r4=c4>>2;
  const s0=c0&3, s1=c1&3, s2=c2&3, s3=c3&3, s4=c4&3;

  let a=r0,b=r1,c=r2,d=r3,e=r4;
  if(a<b){const t=a;a=b;b=t;} if(c<d){const t=c;c=d;d=t;}
  if(a<c){const t=a;a=c;c=t;} if(b<d){const t=b;b=d;d=t;}
  if(b<c){const t=b;b=c;c=t;} if(d<e){const t=d;d=e;e=t;}
  if(c<d){const t=c;c=d;d=t;} if(d<e){const t=d;d=e;e=t;}

  const flush = (s0===s1 && s1===s2 && s2===s3 && s3===s4);

  let isStraight = false, straightHigh = 0;
  if (a!==b && b!==c && c!==d && d!==e) {
    if (a - e === 4) { isStraight = true; straightHigh = a; }
    else if (a===12 && b===3 && c===2 && d===1 && e===0) { isStraight = true; straightHigh = 3; }
  }

  const counts = [1,0,0,0,0]; const vals = [a,0,0,0,0];
  let gi = 0; let prev = a;
  for (let i = 1; i < 5; i++) {
    const v = [b,c,d,e][i-1];
    if (v === prev) { counts[gi]++; }
    else { gi++; counts[gi] = 1; vals[gi] = v; prev = v; }
  }
  const nGroups = gi + 1;
  for (let i = 0; i < nGroups - 1; i++) {
    for (let j = 0; j < nGroups - 1 - i; j++) {
      if (counts[j] < counts[j+1] || (counts[j] === counts[j+1] && vals[j] < vals[j+1])) {
        const tc = counts[j]; counts[j] = counts[j+1]; counts[j+1] = tc;
        const tv = vals[j]; vals[j] = vals[j+1]; vals[j+1] = tv;
      }
    }
  }

  const fc = counts[0], fv = vals[0];
  const sc = counts[1] || 0, sv = vals[1] || 0;

  if (isStraight && flush) {
    if (straightHigh === 12) return 9*B5;
    return 8*B5 + straightHigh*B1;
  }
  if (fc === 4) return 7*B5 + fv*B1 + sv;
  if (fc === 3 && sc === 2) return 6*B5 + fv*B1 + sv;
  if (flush) return 5*B5 + a*B4 + b*B3 + c*B2 + d*B1 + e;
  if (isStraight) return 4*B5 + straightHigh*B1;
  if (fc === 3) return 3*B5 + fv*B2 + sv*B1 + (counts[2]||0)*1 + (vals[2]||0);
  if (fc === 2 && sc === 2) return 2*B5 + fv*B2 + sv*B1 + (counts[2]||0)*1 + (vals[2]||0);
  if (fc === 2) return 1*B5 + fv*B3 + sv*B2 + (counts[2]||0)*B1 + (vals[2]||0) + (counts[3]||0)*1 + (vals[3]||0);
  return a*B4 + b*B3 + c*B2 + d*B1 + e;
}

function catFromStrength(s) {
  return Math.floor(s / B5) - 1;
}

function best7(h0, h1, b0, b1, b2, b3, b4) {
  const all = [h0, h1, b0, b1, b2, b3, b4];
  let best = 0;
  for (let i = 0; i < 21; i++) {
    const idx = COMBOS_7_5[i];
    const s = eval5(all[idx[0]], all[idx[1]], all[idx[2]], all[idx[3]], all[idx[4]]);
    if (s > best) best = s;
  }
  return best;
}

// ── CSPRNG shuffle ────────────────────────────────────────────
let _workDeck = new Int16Array(29);

function secureRandInt(max) {
  if (max === 0) return 0;
  let mask = 1;
  while (mask <= max) mask = (mask << 1) | 1;
  const arr = new Uint32Array(1);
  let val;
  do {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
      val = arr[0] & mask;
    } else {
      return (Math.random() * (max + 1)) | 0;
    }
  } while (val > max);
  return val;
}

// ── Main run handler ───────────────────────────────────────────
function handleRun(payload) {
  const { callId, flopCards, rounds, trueProbabilities, mode } = payload;
  // flopCards: array of 3 card labels (e.g., ["2♣","2♦","2♠"])
  // rounds: number of Monte Carlo rounds
  // trueProbabilities: { cardProbs: [10 floats], rankProbs: [7 floats] } from matrix
  // mode: 'monte-carlo' or 'enumeration'

  // Parse flop cards
  const flop = flopCards.map(parseCard);
  const flopSet = new Set(flop);

  // Build remaining 29 cards
  const remaining = [];
  for (let d = 0; d < 32; d++) {
    if (!flopSet.has(DECK32[d])) remaining.push(DECK32[d]);
  }

  // Initialize win counters
  const cardWins = [0,0,0,0,0,0,0,0,0,0];
  const rankWins = [0,0,0,0,0,0,0];
  let boardWins = 0;
  let total = 0;

  const PROGRESS_INTERVAL = 10000;

  if (mode === 'enumeration') {
    // Full enumeration of all C(29,2) = 406 combos
    const R = remaining.length;
    for (let t = 0; t < R; t++) {
      for (let r = t + 1; r < R; r++) {
        const b0 = flop[0], b1 = flop[1], b2 = flop[2], b3 = remaining[t], b4 = remaining[r];
        const boardStr = eval5(b0, b1, b2, b3, b4);

        let bestHandStr = 0;
        const handStrs = [0,0,0,0,0,0,0,0,0,0];
        let boardBeatsAll = true;

        for (let h = 0; h < 10; h++) {
          const hs = best7(HANDS[h][0], HANDS[h][1], b0, b1, b2, b3, b4);
          handStrs[h] = hs;
          if (hs >= boardStr) boardBeatsAll = false;
          if (hs > bestHandStr) bestHandStr = hs;
        }

        if (!boardBeatsAll) {
          for (let h = 0; h < 10; h++) {
            if (handStrs[h] === bestHandStr) cardWins[h]++;
          }
          const winCat = catFromStrength(bestHandStr);
          if (winCat >= 0 && winCat <= 6) rankWins[winCat]++;
        } else {
          boardWins++;
        }
        total++;
      }
    }
  } else {
    // Monte Carlo
    for (let round = 0; round < rounds; round++) {
      // Shuffle remaining 29 cards (Fisher-Yates)
      for (let i = 0; i < 29; i++) _workDeck[i] = remaining[i];
      for (let i = 28; i > 0; i--) {
        const j = secureRandInt(i);
        const tmp = _workDeck[i]; _workDeck[i] = _workDeck[j]; _workDeck[j] = tmp;
      }
      // Turn at position [1] (after burn at [0]), River at position [3] (after burn at [2])
      const b0 = flop[0], b1 = flop[1], b2 = flop[2], b3 = _workDeck[1], b4 = _workDeck[3];

      const boardStr = eval5(b0, b1, b2, b3, b4);

      let bestHandStr = 0;
      const handStrs = [0,0,0,0,0,0,0,0,0,0];
      let boardBeatsAll = true;

      for (let h = 0; h < 10; h++) {
        const hs = best7(HANDS[h][0], HANDS[h][1], b0, b1, b2, b3, b4);
        handStrs[h] = hs;
        if (hs >= boardStr) boardBeatsAll = false;
        if (hs > bestHandStr) bestHandStr = hs;
      }

      if (!boardBeatsAll) {
        for (let h = 0; h < 10; h++) {
          if (handStrs[h] === bestHandStr) cardWins[h]++;
        }
        const winCat = catFromStrength(bestHandStr);
        if (winCat >= 0 && winCat <= 6) rankWins[winCat]++;
      } else {
        boardWins++;
      }
      total++;

      // Progress report
      if (total > 0 && total % PROGRESS_INTERVAL === 0) {
        self.postMessage({ type: 'PROGRESS', callId, done: total, total: rounds });
      }
    }
  }

  // Build results
  const cardResults = [];
  for (let h = 0; h < 10; h++) {
    const observedProb = cardWins[h] / total;
    const trueProb = trueProbabilities.cardProbs[h];
    const obsRtp = trueProb > 0 ? (observedProb / trueProb) * 100 : 0;
    cardResults.push({
      handId: h + 1,
      handLabel: HAND_LABELS[h],
      wins: cardWins[h],
      observedProb,
      trueProb,
      trueOdds: trueProb > 0 ? (1 / trueProb) - 1 : null,
      observedRtp: obsRtp,
      dead: trueProb === 0,
      // RTP at various targets
      rtpAt96: trueProb > 0 ? observedProb * (0.96 / trueProb) * 100 : 0,
      rtpAt98: trueProb > 0 ? observedProb * (0.98 / trueProb) * 100 : 0,
      rtpAt100: trueProb > 0 ? (observedProb / trueProb) * 100 : 0,
    });
  }

  const rankResults = [];
  for (let r = 0; r < 7; r++) {
    const observedProb = rankWins[r] / total;
    const trueProb = trueProbabilities.rankProbs[r];
    const obsRtp = trueProb > 0 ? (observedProb / trueProb) * 100 : 0;
    rankResults.push({
      rankIndex: r,
      rankName: RANK_NAMES[r],
      wins: rankWins[r],
      observedProb,
      trueProb,
      trueOdds: trueProb > 0 ? (1 / trueProb) - 1 : null,
      observedRtp: obsRtp,
      dead: trueProb === 0,
      rtpAt96: trueProb > 0 ? observedProb * (0.96 / trueProb) * 100 : 0,
      rtpAt98: trueProb > 0 ? observedProb * (0.98 / trueProb) * 100 : 0,
      rtpAt100: trueProb > 0 ? (observedProb / trueProb) * 100 : 0,
    });
  }

  self.postMessage({
    type: 'RESULT',
    callId,
    data: {
      flopCards,
      mode: mode || 'monte-carlo',
      totalRounds: total,
      cardResults,
      rankResults,
      boardWinProb: boardWins / total,
      trueBoardWinProb: trueProbabilities.boardWinProb,
    }
  });
}

// ── Message handler ───────────────────────────────────────────
self.onmessage = function(e) {
  const { type, ...payload } = e.data;
  if (type === 'RUN') {
    try {
      handleRun(payload);
    } catch (err) {
      self.postMessage({ type: 'ERROR', callId: payload.callId, message: err.message });
    }
  }
};
