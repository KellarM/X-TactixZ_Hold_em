import React from 'react';
import RankBoard from './RankBoard';
import ColorBoard from './ColorBoard';
import RiverBoard from './RiverBoard';
import { RiverPlaceholder } from './InfoPanels';

// Composes the right-hand panel:
//  - Hand Ranking (always)
//  - Color board (only once post-flop odds exist)
//  - River board (after the turn) — otherwise the "OPENS AFTER TURN" placeholder
export default function RightSidebar({
  phase, flopOdds, riverOdds, bets, caps,
  onPlace, onRemove
}) {
  const riverOpen = phase === 'postturn' || phase === 'resolved';

  return (
    <div className="flex flex-col h-full" style={{ gap: 10 }}>
      {/* Rank Board — less vertical weight */}
      <div style={{ flex: 5, minHeight: 0 }}>
        <RankBoard
          odds={flopOdds}
          bets={bets}
          caps={caps}
          phase={phase}
          onPlace={onPlace}
          onRemove={onRemove}
        />
      </div>
      {/* Color Board — more vertical weight */}
      <div style={{ flex: 4, minHeight: 0 }}>
        <ColorBoard
          odds={flopOdds}
          bets={bets}
          caps={caps}
          onPlace={onPlace}
          onRemove={onRemove}
        />
      </div>
      {/* River Board */}
      <div style={{ flex: 2, minHeight: 0 }}>
        {riverOpen ? (
          <RiverBoard
            odds={riverOdds}
            bets={bets}
            caps={caps}
            phase={phase}
            onPlace={onPlace}
            onRemove={onRemove}
          />
        ) : (
          <RiverPlaceholder />
        )}
      </div>
    </div>
  );
}
