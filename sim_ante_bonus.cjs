/**
 * Ante Bonus + RNG Bonus RTP Simulation — Standalone
 * Complete enumeration: 4,960 flops x 406 Turn+River = 2,013,760 evaluations
 * Player: bets full Ante on FAVORITE (highest prob) position per board
 */

// ── Card Data ──
const RANK_ORDER = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_COLOR = { spades: 'black', hearts: 'red', diamonds: 'red', clubs: 'black' };
const LOW_RANKS = ['2','3','4','5','6','7'];

const FIXED_HANDS = [
  { id: 1, label: 'Ad10h', cards: [{ rank: 'A', suit: 'diamonds' }, { rank: '10', suit: 'hearts' }] },
  { id: 2, label: 'KcKs', cards: [{ rank: 'K', suit: 'clubs' }, { rank: 'K', suit: 'spades' }] },
  { id: 3, label: 'QcJs', cards: [{ rank: 'Q', suit: 'clubs' }, { rank: 'J', suit: 'spades' }] },
  { id: 4, label: 'Qs10s', cards: [{ rank: 'Q', suit: 'spades' }, { rank: '10', suit: 'spades' }] },
  { id: 5, label: 'Jc9c', cards: [{ rank: 'J', suit: 'clubs' }, { rank: '9', suit: 'clubs' }] },
  { id: 6, label: '8d6d', cards: [{ rank: '8', suit: 'diamonds' }, { rank: '6', suit: 'diamonds' }] },
  { id: 7, label: '7d7s', cards: [{ rank: '7', suit: 'diamonds' }, { rank: '7', suit: 'spades' }] },
  { id: 8, label: '4h2h', cards: [{ rank: '4', suit: 'hearts' }, { rank: '2', suit: 'hearts' }] },
  { id: 9, label: '3c3h', cards: [{ rank: '3', suit: 'clubs' }, { rank: '3', suit: 'hearts' }] },
  { id: 10, label: 'Ah5d', cards: [{ rank: 'A', suit: 'hearts' }, { rank: '5', suit: 'diamonds' }] }
];

const DEALER_STOCK = [
  { rank: 'A', suit: 'spades' }, { rank: '9', suit: 'spades' }, { rank: '8', suit: 'spades' }, { rank: '6', suit: 'spades' },
  { rank: '5', suit: 'spades' }, { rank: '4', suit: 'spades' }, { rank: '3', suit: 'spades' }, { rank: '2', suit: 'spades' },
  { rank: 'K', suit: 'hearts' }, { rank: 'Q', suit: 'hearts' }, { rank: 'J', suit: 'hearts' }, { rank: '9', suit: 'hearts' },
  { rank: '8', suit: 'hearts' }, { rank: '7', suit: 'hearts' }, { rank: '6', suit: 'hearts' }, { rank: '5', suit: 'hearts' },
  { rank: 'K', suit: 'diamonds' }, { rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'diamonds' }, { rank: '10', suit: 'diamonds' },
  { rank: '9', suit: 'diamonds' }, { rank: '4', suit: 'diamonds' }, { rank: '3', suit: 'diamonds' }, { rank: '2', suit: 'diamonds' },
  { rank: 'A', suit: 'clubs' }, { rank: '10', suit: 'clubs' }, { rank: '8', suit: 'clubs' }, { rank: '7', suit: 'clubs' },
  { rank: '6', suit: 'clubs' }, { rank: '5', suit: 'clubs' }, { rank: '4', suit: 'clubs' }, { rank: '2', suit: 'clubs' }
];

const CAT_TO_LABEL = { 0:'1 Pair', 1:'2 Pair', 2:'3 Of A Kind', 3:'Straight', 4:'Flush', 5:'Full House', 6:'4 Of A Kind' };
const RANK_BONUS_POSITIONS = ['4 Of A Kind','Full House','Flush','Straight','3 Of A Kind','2 Pair','1 Pair'];
const COLOR_RIVER_BONUS_POSITIONS = ['3R','3B','4R','4B','5R','5B','low','high'];

// ── Helpers ──
function rv(rank) { return RANK_ORDER.indexOf(rank) + 2; }
function cardColor(card) { return SUIT_COLOR[card.suit]; }
function isLowRank(rank) { return LOW_RANKS.includes(rank); }
function cardKey(card) { return card.rank + '-' + card.suit; }
function payoutFromProb(p, he) { if (p <= 0) return null; return (1 - he) / p - 1; }

