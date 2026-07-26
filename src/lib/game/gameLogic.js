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
  const details = { card: [], rank: [], color: [], river: null, boardWin: res.boardWin };

  // Card Board
  if (!res.boardWin && res.winners.length > 0) {
    const numWinners = res.winners.length;
    res.winners.forEach(id => {
      const amt = bets.card[id] || 0;
      if (amt > 0) {
        const oddsEntry = flopOdds && flopOdds.cardOdds ? flopOdds.cardOdds.find(o => o.handId === id) : null;
        let payout = oddsEntry ? oddsEntry.payout : null;
        if (payout != null && numWinners > 1) {
          payout = ((payout + 1) / 2) * 1.05 - 1;
        }
        if (payout != null) {
          winnings += amt * (payout + 1);
          details.card.push({ id, amt, payout, won: true });
        } else {
          details.card.push({ id, amt, payout: null, won: false });
        }
      }
    });
  }

  // Rank Board
  if (!res.boardWin) {
    const label = CAT_TO_LABEL[res.winningCategory];
    if (label && TYPE_DISPLAY[label]) {
      const amt = bets.rank[label] || 0;
      if (amt > 0 && flopOdds && flopOdds.rankOdds[label] && flopOdds.rankOdds[label].payout != null) {
        const payout = flopOdds.rankOdds[label].payout;
        winnings += amt * (payout + 1);
        details.rank.push({ label, amt, payout, won: true });
      }
    }
  }

  // Color Board (exact match)
  ['3R', '4R', '5R', '3B', '4B', '5B'].forEach(k => {
    const amt = bets.color[k] || 0;
    if (amt > 0 && flopOdds && flopOdds.colorOdds[k] && flopOdds.colorOdds[k].payout != null) {
      const targetCount = parseInt(k[0], 10);
      const targetColor = k[1] === 'R' ? 'red' : 'black';
      const actual = targetColor === 'red' ? res.reds : res.blacks;
      if (actual === targetCount) {
        const payout = flopOdds.colorOdds[k].payout;
        winnings += amt * (payout + 1);
        details.color.push({ k, amt, payout, won: true });
      }
    }
  });

  // River Board
  if (riverOdds && community.length >= 5) {
    const riverCard = community[4];
    const riverIsLow = isLowRank(riverCard.rank);
    ['low', 'high'].forEach(side => {
      const amt = bets.river[side] || 0;
      if (amt > 0 && riverOdds[side] && riverOdds[side].payout != null) {
        if ((side === 'low' && riverIsLow) || (side === 'high' && !riverIsLow)) {
          const payout = riverOdds[side].payout;
          winnings += amt * (payout + 1);
          details.river = { side, amt, payout, won: true };
        }
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

  return { winnings, details, historyEntry, resolution: res };
}