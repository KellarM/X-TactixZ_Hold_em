// Audio pool — pre-create N instances so rapid calls never conflict
const POOL_SIZE = 4;

function makePool(url) {
  return Array.from({ length: POOL_SIZE }, () => {
    const a = new Audio(url);
    a.preload = 'auto';
    return a;
  });
}

const POOLS = {
  cardDeal:   makePool('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/e1fc72793_CardTurning.mp3'),
  chipPlace:  makePool('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/a202fbad7_oxidvideos-placing-poker-chips-522521.mp3'),
  chipRemove: makePool('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/df028b260_Removal-of-poker-chips-95810.mp3'),
};

const POOL_IDX = { cardDeal: 0, chipPlace: 0, chipRemove: 0 };

// ── Persistence helpers (localStorage + cookie fallback) ──────────────────
// Same dual-layer pattern used by anteStructures.js and bonusMultipliers.js.
// Survives the Base44 sandboxed-iframe localStorage issue.
const SOUND_STORAGE_KEY = 'rfpf_sound';
const SOUND_COOKIE_KEY   = 'rfpf_sound';
const SOUND_COOKIE_DAYS  = 365;

// Default sound settings — restored on bank reset
export const DEFAULT_SOUND_SETTINGS = {
  crowdEnabled: true,
  crowdVolume: 0.4,
  sfxEnabled: true,
  sfxVolume: 1.0,
};

function writeCookie(name, value, days = SOUND_COOKIE_DAYS) {
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

function saveSoundSettings(settings) {
  const json = JSON.stringify(settings);
  try { localStorage.setItem(SOUND_STORAGE_KEY, json); } catch {}
  writeCookie(SOUND_COOKIE_KEY, json);
}

function loadSoundSettings() {
  try {
    const raw = localStorage.getItem(SOUND_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        crowdEnabled: typeof parsed.crowdEnabled === 'boolean' ? parsed.crowdEnabled : DEFAULT_SOUND_SETTINGS.crowdEnabled,
        crowdVolume:  typeof parsed.crowdVolume  === 'number'  ? parsed.crowdVolume  : DEFAULT_SOUND_SETTINGS.crowdVolume,
        sfxEnabled:   typeof parsed.sfxEnabled   === 'boolean' ? parsed.sfxEnabled   : DEFAULT_SOUND_SETTINGS.sfxEnabled,
        sfxVolume:    typeof parsed.sfxVolume    === 'number'  ? parsed.sfxVolume    : DEFAULT_SOUND_SETTINGS.sfxVolume,
      };
    }
  } catch {}
  const ck = readCookie(SOUND_COOKIE_KEY);
  if (ck) {
    try {
      const parsed = JSON.parse(ck);
      return {
        crowdEnabled: typeof parsed.crowdEnabled === 'boolean' ? parsed.crowdEnabled : DEFAULT_SOUND_SETTINGS.crowdEnabled,
        crowdVolume:  typeof parsed.crowdVolume  === 'number'  ? parsed.crowdVolume  : DEFAULT_SOUND_SETTINGS.crowdVolume,
        sfxEnabled:   typeof parsed.sfxEnabled   === 'boolean' ? parsed.sfxEnabled   : DEFAULT_SOUND_SETTINGS.sfxEnabled,
        sfxVolume:    typeof parsed.sfxVolume    === 'number'  ? parsed.sfxVolume    : DEFAULT_SOUND_SETTINGS.sfxVolume,
      };
    } catch {}
  }
  return { ...DEFAULT_SOUND_SETTINGS };
}

// Clear all persisted sound settings (used on bank reset)
export function clearSoundSettings() {
  try { localStorage.removeItem(SOUND_STORAGE_KEY); } catch {}
  try { document.cookie = `${SOUND_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`; } catch {}
}

// ── Crowd / Ambient — global singleton to survive hot-reloads ──
function getOrCreateAmbient() {
  if (typeof window === 'undefined') return null;
  if (window.__RF_AMBIENT__) {
    try { window.__RF_AMBIENT__.pause(); } catch (e) {}
  }
  const a = new Audio('https://media.base44.com/files/public/6a1a6f6e670be2c42b2d0a99/033e65cf3_freesound_community-poker-room-33521.mp3');
  a.loop = true;
  a.volume = 0.4;
  a.preload = 'auto';
  window.__RF_AMBIENT__ = a;
  return a;
}

const AMBIENT = getOrCreateAmbient();