// ── Poker Evaluator ──
function evaluate5(cards) {
  const vals = cards.map(c => rv(c.rank)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2] && suits[2] === suits[3] && suits[3] === suits[4];
  const unique = []; const seen = {};
  for (const v of vals) { if (!seen[v]) { seen[v] = true; unique.push(v); } }
  unique.sort((a, b) => b - a);
  let isStraight = false, straightHigh = 0;
  if (unique.length === 5) {
    if (unique[0] - unique[4] === 4) { isStraight = true; straightHigh = unique[0]; }
    else if (unique[0] === 14 && unique[1] === 5 && unique[2] === 4 && unique[3] === 3 && unique[4] === 2) { isStraight = true; straightHigh = 5; }
  }
  const freq = {};
  for (const v of vals) freq[v] = (freq[v] || 0) + 1;
  const groups = Object.keys(freq).map(v => ({ val: +v, count: freq[v] })).sort((a, b) => b.count - a.count || b.val - a.val);
  if (isStraight && isFlush) { if (straightHigh === 14) return { category: 8, tiebreakers: [14] }; return { category: 7, tiebreakers: [straightHigh] }; }
  if (groups[0].count === 4) return { category: 6, tiebreakers: [groups[0].val, groups[1].val] };
  if (groups[0].count === 3 && groups[1].count === 2) return { category: 5, tiebreakers: [groups[0].val, groups[1].val] };
  if (isFlush) return { category: 4, tiebreakers: vals };
  if (isStraight) return { category: 3, tiebreakers: [straightHigh] };
  if (groups[0].count === 3) return { category: 2, tiebreakers: [groups[0].val, groups[1].val, groups[2].val] };
  if (groups[0].count === 2 && groups[1].count === 2) return { category: 1, tiebreakers: [groups[0].val, groups[1].val, groups[2].val] };
  if (groups[0].count === 2) return { category: 0, tiebreakers: [groups[0].val, groups[1].val, groups[2].val, groups[3].val] };
  return { category: -1, tiebreakers: vals };
}

function compare5(a, b) {
  if (a.category !== b.category) return a.category - b.category;
  const len = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < len; i++) { const av = a.tiebreakers[i] || 0, bv = b.tiebreakers[i] || 0; if (av !== bv) return av - bv; }
  return 0;
}

// Precompute 7C5 = 21 combinations
const COMBO7_5 = [];
(function() { function helper(start, combo) { if (combo.length === 5) { COMBO7_5.push(combo.slice()); return; } for (let i = start; i < 7; i++) { combo.push(i); helper(i + 1, combo); combo.pop(); } } helper(0, []); })();

function bestHand(hole, community) {
  const all = [hole[0], hole[1], community[0], community[1], community[2], community[3], community[4]];
  let best = null;
  for (let i = 0; i < COMBO7_5.length; i++) {
    const idx = COMBO7_5[i];
    const e = evaluate5([all[idx[0]], all[idx[1]], all[idx[2]], all[idx[3]], all[idx[4]]]);
    if (!best || compare5(e, best) > 0) best = e;
  }
  return best;
}

function combinations(arr, k) {
  const result = [];
  function helper(start, combo) { if (combo.length === k) { result.push(combo.slice()); return; } for (let i = start; i < arr.length; i++) { combo.push(arr[i]); helper(i + 1, combo); combo.pop(); } }
  helper(0, []);
  return result;
}

// ── Constants ──
const HE_CARD = 0.15, HE_RANK = 0.12, HE_COLOR = 0.04, HE_RIVER = 0.035, LOCKOUT = 0.80;

// ── Main ──
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

