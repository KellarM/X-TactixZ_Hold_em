import React from 'react';
import { SUIT_SYMBOL, SUIT_COLOR } from '@/lib/game/cards';

// Real card image URLs — all 10 fixed hand cards
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
  return CARD_IMAGES[`${card.rank}_${card.suit}`] ?? null;
}

const CARD_BACK_URL = 'https://media.base44.com/images/public/69f3a45ad82dff5b772d4de2/1b33b172d_image.png';

// size: 'sm' (hand slot) | 'md' (community) | 'lg'
export default function PlayingCard({ card, faceDown = false, size = 'md', className = '' }) {
  const dims = {
    sm: { w: 50, h: 70 },
    md: { w: 56, h: 80 },
    lg: { w: 70, h: 98 },
  }[size] || { w: 56, h: 80 };

  // ■■ Face down / card back
  if (faceDown || !card || !card.rank || !card.suit) {
    return (
      <img
        src={CARD_BACK_URL}
        alt="Card back"
        className={`rounded-[6px] ${className}`}
        style={{
          width: dims.w,
          height: dims.h,
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
          border: '1.5px solid #C5A059',
        }}
      />
    );
  }

  // ■■ Real image (fixed hand cards)
  const imgUrl = getCardImageUrl(card);
  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={`${card.rank} of ${card.suit}`}
        className={`rounded-[6px] ${className}`}
        style={{
          width: dims.w,
          height: dims.h,
          objectFit: 'cover',
          border: '1px solid rgba(197,160,89,0.5)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          display: 'block',
          flexShrink: 0,
        }}
      />
    );
  }

  // ■■ Text fallback for community stock cards
  const isRed = SUIT_COLOR[card.suit] === 'red';
  const color = isRed ? '#dc2626' : '#000000';
  const sym = SUIT_SYMBOL[card.suit];

  return (
    <div
      className={`rounded-lg flex flex-col shadow-lg select-none overflow-hidden relative ${className}`}
      style={{
        width: dims.w,
        height: dims.h,
        background: '#ffffff',
        border: `2px solid ${isRed ? 'rgba(239,68,68,0.6)' : 'rgba(107,114,128,0.6)'}`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '3px 4px 0', color, fontWeight: 'bold', lineHeight: 1 }}>
        <div style={{ fontSize: size === 'md' ? '1.05em' : '0.9em' }}>{card.rank}</div>
        <div style={{ fontSize: size === 'md' ? '0.55em' : '0.45em' }}>{sym}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: size === 'md' ? '2.4em' : '2em', lineHeight: 1, opacity: 0.75 }}>
        {sym}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '0 4px 3px', color, fontWeight: 'bold', lineHeight: 1, transform: 'rotate(180deg)' }}>
        <div style={{ fontSize: size === 'md' ? '1.05em' : '0.9em' }}>{card.rank}</div>
        <div style={{ fontSize: size === 'md' ? '0.55em' : '0.45em' }}>{sym}</div>
      </div>
    </div>
  );
}