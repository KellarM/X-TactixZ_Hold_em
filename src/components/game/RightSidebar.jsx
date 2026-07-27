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
  onPlace, onRemove, onClearBets, onFold
}) {
  const colorOpen = !!flopOdds;
  const riverOpen = phase === 'postturn' || phase === 'resolved';
  const showActions = (phase === 'postflop' || phase === 'postturn');

  return (
    <div className="flex flex-col" style={{ gap: 12, height: '100%' }}>
      <RankBoard
        odds={flopOdds}
        bets={bets}
        caps={caps}
        phase={phase}
        onPlace={onPlace}
        onRemove={onRemove}
      />
      {colorOpen && (
        <ColorBoard
          odds={flopOdds}
          bets={bets}
          caps={caps}
          onPlace={onPlace}
          onRemove={onRemove}
        />
      )}
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
      {showActions && (
        <div className="flex" style={{ gap: 8 }}>
          <button
            onClick={onClearBets}
            className="flex-1 rounded-md py-2"
            style={{ background: '#1a1030', border: '1px solid #C5A059', color: '#C5A059', fontWeight: 700, fontSize: 11, letterSpacing: '0.5px' }}
          >
            CLEAR BETS
          </button>
          <button
            onClick={onFold}
            className="flex-1 rounded-md py-2"
            style={{ background: '#3a1020', border: '1px solid #C5A059', color: '#FF6B6B', fontWeight: 700, fontSize: 11, letterSpacing: '0.5px' }}
          >
            FOLD
          </button>
        </div>
      )}
    </div>
  );
}