// Texas Hold'em hand evaluator: best 5 cards from 7.
// Category scale (high to low):
// 8 Royal Flush, 7 Straight Flush, 6 Four of a Kind, 5 Full House, 4 Flush,
// 3 Straight, 2 Three of a Kind, 1 Two Pair, 0 One Pair, -1 High Card

import { rankValue } from './cards.js';

const VAL_CACHE = {};
function rv(rank) {
  if (!(rank in VAL_CACHE)) VAL_CACHE[rank] = rankValue(rank);
  return VAL_CACHE[rank];
}

// All index combinations of k from n (cached for 7-choose-5).
function combinations(arr, k) {
  const result = [];
  const n = arr.length;
  function helper(start, combo) {
    if (combo.length === k) {
      result.push(combo.slice());
      return;
    }
    for (let i = start; i < n; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

const COMBO7_5 = combinations([0, 1, 2, 3, 4, 5, 6], 5);

// Evaluate exactly 5 cards.
export function evaluate5(cards) {
  const vals = cards.map(c => rv(c.rank)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2] && suits[2] === suits[3] && suits[3] === suits[4];

  const unique = [];
  const seen = {};
  for (const v of vals) {
    if (!seen[v]) {
      seen[v] = true;
      unique.push(v);
    }
  }
  unique.sort((a, b) => b - a);

  let isStraight = false;
  let straightHigh = 0;
  if (unique.length === 5) {
    if (unique[0] - unique[4] === 4) {
      isStraight = true;
      straightHigh = unique[0];
    } else if (unique[0] === 14 && unique[1] === 5 && unique[2] === 4 && unique[3] === 3 && unique[4] === 2) {
      // wheel: A-2-3-4-5 (5-high straight)
      isStraight = true;
      straightHigh = 5;
    }
  }

  const freq = {};
  for (const v of vals) freq[v] = (freq[v] || 0) + 1;
  const groups = Object.keys(freq).map(v => ({ val: +v, count: freq[v] })).sort((a, b) => b.count - a.count || b.val - a.val);

  if (isStraight && isFlush) {
    if (straightHigh === 14) return { category: 8, tiebreakers: [14], name: 'Royal Flush' };
    return { category: 7, tiebreakers: [straightHigh], name: 'Straight Flush' };
  }
  if (groups[0].count === 4) return { category: 6, tiebreakers: [groups[0].val, groups[1].val], name: 'Four of a Kind' };
  if (groups[0].count === 3 && groups[1].count === 2) return { category: 5, tiebreakers: [groups[0].val, groups[1].val], name: 'Full House' };
  if (isFlush) return { category: 4, tiebreakers: vals, name: 'Flush' };
  if (isStraight) return { category: 3, tiebreakers: [straightHigh], name: 'Straight' };
  if (groups[0].count === 3) return { category: 2, tiebreakers: [groups[0].val, groups[1].val, groups[2].val], name: 'Three of a Kind' };
  if (groups[0].count === 2 && groups[1].count === 2) return { category: 1, tiebreakers: [groups[0].val, groups[1].val, groups[2].val], name: 'Two Pair' };
  if (groups[0].count === 2) return { category: 0, tiebreakers: [groups[0].val, groups[1].val, groups[2].val, groups[3].val], name: 'One Pair' };
  return { category: -1, tiebreakers: vals, name: 'High Card' };
}

// >0 if a wins, <0 if b wins, 0 if tie.
export function compare5(a, b) {
  if (a.category !== b.category) return a.category - b.category;
  const len = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < len; i++) {
    const av = a.tiebreakers[i] || 0;
    const bv = b.tiebreakers[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

// Best 5-card hand from 2 hole + 5 community (7 cards).
export function bestHand(hole, community) {
  const all = [hole[0], hole[1], community[0], community[1], community[2], community[3], community[4]];
  let best = null;
  for (let i = 0; i < COMBO7_5.length; i++) {
    const idx = COMBO7_5[i];
    const e = evaluate5([all[idx[0]], all[idx[1]], all[idx[2]], all[idx[3]], all[idx[4]]]);
    if (!best || compare5(e, best) > 0) best = e;
  }
  return best;
}

export { combinations };