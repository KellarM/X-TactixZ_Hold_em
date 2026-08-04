import React, { useEffect, useRef } from 'react';
import PlayingCard from './PlayingCard';
import { FIXED_HANDS, formatPayout } from '@/lib/game/cards';
import Chip from '@/components/game/Chip';

// ── Inject keyframe animations once into the document head ──────────────────
const STYLE_ID = 'rf-card-board-animations';
function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes rf-leader-pulse {
      0%   { box-shadow: 0 0 10px 3px rgba(229,193,88,0.5),  inset 0 0 18px rgba(229,193,88,0.15); background-color: #1a1400; }
      50%  { box-shadow: 0 0 28px 10px rgba(255,220,50,0.85), inset 0 0 40px rgba(255,220,50,0.30); background-color: #2a2000; }
      100% { box-shadow: 0 0 10px 3px rgba(229,193,88,0.5),  inset 0 0 18px rgba(229,193,88,0.15); background-color: #1a1400; }
    }
    @keyframes rf-winner-pulse {
      0%   { box-shadow: 0 0 18px 6px  rgba(255,200,0,0.7),  inset 0 0 30px rgba(255,200,0,0.25); background-color: #3a2a00; }
      50%  { box-shadow: 0 0 48px 18px rgba(255,230,0,1.0),  inset 0 0 70px rgba(255,230,0,0.55); background-color: #c8960a; }
      100% { box-shadow: 0 0 18px 6px  rgba(255,200,0,0.7),  inset 0 0 30px rgba(255,200,0,0.25); background-color: #3a2a00; }
    }
    @keyframes rf-bonus-pulse {
      0%   { box-shadow: 0 0 18px 6px rgba(255,215,0,0.7),  inset 0 0 28px rgba(255,215,0,0.25); transform: scale(1.0); border-color: rgba(255,215,0,0.6); }
      40%  { box-shadow: 0 0 38px 14px rgba(255,235,0,1.0), inset 0 0 50px rgba(255,235,0,0.45); transform: scale(1.10); border-color: #FFD700; }
      100% { box-shadow: 0 0 18px 6px rgba(255,215,0,0.7),  inset 0 0 28px rgba(255,215,0,0.25); transform: scale(1.0); border-color: rgba(255,215,0,0.6); }
    }
    @keyframes rf-bonus-land-win {
      0%   { box-shadow: 0 0 24px 10px rgba(255,215,0,0.9),  inset 0 0 40px rgba(255,215,0,0.35); transform: scale(1.12); }
      30%  { box-shadow: 0 0 56px 22px rgba(255,235,0,1.0),  inset 0 0 90px rgba(255,235,0,0.6); transform: scale(1.18); }
      100% { box-shadow: 0 0 44px 18px rgba(255,235,0,1.0),  inset 0 0 70px rgba(255,235,0,0.5); transform: scale(1.10); }
    }
    @keyframes rf-bonus-land-lose {
      0%   { box-shadow: 0 0 18px 6px  rgba(239,68,68,0.5),  inset 0 0 28px rgba(239,68,68,0.15); transform: scale(1.06); }
      100% { box-shadow: 0 0 28px 8px  rgba(180,40,40,0.3),  inset 0 0 38px rgba(120,20,20,0.10); transform: scale(1.0); }
    }

    /* Landing shockwave — ring 1 (fast) */
    @keyframes rf-bonus-shockwave-1 {
      0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 1; border-width: 4px; }
      100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; border-width: 1px; }
    }
    /* Landing shockwave — ring 2 (delayed, slower) */
    @keyframes rf-bonus-shockwave-2 {
      0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; border-width: 3px; }
      100% { transform: translate(-50%, -50%) scale(4.5); opacity: 0; border-width: 1px; }
    }
    /* Landing particle burst — 8 dots flying outward */
    @keyframes rf-bonus-particle {
      0%   { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
    }
    /* Sustained golden glow on the landed box */
    @keyframes rf-bonus-sustained-glow {
      0%   { box-shadow: 0 0 40px 16px rgba(255,235,0,1.0),  inset 0 0 80px rgba(255,235,0,0.55); }
      50%  { box-shadow: 0 0 70px 26px rgba(255,235,0,1.0),  inset 0 0 120px rgba(255,235,0,0.70); }
      100% { box-shadow: 0 0 40px 16px rgba(255,235,0,1.0),  inset 0 0 80px rgba(255,235,0,0.55); }
    }
  `;
  document.head.appendChild(style);
}

export default function CardBoard({ odds, bets, caps, phase, onPlace, onRemove,
  handEvals = {}, leadingHandIds = [], winnerHandIds = [], bonusPulse = null }) {

  useEffect(() => { injectStyles(); }, []);

  const locked = (id) => {
    if (!odds) return true;
    const o = odds.cardOdds.find(x => x.handId === id);
    return !o || o.locked;
  };
  const lockReason = (id) => {
    if (!odds) return null;
    const o = odds.cardOdds.find(x => x.handId === id);
    return o ? o.reason : null;
  };
  const payout = (id) => {
    if (!odds) return null;
    const o = odds.cardOdds.find(x => x.handId === id);
    return o ? o.payout : null;
  };

  const isAntePhase = phase === 'ante';
  const isResolved  = phase === 'resolved';

  return (
    <div
      className="rounded-lg p-3 flex flex-col"
      style={{
        background: 'var(--theme-bg, #051532)',
        border: '1.5px solid #C5A059',
        flex: '1 1 0',
        minHeight: 0,
        height: '100%',
      }}
    >
      <SectionTitle capValue={caps ? caps.card : undefined}>CARD BOARD — HAND POSITIONS</SectionTitle>

      <div
        className="grid grid-cols-5 grid-rows-2"
        style={{ gap: 6, flex: 1, minHeight: 0 }}
      >
        {FIXED_HANDS.map((hand, handArrayIdx) => {
          const isLocked   = locked(hand.id);
          const p          = payout(hand.id);
          const bet        = bets.card[hand.id] || 0;
          const rankLabel  = handEvals[hand.id] || null;
          const isLeading  = leadingHandIds.includes(hand.id);
          const isWinner   = winnerHandIds.includes(hand.id);

          return (
            <BettingSlot
              key={hand.id}
              oddsLabel={formatPayout(p)}
              locked={isLocked}
              lockReason={lockReason(hand.id)}
              bet={bet}
              rankLabel={rankLabel}
              isLeading={isLeading}
              isWinner={isWinner}
              isResolved={isResolved}
              bonusPulse={bonusPulse}
              bonusIndex={handArrayIdx}
              onPlace={() => onPlace('card', hand.id)}
              onRemove={() => onRemove('card', hand.id)}
            >
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
                {hand.cards.map((c, i) => (
                  <PlayingCard key={i} card={c} size="sm" />
                ))}
              </div>
            </BettingSlot>
          );
        })}
      </div>
    </div>
  );
}

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

export function SectionTitle({ children, capValue }) {
  const formatMoney = (v) => v !== undefined ? '$' + v.toFixed(2) : '';
  return (
    <div
      className="flex items-center justify-between flex-shrink-0 mb-2"
      style={{ padding: '0 2px' }}
    >
      <span style={{ flex: 1 }} />
      <span style={{ color: '#E5B64E', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textAlign: 'center', flex: 'auto' }}>
        {children}
      </span>
      <span style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {capValue !== undefined && (
          <span style={capBadgeStyle}>Match Ante: {formatMoney(capValue)}</span>
        )}
      </span>
    </div>
  );
}

export function BettingSlot({
  oddsLabel, locked, lockReason = null, bet, onPlace, onRemove, children,
  rankLabel = null, isLeading = false, isWinner = false, isResolved = false,
  bonusPulse = null, bonusIndex = null,
}) {
  // ── Vault tint locked treatment (Option A) ──────────────────────────────────
  // When locked: dulled gold border, grayscale cards, dark scrim with padlock
  // watermark, actual odds shown (not "LOCKED"), rank label at bottom, and a
  // small reason text telling the player WHY it's locked.

  // ── Border colour ──────────────────────────────────────────────────────────
  let borderColor = '#C5A059';
  let borderWidth = '3px';
  if (isWinner)                      { borderColor = '#FFD700'; borderWidth = '4px'; }
  else if (isLeading && !isResolved) { borderColor = '#e5c158'; borderWidth = '3.5px'; }
  else if (locked)                   { borderColor = '#6b6146'; borderWidth = '3px'; }

  // ── Animation ──────────────────────────────────────────────────────────────
  let animation = 'none';
  let background = 'var(--theme-bg, #04122b)';

  // Bonus pulse state — overrides normal animations during bonus sequence
  const isBonusPulsing = bonusPulse?.card === bonusIndex && !bonusPulse?.landed;
  const isBonusLanded = bonusPulse?.landed && bonusPulse?.card === bonusIndex;

  if (isBonusLanded && bonusPulse?.cardWon) {
    animation = 'rf-bonus-land-win 0.8s ease-out forwards, rf-bonus-sustained-glow 1.2s ease-in-out 0.8s infinite';
    background = '#5a3a00';
  } else if (isBonusLanded && !bonusPulse?.cardWon) {
    animation = 'rf-bonus-land-lose 0.8s ease-out forwards';
    background = '#1a0a0a';
  } else if (isBonusPulsing) {
    animation = 'rf-bonus-pulse 0.25s ease-in-out';
    background = '#2a2000';
  } else if (isWinner) {
    animation  = 'rf-winner-pulse 1.1s ease-in-out infinite';
    background = '#3a2a00';
  } else if (isLeading && !isResolved) {
    animation  = 'rf-leader-pulse 1.6s ease-in-out infinite';
    background = '#1a1400';
  }

  // ── Rank label colour ──────────────────────────────────────────────────────
  const rankColor = isWinner ? '#FFD700'
    : isLeading ? '#e5c158'
    : locked ? '#5a5240'
    : '#8a9ab0';

  // Bottom label: show rank if available, "Dead" if no rank, or nothing pre-flop
  const bottomLabel = locked
    ? (rankLabel || 'Dead Hand')
    : rankLabel;

  return (
    <div
      className="relative rounded-md"
      style={{
        background,
        border: `${borderWidth} solid ${borderColor}`,
        animation,
        opacity: locked ? 0.90 : 1,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: locked ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.2s, border-width 0.2s',
        overflow: 'visible',
        userSelect: 'none',
      }}
      onClick={() => { if (!locked) onPlace(); }}
      onContextMenu={(e) => { e.preventDefault(); if (!locked && bet > 0) onRemove(); }}
    >
      {/* LANDING SHOCKWAVE — two expanding rings on bonus land */}
      {isBonusLanded && (
        <>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '100%', height: '100%',
            border: '4px solid #FFD700',
            borderRadius: '8px',
            pointerEvents: 'none', zIndex: 28,
            animation: 'rf-bonus-shockwave-1 0.7s ease-out forwards',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '100%', height: '100%',
            border: '3px solid rgba(255,235,0,0.7)',
            borderRadius: '8px',
            pointerEvents: 'none', zIndex: 28,
            animation: 'rf-bonus-shockwave-2 0.9s ease-out 0.15s forwards',
            opacity: 0,
          }} />
          {/* Particle burst — 8 gold dots flying outward */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, pi) => {
            const rad = angle * Math.PI / 180;
            const dx = Math.cos(rad) * 60;
            const dy = Math.sin(rad) * 60;
            return (
              <div key={pi} style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 6, height: 6,
                marginLeft: -3, marginTop: -3,
                background: '#FFD700',
                borderRadius: '50%',
                pointerEvents: 'none', zIndex: 29,
                boxShadow: '0 0 8px rgba(255,215,0,0.8)',
                animation: `rf-bonus-particle 0.6s ease-out forwards`,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
              }} />
            );
          })}
        </>
      )}

      {/* BONUS badge — enhanced with glow and scale on landing */}
      {isBonusLanded && (
        <div style={{
          position: 'absolute',
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: bonusPulse.cardWon
            ? 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%)'
            : 'linear-gradient(135deg, #555 0%, #333 100%)',
          color: bonusPulse.cardWon ? '#000' : '#999',
          fontSize: 13,
          fontWeight: 900,
          padding: '4px 14px',
          borderRadius: 6,
          zIndex: 40,
          letterSpacing: '0.8px',
          boxShadow: bonusPulse.cardWon
            ? '0 2px 12px rgba(0,0,0,0.95), 0 0 24px rgba(255,215,0,0.7), 0 0 48px rgba(255,165,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.9)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          textShadow: bonusPulse.cardWon ? '0 1px 0 rgba(255,255,255,0.3)' : 'none',
          border: bonusPulse.cardWon ? '1.5px solid #FFE566' : '1px solid #444',
        }}>
          {bonusPulse.cardWon ? `×${bonusPulse.cardMult} BONUS` : 'BONUS — NO WIN'}
        </div>
      )}

      {/* WIN badge — shows on winning positions at resolution */}
      {isWinner && isResolved && (
        <div style={{
          position: 'absolute',
          top: 2,
          right: 4,
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          color: '#000',
          fontSize: 9,
          fontWeight: 900,
          padding: '1px 5px',
          borderRadius: 3,
          zIndex: 20,
          letterSpacing: '0.5px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
        }}>
          WIN
        </div>
      )}

      {/* Odds label — top (shows actual odds even when locked) */}
      <div style={{
        color: locked ? '#9a8f6e' : '#FFD700',
        fontSize: 13.5,
        fontWeight: 700,
        fontFamily: "'Playfair Display', serif",
        padding: '4px 4px 1px',
        flexShrink: 0,
        lineHeight: 1,
        textAlign: 'center',
        width: '100%',
      }}>
        {oddsLabel}
      </div>

      {/* Cards — flex-1, centred (grayscale filter when locked) */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '0 4px',
        position: 'relative',
        filter: locked ? 'grayscale(1) brightness(0.6)' : 'none',
      }}>
        {children}
      </div>

      {/* Vault tint scrim + real gold padlock image (only when locked) */}
      {locked && (
        <div style={{
          position: 'absolute',
          inset: '28px 0 18px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          pointerEvents: 'none',
        }}>
          <img
            src="https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/06edfeada_gold_lock_cropped.png"
            alt="Locked"
            style={{
              width: 34,
              height: 'auto',
              opacity: 0.95,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))',
            }}
          />
        </div>
      )}

      {/* Bottom label — rank evaluation (or "Dead"), shown even when locked */}
      {bottomLabel && (
        <div style={{
          fontSize: 10.5,
          fontWeight: 700,
          fontFamily: "'Cinzel', serif",
          letterSpacing: '1px',
          textAlign: 'center',
          padding: '2px 4px 3px',
          width: '100%',
          flexShrink: 0,
          lineHeight: 1,
          color: rankColor,
          textTransform: 'uppercase',
        }}>
          {bottomLabel}
        </div>
      )}

      {/* Chip — centered on top of the cards */}
      {bet > 0 && !locked && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Click to remove bet"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            cursor: 'pointer',
            filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.95))',
            pointerEvents: 'auto',
          }}
        >
          <Chip amount={bet} scale={0.65} />
        </span>
      )}
    </div>
  );
}