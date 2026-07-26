import React from 'react';
import { SUIT_SYMBOL, SUIT_COLOR } from '@/lib/game/cards';

// Renders the hand notation for the history rail, e.g. A♠/5♣ with colored suits.
export default function HandNotation({ cards }) {
  if (!cards) return <span className="text-white">BOARD</span>;
  return (
    <span className="font-mono">
      {cards.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-white">/</span>}
          <span className="text-white font-semibold">{c.rank}</span>
          <span style={{ color: SUIT_COLOR[c.suit] === 'red' ? '#FF6B6B' : '#FFFFFF' }}>
            {SUIT_SYMBOL[c.suit]}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}