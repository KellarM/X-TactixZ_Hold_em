import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Wrench } from 'lucide-react';
import { fetchCapturedHands, recalcHandRtp, recalcPayout } from '../../lib/captureApi';

// ── Inject toolbar animations once ───────────────────────────────────────────
const STYLE_ID = 'rf-toolbar-style';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes rf-menu-slide-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .rf-tool-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      background: linear-gradient(135deg, #1a0f00 0%, #0e0800 100%);
      border: 1px solid rgba(197,160,89,0.5);
      border-radius: 6px;
      color: #e5c158;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 9px 14px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      text-transform: uppercase;
    }
    .rf-tool-btn:hover {
      background: linear-gradient(135deg, #2a1a00 0%, #1a1000 100%);
      border-color: #e5c158;
      color: #FFD700;
    }
    .rf-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(255,255,255,0.1);
      outline: none;
    }
    .rf-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e5c158 0%, #d4af37 100%);
      cursor: pointer;
      border: 2px solid #1a0f00;
    }
    .rf-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #e5c158;
      cursor: pointer;
      border: 2px solid #1a0f00;
    }
  `;
  document.head.appendChild(s);
}

// ── Color helpers ────────────────────────────────────────────────────────────
const GOLD = '#e5c158';
const GOLD_BRIGHT = '#FFD700';
const GREEN = '#4ade80';
const RED = '#f87171';
const MUTED = '#8a8a8a';
const BODY_TEXT = '#c4b896';

function pct(v) { return `${(v * 100).toFixed(2)}%`; }
function pct1(v) { return `${(v * 100).toFixed(1)}%`; }

// ── Certification Test Modal ──────────────────────────────────────────────────
function CertificationTestModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('history');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // HE adjustment state (0–1 range)
  const [heCard, setHeCard] = useState(0.15);
  const [heRank, setHeRank] = useState(0.12);
  const [heColor, setHeColor] = useState(0.04); // LOCKED — not user-adjustable

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchCapturedHands();
    if (result.error) {
      setError(result.error);
    } else {
      setData(result);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Calculate adjusted accumulated RTPs
  let adjustedThreeBoard = 0;
  let adjustedTotal = 0;
  if (data && data.hands && data.hands.length > 0) {
    let sum3 = 0, sum4 = 0;
    data.hands.forEach(h => {
      const r = recalcHandRtp(h, heCard, heRank);
      sum3 += r.threeBoardBlended;
      sum4 += r.totalBlended;
    });
    adjustedThreeBoard = sum3 / data.hands.length;
    adjustedTotal = sum4 / data.hands.length;
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #1a0f00 0%, #0a0600 100%)',
        border: '2px solid rgba(202,138,4,0.7)',
        borderRadius: 16,
        width: 680,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 60px rgba(0,0,0,0.95)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 22px',
          borderBottom: '1px solid rgba(202,138,4,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #e5c158 0%, #d4af37 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 16 }}>⚙</span>
            </div>
            <span style={{
              fontSize: 15, fontWeight: 900, color: '#facc15',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Certification Test Suite
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              color: '#facc15', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 20, lineHeight: 1, opacity: 0.8,
            }}
          >✕</button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex', gap: 2, padding: '8px 22px 0',
          borderBottom: '1px solid rgba(202,138,4,0.2)',
          flexShrink: 0,
        }}>
          {[
            { id: 'history', label: 'Captured Hands' },
            { id: 'calculator', label: 'RTP Calculator' },
            { id: 'status', label: 'Cert Status' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'rgba(202,138,4,0.15)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
                color: activeTab === tab.id ? GOLD_BRIGHT : MUTED,
                fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '8px 16px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '18px 22px', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: MUTED, fontSize: 13 }}>
              Loading captured hands…
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: 40, color: RED, fontSize: 13 }}>
              Error: {error}
            </div>
          )}
          {!loading && !error && activeTab === 'history' && (
            <HistoryTab data={data} onRefresh={loadData} />
          )}
          {!loading && !error && activeTab === 'calculator' && (
            <CalculatorTab
              data={data}
              heCard={heCard} setHeCard={setHeCard}
              heRank={heRank} setHeRank={setHeRank}
              heColor={heColor} setHeColor={setHeColor}
              adjustedThreeBoard={adjustedThreeBoard}
              adjustedTotal={adjustedTotal}
            />
          )}
          {!loading && !error && activeTab === 'status' && (
            <StatusTab />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 22px',
          borderTop: '1px solid rgba(202,138,4,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: MUTED, fontSize: 10 }}>
            {data ? `${data.totalHands || 0} hands captured` : ''}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #e5c158 0%, #d4af37 100%)',
              color: '#3d3013', fontWeight: 800, fontSize: 12,
              letterSpacing: '0.08em', padding: '8px 24px',
              borderRadius: 7, border: 'none', cursor: 'pointer',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ data, onRefresh }) {
  if (!data || !data.hands || data.hands.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>No hands captured yet.</div>
        <div style={{ color: '#666', fontSize: 11, marginBottom: 20 }}>
          Play hands in the game — each resolved round is automatically captured.
        </div>
        <button onClick={onRefresh} style={{
          background: 'rgba(202,138,4,0.15)',
          border: `1px solid ${GOLD}66`,
          color: GOLD, fontSize: 11, fontWeight: 700,
          padding: '8px 20px', borderRadius: 7, cursor: 'pointer',
        }}>
          REFRESH
        </button>
      </div>
    );
  }

  const { totalHands, hands, averages } = data;

  return (
    <div>
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatBox label="Total Hands" value={totalHands} />
        <StatBox label="3-Board Blended" value={pct(averages.threeBoardBlended)} color={averages.threeBoardBlended >= 0.85 ? GREEN : GOLD} />
        <StatBox label="Full Blended (w/ River)" value={pct(averages.totalBlended)} color={averages.totalBlended >= 0.88 ? GREEN : GOLD} />
      </div>

      {/* Hand History Table */}
      <div style={{
        border: '1px solid rgba(197,160,89,0.2)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 100px 50px 50px 1fr 70px 70px',
          background: 'rgba(202,138,4,0.08)',
          padding: '8px 10px',
          fontSize: 9, fontWeight: 800, color: GOLD,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          borderBottom: '1px solid rgba(197,160,89,0.2)',
        }}>
          <span>#</span>
          <span>Flop</span>
          <span>Turn</span>
          <span>River</span>
          <span>Winners</span>
          <span style={{ textAlign: 'right' }}>3-Board</span>
          <span style={{ textAlign: 'right' }}>Total</span>
        </div>

        {/* Data rows */}
        {hands.slice(0, 50).map((h, i) => {
          const cardInfo = h.cardWinners && h.cardWinners.length > 0
            ? h.cardWinners.map(w => `H${w.handIndex}`).join(',')
            : 'BOARD';
          const rankInfo = h.rankWinners && h.rankWinners.length > 0
            ? h.rankWinners[0].position
            : '—';
          const colorInfo = h.colorWinners && h.colorWinners.length > 0
            ? h.colorWinners[0].position
            : '—';
          const riverInfo = h.riverWinners && h.riverWinners.length > 0
            ? h.riverWinners[0].position.toUpperCase()
            : '—';

          return (
            <div key={h.id || i} style={{
              display: 'grid',
              gridTemplateColumns: '40px 100px 50px 50px 1fr 70px 70px',
              padding: '7px 10px',
              fontSize: 10, color: BODY_TEXT,
              borderBottom: i < hands.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <span style={{ color: MUTED }}>{h.handNumber || i + 1}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{h.flopCards || '—'}</span>
              <span style={{ fontFamily: 'monospace' }}>{h.turnCard || '—'}</span>
              <span style={{ fontFamily: 'monospace' }}>{h.riverCard || '—'}</span>
              <span style={{ fontSize: 9 }}>
                {cardInfo} · {rankInfo} · {colorInfo} · {riverInfo}
              </span>
              <span style={{ textAlign: 'right', color: h.threeBoardRtp >= 0.8 ? GREEN : h.threeBoardRtp < 0.5 ? RED : GOLD, fontWeight: 700, fontSize: 10 }}>
                {pct1(h.threeBoardRtp)}
              </span>
              <span style={{ textAlign: 'right', color: h.totalRtp >= 0.8 ? GREEN : h.totalRtp < 0.5 ? RED : GOLD, fontWeight: 700, fontSize: 10 }}>
                {pct1(h.totalRtp)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Most Recent Hand Detail */}
      {hands[0] && <HandDetail hand={hands[0]} />}

      <div style={{ marginTop: 12 }}>
        <button onClick={onRefresh} style={{
          background: 'rgba(202,138,4,0.15)',
          border: `1px solid ${GOLD}66`,
          color: GOLD, fontSize: 11, fontWeight: 700,
          padding: '8px 20px', borderRadius: 7, cursor: 'pointer',
        }}>
          REFRESH DATA
        </button>
      </div>
    </div>
  );
}

function HandDetail({ hand }) {
  const boards = [
    { name: 'Card Board', winners: hand.cardWinners, he: '15%' },
    { name: 'Rank Board', winners: hand.rankWinners, he: '12%' },
    { name: 'Color Board', winners: hand.colorWinners, he: '4% (LOCKED)' },
    { name: 'River Board', winners: hand.riverWinners, he: '8% (LOCKED)' },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: GOLD, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>
        MOST RECENT HAND — PER-POSITION DETAIL
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {boards.map(b => (
          <div key={b.name} style={{
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(255,215,0,0.04)',
            border: '1px solid rgba(197,160,89,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: GOLD, fontSize: 10, fontWeight: 700 }}>{b.name}</span>
              <span style={{ color: MUTED, fontSize: 9 }}>HE: {b.he}</span>
            </div>
            {b.winners && b.winners.length > 0 ? b.winners.map((w, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, fontSize: 9 }}>
                <div>
                  <span style={{ color: MUTED }}>Pos: </span>
                  <span style={{ color: BODY_TEXT }}>{b.name === 'Card Board' ? `H${w.handIndex}` : w.position}</span>
                </div>
                <div>
                  <span style={{ color: MUTED }}>P: </span>
                  <span style={{ color: BODY_TEXT }}>{pct1(w.probability)}</span>
                </div>
                <div>
                  <span style={{ color: MUTED }}>Pay: </span>
                  <span style={{ color: BODY_TEXT }}>{w.payout?.toFixed(3)}:1</span>
                </div>
                <div>
                  <span style={{ color: MUTED }}>RTP: </span>
                  <span style={{ color: w.rtp >= 0.9 ? GREEN : GOLD, fontWeight: 700 }}>{pct1(w.rtp)}</span>
                </div>
              </div>
            )) : (
              <div style={{ color: RED, fontSize: 10 }}>BOARD WON — no position paid</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calculator Tab ──────────────────────────────────────────────────────────
function CalculatorTab({ data, heCard, setHeCard, heRank, setHeRank, heColor, setHeColor, adjustedThreeBoard, adjustedTotal }) {
  const originalHE = { card: 0.15, rank: 0.12, color: 0.04 };
  const hasData = data && data.hands && data.hands.length > 0;

  // Use most recent hand for per-position display
  const recentHand = hasData ? data.hands[0] : null;

  return (
    <div>
      {/* HE Sliders */}
      <div style={{ color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', marginBottom: 14, textTransform: 'uppercase' }}>
        House Edge Adjustment — 2 Adjustable Boards (Card & Rank)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <HESlider label="Card Board" value={heCard} onChange={setHeCard} original={originalHE.card} />
        <HESlider label="Rank Board" value={heRank} onChange={setHeRank} original={originalHE.rank} />
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>Color Board</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 700 }}>RTP: 96.0%</span>
              <span style={{ color: BODY_TEXT, fontSize: 14, fontWeight: 800 }}>HE: 4.0%</span>
              <span style={{ color: MUTED, fontSize: 9 }}>LOCKED — 4 pre-certified states</span>
            </div>
          </div>
        </div>
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: MUTED, fontSize: 10 }}>River Board</span>
            <span style={{ color: BODY_TEXT, fontSize: 11, fontWeight: 700 }}>HE: 8% (FIXED — not adjustable)</span>
          </div>
        </div>
      </div>

      {/* Blended RTP Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{
          padding: '14px', borderRadius: 10,
          background: 'rgba(255,215,0,0.06)',
          border: '1px solid rgba(197,160,89,0.3)',
        }}>
          <div style={{ color: GOLD, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 6 }}>3-BOARD BLENDED RTP</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div>
              <div style={{ color: MUTED, fontSize: 9 }}>Original</div>
              <div style={{ color: BODY_TEXT, fontSize: 18, fontWeight: 800 }}>
                {hasData ? pct(data.averages.threeBoardBlended) : '—'}
              </div>
            </div>
            <div style={{ fontSize: 14, color: MUTED }}>→</div>
            <div>
              <div style={{ color: MUTED, fontSize: 9 }}>Adjusted</div>
              <div style={{ color: GOLD_BRIGHT, fontSize: 18, fontWeight: 900 }}>
                {hasData ? pct(adjustedThreeBoard) : '—'}
              </div>
            </div>
          </div>
        </div>
        <div style={{
          padding: '14px', borderRadius: 10,
          background: 'rgba(255,215,0,0.06)',
          border: '1px solid rgba(197,160,89,0.3)',
        }}>
          <div style={{ color: GOLD, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 6 }}>FULL BLENDED RTP (w/ RIVER)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div>
              <div style={{ color: MUTED, fontSize: 9 }}>Original</div>
              <div style={{ color: BODY_TEXT, fontSize: 18, fontWeight: 800 }}>
                {hasData ? pct(data.averages.totalBlended) : '—'}
              </div>
            </div>
            <div style={{ fontSize: 14, color: MUTED }}>→</div>
            <div>
              <div style={{ color: MUTED, fontSize: 9 }}>Adjusted</div>
              <div style={{ color: GOLD_BRIGHT, fontSize: 18, fontWeight: 900 }}>
                {hasData ? pct(adjustedTotal) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Board RTP Summary */}
      <div style={{ color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', marginBottom: 10, textTransform: 'uppercase' }}>
        Per-Board RTP (Adjusted)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        <BoardRtpBox label="Card" rtp={1 - heCard} boardWin={recentHand && (!recentHand.cardWinners || recentHand.cardWinners.length === 0)} />
        <BoardRtpBox label="Rank" rtp={1 - heRank} boardWin={recentHand && (!recentHand.rankWinners || recentHand.rankWinners.length === 0)} />
        <BoardRtpBox label="Color" rtp={0.96} fixed />
        <BoardRtpBox label="River" rtp={1 - 0.08} fixed />
      </div>

      {/* Recent Hand Position Detail with Adjusted Payouts */}
      {recentHand && (
        <div>
          <div style={{ color: GOLD, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>
            MOST RECENT HAND — ADJUSTED ODDS PREVIEW
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <AdjustedBoard
              name="Card Board"
              winners={recentHand.cardWinners}
              he={heCard}
              posLabel={w => `H${w.handIndex}`}
            />
            <AdjustedBoard
              name="Rank Board"
              winners={recentHand.rankWinners}
              he={heRank}
              posLabel={w => w.position}
            />
            <AdjustedBoard
              name="Color Board"
              winners={recentHand.colorWinners}
              he={0.04}
              posLabel={w => w.position}
              fixed
            />
            <AdjustedBoard
              name="River Board"
              winners={recentHand.riverWinners}
              he={0.08}
              posLabel={w => w.position.toUpperCase()}
              fixed
            />
          </div>
        </div>
      )}

      {!hasData && (
        <div style={{ textAlign: 'center', padding: 30, color: MUTED, fontSize: 12 }}>
          No captured hands yet. Play hands to see adjusted odds calculations.
        </div>
      )}
    </div>
  );
}

function HESlider({ label, value, onChange, original }) {
  const changed = Math.abs(value - original) > 0.001;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8,
      background: 'rgba(255,215,0,0.04)',
      border: `1px solid ${changed ? GOLD : 'rgba(197,160,89,0.2)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>{label}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
          <span style={{ color: MUTED, fontSize: 9 }}>
            Original: {(original * 100).toFixed(0)}%
          </span>
          <span style={{
            color: changed ? GOLD_BRIGHT : BODY_TEXT,
            fontSize: 14, fontWeight: 800,
          }}>
            HE: {(value * 100).toFixed(1)}%
          </span>
          <span style={{
            color: 1 - value >= 0.9 ? GREEN : 1 - value >= 0.8 ? GOLD : RED,
            fontSize: 12, fontWeight: 700,
          }}>
            RTP: {((1 - value) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={0.25}
        step={0.005}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="rf-slider"
      />
    </div>
  );
}

function BoardRtpBox({ label, rtp, boardWin, fixed }) {
  const displayRtp = boardWin ? 0 : rtp;
  return (
    <div style={{
      padding: '10px', borderRadius: 8,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center',
    }}>
      <div style={{ color: MUTED, fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{label}{fixed ? ' (fixed)' : ''}</div>
      <div style={{
        color: boardWin ? RED : displayRtp >= 0.9 ? GREEN : displayRtp >= 0.8 ? GOLD : RED,
        fontSize: 18, fontWeight: 900,
      }}>
        {boardWin ? '0.0%' : pct1(displayRtp)}
      </div>
      {boardWin && <div style={{ color: RED, fontSize: 8, marginTop: 2 }}>BOARD WON</div>}
    </div>
  );
}

function AdjustedBoard({ name, winners, he, posLabel, fixed }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: 'rgba(255,215,0,0.04)',
      border: '1px solid rgba(197,160,89,0.2)',
    }}>
      <div style={{ color: GOLD, fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
        {name}{fixed ? ' (FIXED)' : ''}
      </div>
      {winners && winners.length > 0 ? winners.map((w, i) => {
        const newPayout = fixed ? w.payout : recalcPayout(w.probability, he);
        return (
          <div key={i} style={{ fontSize: 9, lineHeight: 1.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: MUTED }}>Position</span>
              <span style={{ color: BODY_TEXT }}>{posLabel(w)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: MUTED }}>Probability</span>
              <span style={{ color: BODY_TEXT }}>{pct1(w.probability)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: MUTED }}>Orig Payout</span>
              <span style={{ color: BODY_TEXT }}>{w.payout?.toFixed(3)}:1</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: MUTED }}>{fixed ? 'Payout' : 'New Payout'}</span>
              <span style={{ color: fixed ? BODY_TEXT : GOLD_BRIGHT, fontWeight: 700 }}>{newPayout?.toFixed(3)}:1</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: MUTED }}>RTP</span>
              <span style={{ color: (1 - he) >= 0.9 ? GREEN : GOLD, fontWeight: 700 }}>
                {pct1(1 - he)}
              </span>
            </div>
          </div>
        );
      }) : (
        <div style={{ color: RED, fontSize: 10 }}>BOARD WON — no position paid</div>
      )}
    </div>
  );
}

