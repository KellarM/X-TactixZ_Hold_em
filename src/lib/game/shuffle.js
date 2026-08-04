// Cryptographically secure Fisher-Yates shuffle with rejection sampling.

export function secureRandInt(max) {
  if (max <= 0) return 0;
  let mask = 1;
  while (mask <= max) mask = (mask << 1) | 1;
  const arr = new Uint32Array(1);
  let val;
  const cryptoObj = (typeof globalThis !== 'undefined' && globalThis.crypto) ? globalThis.crypto : null;
  if (!cryptoObj) {
    // non-browser fallback only
    return Math.floor(Math.random() * (max + 1));
  }
  do {
    cryptoObj.getRandomValues(arr);
    val = arr[0] & mask;
  } while (val > max);
  return val;
}

export function shuffleDeck(deck) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = secureRandInt(i);
    const tmp = d[i];
    d[i] = d[j];
    d[j] = tmp;
  }
  return d;
}

// Standard casino burn protocol:
// pos 0 = BURN, 1-3 = FLOP, 4 = BURN, 5 = TURN, 6 = BURN, 7 = RIVER
export function dealCommunity(shuffledStock) {
  return [
    shuffledStock[1],
    shuffledStock[2],
    shuffledStock[3],
    shuffledStock[5],
    shuffledStock[7]
  ];
}