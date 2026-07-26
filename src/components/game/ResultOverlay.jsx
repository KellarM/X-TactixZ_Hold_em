import React from 'react';
import { X } from 'lucide-react';
import { formatMoney } from '@/lib/game/cards';
import { FIXED_HANDS, SUIT_SYMBOL, SUIT_COLOR, CAT_TO_LABEL } from '@/lib/game/cards';

export default function ResultOverlay({ result, onClose }) {
  const { resolution, details, winnings, historyEntry } = result;
  const totalBet = details.card.reduce((a, b) => a + b.amt, 0)
    + details.rank.reduce((a, b) => a + b.amt, 0)
    + details.color.reduce((a, b) => a + b.amt, 0)
    + (details.river ? details.river.amt : 0);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 max-w-md w-full mx-4"
        style={{ background: 'linear-gradient(180deg, #0a1838 0%, #050d21 100%)', border: '2px solid #C5A059' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: '#E5B64E', fontWeight: 800, fontSize: 20, letterSpacing: '1px' }}>ROUND RESULT</h2>
          <button onClick={onClose} style={{ color: '#C5A059' }}><X size={20} /></button>
        </div>

        <div className="rounded-md p-3 mb-3" style={{ background: '#04101f', border: '1px solid #C5A059' }}>
          {resolution.boardWin ? (
            <div className="text-center">
              <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 16 }}>BOARD WINS</div>
              <div style={{ color: '#C5A059', fontSize: 12, marginTop: 4 }}>
                Best hand: {resolution.winningResult.name}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div style={{ color: '#39FF7D', fontWeight: 800, fontSize: 16 }}>
                {historyEntry.hand} — {historyEntry.type}
              </div>
              <div style={{ color: '#C5A059', fontSize: 12, marginTop: 4 }}>
                Winning rank: {CAT_TO_LABEL[resolution.winningCategory]}
              </div>
              <div style={{ color: '#C5A059', fontSize: 12, marginTop: 2 }}>
                {resolution.winners.length > 1 ? `${resolution.winners.length} hands tied (split pot)` : 'Single winner'}
              </div>
            </div>
          )}
          <div className="text-center mt-2" style={{ color: '#E5B64E', fontSize: 11 }}>
            Board colors: {resolution.reds} Red / {resolution.blacks} Black · River: {resolution.riverLow ? 'LOW' : 'HIGH'}
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: 6 }}>
          {details.card.map((d, i) => (
            <PayRow key={`c${i}`} label={`Hand ${d.id}`} amt={d.amt} payout={d.payout} won={d.won} />
          ))}
          {details.rank.map((d, i) => (
            <PayRow key={`r${i}`} label={d.label} amt={d.amt} payout={d.payout} won={d.won} />
          ))}
          {details.color.map((d, i) => (
            <PayRow key={`co${i}`} label={`Color ${d.k}`} amt={d.amt} payout={d.payout} won={d.won} />
          ))}
          {details.river && (
            <PayRow label={`River ${details.river.side}`} amt={details.river.amt} payout={details.river.payout} won={details.river.won} />
          )}
        </div>

        <div className="flex justify-between mt-4 pt-3" style={{ borderTop: '1px solid #C5A059' }}>
          <div>
            <div style={{ color: '#C5A059', fontSize: 10 }}>TOTAL RETURNED</div>
            <div style={{ color: '#FFD700', fontWeight: 800, fontSize: 18 }}>{formatMoney(winnings)}</div>
          </div>
          <div className="text-right">
            <div style={{ color: '#C5A059', fontSize: 10 }}>NET</div>
            <div style={{ color: winnings - totalBet >= 0 ? '#39FF7D' : '#FF6B6B', fontWeight: 800, fontSize: 18 }}>
              {winnings - totalBet >= 0 ? '+' : ''}{formatMoney(winnings - totalBet)}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 rounded-lg py-2"
          style={{ background: 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)', color: '#3d3013', fontWeight: 800, fontSize: 14, letterSpacing: '1px' }}
        >
          NEW HAND
        </button>
      </div>
    </div>
  );
}

function PayRow({ label, amt, payout, won }) {
  return (
    <div className="flex items-center justify-between rounded px-3 py-1.5" style={{ background: won ? 'rgba(57,255,125,0.1)' : 'rgba(255,107,107,0.1)' }}>
      <span style={{ color: '#FFFFFF', fontSize: 12 }}>{label}</span>
      <span className="flex items-center" style={{ gap: 8 }}>
        <span style={{ color: '#C5A059', fontSize: 11 }}>{formatMoney(amt)} @ {payout != null ? payout.toFixed(2) : '—'}:1</span>
        <span style={{ color: won ? '#39FF7D' : '#FF6B6B', fontWeight: 800, fontSize: 11, minWidth: 36, textAlign: 'right' }}>
          {won ? formatMoney(amt * (payout + 1)) : 'LOST'}
        </span>
      </span>
    </div>
  );
}