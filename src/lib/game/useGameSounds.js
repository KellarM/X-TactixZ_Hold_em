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

// ── Crowd / Ambient — global singleton to survive hot-reloads ──
// If a previous module evaluation created an AMBIENT, grab it and pause it.
// This prevents orphaned Audio elements from playing forever.
function getOrCreateAmbient() {
  if (typeof window === 'undefined') return null;
  if (window.__RF_AMBIENT__) {
    // Kill the old one — we'll create a fresh one with current settings
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

// ── Two independent channels ──
let crowdEnabled = true;
let crowdVolume = 0.4;    // 0..1

let sfxEnabled = true;
let sfxVolume  = 1.0;    // 0..1 master multiplier for all SFX

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

export function useGameSounds() {
  return {
    // ── SFX (chips, cards, bonus) ──
    playChipPlace:    () => play('chipPlace', 0.8),
    playChipRemove:   () => play('chipRemove', 0.7),
    playCardDeal:     () => play('cardDeal', 0.9),
    preloadSounds:    preloadOnce,

    setSfxEnabled:  (enabled) => { sfxEnabled = enabled; },
    isSfxEnabled:   () => sfxEnabled,
    setSfxVolume:   (v) => { sfxVolume = Math.max(0, Math.min(1, v)); },
    getSfxVolume:   () => sfxVolume,

    // ── Crowd / Ambient — fully independent ──
    setCrowdEnabled: (enabled) => {
      crowdEnabled = enabled;
      if (!enabled) stopAmbient();
      else startAmbient();
    },
    isCrowdEnabled:  () => crowdEnabled,
    setCrowdVolume:  (v) => {
      crowdVolume = Math.max(0, Math.min(1, v));
      applyCrowdVolume();
    },
    getCrowdVolume:  () => crowdVolume,

    // ── Legacy compat — maps to SFX channel ──
    setSoundEnabled: (enabled) => { sfxEnabled = enabled; },
    isSoundEnabled:  () => sfxEnabled,

    // ── Ambient legacy compat — maps to crowd channel ──
    setAmbientVolume: (v) => { crowdVolume = Math.max(0, Math.min(1, v)); applyCrowdVolume(); },
    getAmbientVolume: () => crowdVolume,
  };
}
