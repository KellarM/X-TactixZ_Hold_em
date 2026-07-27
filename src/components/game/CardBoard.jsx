import React from 'react';
import PlayingCard from './PlayingCard';
import { FIXED_HANDS, formatPayout, formatMoney } from '@/lib/game/cards';

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

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: '#051532',
        border: '1.5px solid #C5A059'
      }}
    >
      <SectionTitle>CARD BOARD — HAND POSITIONS</SectionTitle>
      <div className="grid grid-cols-5" style={{ gap: 8 }}>
        {FIXED_HANDS.map((hand) => {
          const isLocked = locked(hand.id);
          const p = payout(hand.id);
          const bet = bets.card[hand.id] || 0;
          return (
            <BettingSlot
              key={hand.id}
              oddsLabel={formatPayout(p)}
              locked={isLocked}
              pending={isLocked && phase === 'ante'}
              bet={bet}
              onPlace={() => onPlace('card', hand.id)}
              onRemove={() => onRemove('card', hand.id)}
            >
              <div className="flex" style={{ gap: 4 }}>
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
    <div className="text-center mb-2" style={{ color: '#E5B64E', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px' }}>
      {children}
    </div>
  );
}

export function BettingSlot({ oddsLabel, locked, pending, bet, onPlace, onRemove, children, accent }) {
  return (
    <div
      className="relative flex flex-col items-center rounded-md p-2"
      style={{
        background: '#04122b',
        border: `1px solid ${pending ? '#2a3550' : (locked ? '#3a4a6a' : '#C5A059')}`,
        opacity: pending ? 0.78 : (locked ? 0.45 : 1),
        minHeight: 92
      }}
    >
      <div style={{ color: pending ? '#8a9ab0' : '#FFD700', fontSize: 11, fontWeight: 700, marginBottom: 4, letterSpacing: pending ? '0.5px' : 0 }}>
        {locked ? (pending ? 'FLOP PENDING' : 'LOCKED') : oddsLabel}
      </div>
      <div>{children}</div>
      {bet > 0 && !locked && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5"
          style={{ background: '#C5A059', color: '#051025', fontSize: 9, fontWeight: 800 }}
          title="Remove bet"
        >
          {formatMoney(bet)}
        </button>
      )}
      {!locked && (
        <button
          onClick={onPlace}
          className="mt-1 w-full rounded text-center"
          style={{ color: '#C5A059', fontSize: 9, fontWeight: 700, padding: '2px 0' }}
        >
          {bet > 0 ? formatMoney(bet) : 'BET'}
        </button>
      )}
    </div>
  );
}