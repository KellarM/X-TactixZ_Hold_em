import React from 'react';
import { SUIT_SYMBOL, SUIT_COLOR } from '@/lib/game/cards';

// Real card image URLs — same CDN as Classic game
const CARD_IMAGES = {
  'A_diamonds':  'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/906a8f36c_image.png',
  '10_hearts':   'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/05d9e3ffe_image.png',
  'K_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/1ae5118f8_KingClubs.png',
  'K_spades':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/4360c2a3e_KingSpades.png',
  'Q_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/1167af30e_QueenClubs.png',
  'J_spades':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/2c1f2cc90_JackSpades.png',
  'Q_spades':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/2ed4637f5_QueenSpades.png',
  '10_spades':   'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/7947e0025_10Spades.png',
  'J_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/af3dce297_JackClubs.png',
  '9_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/a3551efc3_9Clubs.png',
  '8_diamonds':  'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/c330938f9_8Diamonds.png',
  '6_diamonds':  'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/45c3f745e_6Diamonds.png',
  '7_diamonds':  'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/c216c62e6_SevenDiamonds.png',
  '7_spades':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/19c0bcf83_7Spades.png',
  '4_hearts':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/98cfa7eaa_4Hearts.png',
  '2_hearts':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/370ab55b9_2Hearts.png',
  '3_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/de95f3ce0_3Clubs.png',
  '3_hearts':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/8aa990eb3_3Hearts.png',
  'A_hearts':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/075308c86_AceHearts.png',
  '5_diamonds':  'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/aac1d390c_5Diamonds.png',
};

function getCardImageUrl(card) {
  if (!card) return null;
  const key = `${card.rank}_${card.suit}`;
  return CARD_IMAGES[key] ?? null;
}

// size: 'sm' (betting slot cards) | 'md' (community cards) | 'lg'
export default function PlayingCard({ card, faceDown = false, size = 'md', className = '' }) {
  const dims = {
    sm: { w: 40, h: 56,  rank: '14px', suit: '12px', big: 18, pad: '3px' },
    md: { w: 66, h: 92,  rank: '22px', suit: '20px', big: 32, pad: '5px' },
    lg: { w: 80, h: 112, rank: '26px', suit: '24px', big: 40, pad: '6px' }
  }[size] || { w: 66, h: 92, rank: '22px', suit: '20px', big: 32, pad: '5px' };

  // ■■ Face down / no card ■■
  if (faceDown || !card || !card.rank || !card.suit) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center rounded-[6px] ${className}`}
        style={{
          width: dims.w, height: dims.h,
          background: 'linear-gradient(135deg, #1a0a12 0%, #2a0a14 50%, #1a0a12 100%)',
          border: '1.5px solid #C5A059',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.6)',
        }}
      >
        <div className="absolute inset-1 rounded-[4px] opacity-30" style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #4a1020 0px, #4a1020 2px, transparent 2px, transparent 6px), ' +
            'repeating-linear-gradient(-45deg, #4a1020 0px, #4a1020 2px, transparent 2px, transparent 6px)',
        }} />
        <div style={{ position: 'relative', fontSize: size === 'sm' ? 5 : 7, fontWeight: 800, color: '#E5B64E', letterSpacing: '0.5px' }}>
          RAPID FIRE
        </div>
      </div>
    );
  }

  // ■■ Real card image ■■
  const imgUrl = getCardImageUrl(card);
  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={`${card.rank} of ${card.suit}`}
        className={`rounded-[6px] ${className}`}
        style={{
          width: dims.w, height: dims.h,
          objectFit: 'cover',
          border: '1px solid rgba(197,160,89,0.6)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          display: 'block',
          flexShrink: 0,
        }}
      />
    );
  }

  // ■■ Text fallback for community cards not in the image map ■■
  const isRed = SUIT_COLOR[card.suit] === 'red';
  const color = isRed ? '#D11A1A' : '#0A0A0A';
  const sym = SUIT_SYMBOL[card.suit];

  return (
    <div
      className={`relative rounded-[6px] flex flex-col ${className}`}
      style={{
        width: dims.w, height: dims.h,
        background: '#FAFAFA',
        border: '1px solid #C5A059',
        padding: dims.pad,
        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex flex-col items-start leading-none" style={{ color }}>
        <span style={{ fontSize: dims.rank, fontWeight: 900, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: dims.suit, lineHeight: 1, marginTop: -1 }}>{sym}</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <span style={{ fontSize: dims.big, color, lineHeight: 1, opacity: 0.9 }}>{sym}</span>
      </div>
      <div className="flex flex-col items-end leading-none rotate-180" style={{ color }}>
        <span style={{ fontSize: dims.rank, fontWeight: 900, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: dims.suit, lineHeight: 1, marginTop: -1 }}>{sym}</span>
      </div>
    </div>
  );
}