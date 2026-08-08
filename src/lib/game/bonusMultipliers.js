// RNG Bonus Multiplier config — 3 operator-adjustable gross multipliers.
// "Gross" = total payout multiple on the winning bet (e.g. 5 means the bet
// pays out at 5x total: the normal win amount + bonus makes up the 5x).
// Selected values are stored in localStorage and applied at round resolution,
// mirroring the Ante Structure pattern (anteStructures.js) exactly.

export const DEFAULT_BONUS_MULTIPLIERS = {
  card: 5,        // Card Hands
  rank: 4,        // Rank Hands
  colorRiver: 3,  // Color & River
};

const STORAGE_KEY = 'rfpf_bonus_multipliers';

export function getSavedBonusMultipliers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BONUS_MULTIPLIERS };
    const parsed = JSON.parse(raw);
    return {
      card: Number.isFinite(parsed.card) ? parsed.card : DEFAULT_BONUS_MULTIPLIERS.card,
      rank: Number.isFinite(parsed.rank) ? parsed.rank : DEFAULT_BONUS_MULTIPLIERS.rank,
      colorRiver: Number.isFinite(parsed.colorRiver) ? parsed.colorRiver : DEFAULT_BONUS_MULTIPLIERS.colorRiver,
    };
  } catch {
    return { ...DEFAULT_BONUS_MULTIPLIERS };
  }
}

export const BONUS_MULTIPLIER_EVENT = 'rfpf-bonus-multipliers-changed';

export function saveBonusMultipliers(values) {
  try {
    const toSave = {
      card: Number.isFinite(values.card) ? values.card : DEFAULT_BONUS_MULTIPLIERS.card,
      rank: Number.isFinite(values.rank) ? values.rank : DEFAULT_BONUS_MULTIPLIERS.rank,
      colorRiver: Number.isFinite(values.colorRiver) ? values.colorRiver : DEFAULT_BONUS_MULTIPLIERS.colorRiver,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BONUS_MULTIPLIER_EVENT, { detail: toSave }));
    }
    return toSave;
  } catch {
    return { ...DEFAULT_BONUS_MULTIPLIERS };
  }
}
