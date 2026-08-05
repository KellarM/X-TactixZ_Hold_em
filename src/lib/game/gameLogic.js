// Round settlement: compute winnings for all placed bets given the resolved board.

import { resolveRound } from './oddsEngine';
import { isLowRank, CAT_TO_LABEL, SUIT_SYMBOL, cardColor } from './cards';

const TYPE_DISPLAY = {
  '1 Pair': '1 PAIR',
  '2 Pair': '2 PAIR',
  '3 Of A Kind': '3 OF KIND',
  'Straight': 'STRAIGHT',
  'Flush': 'FLUSH',
  'Full House': 'FULL HSE',
  '4 Of A Kind': '4 OF KIND'
};

const TYPE_COLOR = {
  '1 PAIR': '#55D6FF',
  '2 PAIR': '#55D6FF',
  '3 OF KIND': '#B279FF',
  'STRAIGHT': '#55D6FF',
  'FLUSH': '#FF9E4A',
  'FULL HSE': '#39FF7D',
  '4 OF KIND': '#FFD700',
  'BOARD': '#FFFFFF'
};

function formatHandNotation(cards) {
  return cards.map(c => `${c.rank}${SUIT_SYMBOL[c.suit]}`).join('/');
}

export function settleRound(community, hands, bets, flopOdds, riverOdds) {
  const res = resolveRound(community, hands);
  let winnings = 0;
  const details = { card: [], rank: [], color: [], river: [], boardWin: res.boardWin };

  // Card Board — push ALL bets (winners + losers) so the overlay can sum the true wager
  // NOTE: Object.keys() always returns STRING keys, even for numeric object keys.
  // hand.id in FIXED_HANDS is a NUMBER. We must convert id -> Number here so
  // downstream lookups (FIXED_HANDS.find(h => h.id === id)) actually match —
  // otherwise the label lookup always misses and falls back to generic "Hand N" text.
  if (res.boardWin) {
    Object.keys(bets.card).forEach(id => {
      const amt = bets.card[id] || 0;
      if (amt > 0) details.card.push({ id: Number(id), amt, payout: null, won: false });
    });
  } else {
    const numWinners = res.winners.length;
    Object.keys(bets.card).forEach(id => {
      const amt = bets.card[id] || 0;
      if (amt <= 0) return;
      const numId = Number(id);
      const oddsEntry = flopOdds && flopOdds.cardOdds ? flopOdds.cardOdds.find(o => o.handId === numId) : null;
      const isWinner = res.winners.includes(numId);
      if (isWinner && oddsEntry && oddsEntry.payout != null) {
        let payout = oddsEntry.payout;
        if (numWinners > 1) payout = ((payout + 1) / 2) * 1.05 - 1;
        const winAmt = Math.round(amt * (payout + 1) * 100) / 100;
        winnings += winAmt;
        details.card.push({ id: numId, amt, payout, won: true });
      } else {
        details.card.push({ id: numId, amt, payout: null, won: false });
      }
    });
  }

  // Rank Board — push ALL bets
  if (res.boardWin) {
    Object.keys(bets.rank).forEach(label => {
      const amt = bets.rank[label] || 0;
      if (amt > 0) details.rank.push({ label, amt, payout: null, won: false });
    });
  } else {
    const winLabel = CAT_TO_LABEL[res.winningCategory];
    Object.keys(bets.rank).forEach(label => {
      const amt = bets.rank[label] || 0;
      if (amt <= 0) return;
      const won = label === winLabel;
      if (won && flopOdds && flopOdds.rankOdds[label] && flopOdds.rankOdds[label].payout != null) {
        const payout = flopOdds.rankOdds[label].payout;
        const winAmt = Math.round(amt * (payout + 1) * 100) / 100;
        winnings += winAmt;
        details.rank.push({ label, amt, payout, won: true });
      } else {
        details.rank.push({ label, amt, payout: null, won: false });
      }
    });
  }

  // Color Board (exact match) — push ALL bets
  ['3R', '4R', '5R', '3B', '4B', '5B'].forEach(k => {
    const amt = bets.color[k] || 0;
    if (amt <= 0) return;
    const targetCount = parseInt(k[0], 10);
    const targetColor = k[1] === 'R' ? 'red' : 'black';
    const actual = targetColor === 'red' ? res.reds : res.blacks;
    const won = actual === targetCount;
    if (won && flopOdds && flopOdds.colorOdds[k] && flopOdds.colorOdds[k].payout != null) {
      const payout = flopOdds.colorOdds[k].payout;
      const winAmt = Math.round(amt * (payout + 1) * 100) / 100;
      winnings += winAmt;
      details.color.push({ k, amt, payout, won: true });
    } else {
      details.color.push({ k, amt, payout: null, won: false });
    }
  });

  // River Board — push ALL bets (both low/high can be bet)
  if (riverOdds && community.length >= 5) {
    const riverCard = community[4];
    const riverIsLow = isLowRank(riverCard.rank);
    ['low', 'high'].forEach(side => {
      const amt = bets.river[side] || 0;
      if (amt <= 0) return;
      const won = (side === 'low' && riverIsLow) || (side === 'high' && !riverIsLow);
      if (won && riverOdds[side] && riverOdds[side].payout != null) {
        const payout = riverOdds[side].payout;
        const winAmt = Math.round(amt * (payout + 1) * 100) / 100;
        winnings += winAmt;
        details.river.push({ side, amt, payout, won: true });
      } else {
        details.river.push({ side, amt, payout: null, won: false });
      }
    });
  }

  // History entry
  const typeKey = res.boardWin ? 'BOARD' : (TYPE_DISPLAY[CAT_TO_LABEL[res.winningCategory]] || 'BOARD');
  let handNotation;
  if (res.boardWin) {
    handNotation = 'BOARD';
  } else {
    const winHand = hands.find(h => h.id === res.winners[0]);
    handNotation = formatHandNotation(winHand.cards);
  }
  const colorPart = res.reds >= 3 ? `${res.reds}R` : `${res.blacks}B`;
  const lhPart = res.riverLow ? 'L' : 'H';
  const historyEntry = {
    hand: handNotation,
    handCards: res.boardWin ? null : hands.find(h => h.id === res.winners[0]).cards,
    type: typeKey,
    rb: `${colorPart} ${lhPart}`,
    color: TYPE_COLOR[typeKey] || '#FFFFFF'
  };

  return { winnings: Math.round(winnings * 100) / 100, details, historyEntry, resolution: res };
}