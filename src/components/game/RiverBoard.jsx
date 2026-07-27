import React from 'react';
import { formatPayout, formatMoney } from '@/lib/game/cards';
import { SectionTitle } from './CardBoard';
import { CapBadge } from './ColorBoard';

const GOLD_BTN = 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)';

export default function RiverBoard({ odds, bets, caps, phase, onPlace, onRemove }) {
  const unlocked = phase === 'postturn' || phase === 'resolved';
  const locked = (side) => {
    if (!unlocked || !odds) return true;
    return odds[side].locked;
  };
  const payout = (side) => (odds ? odds[side].payout : null);

  return (
    <div className="rounded-lg p-3 flex flex-col h-full" style={{ background: '#0a162e', border: '1px solid #222e4d' }}>
      <div className="flex items-center justify-between mb-2">
        <SectionTitle>RIVER — LOW / HIGH</SectionTitle>
        <CapBadge value={caps.river} />
      </div>
      <div className="grid grid-cols-2 flex-1" style={{ gap: 10 }}>
        {[
          { side: 'low', label: 'LOW', range: '2–7' },
          { side: 'high', label: 'HIGH', range: '8–A' }
        ].map((b) => {
          const isLocked = locked(b.side);
          const bet = bets.river[b.side] || 0;
          return (
            <button
              key={b.side}
              disabled={isLocked}
              onClick={() => !isLocked && onPlace('river', b.side)}
              className="relative rounded-lg flex flex-col items-center justify-center"
              style={{
                background: isLocked ? 'linear-gradient(135deg, #6b5a2a 0%, #4a3e1e 100%)' : GOLD_BTN,
                border: '1px solid #bf953f',
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                boxShadow: isLocked ? 'none' : '0 2px 5px rgba(0,0,0,0.5)'
              }}
            >
              <span style={{ color: '#000000', fontWeight: 800, fontSize: 13, lineHeight: 1 }}>{b.label}</span>
              <span style={{ color: '#000000', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{b.range}</span>
              <span style={{ color: '#000000', fontWeight: 700, fontSize: 11, lineHeight: 1 }}>
                {isLocked ? (phase === 'postturn' ? 'LOCKED' : 'OPENS AFTER TURN') : formatPayout(payout(b.side))}
              </span>
              {bet > 0 && !isLocked && (
                <span
                  onClick={(e) => { e.stopPropagation(); onRemove('river', b.side); }}
                  className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5"
                  style={{ background: '#051025', color: '#E5B64E', fontSize: 9, fontWeight: 800, border: '1px solid #C5A059' }}
                >
                  {formatMoney(bet)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}