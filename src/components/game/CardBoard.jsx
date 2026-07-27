import React from 'react';
import { FIXED_HANDS, formatPayout, formatMoney } from '@/lib/game/cards';

// ■■ Card image URLs pulled directly from original game (cardImages.js) ■■■■■■■■
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

function getCardImg(card) {
  if (!card) return null;
  return CARD_IMAGES[`${card.rank}_${card.suit}`] ?? null;
}

// Single card rendered as image (original game style) or fallback text
function CardImg({ card }) {
  const url = getCardImg(card);
  if (url) {
    return (
      <img
        src={url}
        alt={`${card.rank} of ${card.suit}`}
        style={{
          width: '3.9rem',
          height: '5.5rem',
          borderRadius: 8,
          objectFit: 'cover',
          display: 'block',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
        }}
      />
    );
  }
  // Fallback: plain white card
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const sym = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[card.suit] || '';
  return (
    <div style={{
      width: '3.9rem', height: '5.5rem', borderRadius: 8,
      background: '#FAFAFA', border: '1px solid #C5A059',
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '4px', boxSizing: 'border-box',
      color: isRed ? '#D11A1A' : '#0A0A0A',
      boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
    }}>
      <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1 }}>{card.rank}<br /><span style={{ fontSize: 10 }}>{sym}</span></div>
      <div style={{ fontSize: 22, lineHeight: 1, alignSelf: 'center', opacity: 0.85 }}>{sym}</div>
      <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>{card.rank}<br /><span style={{ fontSize: 10 }}>{sym}</span></div>
    </div>
  );
}

export default function CardBoard({ odds, bets, caps, phase, onPlace, onRemove }) {
  const locked = (id) => {
    if (!odds) return true;
    const o = odds.cardOdds.find(x => x.handId === id);
    return !o || o.locked;
  };
  const payout = (id) => {
    if (!odds) return null;
    const o = odds.cardOdds.find(x => x.handId === id);
    return o ? o.payout : null;
  };

  const isAntePhase = phase === 'ante';

  return (
    <div
      className="rounded-lg p-3 flex flex-col"
      style={{
        background: '#051532',
        border: '1.5px solid #C5A059',
        flex: '1 1 0',
        minHeight: 0,
        height: '100%'
      }}
    >
      <SectionTitle>CARD BOARD — HAND POSITIONS</SectionTitle>

      {isAntePhase && (
        <div
          className="text-center rounded-md py-1.5 mb-2"
          style={{
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px dashed #C5A059',
            color: '#8a9ab0',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            flexShrink: 0
          }}
        >
          FLOP PENDING — PLACE ANTE &amp; DEAL TO REVEAL ODDS
        </div>
      )}

      <div
        className="grid grid-cols-5 grid-rows-2"
        style={{ gap: 6, flex: 1, minHeight: 0 }}
      >
        {FIXED_HANDS.map((hand) => {
          const isLocked = locked(hand.id);
          const p = payout(hand.id);
          const bet = bets.card[hand.id] || 0;
          return (
            <BettingSlot
              key={hand.id}
              oddsLabel={formatPayout(p)}
              locked={isLocked}
              bet={bet}
              onPlace={() => onPlace('card', hand.id)}
              onRemove={() => onRemove('card', hand.id)}
            >
              <div className="flex justify-center" style={{ gap: 4 }}>
                {hand.cards.map((c, i) => (
                  <CardImg key={i} card={c} />
                ))}
              </div>
            </BettingSlot>
          );
        })}
      </div>
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div
      className="text-center mb-2"
      style={{ color: '#E5B64E', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', flexShrink: 0 }}
    >
      {children}
    </div>
  );
}

export function BettingSlot({ oddsLabel, locked, bet, onPlace, onRemove, children }) {
  return (
    <div
      className="relative flex flex-col items-center justify-between rounded-md p-2"
      style={{
        background: '#04122b',
        border: `1px solid ${locked ? '#3a4a6a' : '#C5A059'}`,
        opacity: locked ? 0.55 : 1,
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        transition: 'opacity 0.2s, border-color 0.2s'
      }}
    >
      {/* Odds — top, Oswald font matching original */}
      <div style={{
        color: locked ? '#6a7a9a' : '#e8b84b',
        fontFamily: 'Oswald, sans-serif',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textShadow: locked ? 'none' : '0 0 2px #000, 1px 1px 2px #000',
        marginBottom: 4,
        flexShrink: 0
      }}>
        {locked ? 'LOCKED' : oddsLabel}
      </div>

      {/* Cards — centered, fills remaining space */}
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>

      {/* Bet badge */}
      {bet > 0 && !locked && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5"
          style={{ background: '#C5A059', color: '#051025', fontSize: 9, fontWeight: 800, zIndex: 10 }}
          title="Remove bet"
        >
          {formatMoney(bet)}
        </button>
      )}

      {/* BET button — bottom */}
      {!locked && (
        <button
          onClick={onPlace}
          className="mt-1 w-full rounded text-center"
          style={{ color: '#C5A059', fontSize: 9, fontWeight: 700, padding: '2px 0', flexShrink: 0 }}
        >
          {bet > 0 ? formatMoney(bet) : 'BET'}
        </button>
      )}
    </div>
  );
}