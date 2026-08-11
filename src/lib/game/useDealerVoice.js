/**
 * useDealerVoice — Web Speech API dealer dialogue hook
 *
 * Uses the browser's built-in window.speechSynthesis (no API key, no cost).
 * Selects a female voice from the device's available voices and speaks
 * dealer dialogue at each game phase transition.
 *
 * Settings persist via localStorage + cookie fallback (same pattern as
 * useGameSounds.js).
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

// ── Voice selection — find a female voice ──
let _selectedVoice = null;

function pickFemaleVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Priority list of female voice name patterns (cross-platform)
  const femalePriority = [
    /Samantha/i, /Victoria/i, /Karen/i, /Moira/i, /Tessa/i, /Fiona/i, /Serena/i,
    /Google US English/i, /Google UK English Female/i,
    /female/i, /woman/i, /girl/i,
    /Microsoft Aria/i, /Microsoft Jenny/i, /Microsoft Zira/i,
    /Microsoft Michelle/i, /Microsoft Hazel/i,
    /Apple.*Samantha/i,
    /en-US.*female/i, /en_GB.*female/i,
  ];

  for (const pattern of femalePriority) {
    const match = voices.find(v => pattern.test(v.name) && v.lang.startsWith('en'));
    if (match) return match;
  }

  // Fallback: first English voice with a name that doesn't sound male
  const malePatterns = [/Daniel/i, /Alex/i, /Fred/i, /Tom/i, /Oliver/i, /Arthur/i,
    /male/i, /man/i, /boy/i, /Google UK English Male/i, /Microsoft Guy/i,
    /Microsoft Mark/i, /Microsoft David/i, /Microsoft George/i, /Microsoft James/i];

  const femaleOrNeutral = voices.find(v =>
    v.lang.startsWith('en') && !malePatterns.some(p => p.test(v.name))
  );

  return femaleOrNeutral || voices.find(v => v.lang.startsWith('en')) || voices[0];
}

// Ensure voices are loaded (Chrome loads them async)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    _selectedVoice = pickFemaleVoice();
  };
  _selectedVoice = pickFemaleVoice();
}

// ── Dealer dialogue for each phase ──
const DEALER_LINES = {
  ante:      'Place your ante, then deal.',
  postflop:  'No more bets. Dealing the flop and turn.',
  postturn:  'The river board is now open. Place your river bets.',
  resolved:  'The river card. All boards resolve.',
};

// ── Core speak function ──
export function speakDealer(phase) {
  if (!voiceEnabled) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const line = DEALER_LINES[phase];
  if (!line) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(line);
  utterance.volume = Math.max(0, Math.min(1, voiceVolume));
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  if (!_selectedVoice) {
    _selectedVoice = pickFemaleVoice();
  }
  if (_selectedVoice) {
    utterance.voice = _selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// ── Exported setters/getters (same pattern as useGameSounds) ──
export function setVoiceEnabled(enabled) {
  voiceEnabled = enabled;
  if (!enabled && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  persistVoice();
}

export function isVoiceEnabled() { return voiceEnabled; }

export function setVoiceVolume(v) {
  voiceVolume = Math.max(0, Math.min(1, v));
  persistVoice();
}

export function getVoiceVolume() { return voiceVolume; }

// ── React hook — watches phase and speaks on transitions ──
export function useDealerVoice(phase) {
  const prevPhase = useRef(null);

  useEffect(() => {
    if (prevPhase.current !== phase) {
      prevPhase.current = phase;
      speakDealer(phase);
    }
  }, [phase]);
}

// ── Test voice from settings ──
export function testVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance('Welcome to the table. Place your ante to begin.');
  u.volume = Math.max(0, Math.min(1, voiceVolume));
  u.rate = 0.92;
  u.pitch = 1.0;
  if (!_selectedVoice) _selectedVoice = pickFemaleVoice();
  if (_selectedVoice) u.voice = _selectedVoice;
  window.speechSynthesis.speak(u);
}
