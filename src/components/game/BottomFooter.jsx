import React from 'react';
import Chip from '@/components/game/Chip';
import { RotateCcw } from 'lucide-react';
import { CHIPS } from '@/lib/game/useGame';
import { formatMoney } from '@/lib/game/cards';

const GOLD_BTN = 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)';

export default function BottomFooter({
  bank,
  ante,
  totalWagered,
  selectedChip,
  phase,
  canDeal,
  dealLabel,
  subLabel,
  onChipSelect,
  onClearAnte,
  onDeal,
  onNewHand,
  onClearBets,
  onFold,
  onSettings,
  gearMenu,
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-t-lg"
      style={{
        background: 'linear-gradient(180deg, #0a1838 0%, #050d21 100%)',
        borderTop: '2px solid #C5A059'
      }}
    >
      {/* Chips — real 3D casino chip rendering */}
      <div className="flex items-center" style={{ gap: 6 }}>
        {CHIPS.map((chip) => {
          const active = selectedChip === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => onChipSelect(chip.value)}
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer',
                transform: active ? 'scale(1.15) translateY(-3px)' : 'scale(1)',
                transition: 'transform 0.15s',
                filter: active ? 'drop-shadow(0 0 6px rgba(229,182,78,0.9))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                outline: 'none',
              }}
              title={chip.label}
            >
              <Chip amount={chip.value} scale={0.78} />
            </button>
          );
        })}
      </div>

      {/* Player Bank */}
      <StatBox label="PLAYERS BANK" value={formatMoney(bank)} />

      {/* Ante box */}
      <div onClick={phase === 'ante' && ante > 0 ? onClearAnte : undefined} title={phase === 'ante' && ante > 0 ? 'Click to clear ante' : ''}>
        <StatBox label="ANTE" value={formatMoney(ante)} />
      </div>

      {/* Deal / action button */}
      <div className="flex flex-col items-center" style={{ gap: 4 }}>
        {phase === 'resolved' ? (
          <button
            onClick={onNewHand}
            className="rounded-lg px-10 py-2 flex items-center"
            style={{ background: GOLD_BTN, color: '#3d3013', fontWeight: 800, fontSize: 16, letterSpacing: '1px', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}
          >
            <RotateCcw size={16} className="mr-2" /> NEW HAND
          </button>
        ) : (
          <button
            onClick={onDeal}
            disabled={!canDeal}
            className="rounded-lg px-10 py-2"
            style={{
              background: canDeal ? GOLD_BTN : 'linear-gradient(135deg, #3a3128 0%, #2a2418 100%)',
              color: canDeal ? '#3d3013' : '#6a5e48',
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: '1px',
              border: '1px solid #C5A059',
              cursor: canDeal ? 'pointer' : 'not-allowed',
              boxShadow: canDeal ? '0 2px 6px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            {dealLabel}
          </button>
        )}
        <span style={{ color: '#F7C25A', fontSize: 9, fontWeight: 600, letterSpacing: '0.5px' }}>
          {subLabel}
        </span>
      </div>

      {/* Bet sum count */}
      <div onClick={phase === 'ante' && ante > 0 ? onClearAnte : undefined} title={phase === 'ante' && ante > 0 ? 'Click to clear ante' : ''}>
        <StatBox label="BET SUM COUNT" value={formatMoney(phase === 'ante' ? ante : totalWagered)} />
      </div>

      {/* Clear Bets / Fold — shown during post-flop and post-turn */}
      {(phase === 'postflop' || phase === 'postturn') && (
        <div className="flex" style={{ gap: 8 }}>
          <button
            onClick={onClearBets}
            className="rounded-md py-2 px-3"
            style={{ background: '#1a1030', border: '1px solid #C5A059', color: '#C5A059', fontWeight: 700, fontSize: 11, letterSpacing: '0.5px' }}
          >
            CLEAR BETS
          </button>
          <button
            onClick={onFold}
            className="rounded-md py-2 px-3"
            style={{ background: '#3a1020', border: '1px solid #C5A059', color: '#FF6B6B', fontWeight: 700, fontSize: 11, letterSpacing: '0.5px' }}
          >
            FOLD
          </button>
        </div>
      )}

      {/* Settings — GearMenu component inline */}
      {gearMenu || null}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      className="rounded-md px-4 py-1.5 text-center"
      style={{ background: '#050d21', border: '1px solid #C5A059', minWidth: 110 }}
    >
      <div style={{ color: '#C5A059', fontSize: 8, fontWeight: 700, letterSpacing: '1px' }}>{label}</div>
      <div style={{ color: '#FFD700', fontSize: 16, fontWeight: 800 }}>{value}</div>
    </div>
  );
}