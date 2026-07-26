// Post-Flop & Post-Turn odds engine + round resolution.
// Uses COMPLETE ENUMERATION (not Monte Carlo) per the build spec.

import { bestHand, evaluate5, compare5, combinations } from './pokerEvaluator';
import { cardColor, isLowRank, cardKey, CAT_TO_LABEL } from './cards';

export const HOUSE_EDGE = 0.05;        // 5% house edge
export const LOCKOUT_THRESHOLD = 0.90; // dominant lockout (configurable)

function payoutFromProb(p) {
  if (p <= 0) return null;
  const fair = (1 / p) - 1;
  return fair * (1 - HOUSE_EDGE);
}

// Compute exact odds for every position after the flop (3 community cards).
// remaining = 29 cards, C(29,2) = 406 turn+river combinations.
export function computePostFlopOdds(flop, stock, hands) {
  const flopKeys = new Set(flop.map(cardKey));
  const remaining = stock.filter(c => !flopKeys.has(cardKey(c)));
  const combos = combinations(remaining, 2); // 406

  const cardWins = new Array(hands.length).fill(0);
  const rankWins = {};          // by category index
  const colorWins = { '3R': 0, '4R': 0, '5R': 0, '3B': 0, '4B': 0, '5B': 0 };
  let boardWins = 0;
  let total = 0;

  for (let c = 0; c < combos.length; c++) {
    const turn = combos[c][0];
    const river = combos[c][1];
    const board = [flop[0], flop[1], flop[2], turn, river];

    const handResults = hands.map(h => bestHand(h.cards, board));
    const boardResult = evaluate5(board);
    const boardBeatsAll = handResults.every(hr => compare5(boardResult, hr) > 0);

    if (!boardBeatsAll) {
      let best = handResults[0];
      for (let i = 1; i < handResults.length; i++) {
        if (compare5(handResults[i], best) > 0) best = handResults[i];
      }
      for (let i = 0; i < handResults.length; i++) {
        if (compare5(handResults[i], best) === 0) cardWins[i]++;
      }
      rankWins[best.category] = (rankWins[best.category] || 0) + 1;
    } else {
      boardWins++;
    }

    let reds = 0;
    for (let i = 0; i < 5; i++) if (cardColor(board[i]) === 'red') reds++;
    const blacks = 5 - reds;
    if (reds === 3) colorWins['3R']++;
    if (reds === 4) colorWins['4R']++;
    if (reds === 5) colorWins['5R']++;
    if (blacks === 3) colorWins['3B']++;
    if (blacks === 4) colorWins['4B']++;
    if (blacks === 5) colorWins['5B']++;

    total++;
  }

  const cardOdds = hands.map((h, i) => {
    const wins = cardWins[i];
    const p = wins / total;
    return {
      handId: h.id,
      wins,
      probability: p,
      payout: payoutFromProb(p),
      locked: p === 0 || p > LOCKOUT_THRESHOLD,
      reason: p === 0 ? 'dead' : (p > LOCKOUT_THRESHOLD ? 'dominant' : null)
    };
  });

  const rankOdds = {};
  for (const cat of Object.keys(CAT_TO_LABEL)) {
    const label = CAT_TO_LABEL[cat];
    const wins = rankWins[cat] || 0;
    const p = wins / total;
    rankOdds[label] = {
      wins,
      probability: p,
      payout: payoutFromProb(p),
      locked: p === 0 || p > LOCKOUT_THRESHOLD,
      reason: p === 0 ? 'dead' : (p > LOCKOUT_THRESHOLD ? 'dominant' : null)
    };
  }

  const colorOdds = {};
  for (const k of ['3R', '4R', '5R', '3B', '4B', '5B']) {
    const wins = colorWins[k];
    const p = wins / total;
    colorOdds[k] = {
      wins,
      probability: p,
      payout: payoutFromProb(p),
      locked: p === 0 || p > LOCKOUT_THRESHOLD,
      reason: p === 0 ? 'dead' : (p > LOCKOUT_THRESHOLD ? 'dominant' : null)
    };
  }

  return {
    cardOdds,
    rankOdds,
    colorOdds,
    boardWinProb: boardWins / total,
    total
  };
}

// Post-Turn River odds: LOW (2-7) vs HIGH (8-A) from the 28 remaining cards.
export function computeRiverOdds(board4, stock) {
  const boardKeys = new Set(board4.map(cardKey));
  const remaining = stock.filter(c => !boardKeys.has(cardKey(c)));
  const lowCount = remaining.filter(c => isLowRank(c.rank)).length;
  const highCount = remaining.length - lowCount;
  const pLow = lowCount / remaining.length;
  const pHigh = highCount / remaining.length;
  return {
    low: { count: lowCount, probability: pLow, payout: payoutFromProb(pLow), locked: pLow === 0 || pLow > LOCKOUT_THRESHOLD },
    high: { count: highCount, probability: pHigh, payout: payoutFromProb(pHigh), locked: pHigh === 0 || pHigh > LOCKOUT_THRESHOLD },
    remaining: remaining.length
  };
}

// Resolve a completed 5-card community board against the 10 fixed hands.
export function resolveRound(community, hands) {
  const handResults = hands.map(h => ({ id: h.id, label: h.label, cards: h.cards, result: bestHand(h.cards, community) }));
  const boardResult = evaluate5(community);
  const boardWin = handResults.every(hr => compare5(boardResult, hr.result) > 0);

  let winners = [];
  let winningCategory = null;
  let winningResult = boardResult;

  if (!boardWin) {
    let best = handResults[0].result;
    for (let i = 1; i < handResults.length; i++) {
      if (compare5(handResults[i].result, best) > 0) best = handResults[i].result;
    }
    for (let i = 0; i < handResults.length; i++) {
      if (compare5(handResults[i].result, best) === 0) winners.push(handResults[i].id);
    }
    winningCategory = best.category;
    winningResult = best;
  } else {
    winningCategory = boardResult.category;
  }

  let reds = 0;
  for (let i = 0; i < 5; i++) if (cardColor(community[i]) === 'red') reds++;
  const riverCard = community[4];
  const riverLow = isLowRank(riverCard.rank);

  return {
    boardWin,
    winners,
    winningCategory,
    winningResult,
    reds,
    blacks: 5 - reds,
    riverLow
  };
}