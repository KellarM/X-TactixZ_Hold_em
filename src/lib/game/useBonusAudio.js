// Bonus audio — SILENT mode (iteration 3).
// All sound functions are no-ops. Keeps the API intact so BonusSequence
// and other callers don't break. Michael wants to evaluate the visual
// experience without sound before choosing the next sound direction
// (considering: drum roll with cymbal hit at win).

let audioCtx = null;
let bonusSfxEnabled = true;
let bonusSfxVolume = 1.0;

export function setBonusSfxEnabled(enabled) { bonusSfxEnabled = enabled; }
export function setBonusSfxVolume(v) { bonusSfxVolume = Math.max(0, Math.min(1, v)); }

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ─── SILENT — all no-ops ─────────────────────────────────────────────────
export function playBing() {}
export function playSettleTick() {}
export function playLand() {}
export function playWin() {}
export function playLose() {}

export function useBonusAudio() {
  return { playBing, playSettleTick, playLand, playWin, playLose };
}