for (let flopIdx = 0; flopIdx < allFlops.length; flopIdx++) {
  const flop = allFlops[flopIdx];
  const flopKeys = new Set(flop.map(cardKey));
  const remaining = DEALER_STOCK.filter(c => !flopKeys.has(cardKey(c)));
  const turnRiverCombos = combinations(remaining, 2);

  // Post-flop odds
  const cardWC = new Array(10).fill(0);
  const rankWC = {};
  const colorWC = { '3R':0,'4R':0,'5R':0,'3B':0,'4B':0,'5B':0 };
  let bwCnt = 0, tot = 0;

  for (let c = 0; c < turnRiverCombos.length; c++) {
    const board = [flop[0], flop[1], flop[2], turnRiverCombos[c][0], turnRiverCombos[c][1]];
    const hr = FIXED_HANDS.map(h => bestHand(h.cards, board));
    const br = evaluate5(board);
    const bba = hr.every(r => compare5(br, r) > 0);
    if (!bba) {
      let best = hr[0];
      for (let i = 1; i < 10; i++) if (compare5(hr[i], best) > 0) best = hr[i];
      for (let i = 0; i < 10; i++) if (compare5(hr[i], best) === 0) cardWC[i]++;
      rankWC[best.category] = (rankWC[best.category] || 0) + 1;
    } else { bwCnt++; rankWC[br.category] = (rankWC[br.category] || 0) + 1; }
    let reds = 0;
    for (let i = 0; i < 5; i++) if (cardColor(board[i]) === 'red') reds++;
    const blacks = 5 - reds;
    if (reds === 3) colorWC['3R']++; if (reds === 4) colorWC['4R']++; if (reds === 5) colorWC['5R']++;
    if (blacks === 3) colorWC['3B']++; if (blacks === 4) colorWC['4B']++; if (blacks === 5) colorWC['5B']++;
    tot++;
  }

  // Pick favorites
  let cardPick = -1, cardPP = -1, cardPay = null;
  for (let i = 0; i < 10; i++) { const p = cardWC[i]/tot; const pay = payoutFromProb(p, HE_CARD); const locked = p === 0 || p > LOCKOUT || pay > 400 || pay < 0.1; if (!locked && p > cardPP) { cardPP = p; cardPay = pay; cardPick = i; } }
  if (cardPick === -1) for (let i = 0; i < 10; i++) { const p = cardWC[i]/tot; if (p > cardPP) { cardPP = p; cardPay = payoutFromProb(p, HE_CARD); cardPick = i; } }

  let rankPickLabel = null, rankPP = -1, rankPay = null, rankPickCat = -1;
  for (const cat of Object.keys(CAT_TO_LABEL)) { const p = (rankWC[cat]||0)/tot; const pay = payoutFromProb(p, HE_RANK); const locked = p === 0 || p > LOCKOUT || pay > 400 || pay < 0.1; if (!locked && p > rankPP) { rankPP = p; rankPay = pay; rankPickLabel = CAT_TO_LABEL[cat]; rankPickCat = +cat; } }
  if (rankPickLabel === null) for (const cat of Object.keys(CAT_TO_LABEL)) { const p = (rankWC[cat]||0)/tot; if (p > rankPP) { rankPP = p; rankPay = payoutFromProb(p, HE_RANK); rankPickLabel = CAT_TO_LABEL[cat]; rankPickCat = +cat; } }

  let colorPick = null, colorPP = -1, colorPay = null;
  for (const k of ['3R','4R','5R','3B','4B','5B']) { const p = colorWC[k]/tot; const pay = payoutFromProb(p, HE_COLOR); const locked = p === 0 || p > LOCKOUT; if (!locked && p > colorPP) { colorPP = p; colorPay = pay; colorPick = k; } }
  if (colorPick === null) for (const k of ['3R','4R','5R','3B','4B','5B']) { const p = colorWC[k]/tot; if (p > colorPP) { colorPP = p; colorPay = payoutFromProb(p, HE_COLOR); colorPick = k; } }

  // Enumerate outcomes
  for (let c = 0; c < turnRiverCombos.length; c++) {
    const turn = turnRiverCombos[c][0], river = turnRiverCombos[c][1];
    const board = [flop[0], flop[1], flop[2], turn, river];
    const hr = FIXED_HANDS.map(h => bestHand(h.cards, board));
    const br = evaluate5(board);
    const bba = hr.every(r => compare5(br, r) > 0);
    stats.totalRounds++;

    let cardWon = false, winCat = null;
    if (!bba) { let best = hr[0]; for (let i = 1; i < 10; i++) if (compare5(hr[i], best) > 0) best = hr[i]; winCat = best.category; for (let i = 0; i < 10; i++) if (compare5(hr[i], best) === 0 && i === cardPick) cardWon = true; }
    else { stats.boardWinCount++; winCat = br.category; }

    let rankWon = rankPickCat === winCat;

    let reds = 0; for (let i = 0; i < 5; i++) if (cardColor(board[i]) === 'red') reds++;
    const blacks = 5 - reds;
    let colorWon = (colorPick === '3R' && reds === 3) || (colorPick === '4R' && reds === 4) || (colorPick === '5R' && reds === 5) || (colorPick === '3B' && blacks === 3) || (colorPick === '4B' && blacks === 4) || (colorPick === '5B' && blacks === 5);

    // River odds (post-turn)
    const b4keys = new Set([flop[0],flop[1],flop[2],turn].map(cardKey));
    const rRem = DEALER_STOCK.filter(c => !b4keys.has(cardKey(c)));
    const lc = rRem.filter(c => isLowRank(c.rank)).length, hc = rRem.length - lc;
    const pL = lc/rRem.length, pH = hc/rRem.length;
    let rPick = null, rPay = null;
    if (pL >= pH && pL > 0 && pL <= LOCKOUT) { rPick = 'low'; rPay = payoutFromProb(pL, HE_RIVER); }
    else if (pH > 0 && pH <= LOCKOUT) { rPick = 'high'; rPay = payoutFromProb(pH, HE_RIVER); }
    else if (pL > 0) { rPick = 'low'; rPay = payoutFromProb(pL, HE_RIVER); }
    else if (pH > 0) { rPick = 'high'; rPay = payoutFromProb(pH, HE_RIVER); }
    let riverWon = (rPick === 'low' && isLowRank(river.rank)) || (rPick === 'high' && !isLowRank(river.rank));

    let bw = 0;
    if (cardWon) { bw++; stats.cardWins++; }
    if (rankWon) { bw++; stats.rankWins++; }
    if (colorWon) { bw++; stats.colorWins++; }
    if (riverWon) { bw++; stats.riverWins++; }
    stats.anteWins[bw]++;

    stats.totalAnteBet += 1;
    if (bw === 1 || bw === 2) stats.totalAnteReturned += 1;
    else if (bw === 3) { stats.totalAnteReturned += 1; stats.totalAnteBonus += 1; }
    else if (bw === 4) { stats.totalAnteReturned += 1; stats.totalAnteBonus += 2; }

    stats.totalBoardBet += 4;
    if (cardWon && cardPay !== null) { stats.totalBoardPayout += cardPay; stats.cardBoardPayout += cardPay; }
    if (rankWon && rankPay !== null) { stats.totalBoardPayout += rankPay; stats.rankBoardPayout += rankPay; }
    if (colorWon && colorPay !== null) { stats.totalBoardPayout += colorPay; stats.colorBoardPayout += colorPay; }
    if (riverWon && rPay !== null) { stats.totalBoardPayout += rPay; stats.riverBoardPayout += rPay; }

    // RNG Bonus
    const bCardIdx = Math.floor(Math.random() * 10);
    if (!bba) { let best = hr[0]; for (let i = 1; i < 10; i++) if (compare5(hr[i], best) > 0) best = hr[i]; if (compare5(hr[bCardIdx], best) === 0 && bCardIdx === cardPick) { const b = cardPay * 4; stats.totalRngBonus += b; stats.rngCardBonus += b; stats.rngCardTriggers++; } }
    const bRankIdx = Math.floor(Math.random() * 7);
    const bRankLabel = RANK_BONUS_POSITIONS[bRankIdx];
    if (bRankLabel === CAT_TO_LABEL[winCat] && bRankLabel === rankPickLabel) { const b = rankPay * 3; stats.totalRngBonus += b; stats.rngRankBonus += b; stats.rngRankTriggers++; }
    const bCRIdx = Math.floor(Math.random() * 8);
    if (bCRIdx < 6) { const ck = COLOR_RIVER_BONUS_POSITIONS[bCRIdx]; let ch = (ck==='3R'&&reds===3)||(ck==='4R'&&reds===4)||(ck==='5R'&&reds===5)||(ck==='3B'&&blacks===3)||(ck==='4B'&&blacks===4)||(ck==='5B'&&blacks===5); if (ch && ck === colorPick) { const b = colorPay * 2; stats.totalRngBonus += b; stats.rngColorRiverBonus += b; stats.rngColorRiverTriggers++; } }
    else { const rs = COLOR_RIVER_BONUS_POSITIONS[bCRIdx]; let rh = (rs==='low'&&isLowRank(river.rank))||(rs==='high'&&!isLowRank(river.rank)); if (rh && rs === rPick) { const b = rPay * 2; stats.totalRngBonus += b; stats.rngColorRiverBonus += b; stats.rngColorRiverTriggers++; } }
  }
  if ((flopIdx + 1) % 500 === 0) console.log('  Processed ' + (flopIdx + 1) + '/' + allFlops.length + ' flops...');
}

