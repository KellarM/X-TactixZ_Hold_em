// RNG Bonus Multiplier config — 3 operator-adjustable gross multipliers.
// "Gross" = total payout multiple on the winning bet (e.g. 5 means the bet
// pays out at 5x total: the normal win amount + bonus makes up the 5x).
// Selected values are persisted to localStorage with a cookie fallback,
// and applied at round resolution, mirroring the Ante Structure pattern.

export const DEFAULT_BONUS_MULTIPLIERS = {
  card: 5,        // Card Hands
  rank: 4,        // Rank Hands
  colorRiver: 3,  // Color & River
};

const STORAGE_KEY = 'rfpf_bonus_multipliers';
const COOKIE_KEY = 'rfpf_bonus_multipliers';

// ── Dual persistence: localStorage + cookie fallback ─────────────────────
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

export function getSavedBonusMultipliers() {
  // 1) Try localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        card: Number.isFinite(parsed.card) ? parsed.card : DEFAULT_BONUS_MULTIPLIERS.card,
        rank: Number.isFinite(parsed.rank) ? parsed.rank : DEFAULT_BONUS_MULTIPLIERS.rank,
        colorRiver: Number.isFinite(parsed.colorRiver) ? parsed.colorRiver : DEFAULT_BONUS_MULTIPLIERS.colorRiver,
      };
    }
  } catch {}
  // 2) Fall back to cookie
  const ck = readCookie(COOKIE_KEY);
  if (ck) {
    try {
      const parsed = JSON.parse(ck);
      return {
        card: Number.isFinite(parsed.card) ? parsed.card : DEFAULT_BONUS_MULTIPLIERS.card,
        rank: Number.isFinite(parsed.rank) ? parsed.rank : DEFAULT_BONUS_MULTIPLIERS.rank,
        colorRiver: Number.isFinite(parsed.colorRiver) ? parsed.colorRiver : DEFAULT_BONUS_MULTIPLIERS.colorRiver,
      };
    } catch {}
  }
  // 3) Default
  return { ...DEFAULT_BONUS_MULTIPLIERS };
}

export const BONUS_MULTIPLIER_EVENT = 'rfpf-bonus-multipliers-changed';

export function saveBonusMultipliers(values) {
  const toSave = {
    card: Number.isFinite(values.card) ? values.card : DEFAULT_BONUS_MULTIPLIERS.card,
    rank: Number.isFinite(values.rank) ? values.rank : DEFAULT_BONUS_MULTIPLIERS.rank,
    colorRiver: Number.isFinite(values.colorRiver) ? values.colorRiver : DEFAULT_BONUS_MULTIPLIERS.colorRiver,
  };
  const serialized = JSON.stringify(toSave);
  // Write to both layers so a refresh always finds the value
  try { localStorage.setItem(STORAGE_KEY, serialized); } catch {}
  writeCookie(COOKIE_KEY, serialized);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BONUS_MULTIPLIER_EVENT, { detail: toSave }));
  }
  return toSave;
}
