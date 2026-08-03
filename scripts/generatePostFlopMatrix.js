// ============================================================
// POST-FLOP PROBABILITY MATRIX GENERATOR
// 
// Standalone script (NOT bundled into the app). Run manually with:
//   node scripts/generatePostFlopMatrix.js
//
// Regenerates src/lib/game/postFlopProbabilityMatrix.json (full, 9.2MB)
// and src/lib/game/postFlopMatrixCompact.json (compact, 2.6MB, used by UI)
//
// This is the audit trail for GLI/BMM certification: full enumeration
// of all C(32,3) = 4,960 flop combinations, each cross-referenced
// against all C(29,2) = 406 Turn+River combinations (2,013,760 total
// hand evaluations). Zero randomness — deterministic, reproducible,
// regulator-verifiable.
// ============================================================

import fs from 'fs';

const RANK_LABELS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_LABELS = ['clubs','diamonds','hearts','spades'];
const SUIT_SYMBOLS = { clubs:'♣', diamonds:'♦', hearts:'♥', spades:'♠' };

function enc(rankLabel, suitLabel) {
  return RANK_LABELS.indexOf(rankLabel) * 4 + SUIT_LABELS.indexOf(suitLabel);
}
function cardLabel(c) {
  return RANK_LABELS[c >> 2] + SUIT_SYMBOLS[SUIT_LABELS[c & 3]];
}

const HAND_LABELS = ['A♦10♥','K♣K♠','Q♣J♠','Q♠10♠','J♣9♣','8♦6♦','7♦7♠','4♥2♥','3♣3♥','A♥5♦'];
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

const RANK_NAMES = ['1 Pair', '2 Pair', '3 Of A Kind', 'Straight', 'Flush', 'Full House', '4 Of A Kind'];

const COMBOS_7_5 = [
  [0,1,2,3,4],[0,1,2,3,5],[0,1,2,3,6],[0,1,2,4,5],[0,1,2,4,6],
  [0,1,2,5,6],[0,1,3,4,5],[0,1,3,4,6],[0,1,3,5,6],[0,1,4,5,6],
  [0,2,3,4,5],[0,2,3,4,6],[0,2,3,5,6],[0,2,4,5,6],[0,3,4,5,6],
  [1,2,3,4,5],[1,2,3,4,6],[1,2,3,5,6],[1,2,4,5,6],[1,3,4,5,6],
  [2,3,4,5,6]
];

const B1=14, B2=196, B3=2744, B4=38416, B5=537824;

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

function catFromStrength(s) { return Math.floor(s / B5) - 1; }

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

console.log('=== POST-FLOP PROBABILITY MATRIX GENERATOR ===');
console.log('Total evaluations:', 4960 * 406 * 10 * 21);

const matrix = [];
const startTime = Date.now();
const N = DECK32.length;

for (let i = 0; i < N; i++) {
  for (let j = i + 1; j < N; j++) {
    for (let k = j + 1; k < N; k++) {
      const f0 = DECK32[i], f1 = DECK32[j], f2 = DECK32[k];
      const flopSet = new Set([f0, f1, f2]);
      const remaining = [];
      for (let d = 0; d < N; d++) if (!flopSet.has(DECK32[d])) remaining.push(DECK32[d]);

      const cardWins = [0,0,0,0,0,0,0,0,0,0];
      const rankWins = [0,0,0,0,0,0,0];
      let boardWins = 0, total = 0;
      const R = remaining.length;

      for (let t = 0; t < R; t++) {
        for (let r = t + 1; r < R; r++) {
          const b0 = f0, b1 = f1, b2 = f2, b3 = remaining[t], b4 = remaining[r];
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
            for (let h = 0; h < 10; h++) if (handStrs[h] === bestHandStr) cardWins[h]++;
            const winCat = catFromStrength(bestHandStr);
            if (winCat >= 0 && winCat <= 6) rankWins[winCat]++;
          } else {
            boardWins++;
          }
          total++;
        }
      }

      const entry = {
        flopId: matrix.length + 1,
        cards: [cardLabel(f0), cardLabel(f1), cardLabel(f2)],
        cardProbabilities: [],
        rankProbabilities: [],
        boardWinProb: boardWins / total,
        totalCombos: total
      };
      for (let h = 0; h < 10; h++) {
        const p = cardWins[h] / total;
        entry.cardProbabilities.push({ handId: h + 1, handLabel: HAND_LABELS[h], wins: cardWins[h], probability: p, trueOdds: p > 0 ? (1/p)-1 : null });
      }
      for (let rr = 0; rr < 7; rr++) {
        const p = rankWins[rr] / total;
        entry.rankProbabilities.push({ rankIndex: rr, rankName: RANK_NAMES[rr], wins: rankWins[rr], probability: p, trueOdds: p > 0 ? (1/p)-1 : null });
      }
      matrix.push(entry);
    }
  }
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('Done:', matrix.length, 'flops in', totalTime + 's');

fs.writeFileSync('./src/lib/game/postFlopProbabilityMatrix.json', JSON.stringify(matrix));
console.log('Full matrix saved:', (fs.statSync('./src/lib/game/postFlopProbabilityMatrix.json').size / 1024 / 1024).toFixed(2), 'MB');

// Compact format for UI bundling
const compact = matrix.map(e => [
  e.flopId, e.cards[0], e.cards[1], e.cards[2], e.boardWinProb,
  ...e.cardProbabilities.map(cp => cp.probability),
  ...e.rankProbabilities.map(rp => rp.probability)
]);
const trueOdds = matrix.map(e => [
  ...e.cardProbabilities.map(cp => cp.trueOdds),
  ...e.rankProbabilities.map(rp => rp.trueOdds)
]);
fs.writeFileSync('./src/lib/game/postFlopMatrixCompact.json', JSON.stringify({ flops: compact, trueOdds }));
console.log('Compact matrix saved:', (fs.statSync('./src/lib/game/postFlopMatrixCompact.json').size / 1024 / 1024).toFixed(2), 'MB');
