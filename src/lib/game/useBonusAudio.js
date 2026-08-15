// Bonus audio — iteration 4: Silent during movement, bell at win moment only.
// Bounce/pulse/settle = no sound. Landing = clean casino bell strike.
// Next direction considered: drum roll + cymbal hit (Michael's idea).

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

// ─── SILENT — no sound during card-to-card movement ─────────────────────
export function playBing() {}
export function playSettleTick() {}

// ─── LANDING BELL — single clean bell strike at the win moment ──────────
// A real bell: fundamental + inharmonic partials, fast attack, long decay.
export function playLand(pitch = 880, volume = 0.25) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Bell partials — inharmonic ratios give it a real bell character
  const partials = [
    { ratio: 1.0,  gain: 0.50, decay: 2.0 },
    { ratio: 2.0,  gain: 0.30, decay: 1.5 },
    { ratio: 2.4,  gain: 0.15, decay: 1.0 },
    { ratio: 3.8,  gain: 0.08, decay: 0.7 },
    { ratio: 5.4,  gain: 0.04, decay: 0.4 },
  ];

  partials.forEach((p) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * p.ratio, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume * p.gain, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + p.decay);
  });
}

// ─── Win sting — ascending bell notes ───────────────────────────────────
export function playWin(volume = 0.2) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  // Three ascending bell strikes: G5, C6, E6
  const notes = [784, 1047, 1319];
  notes.forEach((freq, i) => {
    const now = ctx.currentTime + i * 0.15;
    const partials = [
      { ratio: 1.0,  gain: 0.50, decay: 1.2 },
      { ratio: 2.0,  gain: 0.25, decay: 0.9 },
      { ratio: 2.4,  gain: 0.12, decay: 0.6 },
    ];
    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume * p.gain, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + p.decay);
    });
  });
}

// ─── Lose — muted thud, quiet ───────────────────────────────────────────
export function playLose(volume = 0.10) {
  if (!bonusSfxEnabled || bonusSfxVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * bonusSfxVolume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

export function useBonusAudio() {
  return { playBing, playSettleTick, playLand, playWin, playLose };
}