// Results
console.log('\n===================================================');
console.log('  ANTE BONUS + RNG BONUS — RTP SIMULATION RESULTS');
console.log('===================================================\n');
console.log('Total rounds: ' + stats.totalRounds.toLocaleString());
console.log('Board beats all: ' + stats.boardWinCount.toLocaleString() + ' (' + (stats.boardWinCount/stats.totalRounds*100).toFixed(2) + '%)\n');

console.log('-- ANTE BONUS DISTRIBUTION --');
for (let i = 0; i <= 4; i++) console.log('  ' + i + ' boards: ' + stats.anteWins[i].toLocaleString() + ' (' + (stats.anteWins[i]/stats.totalRounds*100).toFixed(4) + '%)');

console.log('\n-- PER-BOARD WIN RATES (favorite) --');
console.log('  Card:  ' + (stats.cardWins/stats.totalRounds*100).toFixed(2) + '%');
console.log('  Rank:  ' + (stats.rankWins/stats.totalRounds*100).toFixed(2) + '%');
console.log('  Color: ' + (stats.colorWins/stats.totalRounds*100).toFixed(2) + '%');
console.log('  River: ' + (stats.riverWins/stats.totalRounds*100).toFixed(2) + '%');

const boardBetsRet = stats.cardWins + stats.rankWins + stats.colorWins + stats.riverWins;
const totalBoardRet = boardBetsRet + stats.totalBoardPayout;
const totalWag = stats.totalAnteBet + stats.totalBoardBet;
const totalRet = stats.totalAnteReturned + stats.totalAnteBonus + totalBoardRet + stats.totalRngBonus;
const rtp = totalRet / totalWag * 100;

