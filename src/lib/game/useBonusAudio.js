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

// ─── WARM WOOD-BLOCK CLICK — for each pulse during the random jump phase ─
// Sine wave with a fast pitch drop + a short noise burst for wood-block attack.
// Warmer and rounder than the old triangle/square — less harsh, more casino.
export function playBing(pitch = 800, duration = 0.10, volume = 0.12) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Sine — warm body, quick pitch drop like a wood block
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(pitch * 1.3, now);
  osc1.frequency.exponentialRampToValueAtTime(pitch, now + duration * 0.5);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(volume * bonusSfxVolume * 0.8, now + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + duration);

  // Noise burst — short wood-block attack transient
  const bufferSize = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = pitch * 1.5;
  noiseFilter.Q.value = 1.5;
  noiseGain.gain.setValueAtTime(volume * bonusSfxVolume * 0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.03);
}

// ─── SETTLE TICK — during deceleration, rising pitch tension ─────────────
// Sine-based, softer than triangle. Pitch climbs gently as it settles.
export function playSettleTick(pitch = 600, stepIndex = 0, totalSteps = 5, volume = 0.10) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const progress = Math.min(stepIndex / Math.max(1, totalSteps - 1), 1);
  const climbingPitch = pitch * (1 + progress * 0.5); // gentler rise, up to 1.5x

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(climbingPitch, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
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
