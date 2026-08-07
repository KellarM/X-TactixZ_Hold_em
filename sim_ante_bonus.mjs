/**
 * Ante Bonus + RNG Bonus RTP Simulation
 * Complete enumeration: 4,960 flops × 406 Turn+River = 2,013,760 evaluations
 * Player strategy: bet full Ante on FAVORITE (highest probability) position per board
 */

import { FIXED_HANDS, DEALER_STOCK, CAT_TO_LABEL, RANK_BONUS_POSITIONS, COLOR_RIVER_BONUS_POSITIONS } from './src/lib/game/cards.js';
import { evaluate5, compare5, bestHand, combinations } from './src/lib/game/pokerEvaluator.js';

const HOUSE_EDGE_CARD  = 0.15;
const HOUSE_EDGE_RANK  = 0.12;
const HOUSE_EDGE_COLOR = 0.04;
const HOUSE_EDGE_RIVER = 0.035;
const LOCKOUT_THRESHOLD = 0.80;

const RANK_ORDER = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
function rv(rank) { return RANK_ORDER.indexOf(rank) + 2; }
function cardColor(card) { return (card.suit === 'hearts' || card.suit === 'diamonds') ? 'red' : 'black'; }
function isLowRank(rank) { return ['2','3','4','5','6','7'].includes(rank); }
function cardKey(card) { return card.rank + '-' + card.suit; }
function payoutFromProb(p, he) { if (p <= 0) return null; return (1 - he) / p - 1; }

const allFlops = combinations(DEALER_STOCK, 3);
console.log('Total flops: ' + allFlops.length);

const stats = {
  totalRounds: 0, boardWinCount: 0,
  anteWins: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
  cardWins: 0, rankWins: 0, colorWins: 0, riverWins: 0,
  totalAnteBet: 0, totalAnteReturned: 0, totalAnteBonus: 0,
  totalBoardPayout: 0, totalBoardBet: 0, totalRngBonus: 0,
  cardBoardPayout: 0, rankBoardPayout: 0, colorBoardPayout: 0, riverBoardPayout: 0,
  rngCardBonus: 0, rngRankBonus: 0, rngColorRiverBonus: 0,
  rngCardTriggers: 0, rngRankTriggers: 0, rngColorRiverTriggers: 0,
};

const NUM_FLOPS = allFlops.length;

