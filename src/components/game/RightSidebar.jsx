import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { RANK_LABELS, COLOR_POSITIONS, formatPayout, formatMoney } from '@/lib/game/cards';

// One unified right-side panel.
// 15 rows total: 7 Rank + 6 Color (2-col grid = 3 rows) + 2 River (1 row)
// All rows share the same flex-1 height — fills top to bottom, no wasted space.

const GOLD = 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)';
const GOLD_BORDER = '#C5A059';
const DARK_GOLD = 'linear-gradient(135deg, #6b5a2a 0%, #4a3e1e 100%)';

function SectionLabel({ children, right }) {
  return (
    <div className="flex items-center justify-between px-2 py-0.5 flex-shrink-0"
      style={{ background: '#07101f', borderBottom: `1px solid ${GOLD_BORDER}` }}>
      <span style={{ color: '#E5B64E', fontSize: 9, fontWeight: 800, letterSpacing: '1.2px' }}>{children}</span>
      {right && <span style={{ color: '#FFD700', fontSize: 9, fontWeight: 700 }}>{right}</span>}
    </div>
  );
}

function BetBadge({ amount, onClick }) {
  if (!amount) return null;
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5"
      style={{ background: '#051025', color: '#E5B64E', fontSize: 8, fontWeight: 800, border: `1px solid ${GOLD_BORDER}`, zIndex: 10, cursor: 'pointer' }}
    >
      {formatMoney(amount)}
    </span>
  );
}

export default function RightSidebar({ phase, flopOdds, riverOdds, bets, caps, onPlace, onRemove }) {
  const riverOpen = phase === 'postturn' || phase === 'resolved';

  // --- Rank helpers ---
  const rankLocked = (label) => {
    if (!flopOdds) return true;
    const o = flopOdds.rankOdds[label];
    return !o || o.locked;
  };
  const rankPayout = (label) => {
    if (!flopOdds) return null;
    return flopOdds.rankOdds[label]?.payout ?? null;
  };

  // --- Color helpers ---
  const colorPositions = [
    { key: '3R', num: '3', color: 'red' },
    { key: '3B', num: '3', color: 'black' },
    { key: '4R', num: '4', color: 'red' },
    { key: '4B', num: '4', color: 'black' },
    { key: '5R', num: '5', color: 'red' },
    { key: '5B', num: '5', color: 'black' },
  ];
  const colorLocked = (k) => {
    if (!flopOdds) return true;
    const o = flopOdds.colorOdds[k];
    return !o || o.locked;
  };
  const colorPayout = (k) => {
    if (!flopOdds) return null;
    return flopOdds.colorOdds[k]?.payout ?? null;
  };

  // --- River helpers ---
  const riverLocked = (side) => {
    if (!riverOpen || !riverOdds) return true;
    return riverOdds[side]?.locked ?? true;
  };
  const riverPayout = (side) => riverOdds?.[side]?.payout ?? null;

  return (
    <div
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{ border: `1.5px solid ${GOLD_BORDER}`, background: '#0a1224' }}
    >

      {/* ── HAND RANKING — 7 rows ── */}
      <SectionLabel>HAND RANKING</SectionLabel>
      <div className="flex flex-col" style={{ flex: 7, minHeight: 0 }}>
        {RANK_LABELS.map((label) => {
          const isLocked = rankLocked(label);
          const p = rankPayout(label);
          const bet = bets.rank[label] || 0;
          return (
            <button
              key={label}
              disabled={isLocked}
              onClick={() => !isLocked && onPlace('rank', label)}
              className="relative flex items-center justify-between px-3 flex-1"
              style={{
                background: isLocked ? DARK_GOLD : GOLD,
                borderBottom: '1px solid rgba(0,0,0,0.25)',
                opacity: isLocked ? 0.55 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                minHeight: 0,
              }}
            >
              <span style={{ color: '#3d3013', fontWeight: 800, fontSize: 12, letterSpacing: '0.3px' }}>
                {label}
              </span>
              <span className="flex items-center" style={{ gap: 6 }}>
                <span style={{ color: '#3d3013', fontWeight: 700, fontSize: 10 }}>
                  {isLocked ? 'LOCKED' : formatPayout(p)}
                </span>
                {isLocked
                  ? <Lock size={12} color="#3d3013" strokeWidth={2.5} />
                  : <Unlock size={12} color="#3d3013" strokeWidth={2.5} />}
              </span>
              <BetBadge amount={bet} onClick={() => onRemove('rank', label)} />
            </button>
          );
        })}
      </div>

      {/* ── COLOR BOARD — 6 positions in 2-col grid = 3 rows ── */}
      <SectionLabel right={`Cap: ${formatMoney(caps.color)}`}>COLOR BOARD</SectionLabel>
      <div className="grid grid-cols-2" style={{ flex: 3, minHeight: 0 }}>
        {colorPositions.map((pos) => {
          const isLocked = colorLocked(pos.key);
          const p = colorPayout(pos.key);
          const bet = bets.color[pos.key] || 0;
          const bgColor = isLocked
            ? '#2a2a2a'
            : pos.color === 'red' ? '#c91e1e' : '#111111';
          return (
            <button
              key={pos.key}
              disabled={isLocked}
              onClick={() => !isLocked && onPlace('color', pos.key)}
              className="relative flex flex-col items-center justify-center flex-1"
              style={{
                background: bgColor,
                border: '1px solid rgba(197,160,89,0.3)',
                opacity: isLocked ? 0.4 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                minHeight: 0,
              }}
            >
              <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{pos.num}</span>
              <span style={{ color: '#FFD700', fontWeight: 600, fontSize: 9, lineHeight: 1.3 }}>
                {isLocked ? 'LOCKED' : formatPayout(p)}
              </span>
              <BetBadge amount={bet} onClick={() => onRemove('color', pos.key)} />
            </button>
          );
        })}
      </div>

      {/* ── RIVER — 2 positions in 1 row ── */}
      <SectionLabel right={`Cap: ${formatMoney(caps.river)}`}>RIVER — LOW / HIGH</SectionLabel>
      <div className="grid grid-cols-2" style={{ flex: 1, minHeight: 0 }}>
        {[
          { side: 'low', label: 'LOW', range: '2–7' },
          { side: 'high', label: 'HIGH', range: '8–A' }
        ].map((b) => {
          const isLocked = riverLocked(b.side);
          const bet = bets.river[b.side] || 0;
          return (
            <button
              key={b.side}
              disabled={isLocked}
              onClick={() => !isLocked && onPlace('river', b.side)}
              className="relative flex flex-col items-center justify-center flex-1"
              style={{
                background: isLocked ? DARK_GOLD : GOLD,
                border: '1px solid rgba(197,160,89,0.3)',
                opacity: isLocked ? 0.55 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                minHeight: 0,
              }}
            >
              <span style={{ color: '#1a0d00', fontWeight: 800, fontSize: 12, lineHeight: 1 }}>{b.label}</span>
              <span style={{ color: '#1a0d00', fontWeight: 700, fontSize: 10, lineHeight: 1.2 }}>{b.range}</span>
              <span style={{ color: '#1a0d00', fontWeight: 700, fontSize: 9, lineHeight: 1 }}>
                {isLocked ? (riverOpen ? 'LOCKED' : 'AFTER TURN') : formatPayout(riverPayout(b.side))}
              </span>
              <BetBadge amount={bet} onClick={() => onRemove('river', b.side)} />
            </button>
          );
        })}
      </div>

    </div>
  );
}
