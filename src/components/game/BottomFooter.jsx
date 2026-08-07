import React, { useState, useRef, useEffect } from 'react';
import { Settings, RotateCcw, Info } from 'lucide-react';
import { CHIPS } from '@/lib/game/useGame';
import Chip from '@/components/game/Chip';
import { formatMoney } from '@/lib/game/cards';
import { ANTE_STRUCTURES, getStructureById, getSavedStructureId, ANTE_STRUCTURE_EVENT } from '@/lib/game/anteStructures';

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
  deal:   500,   // subtitle at 16px (one size lower than 18px), scaled from 560px@18px
  gear:   36,
};

export default function BottomFooter({
  bank, ante, totalWagered, selectedChip,
  phase, canDeal, dealLabel, subLabel,
  onChipSelect, onClearAnte, onDeal, onNewHand,
  onClearBets, onFold, onSettings,
  anteStructureId,
}) {
  const showActions = phase === 'postflop' || phase === 'postturn';

  // ── Ante Structure info bubble ──────────────────────────────────────
  // Reads the active structure from props (live-synced from ToolBar changes
  // via the ANTE_STRUCTURE_EVENT). Falls back to localStorage. Shows a
  // speech-bubble above the Ante circle when the info button is pressed.
  const [structureId, setStructureId] = useState(anteStructureId || (() => { try { return getSavedStructureId(); } catch { return 'C'; } }));
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    setStructureId(anteStructureId || structureId);
  }, [anteStructureId]);

  // Listen for live structure changes from the Tools menu
  useEffect(() => {
    const handler = (e) => {
      setStructureId(e.detail || 'C');
      setShowBubble(true); // flash the bubble so operator sees the change
      setTimeout(() => setShowBubble(false), 4000);
    };
    window.addEventListener(ANTE_STRUCTURE_EVENT, handler);
    return () => window.removeEventListener(ANTE_STRUCTURE_EVENT, handler);
  }, []);

  const activeStruct = getStructureById(structureId);

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        background: 'var(--theme-bg, #050d21)',
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

      {/* ── 3a. ANTE STRUCTURE INFO BUTTON + BUBBLE ── */}
      <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setShowBubble(s => !s)}
          title="Ante Bonus Structure"
          style={{
            background: showBubble
              ? 'linear-gradient(135deg, #e5c158 0%, #d4af37 100%)'
              : 'rgba(197,160,89,0.15)',
            border: showBubble ? '1px solid #FFD700' : '1px solid rgba(197,160,89,0.4)',
            borderRadius: '50%',
            width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          <Info size={11} color={showBubble ? '#1a0f00' : '#C5A059'} />
        </button>

        {showBubble && activeStruct && (
          <>
            {/* Click-away overlay */}
            <div
              onClick={() => setShowBubble(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            />
            {/* Speech bubble */}
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999,
              background: 'linear-gradient(160deg, #1a0f00 0%, #0a0600 100%)',
              border: '1.5px solid rgba(202,138,4,0.7)',
              borderRadius: 10,
              padding: '10px 14px',
              minWidth: 200,
              maxWidth: 240,
              boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
              pointerEvents: 'auto',
            }}>
              {/* Bubble tail */}
              <div style={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: 12, height: 12,
                background: '#0a0600',
                borderRight: '1.5px solid rgba(202,138,4,0.7)',
                borderBottom: '1.5px solid rgba(202,138,4,0.7)',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 900, color: '#facc15',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  Ante Structure: {activeStruct.id}
                </span>
                {activeStruct.viable
                  ? <span style={{ fontSize: 8, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '1px 5px', borderRadius: 3 }}>VIABLE</span>
                  : <span style={{ fontSize: 8, color: '#f87171', fontWeight: 700, background: 'rgba(239,68,68,0.15)', padding: '1px 5px', borderRadius: 3 }}>PLAYER EDGE</span>
                }
              </div>
              <div style={{ fontSize: 11, color: '#e5c158', fontWeight: 700, marginBottom: 4 }}>
                {activeStruct.name}
              </div>
              <div style={{ fontSize: 10, color: '#c4b896', marginBottom: 6, lineHeight: 1.4 }}>
                {activeStruct.short}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 9, color: '#8a8a8a' }}>
                <span>RTP: <b style={{ color: activeStruct.blendedRtp > 100 ? '#f87171' : '#4ade80' }}>{activeStruct.blendedRtp.toFixed(2)}%</b></span>
                <span>Edge: <b style={{ color: activeStruct.houseEdge >= 0 ? '#4ade80' : '#f87171' }}>{activeStruct.houseEdge >= 0 ? '+' : ''}{activeStruct.houseEdge.toFixed(2)}%</b></span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 4. DEAL BUTTON — locked width, never shifts.
             Fold (left) and Clear Bets (right) flank it, in the empty space
             above the subtitle line, only during postflop/postturn.
             Uses a 3-column CSS grid (1fr / auto / auto / 1fr... see below) so
             Fold sits at the exact horizontal midpoint between the box's left
             edge and the Deal button's left edge (equal distance from both),
             and Clear Bets sits at the exact midpoint between the Deal
             button's right edge and the box's right edge (equal distance from
             both) -- computed by the grid, not guessed/hardcoded. ── */}
      <div style={{
        width: W.deal, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
        }}>
          <div style={{ justifySelf: 'center' }}>
            {showActions && (
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
            )}
          </div>

          {phase === 'resolved' ? (
            <button
              onClick={onNewHand}
              style={{
                background: GOLD_BTN, color: '#3d3013', fontWeight: 800,
                fontSize: 16, letterSpacing: '1px', borderRadius: 8,
                padding: '8px 28px', border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                justifySelf: 'center',
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
                justifySelf: 'center',
              }}
            >
              {dealLabel}
            </button>
          )}

          <div style={{ justifySelf: 'center' }}>
            {showActions && (
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
            )}
          </div>
        </div>

        <span style={{
          color: '#FFD700', fontSize: 16, fontWeight: 700,
          fontFamily: "'Playfair Display', serif",
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

      {/* ── 6. GEAR — absolutely pinned to far right border. Independent of flex flow;
             cannot be moved by anything else in the row, regardless of width changes ── */}
      <button
        onClick={onSettings}
        title="Settings"
        style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          width: W.gear, height: 36, borderRadius: '50%',
          border: '1px solid #C5A059', color: '#C5A059',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          zIndex: 10,
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
        background: 'var(--theme-bg, #050d21)', border: '1px solid #C5A059',
        borderRadius: 6, padding: '5px 10px', textAlign: 'center',
        width: '100%', boxSizing: 'border-box',
      }}
    >
      <div style={{ color: '#C5A059', fontSize: 8, fontWeight: 700, letterSpacing: '1px' }}>{label}</div>
      <div style={{ color: '#FFD700', fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}
