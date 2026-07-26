import React from 'react';
import { Flame } from 'lucide-react';
import PlayingCard from './PlayingCard';

export default function DealerArea({ statusMessage, community, revealed, phase }) {
  const slots = [
    { card: community[0], label: 'FLOP', show: revealed >= 1 },
    { card: community[1], label: 'FLOP', show: revealed >= 2 },
    { card: community[2], label: 'FLOP', show: revealed >= 3 },
    { card: community[3], label: 'TURN', show: revealed >= 4 },
    { card: community[4], label: 'RIVER', show: revealed >= 5 }
  ];

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {/* Status bar */}
      <div
        className="rounded-md px-4 py-2 text-center"
        style={{
          background: 'linear-gradient(180deg, #21180d 0%, #1a1208 100%)',
          border: '1px solid #C5A059',
          color: '#F7C25A',
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: '0.3px'
        }}
      >
        {statusMessage}
      </div>

      {/* Dealer board with logos + 5 card slots */}
      <div
        className="rounded-lg px-4 py-5 flex items-center justify-between"
        style={{
          background: 'linear-gradient(180deg, #05122b 0%, #04101f 100%)',
          border: '1.5px solid #C5A059'
        }}
      >
        <BrandLogo />
        <div className="flex items-end" style={{ gap: 10 }}>
          {slots.map((s, i) => (
            <div key={i} className="flex flex-col items-center" style={{ gap: 6 }}>
              <PlayingCard card={s.card} faceDown={!s.show} size="md" />
              <span style={{ color: '#C5A059', fontSize: 9, fontWeight: 700, letterSpacing: '1px' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <BrandLogo />
      </div>
    </div>
  );
}

function BrandLogo() {
  return (
    <div className="flex flex-col items-center" style={{ gap: 1, opacity: 0.85 }}>
      <Flame size={22} color="#E5B64E" strokeWidth={2} />
      <div style={{ fontSize: 8, fontWeight: 800, color: '#E5B64E', letterSpacing: '0.5px', lineHeight: 1 }}>
        RAPID FIRE
      </div>
      <div style={{ fontSize: 6, fontWeight: 700, color: '#C5A059', letterSpacing: '0.8px', lineHeight: 1 }}>
        TEXAS HOLD'EM
      </div>
    </div>
  );
}