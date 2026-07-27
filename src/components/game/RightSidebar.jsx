import React from 'react';
import { RANK_LABELS, formatPayout, formatMoney } from '@/lib/game/cards';

const GAP = 4;
const R   = 8;

const GOLD_ACTIVE = {
  background: 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
  boxShadow: 'inset 0 1px 2px rgba(255,255,200,0.6), inset 0 -1px 2px rgba(100,60,0,0.5), 0 1px 4px rgba(0,0,0,0.5)',
  border: '1px solid #000',
};

const GOLD_DIM = {
  background: 'linear-gradient(135deg, #c9a820 0%, #b08a14 30%, #d4b830 55%, #8a6504 80%, #b08a14 100%)',
  boxShadow: 'inset 0 1px 2px rgba(200,170,80,0.3)',
  border: '1px solid #000',
  opacity: 0.6,
};

const RED_ACTIVE = {
  background: 'linear-gradient(160deg, #e02020 0%, #8c0e0e 100%)',
  border: '1px solid #111',
};

const BLACK_ACTIVE = {
  background: 'linear-gradient(160deg, #222 0%, #000 100%)',
  border: '1px solid #2a2a2a',
};

const RED_LOCKED = {
  background: 'linear-gradient(160deg, #8a1414 0%, #4a0505 100%)',
  border: '1px solid #111',
  opacity: 0.45,
};

const BLACK_LOCKED = {
  background: 'linear-gradient(160deg, #111 0%, #000 100%)',
  border: '1px solid #1a1a1a',
  opacity: 0.45,
};

const goldEmbossText = {
  color: 'transparent',
  background: 'linear-gradient(180deg, #ffe566 0%, #c9960a 45%, #ffe566 80%, #a07005 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.7))',
};

const capBadgeStyle = {
  background: 'rgba(0,0,0,0.85)',
  border: '1px solid rgba(234,179,8,0.5)',
  color: '#fbbf24',
  fontSize: 10,
  fontWeight: 900,
  borderRadius: 99,
  padding: '1px 7px',
  whiteSpace: 'nowrap',
};

// Gold border panel — wraps each board section
const boardPanelStyle = {
  background: '#051532',
  border: '1.5px solid #C5A059',
  borderRadius: 10,
  padding: 6,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  boxSizing: 'border-box',
};

