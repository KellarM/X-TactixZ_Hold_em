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
  `;
  document.head.appendChild(style);
}

export default function CardBoard({ odds, bets, caps, phase, onPlace, onRemove,
  handEvals = {}, leadingHandIds = [], winnerHandIds = [] }) {

  useEffect(() => { injectStyles(); }, []);

  const locked = (id) => {
    if (!odds) return true;
    const o = odds.cardOdds.find(x => x.handId === id);
    return !o || o.locked;
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
        background: '#051532',
        border: '1.5px solid #C5A059',
        flex: '1 1 0',
        minHeight: 0,
        height: '100%',
      }}
    >
      <SectionTitle>CARD BOARD — HAND POSITIONS</SectionTitle>

      {isAntePhase && (
        <div
          className="text-center rounded-md py-1.5 mb-2"
          style={{
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px dashed #C5A059',
            color: '#8a9ab0',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            flexShrink: 0,
          }}
        >
          FLOP PENDING — PLACE ANTE &amp; DEAL TO REVEAL ODDS
        </div>
      )}

      <div
        className="grid grid-cols-5 grid-rows-2"
        style={{ gap: 6, flex: 1, minHeight: 0 }}
      >
        {FIXED_HANDS.map((hand) => {
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
              bet={bet}
              rankLabel={rankLabel}
              isLeading={isLeading}
              isWinner={isWinner}
              isResolved={isResolved}
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

export function SectionTitle({ children }) {
  return (
    <div
      className="text-center mb-2"
      style={{ color: '#E5B64E', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', flexShrink: 0 }}
    >
      {children}
    </div>
  );
}

export function BettingSlot({
  oddsLabel, locked, bet, onPlace, onRemove, children,
  rankLabel = null, isLeading = false, isWinner = false, isResolved = false,
}) {
  // ── Border colour ──────────────────────────────────────────────────────────
  let borderColor = locked ? '#3a4a6a' : '#C5A059';
  let borderWidth = '1px';
  if (isWinner)                   { borderColor = '#FFD700'; borderWidth = '2.5px'; }
  else if (isLeading && !isResolved) { borderColor = '#e5c158'; borderWidth = '2px'; }

  // ── Animation ──────────────────────────────────────────────────────────────
  // Winner pulses bright gold; leader pulses softer gold; else static
  let animation = 'none';
  let background = '#04122b';
  if (isWinner) {
    animation  = 'rf-winner-pulse 1.1s ease-in-out infinite';
    background = '#3a2a00';           // base colour; animation overrides each cycle
  } else if (isLeading && !isResolved) {
    animation  = 'rf-leader-pulse 1.6s ease-in-out infinite';
    background = '#1a1400';
  }

  // ── Rank label colour ──────────────────────────────────────────────────────
  const rankColor = isWinner ? '#FFD700' : isLeading ? '#e5c158' : '#8a9ab0';

  return (
    <div
      className="relative rounded-md"
      style={{
        background,
        border: `${borderWidth} solid ${borderColor}`,
        animation,
        opacity: locked ? 0.5 : 1,
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
    >
      {/* Odds label — top */}
      <div style={{
        color: '#FFD700',
        fontSize: 11,
        fontWeight: 700,
        padding: '4px 4px 2px',
        flexShrink: 0,
        lineHeight: 1,
        textAlign: 'center',
        width: '100%',
      }}>
        {locked ? 'LOCKED' : oddsLabel}
      </div>

      {/* Cards — flex-1, centred */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '0 4px',
      }}>
        {children}
      </div>

      {/* Live rank label — bottom */}
      {rankLabel && !locked && (
        <div style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.5px',
          textAlign: 'center',
          padding: '2px 4px 3px',
          width: '100%',
          flexShrink: 0,
          lineHeight: 1,
          color: rankColor,
          textTransform: 'uppercase',
        }}>
          {rankLabel}
        </div>
      )}

      {/* Chip — bottom centre, shifted up if rank label is showing */}
      {bet > 0 && !locked && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Click to remove bet"
          style={{
            position: 'absolute',
            bottom: rankLabel ? 18 : 5,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            cursor: 'pointer',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
            pointerEvents: 'auto',
          }}
        >
          <Chip amount={bet} scale={0.52} />
        </span>
      )}
    </div>
  );
}
