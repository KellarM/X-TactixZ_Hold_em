import React from 'react';
import { Settings, RotateCcw } from 'lucide-react';
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
  onSettings
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-t-lg"
      style={{
        background: 'linear-gradient(180deg, #0a1838 0%, #050d21 100%)',
        borderTop: '2px solid #C5A059'
      }}
    >
      {/* Chips */}
      <div className="flex items-center" style={{ gap: 8 }}>
        {CHIPS.map((chip) => {
          const active = selectedChip === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => onChipSelect(chip.value)}
              className="rounded-full flex items-center justify-center transition-transform"
              style={{
                width: 44,
                height: 44,
                background: chipBg(chip.value),
                border: `2px dashed ${active ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}`,
                boxShadow: active ? '0 0 10px rgba(229,182,78,0.8)' : '0 2px 4px rgba(0,0,0,0.5)',
                transform: active ? 'scale(1.12)' : 'scale(1)',
                color: chipTextColor(chip.value),
                fontWeight: 800,
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Player Bank */}
      <StatBox label="PLAYERS BANK" value={formatMoney(bank)} />

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

      {/* Bet sum count (clickable to clear ante during ante phase) */}
      <div onClick={phase === 'ante' && ante > 0 ? onClearAnte : undefined} title={phase === 'ante' && ante > 0 ? 'Click to clear ante' : ''}>
        <StatBox label="BET SUM COUNT" value={formatMoney(phase === 'ante' ? ante : totalWagered)} />
      </div>

      {/* Settings */}
      <button
        onClick={onSettings}
        className="rounded-full p-2"
        style={{ border: '1px solid #C5A059', color: '#C5A059', cursor: 'pointer' }}
        title="Settings"
      >
        <Settings size={18} />
      </button>
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

function chipBg(value) {
  if (value >= 1) return 'linear-gradient(135deg, #2a2a2a 0%, #000000 100%)';
  if (value >= 0.5) return 'linear-gradient(135deg, #5a3a8a 0%, #2a1a4a 100%)';
  if (value >= 0.25) return 'linear-gradient(135deg, #2a6a4a 0%, #0a3a2a 100%)';
  if (value >= 0.10) return 'linear-gradient(135deg, #c93a3a 0%, #6a1a1a 100%)';
  if (value >= 0.05) return 'linear-gradient(135deg, #3a7ac9 0%, #1a3a6a 100%)';
  return 'linear-gradient(135deg, #d9d9d9 0%, #8a8a8a 100%)';
}

function chipTextColor(value) {
  return value <= 0.01 ? '#1a1a1a' : '#FFFFFF';
}