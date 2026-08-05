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
// GOLD_DIM lightened: each stop blended 50% toward GOLD_ACTIVE's matching stop
// (was #6a5410/#54420a/#6a5818/#3a2d02/#54420a -- half as dark now, lock is the indicator)
const GOLD_DIM = {
  background: 'linear-gradient(135deg, #b09638 0%, #9e821a 30%, #b4a451 55%, #826106 80%, #9e821a 100%)',
  boxShadow: 'inset 0 1px 2px rgba(255,255,200,0.3), inset 0 -1px 2px rgba(100,60,0,0.4), 0 1px 4px rgba(0,0,0,0.4)',
  border: '1px solid #000',
};
// BRIGHTENED — applied to the Rank Board's leading position (pre-resolution)
// so it pops with extra glow, WITHOUT darkening the other open betting
// positions (Michael: "all positions should look open" during betting/play —
// darkening the rest made valid bets look unavailable).
const BRIGHTENED = {
  filter: 'brightness(1.3) saturate(1.15) drop-shadow(0 0 10px rgba(255,230,120,0.85))',
};
// Solid black text (weight-matched to goldEmbossText) — used on Color Board
// positions when gold-highlighted (leading/winner), since the default
// goldEmbossText gold-on-gold would be unreadable against a gold background.
const blackHighlightText = {
  color: '#000',
  WebkitTextFillColor: '#000',
  background: 'none',
  filter: 'none',
};
const RED_ACTIVE   = { background: 'linear-gradient(160deg, #e02020 0%, #8c0e0e 100%)', border: '1px solid #111' };
const BLACK_ACTIVE = { background: 'linear-gradient(160deg, #222 0%, #000 100%)', border: '1px solid #2a2a2a' };
// RED_LOCKED / BLACK_LOCKED lightened the same way: 50% blend toward their ACTIVE counterpart
// (was #5a0a0a/#2a0303 and #0a0a0a/#000 -- black barely moves since ACTIVE black is already near-black)
const RED_LOCKED   = { background: 'linear-gradient(160deg, #9d1515 0%, #5b0909 100%)', border: '1px solid #111' };
const BLACK_LOCKED = { background: 'linear-gradient(160deg, #161616 0%, #000 100%)', border: '1px solid #1a1a1a' };

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
// boardPanelStyle is now a function so it reads the CSS variable at render time
const boardPanelStyle = {
  background: 'var(--theme-bg, #051532)',
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
  // Always (re)write textContent instead of bailing when the tag already
  // exists — a stale tag left over from a hot-reload / previous session
  // would otherwise keep OLD keyframes, silently dropping any new
  // animations added in a later code push.
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `
    @keyframes rf-bonus-pulse-side {
      0%   { box-shadow: 0 0 12px 4px rgba(255,215,0,0.6), inset 0 0 16px rgba(255,215,0,0.18); transform: scale(1.0);  border-color: rgba(255,215,0,0.5); }
      50%  { box-shadow: 0 0 38px 15px rgba(255,235,0,1.0), inset 0 0 42px rgba(255,235,0,0.42); transform: scale(1.16); border-color: #FFD700; }
      100% { box-shadow: 0 0 12px 4px rgba(255,215,0,0.6), inset 0 0 16px rgba(255,215,0,0.18); transform: scale(1.0);  border-color: rgba(255,215,0,0.5); }
    }
    /* EXPLODE — winning side bet position pops with an elastic overshoot
       then settles back to its regular size, with a brightness flash */
    @keyframes rf-bonus-explode-side {
      0%   { box-shadow: 0 0 18px 7px  rgba(255,215,0,0.7),  inset 0 0 26px rgba(255,215,0,0.3); transform: scale(1.0);  filter: brightness(1.0); }
      12%  { box-shadow: 0 0 70px 26px rgba(255,255,180,1.0), inset 0 0 100px rgba(255,255,180,0.8); transform: scale(1.35); filter: brightness(2.4); }
      30%  { box-shadow: 0 0 46px 16px rgba(255,225,0,0.9),  inset 0 0 70px rgba(255,225,0,0.5);  transform: scale(0.90);  filter: brightness(1.3); }
      50%  { box-shadow: 0 0 54px 20px rgba(255,225,0,0.95), inset 0 0 80px rgba(255,225,0,0.55); transform: scale(1.10);  filter: brightness(1.5); }
      75%  { box-shadow: 0 0 40px 14px rgba(255,220,0,0.85), inset 0 0 60px rgba(255,220,0,0.45); transform: scale(0.98);  filter: brightness(1.15); }
      100% { box-shadow: 0 0 36px 14px rgba(255,235,0,1.0),  inset 0 0 70px rgba(255,235,0,0.55); transform: scale(1.0);   filter: brightness(1.0); }
    }
    /* Bright flashbulb burst — accompanies the explode on winning side bets */
    @keyframes rf-bonus-flash-side {
      0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
    }
    /* Quiet fizzle — bonus landed here but no win. Soft ring, no harsh text. */
    @keyframes rf-bonus-fizzle-ring-side {
      0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.85; border-color: rgba(210,210,210,0.6); }
      100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0;    border-color: rgba(140,140,140,0.1); }
    }
    @keyframes rf-bonus-land-lose-side {
      0%   { box-shadow: 0 0 16px 6px rgba(140,140,140,0.35), inset 0 0 22px rgba(140,140,140,0.12); transform: scale(1.04); }
      100% { box-shadow: 0 0 20px 6px rgba(90,90,90,0.2),    inset 0 0 28px rgba(60,60,60,0.08);   transform: scale(1.0); }
    }
    @keyframes rf-bonus-shockwave-side-1 {
      0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 1; border-width: 4px; }
      100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; border-width: 1px; }
    }
    @keyframes rf-bonus-shockwave-side-2 {
      0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; border-width: 3px; }
      100% { transform: translate(-50%, -50%) scale(4.5); opacity: 0; border-width: 1px; }
    }
    @keyframes rf-bonus-particle-side {
      0%   { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
    }
    @keyframes rf-bonus-sustained-glow-side {
      0%   { box-shadow: 0 0 36px 14px rgba(255,235,0,1.0), inset 0 0 70px rgba(255,235,0,0.55); }
      50%  { box-shadow: 0 0 60px 22px rgba(255,235,0,1.0), inset 0 0 100px rgba(255,235,0,0.70); }
      100% { box-shadow: 0 0 36px 14px rgba(255,235,0,1.0), inset 0 0 70px rgba(255,235,0,0.55); }
    }
    @keyframes rf-side-leader {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.02); }
    }
    @keyframes rf-side-winner-settle {
      0%   { box-shadow: 0 0 24px 10px rgba(255,215,0,0.8); }
      100% { box-shadow: 0 0 8px 3px  rgba(255,215,0,0.3); }
    }
    /* Persistent marker — pulsing tag that stays on the bonus-selected
       side-bet position until the player clicks to reveal. */
    @keyframes rf-bonus-marker-pulse-side {
      0%, 100% { opacity: 1;   box-shadow: 0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,215,0,0.5); }
      50%      { opacity: 0.82; box-shadow: 0 2px 6px rgba(0,0,0,0.9), 0 0 18px rgba(255,215,0,0.85); }
    }
  `;
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

// ── Helper: merge highlight styles into a base button style ──
function withHighlight(baseStyle, isLeading, isWinner, isResolved) {
  if (isWinner) {
    return {
      ...baseStyle,
      animation: 'rf-side-winner-settle 0.6s ease-out forwards',
      border: '2.5px solid #FFD700',
      background: 'linear-gradient(135deg, #b8860b 0%, #d4a017 30%, #c9900e 60%, #8B6914 100%)',
      opacity: 1,
    };
  }
  if (isLeading && !isResolved) {
    return {
      ...baseStyle,
      animation: 'rf-side-leader 2.0s ease-in-out infinite',
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
  ante = 0, boardTotals = { card: 0, rank: 0, color: 0, river: 0 },
  bonusPulse = null,
}) {
  useEffect(() => { injectStyles(); }, []);

  const riverOpen = phase === 'postturn' || phase === 'resolved';
  const isResolved = phase === 'resolved';

  // ── Bonus pulse state helpers ──
  // Side bet index mapping: 0-6 = Rank, 7-12 = Color, 13-14 = River
  const isSidePulsing = (sideIdx) => bonusPulse?.side === sideIdx && !bonusPulse?.landed;
  const isSideLanded = (sideIdx) => bonusPulse?.landed && bonusPulse?.side === sideIdx;

  const bonusSideStyle = (sideIdx) => {
    if (isSideLanded(sideIdx) && bonusPulse?.sideWon) return { animation: 'rf-bonus-explode-side 0.9s cubic-bezier(.36,1.65,.32,1) forwards, rf-bonus-sustained-glow-side 1.2s ease-in-out 0.9s infinite' };
    if (isSideLanded(sideIdx) && !bonusPulse?.sideWon) return { animation: 'rf-bonus-land-lose-side 0.9s ease-out forwards' };
    if (isSidePulsing(sideIdx)) return { animation: 'rf-bonus-pulse-side 0.3s ease-in-out' };
    return {};
  };

  const bonusBadge = (sideIdx) => {
    if (!isSideLanded(sideIdx)) return null;

    // ── PERSISTENT MARKER — stays on the selected position for BOTH win
    //    and lose until the player clicks to reveal. ──
    const persistentMarker = (
      <span style={{
        position: 'absolute', bottom: -7, left: '50%',
        transform: 'translateX(-50%)',
        background: bonusPulse.sideWon
          ? 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%)'
          : 'linear-gradient(135deg, #888 0%, #555 50%, #888 100%)',
        color: '#000',
        fontSize: 10, fontWeight: 900,
        padding: '2px 8px', borderRadius: 5,
        zIndex: 41, letterSpacing: '0.5px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,215,0,0.5)',
        pointerEvents: 'none', whiteSpace: 'nowrap',
        border: '1px solid ' + (bonusPulse.sideWon ? '#FFE566' : '#aaa'),
        animation: 'rf-bonus-marker-pulse-side 1.3s ease-in-out infinite',
      }}>
        {bonusPulse.sideWon ? `★ ×${bonusPulse.sideMult} BONUS` : '★ BONUS PICK'}
      </span>
    );

    // ── NO WIN: quiet fizzle ring + persistent marker. ──
    if (!bonusPulse.sideWon) {
      return (
        <>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70%', height: '70%',
            borderRadius: '50%',
            border: '2px solid rgba(210,210,210,0.6)',
            pointerEvents: 'none', zIndex: 26,
            animation: 'rf-bonus-fizzle-ring-side 0.9s ease-out forwards',
          }} />
          {persistentMarker}
        </>
      );
    }

    // ── WIN: flashbulb burst + shockwave rings + particle burst + badge ──
    return (
      <>
        {/* Flashbulb burst on impact */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', height: '100%',
          borderRadius: '50%',
          pointerEvents: 'none', zIndex: 27,
          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,225,120,0.65) 45%, transparent 75%)',
          animation: 'rf-bonus-flash-side 0.45s ease-out forwards',
        }} />
        {/* Shockwave ring 1 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', height: '100%',
          border: '4px solid #FFD700',
          borderRadius: '6px',
          pointerEvents: 'none', zIndex: 28,
          animation: 'rf-bonus-shockwave-side-1 0.7s ease-out forwards',
        }} />
        {/* Shockwave ring 2 (delayed) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', height: '100%',
          border: '3px solid rgba(255,235,0,0.7)',
          borderRadius: '6px',
          pointerEvents: 'none', zIndex: 28,
          animation: 'rf-bonus-shockwave-side-2 0.9s ease-out 0.15s forwards',
          opacity: 0,
        }} />
        {/* Particle burst */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, pi) => {
          const rad = angle * Math.PI / 180;
          const dx = Math.cos(rad) * 50;
          const dy = Math.sin(rad) * 50;
          return (
            <div key={pi} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 5, height: 5,
              marginLeft: -2.5, marginTop: -2.5,
              background: '#FFD700',
              borderRadius: '50%',
              pointerEvents: 'none', zIndex: 29,
              boxShadow: '0 0 6px rgba(255,215,0,0.8)',
              animation: 'rf-bonus-particle-side 0.6s ease-out forwards',
              '--dx': dx + 'px',
              '--dy': dy + 'px',
            }} />
          );
        })}
        {/* Badge — pops in with the explode */}
        <span style={{
          position: 'absolute', top: -8, left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%)',
          color: '#000',
          fontSize: 13, fontWeight: 900,
          padding: '4px 12px', borderRadius: 6,
          zIndex: 40, letterSpacing: '0.8px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 24px rgba(255,215,0,0.7), 0 0 48px rgba(255,165,0,0.4)',
          pointerEvents: 'none', whiteSpace: 'nowrap',
          textShadow: '0 1px 0 rgba(255,255,255,0.3)',
          border: '1.5px solid #FFE566',
        }}>
          {`×${bonusPulse.sideMult} BONUS`}
        </span>
        {persistentMarker}
      </>
    );
  };

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

  const threeBoardTotal = boardTotals.card + boardTotals.rank + boardTotals.color;
  const riverAnteMet = threeBoardTotal >= ante && ante > 0;
  const riverLocked = (s) => !riverOpen || !riverOdds || (riverOdds[s]?.locked ?? true) || !riverAnteMet;
  const riverPayout = (s) => riverOdds?.[s]?.payout ?? null;

  return (
    <div className="flex flex-col h-full" style={{ gap: GAP }}>

      {/* ■■ HAND RANKING BOARD — flex: 5, chip CENTRED, winning rank PULSES ■■ */}
      <div style={{ ...boardPanelStyle, flex: 5 }}>
        <SectionHeader capValue={caps.rank}>HAND RANKING</SectionHeader>
        <div className="flex flex-col" style={{ flex: 1, minHeight: 0, gap: GAP }}>
          {RANK_LABELS.map((label, rankIdx) => {
            const locked = rankLocked(label);
            const p = rankPayout(label);
            const bet = bets.rank[label] || 0;
            const isLeading = leadingRankLabel === label;
            const isWinner  = winnerRankLabel === label;
            const baseStyle = locked ? GOLD_DIM : GOLD_ACTIVE;
            // Leading position (pre-resolution) gets an extra brightness/glow
            // boost so it pops — the other unlocked positions stay at their
            // normal open appearance instead of being darkened.
            const shouldBrighten = isLeading && !isResolved && !isWinner;
            const style = { ...withHighlight(baseStyle, isLeading, isWinner, isResolved), ...(shouldBrighten ? BRIGHTENED : {}) };
            return (
              <button
                key={label}
                disabled={locked}
                onClick={() => !locked && onPlace('rank', label)}
                onContextMenu={(e) => { e.preventDefault(); if (!locked && bets.rank[label]) onRemove('rank', label); }}
                className="relative flex items-center justify-between flex-1"
                style={{ ...style, ...bonusSideStyle(rankIdx), borderRadius: R, padding: '0 12px', minHeight: 0, cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                <span style={{ color: 'rgba(0,0,0,0.88)', fontWeight: 900, fontSize: 15, lineHeight: 1, WebkitTextStroke: '0.4px currentColor' }}>
                  {label}
                </span>
                {/* Odds — ALWAYS visible (dimmed when locked), same right slot as other boards */}
                <span style={{ color: locked ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.88)', fontWeight: 900, fontSize: 14, lineHeight: 1, WebkitTextStroke: '0.4px currentColor' }}>
                  {formatPayout(p)}
                </span>
                {/* Lock — centered overlay (same position as bet chips), only when locked */}
                {locked && (
                  <img
                    src="https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/06edfeada_gold_lock_cropped.png"
                    alt="Locked"
                    style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 26, height: 'auto',
                      opacity: 0.95,
                      filter: 'brightness(1.15) saturate(1.35) drop-shadow(0 2px 5px rgba(0,0,0,0.7))',
                      pointerEvents: 'none',
                      zIndex: 6,
                    }}
                  />
                )}
                {bonusBadge(rankIdx)}
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
          {colorPositions.map((pos, colorIdx) => {
            const locked = colorLocked(pos.key);
            const p = colorPayout(pos.key);
            const bet = bets.color[pos.key] || 0;
            const isLeading = leadingColorKeys.includes(pos.key);
            const isWinner  = winnerColorKeys.includes(pos.key);
            const baseStyle = locked
              ? (pos.color === 'red' ? RED_LOCKED : BLACK_LOCKED)
              : (pos.color === 'red' ? RED_ACTIVE : BLACK_ACTIVE);
            let style = withHighlight(baseStyle, isLeading, isWinner, isResolved);
            // Color Board is the one board whose BASE style is red/black (suit colour,
            // not gold) — withHighlight only adds a border for isLeading, which left the
            // background red/black with just a gold ring. Force the same full-gold
            // background used for a confirmed winner so the leading position pops exactly
            // like Card Board / Rank Board do.
            if (isLeading && !isResolved && !isWinner) {
              style = { ...style, background: 'linear-gradient(135deg, #b8860b 0%, #d4a017 30%, #c9900e 60%, #8B6914 100%)' };
            }
            // Gold-on-gold text is unreadable once the background turns gold
            // (leading or winner) — force solid black text.
            const colorTextStyle = (isWinner || (isLeading && !isResolved)) ? blackHighlightText : goldEmbossText;
            return (
              <button
                key={pos.key}
                disabled={locked}
                onClick={() => !locked && onPlace('color', pos.key)}
                onContextMenu={(e) => { e.preventDefault(); if (!locked && bets.color[pos.key]) onRemove('color', pos.key); }}
                className="relative flex flex-col items-center justify-center"
                style={{ ...style, ...bonusSideStyle(7 + colorIdx), borderRadius: R, minHeight: 0, cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                {bonusBadge(7 + colorIdx)}
                <span style={{ ...colorTextStyle, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{pos.num}</span>
                {locked ? (
                  <img
                    src="https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/06edfeada_gold_lock_cropped.png"
                    alt="Locked"
                    style={{ width: 26, height: 'auto', opacity: 0.95, filter: 'brightness(1.15) saturate(1.35) drop-shadow(0 2px 5px rgba(0,0,0,0.7))' }}
                  />
                ) : (
                  <span style={{ ...colorTextStyle, fontSize: 11, fontWeight: 800, lineHeight: 1.4 }}>
                    {formatPayout(p)}
                  </span>
                )}
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
          ].map((b, riverIdx) => {
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
                style={{ ...style, ...bonusSideStyle(13 + riverIdx), borderRadius: R, minHeight: 0, cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                {bonusBadge(13 + riverIdx)}
                <span style={{ color: '#000', fontWeight: 900, fontSize: 15, lineHeight: 1 }}>{b.label}</span>
                <span style={{ color: '#1a1a1a', fontWeight: 900, fontSize: 17, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{b.range}</span>
                {locked ? (
                  <img
                    src="https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/06edfeada_gold_lock_cropped.png"
                    alt="Locked"
                    style={{ width: 32, height: 'auto', marginTop: 2, opacity: 0.95, filter: 'brightness(1.15) saturate(1.35) drop-shadow(0 2px 5px rgba(0,0,0,0.7))' }}
                  />
                ) : (
                  <span style={{ color: '#000', fontWeight: 900, fontSize: 13, lineHeight: 1 }}>
                    {formatPayout(riverPayout(b.side))}
                  </span>
                )}
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