// Procedural Web Audio API sounds for the RNG Bonus chase.
// Iteration 2: Clean casino chime — soft bell dings, gentle settle, warm landing.
// No audio files needed — everything synthesized.

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

// ─── SOFT BELL DING — for each pulse during the random jump phase ───────
// Two sine partials (fundamental + octave) with a gentle envelope.
// Clean, warm, casino-appropriate. No harsh transients.
export function playBing(pitch = 800, duration = 0.12, volume = 0.12) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Fundamental sine
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(pitch, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(volume * bonusSfxVolume * 0.6, now + 0.01);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + duration);

  // Octave — softer, adds warmth without harshness
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(pitch * 2, now);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(volume * bonusSfxVolume * 0.25, now + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + duration * 0.7);
}

// ─── SETTLE TICK — gentle rising bell, builds anticipation ─────────────
// Same bell character but pitch climbs smoothly as it nears the target.
export function playSettleTick(pitch = 600, stepIndex = 0, totalSteps = 5, volume = 0.10) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const progress = Math.min(stepIndex / Math.max(1, totalSteps - 1), 1);
  const climbingPitch = pitch * (1 + progress * 0.4);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(climbingPitch, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume * 0.5, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

// ─── LANDING — warm gong strike, not a crash ───────────────────────────
// Low bell + soft chord, decays naturally. Celebratory but not jarring.
export function playLand(pitch = 1200, volume = 0.20) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Low bell — the anchor
  const bell = ctx.createOscillator();
  const bellGain = ctx.createGain();
  bell.type = 'sine';
  bell.frequency.setValueAtTime(pitch * 0.5, now);
  bellGain.gain.setValueAtTime(0, now);
  bellGain.gain.linearRampToValueAtTime(volume * bonusSfxVolume * 0.7, now + 0.02);
  bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  bell.connect(bellGain);
  bellGain.connect(ctx.destination);
  bell.start(now);
  bell.stop(now + 1.2);

  // Soft major chord — root, third, fifth
  const chordNotes = [pitch * 0.75, pitch * 0.94, pitch * 1.12];
  chordNotes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + i * 0.03;
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume * (0.35 - i * 0.06), startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.8);
  });
}

// ─── Ascending win sting — bright, celebratory ──────────────────────────
export function playWin(volume = 0.2) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.07;
    osc.type = 'sine';
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
