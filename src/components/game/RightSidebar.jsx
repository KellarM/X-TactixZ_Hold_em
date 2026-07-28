import React, { useEffect } from 'react';
import { RANK_LABELS, formatPayout, formatMoney } from '@/lib/game/cards';
import Chip from '@/components/game/Chip';

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
const RED_ACTIVE   = { background: 'linear-gradient(160deg, #e02020 0%, #8c0e0e 100%)', border: '1px solid #111' };
const BLACK_ACTIVE = { background: 'linear-gradient(160deg, #222 0%, #000 100%)', border: '1px solid #2a2a2a' };
const RED_LOCKED   = { background: 'linear-gradient(160deg, #8a1414 0%, #4a0505 100%)', border: '1px solid #111', opacity: 0.45 };
const BLACK_LOCKED = { background: 'linear-gradient(160deg, #111 0%, #000 100%)', border: '1px solid #1a1a1a', opacity: 0.45 };

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

// ── Inject pulse animations once ─────────────────────────────────────────────
const STYLE_ID = 'rf-sidebar-animations';
function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes rf-side-leader {
      0%   { box-shadow: 0 0 10px 3px rgba(229,193,88,0.5),  inset 0 0 18px rgba(229,193,88,0.15); }
      50%  { box-shadow: 0 0 28px 10px rgba(255,220,50,0.85), inset 0 0 40px rgba(255,220,50,0.30); }
      100% { box-shadow: 0 0 10px 3px rgba(229,193,88,0.5),  inset 0 0 18px rgba(229,193,88,0.15); }
    }
    @keyframes rf-side-winner {
      0%   { box-shadow: 0 0 18px 6px  rgba(255,200,0,0.7),  inset 0 0 30px rgba(255,200,0,0.25); filter: brightness(1.0); }
      50%  { box-shadow: 0 0 48px 18px rgba(255,230,0,1.0),  inset 0 0 70px rgba(255,230,0,0.55); filter: brightness(1.4); }
      100% { box-shadow: 0 0 18px 6px  rgba(255,200,0,0.7),  inset 0 0 30px rgba(255,200,0,0.25); filter: brightness(1.0); }
    }
  `;
  document.head.appendChild(style);
}

// ── Rank board chip: absolute CENTRE ──
function RankChip({ amount, onClick }) {
  if (!amount) return null;
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="Click to remove bet"
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        cursor: 'pointer',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
        pointerEvents: 'auto',
      }}
    >
      <Chip amount={amount} scale={0.50} />
    </span>
  );
}

// ── Color/River chip: absolute LEFT side ──
function LeftChip({ amount, onClick }) {
  if (!amount) return null;
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="Click to remove bet"
      style={{
        position: 'absolute',
        left: 8,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        cursor: 'pointer',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
        pointerEvents: 'auto',
      }}
    >
      <Chip amount={amount} scale={0.48} />
    </span>
  );
}

function SectionHeader({ children, capValue }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-between"
      style={{ padding: '0 2px', marginBottom: GAP }}
    >
      <span style={{ ...goldEmbossText, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {children}
      </span>
      {capValue !== undefined && (
        <span style={capBadgeStyle}>Match Ante: {formatMoney(capValue)}</span>
      )}
    </div>
  );
}

function LockIcon({ dim = false }) {
  const bodyFill    = `rgba(0,0,0,${dim ? 0.45 : 0.88})`;
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

// ── Helper: merge highlight styles into a base button style ──
function withHighlight(baseStyle, isLeading, isWinner, isResolved) {
  if (isWinner) {
    return {
      ...baseStyle,
      animation: 'rf-side-winner 1.1s ease-in-out infinite',
      border: '2.5px solid #FFD700',
      opacity: 1,
    };
  }
  if (isLeading && !isResolved) {
    return {
      ...baseStyle,
      animation: 'rf-side-leader 1.6s ease-in-out infinite',
      border: '2px solid #e5c158',
      opacity: 1,
    };
  }
  return baseStyle;
}

export default function RightSidebar({
  phase, flopOdds, riverOdds, bets, caps, onPlace, onRemove,
  leadingRankLabel = null, winnerRankLabel = null,
  leadingColorKeys = [], winnerColorKeys = [],
  leadingRiverSide = null, winnerRiverSide = null,
}) {
  useEffect(() => { injectStyles(); }, []);

  const riverOpen = phase === 'postturn' || phase === 'resolved';
  const isResolved = phase === 'resolved';

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

      {/* ■■ HAND RANKING BOARD — flex: 5, chip CENTRED, winning rank PULSES ■■ */}
      <div style={{ ...boardPanelStyle, flex: 5 }}>
        <SectionHeader capValue={caps.rank}>HAND RANKING</SectionHeader>
        <div className="flex flex-col" style={{ flex: 1, minHeight: 0, gap: GAP }}>
          {RANK_LABELS.map((label) => {
            const locked = rankLocked(label);
            const p = rankPayout(label);
            const bet = bets.rank[label] || 0;
            const isLeading = leadingRankLabel === label;
            const isWinner  = winnerRankLabel === label;
            const baseStyle = locked ? GOLD_DIM : GOLD_ACTIVE;
            const style = withHighlight(baseStyle, isLeading, isWinner, isResolved);
            return (
              <button
                key={label}
                disabled={locked}
                onClick={() => !locked && onPlace('rank', label)}
                onContextMenu={(e) => { e.preventDefault(); if (!locked && bets.rank[label]) onRemove('rank', label); }}
                className="relative flex items-center justify-between flex-1"
                style={{ ...style, borderRadius: R, padding: '0 12px', minHeight: 0, cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                <span style={{ color: 'rgba(0,0,0,0.88)', fontWeight: 900, fontSize: 15, lineHeight: 1, WebkitTextStroke: '0.4px currentColor' }}>
                  {label}
                </span>
                <span className="flex items-center" style={{ gap: 6 }}>
                  {locked ? <LockIcon dim={true} /> : (
                    <span style={{ color: 'rgba(0,0,0,0.88)', fontWeight: 900, fontSize: 14, lineHeight: 1, WebkitTextStroke: '0.4px currentColor' }}>
                      {formatPayout(p)}
                    </span>
                  )}
                </span>
                {isWinner && isResolved && (
                  <span style={{
                    position: 'absolute',
                    top: 2, right: 4,
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000',
                    fontSize: 9, fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: 3,
                    zIndex: 20,
                    letterSpacing: '0.5px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                  }}>WIN</span>
                )}
                <RankChip amount={bet} onClick={() => onRemove('rank', label)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ■■ COLOR BOARD — flex: 3, chip LEFT, text CENTRED, winning color PULSES ■■ */}
      <div style={{ ...boardPanelStyle, flex: 3 }}>
        <SectionHeader capValue={caps.color}>COLOR BOARD</SectionHeader>
        <div className="grid grid-cols-2" style={{ flex: 1, minHeight: 0, gap: GAP }}>
          {colorPositions.map((pos) => {
            const locked = colorLocked(pos.key);
            const p = colorPayout(pos.key);
            const bet = bets.color[pos.key] || 0;
            const isLeading = leadingColorKeys.includes(pos.key);
            const isWinner  = winnerColorKeys.includes(pos.key);
            const baseStyle = locked
              ? (pos.color === 'red' ? RED_LOCKED : BLACK_LOCKED)
              : (pos.color === 'red' ? RED_ACTIVE : BLACK_ACTIVE);
            const style = withHighlight(baseStyle, isLeading, isWinner, isResolved);
            return (
              <button
                key={pos.key}
                disabled={locked}
                onClick={() => !locked && onPlace('color', pos.key)}
                onContextMenu={(e) => { e.preventDefault(); if (!locked && bets.color[pos.key]) onRemove('color', pos.key); }}
                className="relative flex flex-col items-center justify-center"
                style={{ ...style, borderRadius: R, minHeight: 0, cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                <span style={{ ...goldEmbossText, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{pos.num}</span>
                <span style={{ ...goldEmbossText, fontSize: 11, fontWeight: 800, lineHeight: 1.4 }}>
                  {locked ? 'LOCKED' : formatPayout(p)}
                </span>
                {isWinner && isResolved && (
                  <span style={{
                    position: 'absolute',
                    top: 2, right: 4,
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000',
                    fontSize: 9, fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: 3,
                    zIndex: 20,
                    letterSpacing: '0.5px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                  }}>WIN</span>
                )}
                <LeftChip amount={bet} onClick={() => onRemove('color', pos.key)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ■■ RIVER — flex: 2, chip LEFT, text CENTRED, winning side PULSES ■■ */}
      <div style={{ ...boardPanelStyle, flex: 2 }}>
        <SectionHeader capValue={caps.river}>RIVER — LOW / HIGH</SectionHeader>
        <div className="grid grid-cols-2" style={{ flex: 1, minHeight: 0, gap: GAP }}>
          {[
            { side: 'low',  label: 'LOW',  range: '2–7' },
            { side: 'high', label: 'HIGH', range: '8–A' },
          ].map((b) => {
            const locked = riverLocked(b.side);
            const bet = bets.river[b.side] || 0;
            const isLeading = leadingRiverSide === b.side;
            const isWinner  = winnerRiverSide === b.side;
            const baseStyle = locked ? GOLD_DIM : GOLD_ACTIVE;
            const style = withHighlight(baseStyle, isLeading, isWinner, isResolved);
            return (
              <button
                key={b.side}
                disabled={locked}
                onClick={() => !locked && onPlace('river', b.side)}
                onContextMenu={(e) => { e.preventDefault(); if (!locked && bets.river[b.side]) onRemove('river', b.side); }}
                className="relative flex flex-col items-center justify-center"
                style={{ ...style, borderRadius: R, minHeight: 0, cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                <span style={{ color: '#000', fontWeight: 900, fontSize: 15, lineHeight: 1 }}>{b.label}</span>
                <span style={{ color: '#1a1a1a', fontWeight: 900, fontSize: 17, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{b.range}</span>
                <span style={{ color: '#000', fontWeight: 900, fontSize: 13, lineHeight: 1 }}>
                  {locked ? (riverOpen ? 'LOCKED' : 'AFTER TURN') : formatPayout(riverPayout(b.side))}
                </span>
                {isWinner && isResolved && (
                  <span style={{
                    position: 'absolute',
                    top: 2, right: 4,
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000',
                    fontSize: 9, fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: 3,
                    zIndex: 20,
                    letterSpacing: '0.5px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                  }}>WIN</span>
                )}
                <LeftChip amount={bet} onClick={() => onRemove('river', b.side)} />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}