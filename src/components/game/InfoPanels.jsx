import React from 'react';
import { Trophy, Lock } from 'lucide-react';

export const PANEL = {
  background: '#0a0a0c',
  border: '1px solid #bf9b30',
  borderRadius: 10
};

export function UpgradePanel({ boardTotals }) {
  const rankMatchesHand = boardTotals && Math.abs(boardTotals.rank - boardTotals.card) < 0.001 && boardTotals.card > 0;
  return (
    <div className="flex flex-col items-center text-center px-3 py-4" style={PANEL}>
      <Trophy size={26} color="#ffcc00" strokeWidth={2} />
      <div style={{ color: '#ffcc00', fontWeight: 800, fontSize: 13, letterSpacing: '0.5px', marginTop: 6 }}>
        UPGRADE YOUR WIN
      </div>
      <div style={{ color: '#d1a94e', fontWeight: 500, fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
        {rankMatchesHand
          ? 'Unlocked! Rank bet total matches Hand bet total.'
          : 'Match your Rank bet total to your Hand bet total to unlock'}
      </div>
    </div>
  );
}

export function RiverPlaceholder() {
  return (
    <div className="flex flex-col items-center text-center px-3 py-4" style={PANEL}>
      <Lock size={26} color="#ffcc00" strokeWidth={2} />
      <div style={{ color: '#ffcc00', fontWeight: 800, fontSize: 13, letterSpacing: '0.5px', marginTop: 6 }}>
        OPENS AFTER TURN
      </div>
      <div style={{ color: '#d1a94e', fontWeight: 500, fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
        River bet available once the Turn card is dealt
      </div>
    </div>
  );
}