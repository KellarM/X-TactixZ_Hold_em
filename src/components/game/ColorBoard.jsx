import React from 'react';
import { formatPayout, formatMoney } from '@/lib/game/cards';
import { SectionTitle } from './CardBoard';

const GOLD_BORDER = '#b8860b';

export default function ColorBoard({ odds, bets, caps, onPlace, onRemove }) {
  const positions = [
    { key: '3R', num: '3', color: 'red', label: '3 Red' },
    { key: '3B', num: '3', color: 'black', label: '3 Black' },
    { key: '4R', num: '4', color: 'red', label: '4 Red' },
    { key: '4B', num: '4', color: 'black', label: '4 Black' },
    { key: '5R', num: '5', color: 'red', label: '5 Red' },
    { key: '5B', num: '5', color: 'black', label: '5 Black' }
  ];

  const locked = (k) => {
    if (!odds) return true;
    const o = odds.colorOdds[k];
    return !o || o.locked;
  };
  const payout = (k) => {
    if (!odds) return null;
    const o = odds.colorOdds[k];
    return o ? o.payout : null;
  };

  return (
    <div className="rounded-lg p-3 flex flex-col h-full" style={{ background: '#0a162e', border: '1.5px solid #C5A059' }}>
      <div className="flex items-center justify-between mb-2">
        <SectionTitle>COLOR BOARD</SectionTitle>
        <CapBadge value={caps.color} />
      </div>
      <div className="grid grid-cols-2 grid-rows-3 flex-1" style={{ gap: 8 }}>
        {positions.map((pos) => {
          const isLocked = locked(pos.key);
          const p = payout(pos.key);
          const bet = bets.color[pos.key] || 0;
          return (
            <button
              key={pos.key}
              disabled={isLocked}
              onClick={() => !isLocked && onPlace('color', pos.key)}
              className="relative rounded-lg flex flex-col items-center justify-center"
              style={{
                background: isLocked
                  ? '#2a2a2a'
                  : (pos.color === 'red' ? '#c91e1e' : '#1a1a1a'),
                border: `1px solid ${GOLD_BORDER}`,
                opacity: isLocked ? 0.35 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer'
              }}
            >
              <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{pos.num}</span>
              <span style={{ color: '#FFD700', fontWeight: 600, fontSize: 10, lineHeight: 1 }}>
                {isLocked ? 'LOCKED' : formatPayout(p)}
              </span>
              {bet > 0 && !isLocked && (
                <span
                  onClick={(e) => { e.stopPropagation(); onRemove('color', pos.key); }}
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

export function CapBadge({ value }) {
  return (
    <span
      className="rounded-full px-2 py-0.5"
      style={{ background: '#000000', border: '1px solid #C5A059', color: '#FFD700', fontSize: 9, fontWeight: 700 }}
    >
      Match Cap: {formatMoney(value)}
    </span>
  );
}