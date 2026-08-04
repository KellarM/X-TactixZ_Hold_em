// Procedural Web Audio API sounds for the RNG Bonus chase.
// No audio files needed — everything synthesized.
// Respects the SFX channel — when SFX is muted, bonus sounds are also muted.

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

// ─── BRIGHT CLICK — for each pulse during the random jump phase ───────────
// Triangle wave with a quick downward pitch sweep + a square wave layer
// for "bite". Much more character than the old flat sine blip.
export function playBing(pitch = 800, duration = 0.07, volume = 0.12) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Triangle — bright, sweeps down quickly
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(pitch * 1.4, now);
  osc1.frequency.exponentialRampToValueAtTime(pitch, now + duration * 0.6);
  gain1.gain.setValueAtTime(volume * bonusSfxVolume * 0.7, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + duration);

  // Square — adds a sharp transient click on top, very short
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(pitch * 2, now);
  gain2.gain.setValueAtTime(volume * bonusSfxVolume * 0.25, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.3);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + duration * 0.3);
}

// ─── SETTLE TICK — during deceleration, rising pitch tension ─────────────
// Pitch climbs as the sequence slows down, creating anticipation.
export function playSettleTick(pitch = 600, stepIndex = 0, totalSteps = 5, volume = 0.10) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const progress = Math.min(stepIndex / Math.max(1, totalSteps - 1), 1);
  const climbingPitch = pitch * (1 + progress * 0.8); // rises up to 1.8x

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(climbingPitch, now);
  gain.gain.setValueAtTime(volume * bonusSfxVolume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

// ─── LANDING CRASH — full chord + sub-bass thump + shimmer ───────────────
// This replaces the old two-oscillator ding. A real celebration sound.
export function playLand(pitch = 1200, volume = 0.20) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Sub-bass thump — the "impact"
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(120, now);
  sub.frequency.exponentialRampToValueAtTime(60, now + 0.15);
  subGain.gain.setValueAtTime(volume * bonusSfxVolume * 0.8, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  sub.connect(subGain);
  subGain.connect(ctx.destination);
  sub.start(now);
  sub.stop(now + 0.25);

  // Full major chord — root, third, fifth, octave
  const chordNotes = [pitch, pitch * 1.26, pitch * 1.5, pitch * 2.0];
  chordNotes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + i * 0.025; // slight strum
    const dur = 0.6;

    osc.type = i === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume * (0.5 - i * 0.08), startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + dur);
  });

  // Shimmer — high-frequency sparkle that decays slowly
  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  const shimmerFilter = ctx.createBiquadFilter();
  shimmer.type = 'sawtooth';
  shimmer.frequency.value = pitch * 4;
  shimmerFilter.type = 'bandpass';
  shimmerFilter.frequency.value = pitch * 4;
  shimmerFilter.Q.value = 2;
  shimmerGain.gain.setValueAtTime(0, now);
  shimmerGain.gain.linearRampToValueAtTime(volume * bonusSfxVolume * 0.15, now + 0.02);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  shimmer.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(ctx.destination);
  shimmer.start(now);
  shimmer.stop(now + 0.8);
}

// ─── Ascending win sting — bright, celebratory ──────────────────────────
export function playWin(volume = 0.2) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const notes = [523, 659, 784, 1047, 1319]; // C5, E5, G5, C6, E6 — brighter 5-note arpeggio
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.07;

    osc.type = 'triangle';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.4);
  });
}

// ─── Descending lose tone — muted, disappointing ─────────────────────────
export function playLose(volume = 0.12) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const notes = [400, 300, 200];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.12;

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.25);
  });
}

export function useBonusAudio() {
  return { playBing, playSettleTick, playLand, playWin, playLose };
}
