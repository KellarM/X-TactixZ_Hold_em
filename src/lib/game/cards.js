// Card data, fixed hands, dealer stock, and helpers for Rapid Fire Texas Hold'em

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const SUIT_SYMBOL = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

export const SUIT_COLOR = {
  spades: 'black',
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black'
};

export const LOW_RANKS = ['2', '3', '4', '5', '6', '7'];
export const HIGH_RANKS = ['8', '9', '10', 'J', 'Q', 'K', 'A'];

export function cardColor(card) {
  return SUIT_COLOR[card.suit];
}

export function isLowRank(rank) {
  return LOW_RANKS.includes(rank);
}

export function cardKey(card) {
  return `${card.rank}-${card.suit}`;
}

export function rankValue(rank) {
  return RANK_ORDER.indexOf(rank) + 2;
}

// The 10 fixed player hands (betting options on the Card Board).
export const FIXED_HANDS = [
  { id: 1, label: 'A♦10♥', cards: [{ rank: 'A', suit: 'diamonds' }, { rank: '10', suit: 'hearts' }], blindPayout: 20.3 },
  { id: 2, label: 'K♣K♠', cards: [{ rank: 'K', suit: 'clubs' }, { rank: 'K', suit: 'spades' }], blindPayout: 4.35 },
  { id: 3, label: 'Q♣J♠', cards: [{ rank: 'Q', suit: 'clubs' }, { rank: 'J', suit: 'spades' }], blindPayout: 15.8 },
  { id: 4, label: 'Q♠10♠', cards: [{ rank: 'Q', suit: 'spades' }, { rank: '10', suit: 'spades' }], blindPayout: 9.0 },
  { id: 5, label: 'J♣9♣', cards: [{ rank: 'J', suit: 'clubs' }, { rank: '9', suit: 'clubs' }], blindPayout: 7.4 },
  { id: 6, label: '8♦6♦', cards: [{ rank: '8', suit: 'diamonds' }, { rank: '6', suit: 'diamonds' }], blindPayout: 5.9 },
  { id: 7, label: '7♦7♠', cards: [{ rank: '7', suit: 'diamonds' }, { rank: '7', suit: 'spades' }], blindPayout: 6.8 },
  { id: 8, label: '4♥2♥', cards: [{ rank: '4', suit: 'hearts' }, { rank: '2', suit: 'hearts' }], blindPayout: 7.3 },
  { id: 9, label: '3♣3♥', cards: [{ rank: '3', suit: 'clubs' }, { rank: '3', suit: 'hearts' }], blindPayout: 9.1 },
  { id: 10, label: 'A♥5♦', cards: [{ rank: 'A', suit: 'hearts' }, { rank: '5', suit: 'diamonds' }], blindPayout: 15.8 }
];

// The 32-card dealer stock used for community cards.
export const DEALER_STOCK = [
  { rank: 'A', suit: 'spades' }, { rank: '9', suit: 'spades' }, { rank: '8', suit: 'spades' }, { rank: '6', suit: 'spades' },
  { rank: '5', suit: 'spades' }, { rank: '4', suit: 'spades' }, { rank: '3', suit: 'spades' }, { rank: '2', suit: 'spades' },
  { rank: 'K', suit: 'hearts' }, { rank: 'Q', suit: 'hearts' }, { rank: 'J', suit: 'hearts' }, { rank: '9', suit: 'hearts' },
  { rank: '8', suit: 'hearts' }, { rank: '7', suit: 'hearts' }, { rank: '6', suit: 'hearts' }, { rank: '5', suit: 'hearts' },
  { rank: 'K', suit: 'diamonds' }, { rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'diamonds' }, { rank: '10', suit: 'diamonds' },
  { rank: '9', suit: 'diamonds' }, { rank: '4', suit: 'diamonds' }, { rank: '3', suit: 'diamonds' }, { rank: '2', suit: 'diamonds' },
  { rank: 'A', suit: 'clubs' }, { rank: '10', suit: 'clubs' }, { rank: '8', suit: 'clubs' }, { rank: '7', suit: 'clubs' },
  { rank: '6', suit: 'clubs' }, { rank: '5', suit: 'clubs' }, { rank: '4', suit: 'clubs' }, { rank: '2', suit: 'clubs' }
];

// Rank category index -> display label (the 7 bettable ranks shown on the Rank Board).
export const CAT_TO_LABEL = {
  0: '1 Pair',
  1: '2 Pair',
  2: '3 Of A Kind',
  3: 'Straight',
  4: 'Flush',
  5: 'Full House',
  6: '4 Of A Kind'
};

export const RANK_LABELS = [
  '4 Of A Kind',
  'Full House',
  'Flush',
  'Straight',
  '3 Of A Kind',
  '2 Pair',
  '1 Pair'
];

export const COLOR_POSITIONS = ['3R', '4R', '5R', '3B', '4B', '5B'];

export function formatMoney(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return '$' + amount.toFixed(2);
}

export function formatPayout(p) {
  if (p === null || p === undefined) return '—';
  if (p >= 100) return `${p.toFixed(0)}:1`;
  if (p >= 10) return `${p.toFixed(1)}:1`;
  return `${p.toFixed(2)}:1`;
}