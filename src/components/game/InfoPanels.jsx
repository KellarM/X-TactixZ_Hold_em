import React from 'react';
import { Trophy, Lock } from 'lucide-react';

const PANEL = {
  background: '#0a0a0c',
  border: '1px solid #bf9b30',
  borderRadius: 10
};

export default function InfoPanels({ phase, boardTotals }) {
  const rankMatchesHand = Math.abs(boardTotals.rank - boardTotals.card) < 0.001 && boardTotals.card > 0;
  const upgradeUnlocked = rankMatchesHand;

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <div className="flex flex-col items-center text-center px-3 py-4" style={PANEL}>
        <Trophy size={26} color="#ffcc00" strokeWidth={2} />
        <div style={{ color: '#ffcc00', fontWeight: 800, fontSize: 13, letterSpacing: '0.5px', marginTop: 6 }}>
          UPGRADE YOUR WIN
        </div>
        <div style={{ color: '#d1a94e', fontWeight: 500, fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
          {upgradeUnlocked
            ? 'Unlocked! Rank bet total matches Hand bet total.'
            : 'Match your Rank bet total to your Hand bet total to unlock'}
        </div>
      </div>

      <div className="flex flex-col items-center text-center px-3 py-4" style={PANEL}>
        {phase === 'postturn' || phase === 'resolved' ? (
          <>
            <Trophy size={26} color="#ffcc00" strokeWidth={2} />
            <div style={{ color: '#ffcc00', fontWeight: 800, fontSize: 13, letterSpacing: '0.5px', marginTop: 6 }}>
              RIVER OPEN
            </div>
            <div style={{ color: '#d1a94e', fontWeight: 500, fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
              River bet is now available — the Turn has been dealt.
            </div>
          </>
        ) : (
          <>
            <Lock size={26} color="#ffcc00" strokeWidth={2} />
            <div style={{ color: '#ffcc00', fontWeight: 800, fontSize: 13, letterSpacing: '0.5px', marginTop: 6 }}>
              OPENS AFTER TURN
            </div>
            <div style={{ color: '#d1a94e', fontWeight: 500, fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
              River bet available once the Turn card is dealt
            </div>
          </>
        )}
      </div>
    </div>
  );
}