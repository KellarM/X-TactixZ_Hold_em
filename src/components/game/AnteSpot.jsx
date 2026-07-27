import React from 'react';
import { Coins } from 'lucide-react';
import { formatMoney } from '@/lib/game/cards';

// Visible ante-betting area shown during the ante phase.
// Chips are placed from the footer (selected chip value added to ante on click);
// clicking the spot clears the ante once set.
export default function AnteSpot({ ante, onClear }) {
  const has = ante > 0;
  return (
    <div
      className="rounded-lg p-4 flex flex-col items-center"
      style={{ background: '#051532', border: `1.5px solid ${has ? '#C5A059' : '#2a3550'}` }}
    >
      <div style={{ color: '#C5A059', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', marginBottom: 10 }}>
        ANTE
      </div>
      <button
        onClick={has ? onClear : undefined}
        className="rounded-full flex flex-col items-center justify-center transition-transform"
        style={{
          width: 104,
          height: 104,
          borderRadius: '50%',
          background: has ? 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)' : '#0a1838',
          border: `2px dashed ${has ? '#5a4a1a' : '#3a4760'}`,
          cursor: has ? 'pointer' : 'default',
          boxShadow: has ? '0 0 22px rgba(229,182,78,0.45)' : 'none',
          transform: has ? 'scale(1.02)' : 'scale(1)'
        }}
        title={has ? 'Click to clear ante' : 'Select a chip below to place your ante'}
      >
        {has ? (
          <>
            <Coins size={24} color="#3d3013" strokeWidth={2.5} />
            <span style={{ color: '#3d3013', fontWeight: 900, fontSize: 20, marginTop: 3 }}>
              {formatMoney(ante)}
            </span>
          </>
        ) : (
          <>
            <Coins size={24} color="#5a6a8a" strokeWidth={2} />
            <span style={{ color: '#8a9ab8', fontWeight: 700, fontSize: 12, marginTop: 3, letterSpacing: '0.5px' }}>
              PLACE ANTE
            </span>
          </>
        )}
      </button>
      <div style={{ color: '#8a9ab8', fontSize: 11, fontWeight: 500, marginTop: 12, textAlign: 'center', lineHeight: 1.5, maxWidth: 300 }}>
        {has
          ? 'Ante placed — press DEAL to receive the flop.'
          : 'Select a chip below to place your ante and start the round.'}
      </div>
    </div>
  );
}