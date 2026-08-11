/**
 * useDealerVoice — Pre-generated TTS dealer dialogue
 *
 * Uses pre-generated audio files (Google TTS) hosted on Base44 CDN.
 * Same Audio pool pattern as useGameSounds.js — no API calls during play,
 * no external dependencies, no CORS issues.
 *
 * Voice: Google English female (calm, clear — casino dealer feel)
 */

import { useEffect, useRef } from 'react';

// ── Audio URLs (hosted on Base44 CDN — same as chip/card sounds) ──
const DEALER_AUDIO = {
  ante:      'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/9c9626312_ante.mp3',
  postflop:  'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/3746c199c_postflop.mp3',
  postturn:  'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/cc5d35a4e_postturn.mp3',
  resolved:  'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/4a00fb1fc_resolved.mp3',
};

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

// ── Module-level state ──
const _initial = loadVoiceSettings();
let voiceEnabled = _initial.voiceEnabled;
let voiceVolume  = _initial.voiceVolume;

function persistVoice() {
  saveVoiceSettings({ voiceEnabled, voiceVolume });
}

// ── Audio pool — pre-create Audio elements on module init ──
const audioPool = {};
let preloaded = false;

function initAudioPool() {
  if (preloaded) return;
  preloaded = true;
  for (const [phase, url] of Object.entries(DEALER_AUDIO)) {
    const a = new Audio(url);
    a.preload = 'auto';
    audioPool[phase] = a;
  }
}

// Initialize immediately (browser will lazy-load as needed)
if (typeof window !== 'undefined') {
  initAudioPool();
}

// ── Core speak function ──
export function speakDealer(phase) {
  if (!voiceEnabled) return;
  const audio = audioPool[phase];
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

// ── React hook — preloads audio + speaks on phase transitions ──
export function useDealerVoice(phase) {
  const prevPhase = useRef(null);

  // Ensure audio pool is initialized
  useEffect(() => {
    initAudioPool();
    // Force load all audio files
    Object.values(audioPool).forEach(a => a.load());
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
  // Use the ante line for testing
  const audio = audioPool.ante;
  if (!audio) return;
  audio.volume = Math.max(0, Math.min(1, voiceVolume));
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