function BetBadge({ amount, onClick }) {
  if (!amount) return null;
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute"
      style={{
        top: -8, right: -8,
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid rgba(234,179,8,0.5)',
        color: '#fbbf24',
        fontSize: 9,
        fontWeight: 900,
        borderRadius: 99,
        padding: '1px 5px',
        zIndex: 10,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {formatMoney(amount)}
    </span>
  );
}

function SectionHeader({ children, capValue }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-between"
      style={{ padding: '0 2px', marginBottom: GAP }}
    >
      <span style={{
        ...goldEmbossText,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {children}
      </span>
      {capValue !== undefined && (
        <span style={capBadgeStyle}>
          Match Cap: {formatMoney(capValue)}
        </span>
      )}
    </div>
  );
}

function LockIcon({ dim = false }) {
  const bodyFill = `rgba(0,0,0,${dim ? 0.45 : 0.88})`;
  const shackleColor = `rgba(0,0,0,${dim ? 0.45 : 0.88})`;
  const keyholeColor = 'rgba(230,180,20,0.9)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, display: 'block' }}>
      <rect x="3" y="11" width="18" height="12" rx="2.5" fill={bodyFill} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={shackleColor} strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="2" fill={keyholeColor} />
      <rect x="11" y="17" width="2" height="3" rx="1" fill={keyholeColor} />
    </svg>
  );
}

export default function RightSidebar({ phase, flopOdds, riverOdds, bets, caps, onPlace, onRemove }) {
  const riverOpen = phase === 'postturn' || phase === 'resolved';

  const rankLocked  = (l) => !flopOdds || !flopOdds.rankOdds[l] || flopOdds.rankOdds[l].locked;
  const rankPayout  = (l) => flopOdds?.rankOdds[l]?.payout ?? null;

  const colorPositions = [
    { key: '3R', num: '3', color: 'red'   },
    { key: '3B', num: '3', color: 'black' },
    { key: '4R', num: '4', color: 'red'   },
    { key: '4B', num: '4', color: 'black' },
    { key: '5R', num: '5', color: 'red'   },
    { key: '5B', num: '5', color: 'black' },
  ];
  const colorLocked = (k) => !flopOdds || !flopOdds.colorOdds[k] || flopOdds.colorOdds[k].locked;
  const colorPayout = (k) => flopOdds?.colorOdds[k]?.payout ?? null;

  const riverLocked = (s) => !riverOpen || !riverOdds || (riverOdds[s]?.locked ?? true);
  const riverPayout = (s) => riverOdds?.[s]?.payout ?? null;

  return (
    <div className="flex flex-col h-full" style={{ gap: GAP }}>

      {/* ■■ HAND RANKING BOARD ■■ */}
      <div style={{ ...boardPanelStyle, flex: 5 }}>
        <SectionHeader>HAND RANKING</SectionHeader>
        <div className="flex flex-col" style={{ flex: 1, minHeight: 0, gap: GAP }}>
          {RANK_LABELS.map((label) => {
            const locked = rankLocked(label);
            const p = rankPayout(label);
            const bet = bets.rank[label] || 0;
            const style = locked ? GOLD_DIM : GOLD_ACTIVE;
            return (
              <button
                key={label}
                disabled={locked}
                onClick={() => !locked && onPlace('rank', label)}
                className="relative flex items-center justify-between flex-1"
                style={{
                  ...style,
                  borderRadius: R,
                  padding: '0 12px',
                  minHeight: 0,
                  cursor: locked ? 'not-allowed' : 'pointer',
                }}
              >
                <span style={{
                  color: 'rgba(0,0,0,0.88)',
                  fontWeight: 900,
                  fontSize: 15,
                  lineHeight: 1,
                  WebkitTextStroke: '0.4px currentColor',
                }}>
                  {label}
                </span>
                <span className="flex items-center" style={{ gap: 6 }}>
                  {locked ? (
                    <LockIcon dim={true} />
                  ) : (
                    <span style={{
                      color: 'rgba(0,0,0,0.88)',
                      fontWeight: 900,
                      fontSize: 14,
                      lineHeight: 1,
                      WebkitTextStroke: '0.4px currentColor',
                    }}>
                      {formatPayout(p)}
                    </span>
                  )}
                </span>
                <BetBadge amount={bet} onClick={() => onRemove('rank', label)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ■■ COLOR BOARD ■■ */}
      <div style={{ ...boardPanelStyle, flex: 3 }}>
        <SectionHeader capValue={caps.color}>COLOR BOARD</SectionHeader>
        <div className="grid grid-cols-2" style={{ flex: 1, minHeight: 0, gap: GAP }}>
          {colorPositions.map((pos) => {
            const locked = colorLocked(pos.key);
            const p = colorPayout(pos.key);
            const bet = bets.color[pos.key] || 0;

            let style;
            if (locked) {
              style = pos.color === 'red' ? RED_LOCKED : BLACK_LOCKED;
            } else {
              style = pos.color === 'red' ? RED_ACTIVE : BLACK_ACTIVE;
            }

            return (
              <button
                key={pos.key}
                disabled={locked}
                onClick={() => !locked && onPlace('color', pos.key)}
                className="relative flex flex-col items-center justify-center"
                style={{
                  ...style,
                  borderRadius: R,
                  minHeight: 0,
                  cursor: locked ? 'not-allowed' : 'pointer',
                }}
              >
                <span style={{
                  ...goldEmbossText,
                  fontSize: 20,
                  fontWeight: 900,
                  lineHeight: 1,
                }}>
                  {pos.num}
                </span>
                <span style={{
                  ...goldEmbossText,
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.4,
                }}>
                  {locked ? 'LOCKED' : formatPayout(p)}
                </span>
                <BetBadge amount={bet} onClick={() => onRemove('color', pos.key)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ■■ RIVER — LOW / HIGH ■■ */}
      <div style={{ ...boardPanelStyle, flex: 2 }}>
        <SectionHeader capValue={caps.river}>RIVER — LOW / HIGH</SectionHeader>
        <div className="grid grid-cols-2" style={{ flex: 1, minHeight: 0, gap: GAP }}>
          {[
            { side: 'low',  label: 'LOW',  range: '2–7' },
            { side: 'high', label: 'HIGH', range: '8–A' },
          ].map((b) => {
            const locked = riverLocked(b.side);
            const bet = bets.river[b.side] || 0;
            const style = locked ? GOLD_DIM : GOLD_ACTIVE;

            return (
              <button
                key={b.side}
                disabled={locked}
                onClick={() => !locked && onPlace('river', b.side)}
                className="relative flex flex-col items-center justify-center"
                style={{
                  ...style,
                  borderRadius: R,
                  minHeight: 0,
                  cursor: locked ? 'not-allowed' : 'pointer',
                }}
              >
                <span style={{ color: '#000', fontWeight: 900, fontSize: 15, lineHeight: 1 }}>
                  {b.label}
                </span>
                <span style={{ color: '#1a1a1a', fontWeight: 900, fontSize: 17, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  {b.range}
                </span>
                <span style={{ color: '#000', fontWeight: 900, fontSize: 13, lineHeight: 1 }}>
                  {locked ? (riverOpen ? 'LOCKED' : 'AFTER TURN') : formatPayout(riverPayout(b.side))}
                </span>
                <BetBadge amount={bet} onClick={() => onRemove('river', b.side)} />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}