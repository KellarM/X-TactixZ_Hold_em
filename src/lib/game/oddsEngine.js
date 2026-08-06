// Post-Flop & Post-Turn odds engine + round resolution.
// Uses COMPLETE ENUMERATION (not Monte Carlo) per the build spec.

import { bestHand, evaluate5, compare5, combinations } from './pokerEvaluator';
import { cardColor, isLowRank, cardKey, CAT_TO_LABEL } from './cards';

// Tiered house edges — higher for boards where player has more post-flop information
export const HOUSE_EDGE_CARD  = 0.15;  // Card Board: player sees exact hand matchups post-flop
export const HOUSE_EDGE_RANK  = 0.12;  // Rank Board: player sees rank distribution
export const HOUSE_EDGE_COLOR = 0.04;  // Color Board: LOCKED at 96% RTP (4% HE) — 4 pre-certifiable states
export const HOUSE_EDGE_RIVER = 0.035; // River Board: 96.5% RTP — certified 2M round simulation
export const LOCKOUT_THRESHOLD = 0.80; // Lockout dominant positions at 80% (tightened from 90%)

// Odds thresholds — positions outside this payout window are dead (not bettable)
// Configurable operator settings. Starting values for tuning — not final.
// Separate per-board so they can be tuned independently.
export const ODDS_THRESHOLD_CARD_HIGH = 400;   // Card Board max odds — locked at 400:1 or higher
export const ODDS_THRESHOLD_CARD_LOW  = 0.1;   // Card Board min odds — locked at 0.1:1 or lower
export const ODDS_THRESHOLD_RANK_HIGH = 400;   // Rank Board max odds — locked at 400:1 or higher
export const ODDS_THRESHOLD_RANK_LOW  = 0.1;   // Rank Board min odds — locked at 0.1:1 or lower
// NOTE: Color and River boards intentionally do NOT use odds thresholds.
// Color Board is locked at a pre-certified 96% RTP with fixed payouts as low as
// 0.856:1 by design (3 positions always live per flop state) — a 1.1 floor would
// falsely kill one of the 3 live positions on every single flop.
// River Board is an inherently near-50/50 bet — at 3.5% house edge (96.5% RTP),
// payouts run ~0.69-1.25:1 almost always, so a 1.1 floor locks BOTH sides most rounds.
// Bug found and fixed 2026-08-03: these were mistakenly added without being
// requested (only Card/Rank thresholds were asked for) and broke live gameplay.

// Check if a payout falls outside a given threshold window
function payoutOutsideThresholds(payout, high, low) {
  if (payout === null) return true;
  return payout > high || payout < low;
}

// Correct flat house-edge formula: EV = -HE regardless of probability
// payout = (1 - HE) / p - 1
// This ensures the casino holds exactly HE per dollar bet at every probability.
// (The old formula (1/p-1)*(1-HE) only held ~HE*(1-p), which nearly vanished at high probs.)
function payoutFromProb(p, houseEdge) {
  if (p <= 0) return null;
  return (1 - houseEdge) / p - 1;
}

// Determine specific lock reason for display: 'dead', 'dominant', 'threshold-high', 'threshold-low', or null
function lockReasonFor(p, payout, high, low) {
  if (p === 0) return 'dead';
  if (p > LOCKOUT_THRESHOLD) return 'dominant';
  if (payout === null) return 'dead';
  if (payout > high) return 'threshold-high';
  if (payout < low) return 'threshold-low';
  return null;
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
      payout: payoutFromProb(p, HOUSE_EDGE_CARD),
      locked: p === 0 || p > LOCKOUT_THRESHOLD || payoutOutsideThresholds(payoutFromProb(p, HOUSE_EDGE_CARD), ODDS_THRESHOLD_CARD_HIGH, ODDS_THRESHOLD_CARD_LOW),
      reason: lockReasonFor(p, payoutFromProb(p, HOUSE_EDGE_CARD), ODDS_THRESHOLD_CARD_HIGH, ODDS_THRESHOLD_CARD_LOW)
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
      payout: payoutFromProb(p, HOUSE_EDGE_RANK),
      locked: p === 0 || p > LOCKOUT_THRESHOLD || payoutOutsideThresholds(payoutFromProb(p, HOUSE_EDGE_RANK), ODDS_THRESHOLD_RANK_HIGH, ODDS_THRESHOLD_RANK_LOW),
      reason: lockReasonFor(p, payoutFromProb(p, HOUSE_EDGE_RANK), ODDS_THRESHOLD_RANK_HIGH, ODDS_THRESHOLD_RANK_LOW)
    };
  }

  const colorOdds = {};
  for (const k of ['3R', '4R', '5R', '3B', '4B', '5B']) {
    const wins = colorWins[k];
    const p = wins / total;
    colorOdds[k] = {
      wins,
      probability: p,
      payout: payoutFromProb(p, HOUSE_EDGE_COLOR),
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
    low: { count: lowCount, probability: pLow, payout: payoutFromProb(pLow, HOUSE_EDGE_RIVER), locked: pLow === 0 || pLow > LOCKOUT_THRESHOLD },
    high: { count: highCount, probability: pHigh, payout: payoutFromProb(pHigh, HOUSE_EDGE_RIVER), locked: pHigh === 0 || pHigh > LOCKOUT_THRESHOLD },
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