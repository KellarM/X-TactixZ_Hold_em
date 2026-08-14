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
//
// ============================================================
// FIX (2026-08-14): Replaced broken inline eval5/best7 with imports
// from pokerEvaluator.js. The old inline evaluator had a faulty
// 5-element sorting network (8 compare-exchanges instead of 9),
// producing a 10.87% category mismatch rate vs the live engine.
// Now uses the same canonical evaluator as the live game — single
// source of truth, no divergence possible.
// ============================================================

import { evaluate5, bestHand, compare5 } from '../lib/game/pokerEvaluator.js';

const RANK_LABELS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_LABELS = ['clubs','diamonds','hearts','spades'];

function enc(rankLabel, suitLabel) {
  return RANK_LABELS.indexOf(rankLabel) * 4 + SUIT_LABELS.indexOf(suitLabel);
}

// ── Integer-to-card-object converter ───────────────────────────
// The worker uses fast integer encoding (rank*4+suit) for shuffling.
// pokerEvaluator.js works with {rank, suit} card objects. This thin
// adapter bridges the two — called only during evaluation, not during
// the hot shuffle loop, so overhead is negligible.
function intToCard(n) {
  return { rank: RANK_LABELS[n >> 2], suit: SUIT_LABELS[n & 3] };
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
// Odds thresholds — must match oddsEngine.js
const ODDS_THRESHOLD_CARD_HIGH = 300;
const ODDS_THRESHOLD_CARD_LOW  = 1.1;
const ODDS_THRESHOLD_RANK_HIGH = 300;
const ODDS_THRESHOLD_RANK_LOW  = 1.1;

function isOddsDead(trueOdds, high, low) {
  if (trueOdds === null) return true;
  return trueOdds > high || trueOdds < low;
}

// ── Card encoding helpers (for decoding flop from message) ──
const SUIT_SYMBOLS = { clubs:'♣', diamonds:'♦', hearts:'♥', spades:'♠' };

function cardLabel(c) {
  return RANK_LABELS[c >> 2] + SUIT_SYMBOLS[SUIT_LABELS[c & 3]];
}

function parseCard(label) {
  const suitMap = { '♣':'clubs', '♦':'diamonds', '♥':'hearts', '♠':'spades' };
  const suit = suitMap[label.slice(-1)];
  const rank = label.slice(0, -1);
  return enc(rank, suit);
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

  // Parse flop cards (integer-encoded for fast set operations)
  const flop = flopCards.map(parseCard);
  const flopSet = new Set(flop);

  // Pre-convert flop to card objects for evaluation (reused every round)
  const flopCards5 = flop.map(intToCard);

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
        const board = [flopCards5[0], flopCards5[1], flopCards5[2],
                       intToCard(remaining[t]), intToCard(remaining[r])];
        const boardResult = evaluate5(board);

        let bestHandResult = null;
        const handResults = [null,null,null,null,null,null,null,null,null,null];
        let boardBeatsAll = true;

        for (let h = 0; h < 10; h++) {
          const hs = bestHand([intToCard(HANDS[h][0]), intToCard(HANDS[h][1])], board);
          handResults[h] = hs;
          if (compare5(hs, boardResult) >= 0) boardBeatsAll = false;
          if (bestHandResult === null || compare5(hs, bestHandResult) > 0) bestHandResult = hs;
        }

        if (!boardBeatsAll) {
          for (let h = 0; h < 10; h++) {
            if (compare5(handResults[h], bestHandResult) === 0) cardWins[h]++;
          }
          const winCat = bestHandResult.category;
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
      const board = [flopCards5[0], flopCards5[1], flopCards5[2],
                     intToCard(_workDeck[1]), intToCard(_workDeck[3])];
      const boardResult = evaluate5(board);

      let bestHandResult = null;
      const handResults = [null,null,null,null,null,null,null,null,null,null];
      let boardBeatsAll = true;

      for (let h = 0; h < 10; h++) {
        const hs = bestHand([intToCard(HANDS[h][0]), intToCard(HANDS[h][1])], board);
        handResults[h] = hs;
        if (compare5(hs, boardResult) >= 0) boardBeatsAll = false;
        if (bestHandResult === null || compare5(hs, bestHandResult) > 0) bestHandResult = hs;
      }

      if (!boardBeatsAll) {
        for (let h = 0; h < 10; h++) {
          if (compare5(handResults[h], bestHandResult) === 0) cardWins[h]++;
        }
        const winCat = bestHandResult.category;
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
      dead: trueProb === 0 || isOddsDead(trueProb > 0 ? (1 / trueProb) - 1 : null, ODDS_THRESHOLD_CARD_HIGH, ODDS_THRESHOLD_CARD_LOW),
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
      dead: trueProb === 0 || isOddsDead(trueProb > 0 ? (1 / trueProb) - 1 : null, ODDS_THRESHOLD_RANK_HIGH, ODDS_THRESHOLD_RANK_LOW),
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
