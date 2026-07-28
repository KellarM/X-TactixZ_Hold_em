import React from 'react';
import PlayingCard from './PlayingCard';
import { FIXED_HANDS, formatPayout } from '@/lib/game/cards';
import Chip from '@/components/game/Chip';

// ── CardBoard — hand slots with live rank labels and leader/winner highlights ──
export default function CardBoard({ odds, bets, caps, phase, onPlace, onRemove,
  handEvals = {}, leadingHandIds = [], winnerHandIds = [] }) {

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
  // Border: winner = bright gold pulse, leader = soft gold, normal = dim
  let borderColor = locked ? '#3a4a6a' : '#C5A059';
  let boxShadow   = 'none';
  let background  = '#04122b';

  if (isWinner) {
    borderColor = '#FFD700';
    boxShadow   = '0 0 12px 3px rgba(255,215,0,0.6)';
    background  = 'linear-gradient(160deg, #1a1200 0%, #0d0900 100%)';
  } else if (isLeading && !isResolved) {
    borderColor = '#e5c158';
    boxShadow   = '0 0 8px 2px rgba(229,193,88,0.35)';
    background  = 'linear-gradient(160deg, #121008 0%, #04122b 100%)';
  }

  return (
    <div
      className="relative rounded-md"
      style={{
        background,
        border: `1.5px solid ${borderColor}`,
        boxShadow,
        opacity: locked ? 0.5 : 1,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: locked ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
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

      {/* Live rank label — bottom of slot */}
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
          color: isWinner ? '#FFD700' : isLeading ? '#e5c158' : '#8a9ab0',
          textTransform: 'uppercase',
        }}>
          {rankLabel}
        </div>
      )}

      {/* Chip overlay */}
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
