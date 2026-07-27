import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { RANK_LABELS, formatPayout, formatMoney } from '@/lib/game/cards';
import { SectionTitle } from './CardBoard';

const GOLD_BTN = 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)';

export default function RankBoard({ odds, bets, caps, onPlace, onRemove, phase }) {
  const locked = (label) => {
    if (!odds) return true;
    const o = odds.rankOdds[label];
    return !o || o.locked;
  };
  const payout = (label) => {
    if (!odds) return null;
    const o = odds.rankOdds[label];
    return o ? o.payout : null;
  };

  return (
    <div className="rounded-lg p-3 flex flex-col h-full" style={{ background: '#0a1224', border: '1.5px solid #C5A059' }}>
      <SectionTitle>HAND RANKING</SectionTitle>
      <div className="flex flex-col flex-1" style={{ gap: 6 }}>
        {RANK_LABELS.map((label) => {
          const isLocked = locked(label);
          const p = payout(label);
          const bet = bets.rank[label] || 0;
          return (
            <button
              key={label}
              disabled={isLocked}
              onClick={() => !isLocked && onPlace('rank', label)}
              className="relative flex items-center justify-between rounded-lg px-3 flex-1"
              style={{
                background: isLocked ? 'linear-gradient(135deg, #6b5a2a 0%, #4a3e1e 100%)' : GOLD_BTN,
                border: '1px solid #2a2040',
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                boxShadow: isLocked ? 'none' : '0 2px 4px rgba(0,0,0,0.4)'
              }}
            >
              <span style={{ color: '#3d3013', fontWeight: 800, fontSize: 13, letterSpacing: '0.3px' }}>
                {label}
              </span>
              <span className="flex items-center" style={{ gap: 8 }}>
                <span style={{ color: '#3d3013', fontWeight: 700, fontSize: 11 }}>
                  {isLocked ? (phase === 'ante' ? 'FLOP PENDING' : 'LOCKED') : formatPayout(p)}
                </span>
                {isLocked ? (
                  <Lock size={15} color="#3d3013" strokeWidth={2.5} />
                ) : (
                  <Unlock size={15} color="#3d3013" strokeWidth={2.5} />
                )}
              </span>
              {bet > 0 && !isLocked && (
                <span
                  onClick={(e) => { e.stopPropagation(); onRemove('rank', label); }}
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