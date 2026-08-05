import React from 'react';
import { Flame } from 'lucide-react';
import { SUIT_SYMBOL, SUIT_COLOR } from '@/lib/game/cards';

// ── CSS / Unicode-drawn playing cards ──────────────────────────────────────
// No external image dependencies — zero network requests, instant render.
// Matches Desktop's PlayingCard.jsx approach: white card, bold rank text,
// unicode suit symbols, gold border to match Post-Flop's felt aesthetic.
//
// Card identity is driven by card.rank + card.suit string identifiers
// (unchanged) — this is display-layer only, no game logic impact.

// size: 'xs' (mini) | 'sm' (betting slot) | 'md' (default) | 'community' (70×100) | 'lg'
export default function PlayingCard({ card, faceDown = false, size = 'md', className = '' }) {
  const dims = {
    xs:       { w: 26, h: 37,  rank: 8,  suit: 7,  big: 12, pad: 2, radius: 4 },
    sm:       { w: 62, h: 88,  rank: 16, suit: 14, big: 28, pad: 4, radius: 6 },
    md:       { w: 66, h: 92,  rank: 20, suit: 18, big: 32, pad: 5, radius: 6 },
    community:{ w: 70, h: 100, rank: 22, suit: 20, big: 36, pad: 5, radius: 6 },
    lg:       { w: 80, h: 112, rank: 26, suit: 24, big: 40, pad: 6, radius: 7 },
  }[size];

  // ── Card back (face down or no card yet) — unchanged CSS design ──
  if (faceDown || !card || !card.rank || !card.suit) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center rounded-[6px] ${className}`}
        style={{
          width: dims.w,
          height: dims.h,
          background: 'linear-gradient(135deg, #1a0a12 0%, #2a0a14 50%, #1a0a12 100%)',
          border: '1.5px solid #C5A059',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="absolute inset-1 rounded-[4px] opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #4a1020 0px, #4a1020 2px, transparent 2px, transparent 6px), repeating-linear-gradient(-45deg, #4a1020 0px, #4a1020 2px, transparent 2px, transparent 6px)',
          }}
        />
        <div className="relative flex flex-col items-center justify-center" style={{ gap: 1 }}>
          <Flame size={size === 'sm' || size === 'xs' ? 12 : 18} color="#E5B64E" strokeWidth={2} />
          <div style={{ fontSize: (size === 'sm' || size === 'xs') ? 5 : 7, fontWeight: 800, color: '#E5B64E', letterSpacing: '0.5px', lineHeight: 1 }}>
            RAPID FIRE
          </div>
          {size !== 'sm' && size !== 'xs' && (
            <div style={{ fontSize: 5.5, fontWeight: 700, color: '#C5A059', letterSpacing: '0.8px', lineHeight: 1 }}>
              TEXAS HOLD'EM
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Face-up card — CSS / unicode drawn (no image loading) ──
  const isRed = SUIT_COLOR[card.suit] === 'red';
  const color = isRed ? '#D11A1A' : '#0A0A0A';
  const sym = SUIT_SYMBOL[card.suit];

  return (
    <div
      className={`relative flex flex-col ${className}`}
      style={{
        width: dims.w,
        height: dims.h,
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F5F5F0 100%)',
        border: '1px solid #C5A059',
        borderRadius: dims.radius,
        padding: dims.pad,
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Top-left: rank + suit */}
      <div className="flex flex-col items-start leading-none" style={{ color }}>
        <span style={{ fontSize: dims.rank, fontWeight: 900, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{card.rank}</span>
        <span style={{ fontSize: dims.suit, lineHeight: 1, marginTop: -1 }}>{sym}</span>
      </div>

      {/* Center: large suit symbol */}
      <div className="flex-1 flex items-center justify-center">
        <span style={{ fontSize: dims.big, color, lineHeight: 1, opacity: 0.85 }}>{sym}</span>
      </div>

      {/* Bottom-right: rank + suit (rotated 180° like a real card) */}
      <div className="flex flex-col items-end leading-none" style={{ color, transform: 'rotate(180deg)' }}>
        <span style={{ fontSize: dims.rank, fontWeight: 900, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{card.rank}</span>
        <span style={{ fontSize: dims.suit, lineHeight: 1, marginTop: -1 }}>{sym}</span>
      </div>
    </div>
  );
}
