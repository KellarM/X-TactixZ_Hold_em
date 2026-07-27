import React from 'react';
import { X } from 'lucide-react';
import { formatMoney, CAT_TO_LABEL, SUIT_SYMBOL, SUIT_COLOR } from '@/lib/game/cards';

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — matched exactly to DetailedPayoutDisplay.jsx in original game
// ═══════════════════════════════════════════════════════════════════════════

const gold = {
  color: 'transparent',
  background: 'linear-gradient(180deg,#ffe566 0%,#c9960a 45%,#ffe566 80%,#a07005 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))',
};

const blackOutline = {
  textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
};

// NEW HAND button — same gold gradient as rank/river slots in original
const NEW_HAND_BTN = {
  background: 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
  boxShadow: 'inset 0 1px 2px rgba(255,255,200,0.6), inset 0 -1px 2px rgba(100,60,0,0.5), 0 1px 4px rgba(0,0,0,0.5)',
  color: '#000',
  fontWeight: 900,
  fontSize: 15,
  letterSpacing: '0.12em',
  border: '1px solid #000',
  borderRadius: 10,
  width: '100%',
  padding: '12px 0',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// ─── Small PayRow inside win modal ──────────────────────────────────────────
function PayRow({ label, amt, payout, won }) {
  const returned = won && payout != null ? amt * (payout + 1) : 0;
  return (
    <div
      style={{
        background: won ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        borderRadius: 6,
        padding: '5px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, ...blackOutline }}>
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {won && payout != null ? (
          <>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {formatMoney(amt)} @ {payout.toFixed(2)}:1
            </span>
            <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', ...blackOutline }}>
              {formatMoney(returned)}
            </span>
          </>
        ) : (
          <>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {formatMoney(amt)}
            </span>
            <span style={{ color: '#f87171', fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', ...blackOutline }}>
              LOST
            </span>
          </>
        )}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ResultOverlay({ result, onClose }) {
  if (!result) return null;
  const { resolution, details, winnings, historyEntry } = result;

  const totalBet =
    details.card.reduce((a, b) => a + b.amt, 0) +
    details.rank.reduce((a, b) => a + b.amt, 0) +
    details.color.reduce((a, b) => a + b.amt, 0) +
    (details.river ? details.river.amt : 0);

  const net       = winnings - totalBet;
  const isWin     = winnings > 0;
  const isBoardWin = resolution.boardWin;

  // Collect all payout rows
  const rows = [
    ...details.card.map(d => ({ label: `Hand ${d.id}`, amt: d.amt, payout: d.payout, won: d.won })),
    ...details.rank.map(d => ({ label: d.label, amt: d.amt, payout: d.payout, won: d.won })),
    ...details.color.map(d => ({ label: `Color ${d.k}`, amt: d.amt, payout: d.payout, won: d.won })),
    ...(details.river ? [{ label: `River ${details.river.side?.toUpperCase()}`, amt: details.river.amt, payout: details.river.payout, won: details.river.won }] : []),
  ];

  // ── BACKDROP ──────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >

      {/* ── NO WIN modal ──────────────────────────────────────────────────── */}
      {!isWin ? (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 480,
            maxWidth: '96vw',
            background: 'linear-gradient(135deg,rgba(10,4,4,0.99) 0%,rgba(40,8,8,0.99) 50%,rgba(10,4,4,0.99) 100%)',
            border: '2px solid #7f1d1d',
            borderRadius: 16,
            boxShadow: '0 0 60px rgba(180,0,0,0.4), 0 0 120px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: '40px 32px',
          }}
        >
          {/* Red accent bars */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#7f1d1d,#ef4444,#7f1d1d)' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#7f1d1d,#ef4444,#7f1d1d)' }} />

          {/* NO WIN headline */}
          <div style={{
            fontWeight: 900,
            fontSize: '3rem',
            letterSpacing: '0.06em',
            color: '#ef4444',
            textShadow: '0 0 30px rgba(239,68,68,0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
            lineHeight: 1,
            marginBottom: 14,
          }}>
            NO WIN
          </div>

          {/* Red divider */}
          <div style={{ width: 200, height: 2, background: 'linear-gradient(90deg,transparent,#ef4444,transparent)', marginBottom: 16 }} />

          {/* Sub message */}
          <div style={{
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            ...blackOutline,
            marginBottom: 20,
          }}>
            Better Luck Next Round
          </div>

          {/* Amount wagered */}
          {totalBet > 0 && (
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                Amount Wagered
              </div>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#f87171',
                textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
              }}>
                -{formatMoney(totalBet)}
              </div>
            </div>
          )}

          <button onClick={onClose} style={NEW_HAND_BTN}>NEW HAND</button>
        </div>

      ) : (
      /* ── WIN modal ──────────────────────────────────────────────────────── */
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 500,
            maxWidth: '96vw',
            background: 'linear-gradient(135deg,rgba(5,10,30,0.99) 0%,rgba(10,20,50,0.99) 50%,rgba(5,10,30,0.99) 100%)',
            border: '2px solid #C5A059',
            borderRadius: 16,
            boxShadow: '0 0 50px rgba(0,0,0,0.85), 0 0 20px rgba(197,160,89,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Gold accent top bar */}
          <div style={{ height: 3, background: 'linear-gradient(90deg,#c9960a,#ffe566,#c9960a)', flexShrink: 0 }} />

          {/* ── Header ── */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px 10px',
            borderBottom: '1px solid rgba(197,160,89,0.3)',
          }}>
            <div>
              <div style={{ ...gold, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.08em', lineHeight: 1 }}>
                ROUND RESULT
              </div>
              {isBoardWin && (
                <div style={{ color: '#f87171', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                  Board wins — card & rank bets lose
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5A059', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Summary block ── */}
          <div style={{
            margin: '10px 14px',
            background: 'rgba(0,0,0,0.35)',
            border: '1.5px solid rgba(197,160,89,0.4)',
            borderRadius: 10,
            padding: '10px 14px',
            flexShrink: 0,
          }}>
            {resolution.boardWin ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ef4444', fontWeight: 900, fontSize: 16, letterSpacing: '0.05em' }}>BOARD WINS</div>
                <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 4 }}>Best hand: {resolution.winningResult?.name}</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4ade80', fontWeight: 900, fontSize: 16, letterSpacing: '0.05em' }}>
                  {historyEntry?.hand} — {historyEntry?.type}
                </div>
                <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 3 }}>
                  Winning rank: {CAT_TO_LABEL?.[resolution.winningCategory] ?? resolution.winningCategory}
                </div>
                <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 2 }}>
                  {resolution.winners?.length > 1 ? `${resolution.winners.length} hands tied (split pot)` : 'Single winner'}
                </div>
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 6, color: '#fbbf24', fontSize: 11, opacity: 0.75 }}>
              Board colors: {resolution.reds} Red / {resolution.blacks} Black · River: {resolution.riverLow ? 'LOW' : 'HIGH'}
            </div>
          </div>

          {/* ── Pay rows ── */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {rows.map((r, i) => (
              <PayRow key={i} label={r.label} amt={r.amt} payout={r.payout} won={r.won} />
            ))}
          </div>

          {/* ── Totals bar ── */}
          <div style={{
            flexShrink: 0,
            borderTop: '1px solid rgba(197,160,89,0.3)',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.3)',
            marginTop: 8,
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                TOTAL RETURNED
              </div>
              <div style={{ ...gold, fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>
                {formatMoney(winnings)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                NET
              </div>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: net >= 0 ? '#4ade80' : '#f87171',
                ...blackOutline,
              }}>
                {net >= 0 ? '+' : ''}{formatMoney(net)}
              </div>
            </div>
          </div>

          {/* ── NEW HAND button ── */}
          <div style={{ padding: '10px 14px 14px' }}>
            <button onClick={onClose} style={NEW_HAND_BTN}>NEW HAND</button>
          </div>

        </div>
      )}
    </div>
  );
}
