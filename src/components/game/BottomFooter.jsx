import React from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { CHIPS } from '@/lib/game/useGame';
import Chip from '@/components/game/Chip';
import { formatMoney } from '@/lib/game/cards';

const GOLD_BTN = 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)';

export default function BottomFooter({
  bank, ante, totalWagered, selectedChip,
  phase, canDeal, dealLabel, subLabel,
  onChipSelect, onClearAnte, onDeal, onNewHand,
  onClearBets, onFold, onSettings,
}) {
  const showActions = phase === 'postflop' || phase === 'postturn';

  return (
    <div
      style={{
        width: '100%',
        background: 'linear-gradient(180deg, #0a1838 0%, #050d21 100%)',
        borderTop: '2px solid #C5A059',
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      {/* ■■ Chips ■■ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {CHIPS.map((chip) => {
          const active = selectedChip === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => onChipSelect(chip.value)}
              title={chip.label}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: active ? 'scale(1.18) translateY(-3px)' : 'scale(1)',
                filter: active
                  ? 'drop-shadow(0 0 8px rgba(255,215,0,0.9)) drop-shadow(0 0 3px rgba(255,215,0,0.6))'
                  : 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))',
                transition: 'transform 0.12s ease, filter 0.12s ease',
              }}
            >
              <Chip amount={chip.value} scale={0.72} />
            </button>
          );
        })}
      </div>

      {/* ■■ Players Bank ■■ */}
      <StatBox label="PLAYERS BANK" value={formatMoney(bank)} />

      {/* ■■ Ante — circular chip display, no label below ■■ */}
      <div
        onClick={phase === 'ante' && ante > 0 ? onClearAnte : undefined}
        title={phase === 'ante' && ante > 0 ? 'Click to clear ante' : ''}
        style={{
          cursor: phase === 'ante' && ante > 0 ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: '2px dashed rgba(197,160,89,0.5)',
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        {ante > 0 ? (
          <Chip amount={ante} scale={0.55} />
        ) : (
          <span style={{ color: 'rgba(197,160,89,0.6)', fontSize: 9, fontWeight: 800, letterSpacing: '0.5px' }}>
            ANTE
          </span>
        )}
      </div>

      {/* ■■ Deal / New Hand (flex-1 to fill space) ■■ */}
      <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
        {phase === 'resolved' ? (
          <button
            onClick={onNewHand}
            style={{
              background: GOLD_BTN, color: '#3d3013', fontWeight: 800,
              fontSize: 16, letterSpacing: '1px', borderRadius: 8,
              padding: '8px 28px', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}
          >
            <RotateCcw size={16} /> NEW HAND
          </button>
        ) : (
          <button
            onClick={onDeal}
            disabled={!canDeal}
            style={{
              background: canDeal ? GOLD_BTN : 'linear-gradient(135deg, #3a3128 0%, #2a2418 100%)',
              color: canDeal ? '#3d3013' : '#6a5e48',
              fontWeight: 800, fontSize: 16, letterSpacing: '1px',
              borderRadius: 8, padding: '8px 28px',
              border: '1px solid #C5A059',
              cursor: canDeal ? 'pointer' : 'not-allowed',
              boxShadow: canDeal ? '0 2px 6px rgba(0,0,0,0.5)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {dealLabel}
          </button>
        )}
        <span style={{ color: '#F7C25A', fontSize: 9, fontWeight: 600, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
          {subLabel}
        </span>
      </div>

      {/* ■■ Bet Sum Count ■■ */}
      <div
        onClick={phase === 'ante' && ante > 0 ? onClearAnte : undefined}
        title={phase === 'ante' && ante > 0 ? 'Click to clear ante' : ''}
        style={{ cursor: phase === 'ante' && ante > 0 ? 'pointer' : 'default' }}
      >
        <StatBox label="BET SUM COUNT" value={formatMoney(phase === 'ante' ? ante : totalWagered)} />
      </div>

      {/* ■■ Clear Bets / Fold ■■ */}
      {showActions && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onClearBets}
            style={{
              background: '#1a1030', border: '1px solid #C5A059', color: '#C5A059',
              fontWeight: 700, fontSize: 11, letterSpacing: '0.5px',
              borderRadius: 6, padding: '7px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            CLEAR BETS
          </button>
          <button
            onClick={onFold}
            style={{
              background: '#3a1020', border: '1px solid #C5A059', color: '#FF6B6B',
              fontWeight: 700, fontSize: 11, letterSpacing: '0.5px',
              borderRadius: 6, padding: '7px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            FOLD
          </button>
        </div>
      )}

      {/* ■■ Settings gear — ALWAYS visible, flexShrink:0 ■■ */}
      <button
        onClick={onSettings}
        title="Settings"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid #C5A059', color: '#C5A059',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Settings size={18} />
      </button>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        background: '#050d21', border: '1px solid #C5A059',
        borderRadius: 6, padding: '5px 14px', textAlign: 'center',
        minWidth: 100, flexShrink: 0,
      }}
    >
      <div style={{ color: '#C5A059', fontSize: 8, fontWeight: 700, letterSpacing: '1px' }}>{label}</div>
      <div style={{ color: '#FFD700', fontSize: 16, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function chipBg(value) {
  if (value >= 1)    return 'linear-gradient(135deg, #2a2a2a 0%, #000000 100%)';
  if (value >= 0.5)  return 'linear-gradient(135deg, #5a3a8a 0%, #2a1a4a 100%)';
  if (value >= 0.25) return 'linear-gradient(135deg, #2a6a4a 0%, #0a3a2a 100%)';
  if (value >= 0.10) return 'linear-gradient(135deg, #c93a3a 0%, #6a1a1a 100%)';
  if (value >= 0.05) return 'linear-gradient(135deg, #3a7ac9 0%, #1a3a6a 100%)';
  return 'linear-gradient(135deg, #d9d9d9 0%, #8a8a8a 100%)';
}

function chipTextColor(value) {
  return value <= 0.01 ? '#1a1a1a' : '#FFFFFF';
}