// ── Load persisted settings on module init ──
const _initial = loadSoundSettings();

// ── Two independent channels ──
let crowdEnabled = _initial.crowdEnabled;
let crowdVolume  = _initial.crowdVolume;    // 0..1

let sfxEnabled = _initial.sfxEnabled;
let sfxVolume   = _initial.sfxVolume;       // 0..1 master multiplier for all SFX

// Apply initial crowd volume to ambient element
if (AMBIENT) AMBIENT.volume = crowdVolume;

function persistSound() {
  saveSoundSettings({ crowdEnabled, crowdVolume, sfxEnabled, sfxVolume });
}

// ── SFX playback ──
function play(key, volume) {
  if (!sfxEnabled || sfxVolume <= 0) return;
  const pool = POOLS[key];
  if (!pool) return;
  const idx = POOL_IDX[key];
  POOL_IDX[key] = (idx + 1) % POOL_SIZE;
  const el = pool[idx];
  el.volume = Math.max(0, Math.min(1, volume * sfxVolume));
  el.currentTime = 0;
  el.play().catch(() => {});
}

// ── Crowd controls — completely independent from SFX ──
function startAmbient() {
  if (!AMBIENT) return;
  if (!crowdEnabled || crowdVolume <= 0) return;
  if (!AMBIENT.paused) return;
  AMBIENT.volume = crowdVolume;
  AMBIENT.play().catch(() => {});
}

function stopAmbient() {
  if (!AMBIENT) return;
  if (!AMBIENT.paused) AMBIENT.pause();
}

function applyCrowdVolume() {
  if (!AMBIENT) return;
  if (crowdVolume <= 0 || !crowdEnabled) {
    stopAmbient();
  } else {
    AMBIENT.volume = crowdVolume;
    if (AMBIENT.paused) startAmbient();
  }
}

let preloaded = false;
function preloadOnce() {
  startAmbient();
  if (preloaded) return;
  preloaded = true;
  Object.values(POOLS).flat().forEach(a => a.load());
}

// ── Standalone SFX — usable outside React component tree ──
export function playChipSound()    { play('chipPlace', 0.8); }
export function playChipRemoveSound() { play('chipRemove', 0.7); }
export function playCardDealSound() { play('cardDeal', 0.9); }

// ── Reset sound to defaults (called on bank reset) ──
export function resetSoundToDefaults() {
  crowdEnabled = DEFAULT_SOUND_SETTINGS.crowdEnabled;
  crowdVolume  = DEFAULT_SOUND_SETTINGS.crowdVolume;
  sfxEnabled   = DEFAULT_SOUND_SETTINGS.sfxEnabled;
  sfxVolume    = DEFAULT_SOUND_SETTINGS.sfxVolume;
  clearSoundSettings();
  if (AMBIENT) AMBIENT.volume = crowdVolume;
  applyCrowdVolume();
}

export function useGameSounds() {
  return {
    // ── SFX (chips, cards, bonus) ──
    playChipPlace:    () => play('chipPlace', 0.8),
    playChipRemove:   () => play('chipRemove', 0.7),
    playCardDeal:     () => play('cardDeal', 0.9),
    preloadSounds:    preloadOnce,

    setSfxEnabled:  (enabled) => { sfxEnabled = enabled; persistSound(); },
    isSfxEnabled:   () => sfxEnabled,
    setSfxVolume:   (v) => { sfxVolume = Math.max(0, Math.min(1, v)); persistSound(); },
    getSfxVolume:   () => sfxVolume,

    // ── Crowd / Ambient — fully independent ──
    setCrowdEnabled: (enabled) => {
      crowdEnabled = enabled;
      if (!enabled) stopAmbient();
      else startAmbient();
      persistSound();
    },
    isCrowdEnabled:  () => crowdEnabled,
    setCrowdVolume:  (v) => {
      crowdVolume = Math.max(0, Math.min(1, v));
      applyCrowdVolume();
      persistSound();
    },
    getCrowdVolume:  () => crowdVolume,

    // ── Legacy compat — maps to SFX channel ──
    setSoundEnabled: (enabled) => { sfxEnabled = enabled; persistSound(); },
    isSoundEnabled:  () => sfxEnabled,

    // ── Ambient legacy compat — maps to crowd channel ──
    setAmbientVolume: (v) => { crowdVolume = Math.max(0, Math.min(1, v)); applyCrowdVolume(); persistSound(); },
    getAmbientVolume: () => crowdVolume,
  };
}
