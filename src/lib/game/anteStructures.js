// Ante Bonus Structure definitions — 6 configurable threshold structures
// Each defines how many qualifying boards are needed to return the Ante
// and earn bonus payouts. Selected structure is persisted to localStorage
// with a cookie fallback, and applied at round resolution.

export const ANTE_STRUCTURES = [
  {
    id: 'A',
    name: 'Original',
    short: '1-2 ret · 3=1:1 · 4=2:1',
    returnThreshold: 1,   // min qualifying boards to return ante
    bonus1Boards: 3, bonus1Mult: 1,  // at 3 boards, pay 1:1
    bonus2Boards: 4, bonus2Mult: 2,  // at 4 boards, pay 2:1
    anteRtp: 128.36,
    blendedRtp: 112.15,
    houseEdge: -12.15,
    viable: false,
  },
  {
    id: 'B',
    name: 'Tighter',
    short: '2 ret · 3=1:1 · 4=2:1',
    returnThreshold: 2,
    bonus1Boards: 3, bonus1Mult: 1,
    bonus2Boards: 4, bonus2Mult: 2,
    anteRtp: 98.80,
    blendedRtp: 106.24,
    houseEdge: -6.24,
    viable: false,
  },
  {
    id: 'C',
    name: 'Balanced',
    short: '2 ret · 3=push · 4=1:1',
    returnThreshold: 2,
    bonus1Boards: 4, bonus1Mult: 1,
    bonus2Boards: 99, bonus2Mult: 0,  // no second bonus tier
    anteRtp: 66.82,
    blendedRtp: 99.84,
    houseEdge: 0.16,
    viable: true,
  },
  {
    id: 'D',
    name: 'Hard',
    short: '3 ret · 4=1:1',
    returnThreshold: 3,
    bonus1Boards: 4, bonus1Mult: 1,
    bonus2Boards: 99, bonus2Mult: 0,
    anteRtp: 31.99,
    blendedRtp: 92.88,
    houseEdge: 7.12,
    viable: true,
  },
  {
    id: 'E',
    name: 'V.Hard',
    short: '3 ret · 4=2:1',
    returnThreshold: 3,
    bonus1Boards: 4, bonus1Mult: 2,
    bonus2Boards: 99, bonus2Mult: 0,
    anteRtp: 37.58,
    blendedRtp: 93.99,
    houseEdge: 6.01,
    viable: true,
  },
  {
    id: 'F',
    name: 'VeryHard',
    short: '4 ret only',
    returnThreshold: 4,
    bonus1Boards: 99, bonus1Mult: 0,
    bonus2Boards: 99, bonus2Mult: 0,
    anteRtp: 5.59,
    blendedRtp: 87.60,
    houseEdge: 12.40,
    viable: true,
  },
];

export const DEFAULT_ANTE_STRUCTURE_ID = 'C';

// ── Dual persistence: localStorage + cookie fallback ─────────────────────
// localStorage can be silently blocked in sandboxed iframe environments
// (e.g. Base44 preview). Cookies persist independently of the iframe
// sandbox, so we write to both and read localStorage-first, cookie-fallback.
const LS_KEY = 'rfpf_ante_structure';
const COOKIE_KEY = 'rfpf_ante_structure';

function writeCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

function readCookie(name) {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

export function getStructureById(id) {
  return ANTE_STRUCTURES.find(s => s.id === id) || ANTE_STRUCTURES.find(s => s.id === DEFAULT_ANTE_STRUCTURE_ID);
}

export function getSavedStructureId() {
  // 1) Try localStorage
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (ls) return ls;
  } catch {}
  // 2) Fall back to cookie
  const ck = readCookie(COOKIE_KEY);
  if (ck) return ck;
  // 3) Default
  return DEFAULT_ANTE_STRUCTURE_ID;
}

export const ANTE_STRUCTURE_EVENT = 'rfpf-ante-structure-changed';

export function saveStructureId(id) {
  // Write to both layers so a refresh always finds the value
  try { localStorage.setItem(LS_KEY, id); } catch {}
  writeCookie(COOKIE_KEY, id);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ANTE_STRUCTURE_EVENT, { detail: id }));
  }
}

// Resolve Ante bonus given a structure, number of qualifying boards won, and ante amount
// Returns { returned: boolean, bonus: number, boardsWon: number }
export function resolveAnteBonus(structure, boardsWon, anteAmount) {
  if (!structure || anteAmount <= 0) return { returned: false, bonus: 0, boardsWon: 0 };

  let returned = false;
  let bonus = 0;

  if (boardsWon >= structure.returnThreshold) {
    returned = true;
    if (boardsWon >= structure.bonus1Boards) {
      bonus += anteAmount * structure.bonus1Mult;
    }
    if (boardsWon >= structure.bonus2Boards) {
      bonus += anteAmount * structure.bonus2Mult;
    }
  }

  return { returned, bonus: Math.round(bonus * 100) / 100, boardsWon };
}

// Check if a board qualifies for Ante bonus: player bet >= ante on one winning position
// details: array of { amt, won, ... } from settlement
// ante: the ante amount
export function boardQualifies(details, ante) {
  if (!details || !ante || ante <= 0) return false;
  return details.some(d => d.won && d.amt >= ante - 0.01); // 0.01 for float tolerance
}

// Generate a player-facing, plain-language description of what happens at
// each board-win tier for a given structure — used by the in-game Ante
// info bubble so a first-time player understands the Ante payout function
// at a glance, with zero operator/certification jargon.
// Returns an ordered array of { range, outcome, kind }.
// kind: 'loss' | 'push' | 'bonus' — used for text color in the UI.
// NOTE: mirrors the exact math in resolveAnteBonus() above — if that
// function's stacking logic changes, this must be updated to match, or the
// displayed text will misrepresent the real payout (regulatory risk).
export function getAnteTierDescriptions(structure, maxBoards = 4) {
  if (!structure) return [];
  const { returnThreshold: R, bonus1Boards: b1B, bonus1Mult: b1M, bonus2Boards: b2B, bonus2Mult: b2M } = structure;

  const breakpoints = new Set([0, R]);
  if (b1B <= maxBoards) breakpoints.add(b1B);
  if (b2B <= maxBoards) breakpoints.add(b2B);
  const points = Array.from(breakpoints).sort((a, b) => a - b);

  const tiers = [];
  for (let i = 0; i < points.length; i++) {
    const start = points[i];
    if (start > maxBoards) continue;
    const end = i + 1 < points.length ? points[i + 1] - 1 : maxBoards;
    if (end < start) continue;

    let mult = 0;
    if (start >= b1B) mult += b1M;
    if (start >= b2B) mult += b2M;

    const range = start === end ? `${start}` : `${start}-${end}`;
    const boardWord = start === end && start === 1 ? 'Board' : 'Boards';

    let outcome, kind;
    if (start < R) {
      outcome = 'Ante Lost';
      kind = 'loss';
    } else if (mult > 0) {
      outcome = `Ante Returned + ${mult}:1 Bonus`;
      kind = 'bonus';
    } else {
      outcome = 'Ante Returned';
      kind = 'push';
    }

    tiers.push({ range, boardWord, outcome, kind });
  }
  return tiers;
}