// ── Status Tab ──────────────────────────────────────────────────────────────
function StatusTab() {
  const items = [
    { item: 'Math Engine — Post-Flop Odds', status: 'VERIFIED', color: GREEN },
    { item: 'RTP Formula Correctness', status: 'VERIFIED', color: GREEN },
    { item: 'Lockout Logic (80% threshold)', status: 'VERIFIED', color: GREEN },
    { item: 'Color Board Dynamic Odds', status: 'VERIFIED', color: GREEN },
    { item: 'Auto-Capture System', status: 'ACTIVE', color: GREEN },
    { item: 'RTP Calculator (HE Adjustment)', status: 'ACTIVE', color: GREEN },
    { item: 'Full Enumeration Report', status: 'PENDING', color: '#facc15' },
    { item: 'Monte Carlo Simulation Report', status: 'PENDING', color: '#facc15' },
    { item: 'GLI / BMM Submission', status: 'NOT STARTED', color: RED },
  ];

  return (
    <div>
      <div style={{ color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', marginBottom: 14, textTransform: 'uppercase' }}>
        Certification Status
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(({ item, status, color }) => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ color: '#c4b896', fontSize: 11 }}>{item}</span>
            <span style={{ color, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatBox({ label, value, color }) {
  return (
    <div style={{
      padding: '12px', borderRadius: 8,
      background: 'rgba(255,215,0,0.04)',
      border: '1px solid rgba(197,160,89,0.2)',
      textAlign: 'center',
    }}>
      <div style={{ color: MUTED, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: color || GOLD_BRIGHT, fontSize: 20, fontWeight: 900 }}>
        {value}
      </div>
    </div>
  );
}

// ── Main ToolBar Component ────────────────────────────────────────────────────
export default function ToolBar() {
  const [open, setOpen] = useState(false);
  const [showCertTest, setShowCertTest] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);

  useLayoutEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      const menuEl = document.getElementById('rf-toolbar-portal-menu');
      if (menuEl && menuEl.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button
          ref={btnRef}
          onClick={() => setOpen(o => !o)}
          title="Operator Tools"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5,
            height: 34,
            padding: '0 12px',
            background: open
              ? 'linear-gradient(135deg, #2a1a00 0%, #1a1000 100%)'
              : 'linear-gradient(135deg, #1a0f00 0%, #0e0800 100%)',
            border: `1px solid ${open ? '#e5c158' : 'rgba(197,160,89,0.5)'}`,
            borderRadius: 6,
            color: open ? '#FFD700' : '#e5c158',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          <Wrench size={14} />
          <span style={{
            fontSize: 10, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            TOOLS
          </span>
        </button>
      </div>

      {open && menuPos && typeof document !== 'undefined' && createPortal(
        <div
          id="rf-toolbar-portal-menu"
          style={{
            position: 'fixed',
            left: menuPos.left,
            bottom: menuPos.bottom,
            minWidth: 200,
            background: 'linear-gradient(160deg, #1a0f00 0%, #0a0600 100%)',
            border: '1px solid rgba(202,138,4,0.6)',
            borderRadius: 10,
            padding: '8px',
            display: 'flex', flexDirection: 'column', gap: 6,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.9)',
            zIndex: 9999,
            animation: 'rf-menu-slide-up 0.18s ease-out',
          }}
        >
          <div style={{
            color: 'rgba(229,193,88,0.6)', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '2px 6px 6px',
            borderBottom: '1px solid rgba(202,138,4,0.2)',
            marginBottom: 2,
          }}>
            OPERATOR TOOLS
          </div>

          <button
            className="rf-tool-btn"
            onClick={() => { setOpen(false); setShowCertTest(true); }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 5,
              background: 'linear-gradient(135deg, #e5c158 0%, #d4af37 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 12,
            }}>⚙</span>
            CERTIFICATION TEST
          </button>

          <div style={{
            color: 'rgba(197,160,89,0.3)', fontSize: 9, fontWeight: 600,
            letterSpacing: '0.08em', textAlign: 'center',
            padding: '4px 0 2px',
          }}>
            MORE TOOLS COMING
          </div>
        </div>,
        document.body
      )}

      {showCertTest && (
        <CertificationTestModal onClose={() => setShowCertTest(false)} />
      )}
    </>
  );
}
