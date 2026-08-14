// ============================================================
// POST-FLOP PROBABILITY MATRIX GENERATOR
//
// Standalone script (NOT bundled into the app). Run manually with:
//   node scripts/generatePostFlopMatrix.js
//
// Regenerates src/lib/game/postFlopProbabilityMatrix.json (full, ~9MB)
// and src/lib/game/postFlopMatrixCompact.json (compact, ~2.6MB, used by UI)
//
// This is the audit trail for GLI/BMM certification: full enumeration
// of all C(32,3) = 4,960 flop combinations, each cross-referenced
// against all C(29,2) = 406 Turn+River combinations (2,013,760 total
// hand evaluations). Zero randomness — deterministic, reproducible,
// regulator-verifiable.
//
// ============================================================
// FIX (2026-08-14): Replaced broken inline poker evaluator with the
// live game's pokerEvaluator.js. The old inline eval5() had a faulty
// 5-element sorting network (8 compare-exchanges instead of the
// required 9), producing a 10.87% category mismatch rate vs the live
// engine. This caused the JSON/Excel probability matrix to diverge
// from actual game payouts. Now both systems use identical evaluator
// code — single source of truth, no divergence possible.
// ============================================================

import fs from 'fs';
import { bestHand, evaluate5, compare5, combinations } from '../src/lib/game/pokerEvaluator.js';
import { DEALER_STOCK, FIXED_HANDS, CAT_TO_LABEL } from '../src/lib/game/cards.js';

const SUIT_SYMBOLS = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' };
function cardLabel(card) {
  return card.rank + SUIT_SYMBOLS[card.suit];
}

const RANK_NAMES = ['1 Pair', '2 Pair', '3 Of A Kind', 'Straight', 'Flush', 'Full House', '4 Of A Kind'];

console.log('=== POST-FLOP PROBABILITY MATRIX GENERATOR ===');
console.log('Using live game evaluator (pokerEvaluator.js) — single source of truth');
console.log('Total evaluations:', 4960 * 406 * 10 * 21);

const matrix = [];
const startTime = Date.now();

// Enumerate all C(32,3) = 4,960 flop combinations from the 32-card dealer stock
const flopCombos = combinations(DEALER_STOCK, 3);

for (let fi = 0; fi < flopCombos.length; fi++) {
  const flop = flopCombos[fi];
  const flopSet = new Set(flop.map(c => `${c.rank}-${c.suit}`));
  const remaining = DEALER_STOCK.filter(c => !flopSet.has(`${c.rank}-${c.suit}`));

  const cardWins = new Array(10).fill(0);
  const rankWins = new Array(7).fill(0);
  let boardWins = 0;
  let total = 0;

  // Enumerate all C(29,2) = 406 Turn+River combinations
  const turnRiverCombos = combinations(remaining, 2);

  for (let ci = 0; ci < turnRiverCombos.length; ci++) {
    const turn = turnRiverCombos[ci][0];
    const river = turnRiverCombos[ci][1];
    const board = [flop[0], flop[1], flop[2], turn, river];

    const boardResult = evaluate5(board);
    const handResults = FIXED_HANDS.map(h => bestHand(h.cards, board));

    // Board wins only if it STRICTLY beats every hand
    const boardBeatsAll = handResults.every(hr => compare5(boardResult, hr) > 0);

    if (!boardBeatsAll) {
      // Find the best hand among the players
      let best = handResults[0];
      for (let i = 1; i < handResults.length; i++) {
        if (compare5(handResults[i], best) > 0) best = handResults[i];
      }
      // All hands that tie the best are winners
      for (let i = 0; i < 10; i++) {
        if (compare5(handResults[i], best) === 0) cardWins[i]++;
      }
      // Track winning rank category (only bettable ranks: 0-6)
      const winCat = best.category;
      if (winCat >= 0 && winCat <= 6) rankWins[winCat]++;
    } else {
      boardWins++;
    }
    total++;
  }

  const entry = {
    flopId: matrix.length + 1,
    cards: [cardLabel(flop[0]), cardLabel(flop[1]), cardLabel(flop[2])],
    cardProbabilities: [],
    rankProbabilities: [],
    boardWinProb: boardWins / total,
    totalCombos: total
  };

  for (let h = 0; h < 10; h++) {
    const p = cardWins[h] / total;
    entry.cardProbabilities.push({
      handId: FIXED_HANDS[h].id,
      handLabel: FIXED_HANDS[h].label,
      wins: cardWins[h],
      probability: p,
      trueOdds: p > 0 ? (1 / p) - 1 : null
    });
  }

  for (let r = 0; r < 7; r++) {
    const p = rankWins[r] / total;
    entry.rankProbabilities.push({
      rankIndex: r,
      rankName: RANK_NAMES[r],
      wins: rankWins[r],
      probability: p,
      trueOdds: p > 0 ? (1 / p) - 1 : null
    });
  }

  matrix.push(entry);
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('Done:', matrix.length, 'flops in', totalTime + 's');

// Save full matrix
fs.writeFileSync('./src/lib/game/postFlopProbabilityMatrix.json', JSON.stringify(matrix));
console.log('Full matrix saved:', (fs.statSync('./src/lib/game/postFlopProbabilityMatrix.json').size / 1024 / 1024).toFixed(2), 'MB');

// Save compact matrix for UI bundling
const compact = matrix.map(e => [
  e.flopId, e.cards[0], e.cards[1], e.cards[2], e.boardWinProb,
  ...e.cardProbabilities.map(cp => cp.probability),
  ...e.rankProbabilities.map(rp => rp.probability)
]);
const trueOddsArr = matrix.map(e => [
  ...e.cardProbabilities.map(cp => cp.trueOdds),
  ...e.rankProbabilities.map(rp => rp.trueOdds)
]);
fs.writeFileSync('./src/lib/game/postFlopMatrixCompact.json', JSON.stringify({ flops: compact, trueOdds: trueOddsArr }));
console.log('Compact matrix saved:', (fs.statSync('./src/lib/game/postFlopMatrixCompact.json').size / 1024 / 1024).toFixed(2), 'MB');