for (let flopIdx = 0; flopIdx < NUM_FLOPS; flopIdx++) {
  const flop = allFlops[flopIdx];
  const flopKeys = new Set(flop.map(cardKey));
  const remaining = DEALER_STOCK.filter(c => !flopKeys.has(cardKey(c)));
  const turnRiverCombos = combinations(remaining, 2);

  // Compute post-flop odds
  const cardWinCount = new Array(FIXED_HANDS.length).fill(0);
  const rankWinCount = {};
  const colorWinCount = { '3R':0,'4R':0,'5R':0,'3B':0,'4B':0,'5B':0 };
  let bwCount = 0, total = 0;

  for (let c = 0; c < turnRiverCombos.length; c++) {
    const turn = turnRiverCombos[c][0], river = turnRiverCombos[c][1];
    const board = [flop[0], flop[1], flop[2], turn, river];
    const handResults = FIXED_HANDS.map(h => bestHand(h.cards, board));
    const boardResult = evaluate5(board);
    const boardBeatsAll = handResults.every(hr => compare5(boardResult, hr) > 0);
    if (!boardBeatsAll) {
      let best = handResults[0];
      for (let i = 1; i < handResults.length; i++) if (compare5(handResults[i], best) > 0) best = handResults[i];
      for (let i = 0; i < handResults.length; i++) if (compare5(handResults[i], best) === 0) cardWinCount[i]++;
      rankWinCount[best.category] = (rankWinCount[best.category] || 0) + 1;
    } else {
      bwCount++;
      rankWinCount[boardResult.category] = (rankWinCount[boardResult.category] || 0) + 1;
    }
    let reds = 0;
    for (let i = 0; i < 5; i++) if (cardColor(board[i]) === 'red') reds++;
    const blacks = 5 - reds;
    if (reds === 3) colorWinCount['3R']++;
    if (reds === 4) colorWinCount['4R']++;
    if (reds === 5) colorWinCount['5R']++;
    if (blacks === 3) colorWinCount['3B']++;
    if (blacks === 4) colorWinCount['4B']++;
    if (blacks === 5) colorWinCount['5B']++;
    total++;
  }

  // Pick FAVORITE per board
  let cardPick = -1, cardPickProb = -1, cardPickPayout = null;
  for (let i = 0; i < FIXED_HANDS.length; i++) {
    const p = cardWinCount[i] / total;
    const payout = payoutFromProb(p, HOUSE_EDGE_CARD);
    const locked = p === 0 || p > LOCKOUT_THRESHOLD || payout > 400 || payout < 0.1;
    if (!locked && p > cardPickProb) { cardPickProb = p; cardPickPayout = payout; cardPick = i; }
  }
  if (cardPick === -1) { for (let i = 0; i < FIXED_HANDS.length; i++) { const p = cardWinCount[i]/total; if (p > cardPickProb) { cardPickProb = p; cardPickPayout = payoutFromProb(p, HOUSE_EDGE_CARD); cardPick = i; } } }

  let rankPickLabel = null, rankPickProb = -1, rankPickPayout = null, rankPickCat = -1;
  for (const cat of Object.keys(CAT_TO_LABEL)) {
    const p = (rankWinCount[cat] || 0) / total;
    const payout = payoutFromProb(p, HOUSE_EDGE_RANK);
    const locked = p === 0 || p > LOCKOUT_THRESHOLD || payout > 400 || payout < 0.1;
    if (!locked && p > rankPickProb) { rankPickProb = p; rankPickPayout = payout; rankPickLabel = CAT_TO_LABEL[cat]; rankPickCat = +cat; }
  }
  if (rankPickLabel === null) { for (const cat of Object.keys(CAT_TO_LABEL)) { const p = (rankWinCount[cat]||0)/total; if (p > rankPickProb) { rankPickProb = p; rankPickPayout = payoutFromProb(p, HOUSE_EDGE_RANK); rankPickLabel = CAT_TO_LABEL[cat]; rankPickCat = +cat; } } }

  let colorPick = null, colorPickProb = -1, colorPickPayout = null;
  for (const k of ['3R','4R','5R','3B','4B','5B']) {
    const p = colorWinCount[k] / total;
    const payout = payoutFromProb(p, HOUSE_EDGE_COLOR);
    const locked = p === 0 || p > LOCKOUT_THRESHOLD;
    if (!locked && p > colorPickProb) { colorPickProb = p; colorPickPayout = payout; colorPick = k; }
  }
  if (colorPick === null) { for (const k of ['3R','4R','5R','3B','4B','5B']) { const p = colorWinCount[k]/total; if (p > colorPickProb) { colorPickProb = p; colorPickPayout = payoutFromProb(p, HOUSE_EDGE_COLOR); colorPick = k; } } }

  // Enumerate outcomes
  for (let c = 0; c < turnRiverCombos.length; c++) {
    const turn = turnRiverCombos[c][0], river = turnRiverCombos[c][1];
    const board = [flop[0], flop[1], flop[2], turn, river];
    const handResults = FIXED_HANDS.map(h => bestHand(h.cards, board));
    const boardResult = evaluate5(board);
    const boardBeatsAll = handResults.every(hr => compare5(boardResult, hr) > 0);
    stats.totalRounds++;

    // Card Board
    let cardWon = false, winningCategory = null;
    if (!boardBeatsAll) {
      let best = handResults[0];
      for (let i = 1; i < handResults.length; i++) if (compare5(handResults[i], best) > 0) best = handResults[i];
      winningCategory = best.category;
      for (let i = 0; i < FIXED_HANDS.length; i++) if (compare5(handResults[i], best) === 0 && i === cardPick) cardWon = true;
    } else { stats.boardWinCount++; winningCategory = boardResult.category; }

    // Rank Board
    let rankWon = false;
    if (rankPickCat === winningCategory) rankWon = true;

    // Color Board
    let reds = 0;
    for (let i = 0; i < 5; i++) if (cardColor(board[i]) === 'red') reds++;
    const blacks = 5 - reds;
    let colorWon = false;
    if (colorPick === '3R' && reds === 3) colorWon = true;
    else if (colorPick === '4R' && reds === 4) colorWon = true;
    else if (colorPick === '5R' && reds === 5) colorWon = true;
    else if (colorPick === '3B' && blacks === 3) colorWon = true;
    else if (colorPick === '4B' && blacks === 4) colorWon = true;
    else if (colorPick === '5B' && blacks === 5) colorWon = true;

    // River Board (post-turn odds)
    const board4 = [flop[0], flop[1], flop[2], turn];
    const board4Keys = new Set(board4.map(cardKey));
    const riverRem = DEALER_STOCK.filter(c => !board4Keys.has(cardKey(c)));
    const lowCount = riverRem.filter(c => isLowRank(c.rank)).length;
    const highCount = riverRem.length - lowCount;
    const pLow = lowCount / riverRem.length, pHigh = highCount / riverRem.length;
    let riverPick = null, riverPickPayout = null;
    if (pLow >= pHigh && pLow > 0 && pLow <= LOCKOUT_THRESHOLD) { riverPick = 'low'; riverPickPayout = payoutFromProb(pLow, HOUSE_EDGE_RIVER); }
    else if (pHigh > 0 && pHigh <= LOCKOUT_THRESHOLD) { riverPick = 'high'; riverPickPayout = payoutFromProb(pHigh, HOUSE_EDGE_RIVER); }
    else if (pLow > 0) { riverPick = 'low'; riverPickPayout = payoutFromProb(pLow, HOUSE_EDGE_RIVER); }
    else if (pHigh > 0) { riverPick = 'high'; riverPickPayout = payoutFromProb(pHigh, HOUSE_EDGE_RIVER); }
    let riverWon = false;
    if (riverPick === 'low' && isLowRank(river.rank)) riverWon = true;
    else if (riverPick === 'high' && !isLowRank(river.rank)) riverWon = true;

    let boardsWon = 0;
    if (cardWon) { boardsWon++; stats.cardWins++; }
    if (rankWon) { boardsWon++; stats.rankWins++; }
    if (colorWon) { boardsWon++; stats.colorWins++; }
    if (riverWon) { boardsWon++; stats.riverWins++; }
    stats.anteWins[boardsWon]++;

    // Ante bonus
    stats.totalAnteBet += 1;
    if (boardsWon === 1 || boardsWon === 2) stats.totalAnteReturned += 1;
    else if (boardsWon === 3) { stats.totalAnteReturned += 1; stats.totalAnteBonus += 1; }
    else if (boardsWon === 4) { stats.totalAnteReturned += 1; stats.totalAnteBonus += 2; }

    // Board payouts (net winnings)
    stats.totalBoardBet += 4;
    if (cardWon && cardPickPayout !== null) { stats.totalBoardPayout += cardPickPayout; stats.cardBoardPayout += cardPickPayout; }
    if (rankWon && rankPickPayout !== null) { stats.totalBoardPayout += rankPickPayout; stats.rankBoardPayout += rankPickPayout; }
    if (colorWon && colorPickPayout !== null) { stats.totalBoardPayout += colorPickPayout; stats.colorBoardPayout += colorPickPayout; }
    if (riverWon && riverPickPayout !== null) { stats.totalBoardPayout += riverPickPayout; stats.riverBoardPayout += riverPickPayout; }

    // RNG Bonus
    const bonusCardIdx = Math.floor(Math.random() * 10);
    if (!boardBeatsAll) {
      let best = handResults[0];
      for (let i = 1; i < handResults.length; i++) if (compare5(handResults[i], best) > 0) best = handResults[i];
      if (compare5(handResults[bonusCardIdx], best) === 0 && bonusCardIdx === cardPick) {
        const bonusAmt = cardPickPayout * 4; stats.totalRngBonus += bonusAmt; stats.rngCardBonus += bonusAmt; stats.rngCardTriggers++;
      }
    }
    const bonusRankIdx = Math.floor(Math.random() * 7);
    const bonusRankLabel = RANK_BONUS_POSITIONS[bonusRankIdx];
    if (bonusRankLabel === CAT_TO_LABEL[winningCategory] && bonusRankLabel === rankPickLabel) {
      const bonusAmt = rankPickPayout * 3; stats.totalRngBonus += bonusAmt; stats.rngRankBonus += bonusAmt; stats.rngRankTriggers++;
    }
    const bonusColorRiverIdx = Math.floor(Math.random() * 8);
    if (bonusColorRiverIdx < 6) {
      const colorKey = COLOR_RIVER_BONUS_POSITIONS[bonusColorRiverIdx];
      let colorHit = false;
      if (colorKey === '3R' && reds === 3) colorHit = true;
      else if (colorKey === '4R' && reds === 4) colorHit = true;
      else if (colorKey === '5R' && reds === 5) colorHit = true;
      else if (colorKey === '3B' && blacks === 3) colorHit = true;
      else if (colorKey === '4B' && blacks === 4) colorHit = true;
      else if (colorKey === '5B' && blacks === 5) colorHit = true;
      if (colorHit && colorKey === colorPick) { const bonusAmt = colorPickPayout * 2; stats.totalRngBonus += bonusAmt; stats.rngColorRiverBonus += bonusAmt; stats.rngColorRiverTriggers++; }
    } else {
      const riverSide = COLOR_RIVER_BONUS_POSITIONS[bonusColorRiverIdx];
      let riverHit = false;
      if (riverSide === 'low' && isLowRank(river.rank)) riverHit = true;
      else if (riverSide === 'high' && !isLowRank(river.rank)) riverHit = true;
      if (riverHit && riverSide === riverPick) { const bonusAmt = riverPickPayout * 2; stats.totalRngBonus += bonusAmt; stats.rngColorRiverBonus += bonusAmt; stats.rngColorRiverTriggers++; }
    }
  }
  if ((flopIdx + 1) % 500 === 0) console.log('  Processed ' + (flopIdx + 1) + '/' + NUM_FLOPS + ' flops...');
}

