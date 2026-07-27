import React from 'react';
import { Flame } from 'lucide-react';
import { SUIT_SYMBOL, SUIT_COLOR } from '@/lib/game/cards';

// size: 'sm' (betting slot) | 'md' (community card) | 'lg'
export default function PlayingCard({ card, faceDown = false, size = 'md', className = '' }) {
  const dims = {
    sm: { w: 36, h: 50, rank: '13px', suit: '11px', big: 16, pad: '3px' },
    md: { w: 66, h: 92, rank: '22px', suit: '20px', big: 32, pad: '5px' },
    lg: { w: 80, h: 112, rank: '26px', suit: '24px', big: 40, pad: '6px' }
  }[size];

  // Card back (face down or no card yet)
  if (faceDown || !card || !card.rank || !card.suit) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center rounded-[6px] ${className}`}
        style={{
          width: dims.w,
          height: dims.h,
          background: 'linear-gradient(135deg, #1a0a12 0%, #2a0a14 50%, #1a0a12 100%)',
          border: '1.5px solid #C5A059',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.6)'
        }}
      >
        <div
          className="absolute inset-1 rounded-[4px] opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #4a1020 0px, #4a1020 2px, transparent 2px, transparent 6px), repeating-linear-gradient(-45deg, #4a1020 0px, #4a1020 2px, transparent 2px, transparent 6px)'
          }}
        />
        <div className="relative flex flex-col items-center justify-center" style={{ gap: 1 }}>
          <Flame size={size === 'sm' ? 12 : 18} color="#E5B64E" strokeWidth={2} />
          <div style={{
            fontSize: size === 'sm' ? 5 : 7,
            fontWeight: 800,
            color: '#E5B64E',
            letterSpacing: '0.5px',
            lineHeight: 1
          }}>RAPID FIRE</div>
          {size !== 'sm' && (
            <div style={{
              fontSize: 5.5,
              fontWeight: 700,
              color: '#C5A059',
              letterSpacing: '0.8px',
              lineHeight: 1
            }}>TEXAS HOLD'EM</div>
          )}
        </div>
      </div>
    );
  }

  // Card face
  const isRed = SUIT_COLOR[card.suit] === 'red';
  const color = isRed ? '#D11A1A' : '#0A0A0A';
  const sym = SUIT_SYMBOL[card.suit];

  return (
    <div
      className={`relative rounded-[6px] flex flex-col ${className}`}
      style={{
        width: dims.w,
        height: dims.h,
        background: '#FAFAFA',
        border: '1px solid #C5A059',
        padding: dims.pad,
        boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
      }}
    >
      {/* Top-left corner: rank + suit */}
      <div className="flex flex-col items-start leading-none" style={{ color }}>
        <span style={{ fontSize: dims.rank, fontWeight: 900, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: dims.suit, lineHeight: 1, marginTop: -1 }}>{sym}</span>
      </div>
      {/* Center: large suit symbol */}
      <div className="flex-1 flex items-center justify-center">
        <span style={{ fontSize: dims.big, color, lineHeight: 1, opacity: 0.9 }}>{sym}</span>
      </div>
      {/* Bottom-right corner: rank + suit (rotated) */}
      <div className="flex flex-col items-end leading-none rotate-180" style={{ color }}>
        <span style={{ fontSize: dims.rank, fontWeight: 900, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: dims.suit, lineHeight: 1, marginTop: -1 }}>{sym}</span>
      </div>
    </div>
  );
}
