import React from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { CHIPS } from '@/lib/game/useGame';
import Chip from '@/components/game/Chip';
import { formatMoney } from '@/lib/game/cards';

const GOLD_BTN = 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)';

// Inject ante glow animation
if (typeof document !== 'undefined' && !document.getElementById('rf-ante-glow-style')) {
  const s = document.createElement('style');
  s.id = 'rf-ante-glow-style';
  s.textContent = `
    @keyframes rf-ante-glow {
      0%   { box-shadow: 0 0 12px 4px rgba(255,215,0,0.7), inset 0 0 10px rgba(255,215,0,0.2), 0 2px 6px rgba(0,0,0,0.6); }
      50%  { box-shadow: 0 0 24px 10px rgba(255,230,0,0.95), inset 0 0 20px rgba(255,215,0,0.4), 0 2px 6px rgba(0,0,0,0.6); }
      100% { box-shadow: 0 0 12px 4px rgba(255,215,0,0.7), inset 0 0 10px rgba(255,215,0,0.2), 0 2px 6px rgba(0,0,0,0.6); }
    }
  `;
  document.head.appendChild(s);
}

// ── Fixed widths — nothing ever moves ──
const W = {
  bank:   130,   // $99,999.99 = 10 chars, sized to fit without expansion
  betSum: 100,   // same as original, locked
  deal:   280,   // longest subtitle: "SELECT A CHIP, THEN PLACE AN ANTE, THEN DEAL" = ~46 chars at 9px
  gear:   36,
};

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
        gap: 8,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── 1. CHIPS ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {CHIPS.map((chip) => {
          const active = selectedChip === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => onChipSelect(chip.value)}
              title={chip.label}
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
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

      {/* ── 2. PLAYERS BANK — locked at 7-digit width ── */}
      <div style={{ width: W.bank, flexShrink: 0 }}>
        <StatBox label="PLAYERS BANK" value={formatMoney(bank)} />
      </div>

      {/* ── 3. ANTE — bold gold circular display ── */}
      <div
        onClick={phase === 'ante' && ante > 0 ? onClearAnte : undefined}
        title={phase === 'ante' && ante > 0 ? 'Click to clear ante' : ''}
        style={{
          cursor: phase === 'ante' && ante > 0 ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          width: 56, height: 56, borderRadius: '50%',
          border: ante > 0 ? '3px solid #FFD700' : '3px solid #C5A059',
          background: ante > 0
            ? 'radial-gradient(circle, rgba(255,215,0,0.08) 60%, rgba(0,0,0,0.5) 100%)'
            : 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
          boxShadow: ante > 0
            ? '0 0 12px 4px rgba(255,215,0,0.7), inset 0 0 10px rgba(255,215,0,0.2), 0 2px 6px rgba(0,0,0,0.6)'
            : 'inset 0 1px 2px rgba(255,255,200,0.6), inset 0 -1px 2px rgba(100,60,0,0.5), 0 2px 4px rgba(0,0,0,0.5)',
          animation: ante > 0 ? 'rf-ante-glow 1.6s ease-in-out infinite' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {ante > 0 ? (
          <Chip amount={ante} scale={0.58} />
        ) : (
          <span style={{
            color: '#000', fontSize: 11, fontWeight: 900,
            letterSpacing: '1px', textAlign: 'center', lineHeight: 1,
          }}>
            ANTE
          </span>
        )}
      </div>

      {/* ── 4. DEAL BUTTON — locked width, never shifts ── */}
      <div style={{
        width: W.deal, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
      }}>
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
        <span style={{
          color: '#F7C25A', fontSize: 9, fontWeight: 600,
          letterSpacing: '0.5px', whiteSpace: 'nowrap',
          display: 'block', textAlign: 'center',
        }}>
          {subLabel}
        </span>
      </div>

      {/* ── 5. BET SUM — locked ── */}
      <div style={{ width: W.betSum, flexShrink: 0 }}>
        <StatBox label="BET SUM" value={formatMoney(phase === 'ante' ? ante : totalWagered)} />
      </div>

      {/* ── CLEAR BETS / FOLD — visible during postflop/postturn ── */}
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

      {/* ── SPACER — pushes Gear to far right ── */}
      <div style={{ flex: '1 1 0', minWidth: 0 }} />

      {/* ── 6. GEAR — pinned to far right border ── */}
      <button
        onClick={onSettings}
        title="Settings"
        style={{
          width: W.gear, height: 36, borderRadius: '50%',
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
        borderRadius: 6, padding: '5px 10px', textAlign: 'center',
        width: '100%', boxSizing: 'border-box',
      }}
    >
      <div style={{ color: '#C5A059', fontSize: 8, fontWeight: 700, letterSpacing: '1px' }}>{label}</div>
      <div style={{ color: '#FFD700', fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}