// Results
console.log('\n═══════════════════════════════════════════════════');
console.log('  ANTE BONUS + RNG BONUS — RTP SIMULATION RESULTS');
console.log('═══════════════════════════════════════════════════\n');
console.log('Total rounds simulated: ' + stats.totalRounds.toLocaleString());
console.log('Board beats all hands: ' + stats.boardWinCount.toLocaleString() + ' (' + (stats.boardWinCount/stats.totalRounds*100).toFixed(2) + '%)\n');

console.log('── ANTE BONUS DISTRIBUTION ──');
for (let i = 0; i <= 4; i++) {
  console.log('  ' + i + ' boards won: ' + stats.anteWins[i].toLocaleString() + ' (' + (stats.anteWins[i]/stats.totalRounds*100).toFixed(4) + '%)');
}

console.log('\n── PER-BOARD WIN RATES (favorite strategy) ──');
console.log('  Card Board:  ' + (stats.cardWins/stats.totalRounds*100).toFixed(2) + '%');
console.log('  Rank Board:  ' + (stats.rankWins/stats.totalRounds*100).toFixed(2) + '%');
console.log('  Color Board: ' + (stats.colorWins/stats.totalRounds*100).toFixed(2) + '%');
console.log('  River Board: ' + (stats.riverWins/stats.totalRounds*100).toFixed(2) + '%');