console.log('\n-- FINANCIAL (per $1 Ante) --');
console.log('  Wagered: $' + totalWag.toLocaleString() + ' ($1 ante + $4 boards)');
console.log('  Returned: $' + totalRet.toLocaleString(undefined,{maximumFractionDigits:2}));
console.log('  BLENDED RTP: ' + rtp.toFixed(2) + '%');
console.log('  House Edge: ' + (100-rtp).toFixed(2) + '%\n');

console.log('-- BREAKDOWN --');
console.log('  Ante: wagered $' + stats.totalAnteBet + ', returned $' + stats.totalAnteReturned + ', bonus $' + stats.totalAnteBonus.toFixed(2));
console.log('    Ante RTP: ' + ((stats.totalAnteReturned+stats.totalAnteBonus)/stats.totalAnteBet*100).toFixed(2) + '%');
console.log('  Boards: wagered $' + stats.totalBoardBet + ', returned $' + totalBoardRet.toFixed(2));
console.log('    Board RTP: ' + (totalBoardRet/stats.totalBoardBet*100).toFixed(2) + '%');
console.log('    Card:  $' + stats.cardBoardPayout.toFixed(2) + ' + $' + stats.cardWins + ' returns');
console.log('    Rank:  $' + stats.rankBoardPayout.toFixed(2) + ' + $' + stats.rankWins + ' returns');
console.log('    Color: $' + stats.colorBoardPayout.toFixed(2) + ' + $' + stats.colorWins + ' returns');
console.log('    River: $' + stats.riverBoardPayout.toFixed(2) + ' + $' + stats.riverWins + ' returns');
console.log('  RNG: $' + stats.totalRngBonus.toFixed(2) + ' (' + (stats.totalRngBonus/totalWag*100).toFixed(2) + '% of wagered)');
console.log('    Card(x5): ' + stats.rngCardTriggers + ' hits, $' + stats.rngCardBonus.toFixed(2));
console.log('    Rank(x4): ' + stats.rngRankTriggers + ' hits, $' + stats.rngRankBonus.toFixed(2));
console.log('    CR(x3):   ' + stats.rngColorRiverTriggers + ' hits, $' + stats.rngColorRiverBonus.toFixed(2));

console.log('\n-- ANTE EV --');
console.log('  Net EV/round: $' + ((stats.totalAnteReturned+stats.totalAnteBonus-stats.totalAnteBet)/stats.totalRounds).toFixed(4));
console.log('  Returned: ' + (stats.totalAnteReturned/stats.totalAnteBet*100).toFixed(2) + '%');
console.log('  Bonus: ' + (stats.totalAnteBonus/stats.totalAnteBet*100).toFixed(2) + '%');
console.log('  Lost: ' + ((stats.totalAnteBet-stats.totalAnteReturned)/stats.totalAnteBet*100).toFixed(2) + '%');
console.log('\n===================================================');
