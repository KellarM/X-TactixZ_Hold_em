/**
 * useDealerVoice — StreamElements TTS (Amazon Polly) dealer dialogue
 *
 * Uses StreamElements' free TTS endpoint which wraps Amazon Polly voices.
 * Pre-fetches all dealer lines as audio on game load, caches them in
 * an Audio pool — zero latency during play, zero cost, zero API key.
 *
 * Voice: Joanna (American female, calm, professional — casino dealer feel)
 */

import { useEffect, useRef } from 'react';

// ── Persistence (same dual-layer pattern as useGameSounds) ──────────────
const VOICE_STORAGE_KEY = 'rfpf_dealer_voice';
const VOICE_COOKIE_KEY  = 'rfpf_dealer_voice';
const VOICE_COOKIE_DAYS = 365;

function writeCookie(name, value, days = VOICE_COOKIE_DAYS) {
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

export const DEFAULT_VOICE_SETTINGS = {
  voiceEnabled: true,
  voiceVolume: 0.8,
};

function saveVoiceSettings(settings) {
  const json = JSON.stringify(settings);
  try { localStorage.setItem(VOICE_STORAGE_KEY, json); } catch {}
  writeCookie(VOICE_COOKIE_KEY, json);
}

function loadVoiceSettings() {
  try {
    const raw = localStorage.getItem(VOICE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        voiceEnabled: typeof parsed.voiceEnabled === 'boolean' ? parsed.voiceEnabled : DEFAULT_VOICE_SETTINGS.voiceEnabled,
        voiceVolume:  typeof parsed.voiceVolume  === 'number'  ? parsed.voiceVolume  : DEFAULT_VOICE_SETTINGS.voiceVolume,
      };
    }
  } catch {}
  const ck = readCookie(VOICE_COOKIE_KEY);
  if (ck) {
    try {
      const parsed = JSON.parse(ck);
      return {
        voiceEnabled: typeof parsed.voiceEnabled === 'boolean' ? parsed.voiceEnabled : DEFAULT_VOICE_SETTINGS.voiceEnabled,
        voiceVolume:  typeof parsed.voiceVolume  === 'number'  ? parsed.voiceVolume  : DEFAULT_VOICE_SETTINGS.voiceVolume,
      };
    } catch {}
  }
  return { ...DEFAULT_VOICE_SETTINGS };
}

export function clearVoiceSettings() {
  try { localStorage.removeItem(VOICE_STORAGE_KEY); } catch {}
  try { document.cookie = `${VOICE_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`; } catch {}
}

export function resetVoiceToDefaults() {
  voiceEnabled = DEFAULT_VOICE_SETTINGS.voiceEnabled;
  voiceVolume = DEFAULT_VOICE_SETTINGS.voiceVolume;
  clearVoiceSettings();
}

// ── Module-level state (survives hot-reloads) ──
const _initial = loadVoiceSettings();
let voiceEnabled = _initial.voiceEnabled;
let voiceVolume  = _initial.voiceVolume;

function persistVoice() {
  saveVoiceSettings({ voiceEnabled, voiceVolume });
}

// ── StreamElements TTS config ──
const SE_VOICE = 'Joanna';
const SE_TTS_URL = 'https://api.streamelements.com/kappa/v2/speech';

// ── Dealer dialogue for each phase ──
const DEALER_LINES = {
  ante:      'Place your ante, then deal.',
  postflop:  'No more bets. Dealing the flop and turn.',
  postturn:  'The river board is now open. Place your river bets.',
  resolved:  'The river card. All boards resolve.',
};

// ── Audio cache — one Audio element per phase ──
const audioCache = {};
let preloaded = false;

function buildUrl(text) {
  return `${SE_TTS_URL}?voice=${SE_VOICE}&text=${encodeURIComponent(text)}`;
}

async function fetchAudio(text) {
  const url = buildUrl(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);
  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  audio.preload = 'auto';
  return audio;
}

async function preloadDealerVoice() {
  if (preloaded) return;
  preloaded = true;
  const entries = Object.entries(DEALER_LINES);
  await Promise.all(entries.map(async ([phase, text]) => {
    try {
      audioCache[phase] = await fetchAudio(text);
    } catch (e) {
      console.warn(`Dealer voice: failed to preload "${phase}"`, e);
    }
  }));
}

// ── Core speak function ──
export function speakDealer(phase) {
  if (!voiceEnabled) return;
  const audio = audioCache[phase];
  if (!audio) return;
  audio.volume = Math.max(0, Math.min(1, voiceVolume));
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ── Exported setters/getters ──
export function setVoiceEnabled(enabled) {
  voiceEnabled = enabled;
  persistVoice();
}

export function isVoiceEnabled() { return voiceEnabled; }

export function setVoiceVolume(v) {
  voiceVolume = Math.max(0, Math.min(1, v));
  persistVoice();
}

export function getVoiceVolume() { return voiceVolume; }

// ── React hook — preloads audio + watches phase transitions ──
export function useDealerVoice(phase) {
  const prevPhase = useRef(null);

  // Preload audio on mount
  useEffect(() => {
    preloadDealerVoice();
  }, []);

  // Speak on phase change
  useEffect(() => {
    if (prevPhase.current !== phase) {
      prevPhase.current = phase;
      speakDealer(phase);
    }
  }, [phase]);
}

// ── Test voice from settings ──
export function testVoice() {
  if (!voiceEnabled) return;
  // Use the ante line for testing, or fetch a test line if not yet cached
  if (audioCache.ante) {
    audioCache.ante.volume = Math.max(0, Math.min(1, voiceVolume));
    audioCache.ante.currentTime = 0;
    audioCache.ante.play().catch(() => {});
  } else {
    // Not yet preloaded — fetch on demand
    fetchAudio('Welcome to the table. Place your ante to begin.').then(audio => {
      audio.volume = Math.max(0, Math.min(1, voiceVolume));
      audio.play().catch(() => {});
    }).catch(() => {});
  }
}