const boardBetsReturned = stats.cardWins + stats.rankWins + stats.colorWins + stats.riverWins;
const totalBoardReturn = boardBetsReturned + stats.totalBoardPayout;
const totalWagered = stats.totalAnteBet + stats.totalBoardBet;
const totalReturn = stats.totalAnteReturned + stats.totalAnteBonus + totalBoardReturn + stats.totalRngBonus;
const rtp = totalReturn / totalWagered * 100;

console.log('\n── FINANCIAL ANALYSIS (per $1 Ante) ──');
console.log('  Total wagered: $' + totalWagered.toLocaleString() + ' ($1 Ante + $4 board bets per round)');
console.log('  Total returned: $' + totalReturn.toLocaleString(undefined, {maximumFractionDigits: 2}));
console.log('  ────────────────');
console.log('  BLENDED RTP: ' + rtp.toFixed(2) + '%');
console.log('  House Edge: ' + (100 - rtp).toFixed(2) + '%\n');

console.log('── BREAKDOWN ──');
console.log('  Ante: wagered $' + stats.totalAnteBet.toLocaleString() + ', returned $' + stats.totalAnteReturned.toLocaleString() + ', bonus $' + stats.totalAnteBonus.toLocaleString(undefined, {maximumFractionDigits: 2}));
console.log('    Ante RTP contribution: ' + ((stats.totalAnteReturned + stats.totalAnteBonus) / stats.totalAnteBet * 100).toFixed(2) + '%');
console.log('  Board bets: wagered $' + stats.totalBoardBet.toLocaleString() + ', returned $' + totalBoardReturn.toLocaleString(undefined, {maximumFractionDigits: 2}));
console.log('    Board RTP: ' + (totalBoardReturn / stats.totalBoardBet * 100).toFixed(2) + '%');
console.log('    Card:   $' + stats.cardBoardPayout.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' winnings + $' + stats.cardWins + ' bet returns');
console.log('    Rank:   $' + stats.rankBoardPayout.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' winnings + $' + stats.rankWins + ' bet returns');
console.log('    Color:  $' + stats.colorBoardPayout.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' winnings + $' + stats.colorWins + ' bet returns');
console.log('    River:  $' + stats.riverBoardPayout.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' winnings + $' + stats.riverWins + ' bet returns');
console.log('  RNG Bonus: $' + stats.totalRngBonus.toLocaleString(undefined, {maximumFractionDigits: 2}) + ' extra winnings');
console.log('    Card (x5): ' + stats.rngCardTriggers + ' triggers, $' + stats.rngCardBonus.toLocaleString(undefined, {maximumFractionDigits: 2}));
console.log('    Rank (x4): ' + stats.rngRankTriggers + ' triggers, $' + stats.rngRankBonus.toLocaleString(undefined, {maximumFractionDigits: 2}));
console.log('    Color/River (x3): ' + stats.rngColorRiverTriggers + ' triggers, $' + stats.rngColorRiverBonus.toLocaleString(undefined, {maximumFractionDigits: 2}));

console.log('\n── ANTE BONUS EV ──');
const anteEV = (stats.totalAnteReturned + stats.totalAnteBonus - stats.totalAnteBet) / stats.totalRounds;
console.log('  Ante net EV per round: $' + anteEV.toFixed(4));
console.log('  Ante returned rate: ' + (stats.totalAnteReturned / stats.totalAnteBet * 100).toFixed(2) + '%');
console.log('  Ante bonus rate: ' + (stats.totalAnteBonus / stats.totalAnteBet * 100).toFixed(2) + '%');
console.log('  Ante lost rate: ' + ((stats.totalAnteBet - stats.totalAnteReturned) / stats.totalAnteBet * 100).toFixed(2) + '%');

console.log('\n── RNG BONUS EV ──');
console.log('  RNG bonus EV per round: $' + (stats.totalRngBonus / stats.totalRounds).toFixed(4));
console.log('  RNG bonus as % of total wagered: ' + (stats.totalRngBonus / totalWagered * 100).toFixed(2) + '%');

console.log('\n═══════════════════════════════════════════════════');
