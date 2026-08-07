// Ante Bonus Structure definitions — 6 configurable threshold structures
// Each defines how many qualifying boards are needed to return the Ante
// and earn bonus payouts. Selected structure is stored in localStorage
// and applied at round resolution.

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

export function getStructureById(id) {
  return ANTE_STRUCTURES.find(s => s.id === id) || ANTE_STRUCTURES.find(s => s.id === DEFAULT_ANTE_STRUCTURE_ID);
}

export function getSavedStructureId() {
  try {
    return localStorage.getItem('rfpf_ante_structure') || DEFAULT_ANTE_STRUCTURE_ID;
  } catch {
    return DEFAULT_ANTE_STRUCTURE_ID;
  }
}

export function saveStructureId(id) {
  try {
    localStorage.setItem('rfpf_ante_structure', id);
  } catch {}
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
