import React from 'react';
import PlayingCard from './PlayingCard';
import { FIXED_HANDS, formatPayout, formatMoney } from '@/lib/game/cards';
import Chip from '@/components/game/Chip';

export default function CardBoard({ odds, bets, caps, phase, onPlace, onRemove }) {
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

  return (
    <div
      className="rounded-lg p-3 flex flex-col"
      style={{
        background: '#051532',
        border: '1.5px solid #C5A059',
        flex: '1 1 0',
        minHeight: 0,
        height: '100%'
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
            flexShrink: 0
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
          const isLocked = locked(hand.id);
          const p = payout(hand.id);
          const bet = bets.card[hand.id] || 0;
          return (
            <BettingSlot
              key={hand.id}
              oddsLabel={formatPayout(p)}
              locked={isLocked}
              pending={false}
              bet={bet}
              onPlace={() => onPlace('card', hand.id)}
              onRemove={() => onRemove('card', hand.id)}
            >
              <div className="flex" style={{ gap: 3 }}>
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
    <div className="text-center mb-2" style={{ color: '#E5B64E', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', flexShrink: 0 }}>
      {children}
    </div>
  );
}

export function BettingSlot({ oddsLabel, locked, pending, bet, onPlace, onRemove, children }) {
  return (
    <div
      className="relative flex flex-col items-center justify-between rounded-md p-2"
      style={{
        background: '#04122b',
        border: `1px solid ${locked ? '#3a4a6a' : '#C5A059'}`,
        opacity: locked ? 0.45 : 1,
        height: '100%',
        minHeight: 0,
        transition: 'opacity 0.2s, border-color 0.2s'
      }}
    >
      <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
        {locked ? 'LOCKED' : oddsLabel}
      </div>
      <div>{children}</div>
      {bet > 0 && !locked && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute"
          title="Click to remove bet"
          style={{
            bottom: -10, left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, cursor: 'pointer',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
          }}
        >
          <Chip amount={bet} scale={0.52} />
        </span>
      )}
      {!locked && (
        <button
          onClick={onPlace}
          className="mt-1 w-full rounded text-center"
          style={{ color: '#C5A059', fontSize: 9, fontWeight: 700, padding: '2px 0' }}
        >
          {bet > 0 ? '' : 'BET'}
        </button>
      )}
    </div>
  );
}