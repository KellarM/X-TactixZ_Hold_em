import React, { useState, useRef, useEffect } from 'react';
import { Wrench } from 'lucide-react';

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
  `;
  document.head.appendChild(s);
}

// ── Certification Test Modal ──────────────────────────────────────────────────
function CertificationTestModal({ onClose }) {
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
        width: 580,
        maxHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 60px rgba(0,0,0,0.95)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
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

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 22px', flex: 1 }}>

          {/* RTP Configuration */}
          <Section title="RTP CONFIGURATION — OPERATOR CONTROL">
            <p style={bodyText}>
              Set the target house edge per board. All displayed payouts update
              automatically. Each configuration requires a separate certification build.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              {[
                { board: 'Card Board', he: 15, rtp: 85 },
                { board: 'Rank Board', he: 12, rtp: 88 },
                { board: 'Color Board', he: 10, rtp: 90 },
                { board: 'River Board', he: 8,  rtp: 92 },
              ].map(({ board, he, rtp }) => (
                <div key={board} style={configBox}>
                  <div style={{ color: '#e5c158', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                    {board}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ color: '#aaa', fontSize: 10 }}>House Edge</span>
                    <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 12 }}>{he}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ color: '#aaa', fontSize: 10 }}>RTP</span>
                    <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 12 }}>{rtp}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div style={{ color: '#facc15', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>CURRENT BLENDED RTP</div>
              <div style={{ color: '#FFD700', fontSize: 22, fontWeight: 900 }}>85%–92%</div>
              <div style={{ color: '#888', fontSize: 10, marginTop: 2 }}>Varies by player bet distribution across boards</div>
            </div>
          </Section>

          <Divider />

          {/* Verification Tools */}
          <Section title="VERIFICATION TOOLS">
            <p style={bodyText}>
              Independent math verification tools for GLI / BMM certification.
              All computations run separately from the game engine.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <ToolRow
                icon="📊"
                title="Full Enumeration Export"
                desc="Runs all 2,013,760 game outcomes (4,960 flops × 406 combos). Exports odds for every position across all flop states to Excel."
                badge="GLI REQUIRED"
                badgeColor="#e5c158"
                comingSoon
              />
              <ToolRow
                icon="🎲"
                title="Monte Carlo Simulator"
                desc="Simulates up to 10M rounds with configurable bet patterns. Confirms actual RTP matches theoretical RTP within GLI confidence bands."
                badge="GLI REQUIRED"
                badgeColor="#e5c158"
                comingSoon
              />
              <ToolRow
                icon="🔒"
                title="Lockout Threshold Analyzer"
                desc="Maps every flop state against lockout triggers. Reports how many positions lock at 70%, 80%, 90% thresholds across all 4,960 flops."
                badge="ANALYSIS"
                badgeColor="#60a5fa"
                comingSoon
              />
              <ToolRow
                icon="✅"
                title="Single Flop Verifier"
                desc="Enter a specific flop state and verify all 23 displayed positions against independent brute-force calculation."
                badge="READY"
                badgeColor="#4ade80"
                comingSoon
              />
            </div>
          </Section>

          <Divider />

          {/* Certification Status */}
          <Section title="CERTIFICATION STATUS">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { item: 'Math Engine — Post-Flop Odds',   status: 'VERIFIED',   color: '#4ade80' },
                { item: 'RTP Formula Correctness',         status: 'VERIFIED',   color: '#4ade80' },
                { item: 'Lockout Logic (80% threshold)',    status: 'VERIFIED',   color: '#4ade80' },
                { item: 'Color Board Dynamic Odds',         status: 'VERIFIED',   color: '#4ade80' },
                { item: 'Full Enumeration Report',          status: 'PENDING',    color: '#facc15' },
                { item: 'Monte Carlo Simulation Report',    status: 'PENDING',    color: '#facc15' },
                { item: 'GLI / BMM Submission',             status: 'NOT STARTED',color: '#f87171' },
              ].map(({ item, status, color }) => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 12px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ color: '#c4b896', fontSize: 11 }}>{item}</span>
                  <span style={{ color, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>{status}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 22px',
          borderTop: '1px solid rgba(202,138,4,0.2)',
          display: 'flex', justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
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

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        color: '#facc15', fontSize: 11, fontWeight: 900,
        letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(202,138,4,0.2)', margin: '18px 0' }} />;
}

function ToolRow({ icon, title, desc, badge, badgeColor, comingSoon }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(197,160,89,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ color: '#e2d9a0', fontSize: 12, fontWeight: 700 }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {badge && (
            <span style={{
              background: `${badgeColor}22`, border: `1px solid ${badgeColor}66`,
              color: badgeColor, fontSize: 9, fontWeight: 800,
              padding: '2px 7px', borderRadius: 99, letterSpacing: '0.06em',
            }}>{badge}</span>
          )}
          {comingSoon && (
            <span style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#888', fontSize: 9, fontWeight: 700,
              padding: '2px 7px', borderRadius: 99, letterSpacing: '0.06em',
            }}>COMING SOON</span>
          )}
        </div>
      </div>
      <div style={{ color: '#7a8a9a', fontSize: 10, lineHeight: 1.6, paddingLeft: 24 }}>
        {desc}
      </div>
    </div>
  );
}

const bodyText = { color: '#c4b896', fontSize: 11, lineHeight: 1.7, margin: 0 };
const configBox = {
  padding: '10px 12px', borderRadius: 8,
  background: 'rgba(255,215,0,0.04)',
  border: '1px solid rgba(197,160,89,0.3)',
};

// ── Main ToolBar Component ────────────────────────────────────────────────────
export default function ToolBar() {
  const [open, setOpen] = useState(false);
  const [showCertTest, setShowCertTest] = useState(false);
  const ref = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      {/* ── Toolbar trigger + menu container ─────────────────────────────── */}
      <div
        ref={ref}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        {/* Trigger button — wrench icon, same height as Fold/Clear buttons */}
        <button
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

        {/* ── Upward-scrolling menu ─────────────────────────────────────── */}
        {open && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: 0,
              minWidth: 200,
              background: 'linear-gradient(160deg, #1a0f00 0%, #0a0600 100%)',
              border: '1px solid rgba(202,138,4,0.6)',
              borderRadius: 10,
              padding: '8px',
              display: 'flex', flexDirection: 'column', gap: 6,
              boxShadow: '0 -8px 32px rgba(0,0,0,0.9)',
              zIndex: 500,
              animation: 'rf-menu-slide-up 0.18s ease-out',
            }}
          >
            {/* Menu header label */}
            <div style={{
              color: 'rgba(229,193,88,0.6)', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '2px 6px 6px',
              borderBottom: '1px solid rgba(202,138,4,0.2)',
              marginBottom: 2,
            }}>
              OPERATOR TOOLS
            </div>

            {/* ── Tool buttons — add more here as tools are built ── */}
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

            {/* Placeholder for future tools */}
            <div style={{
              color: 'rgba(197,160,89,0.3)', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.08em', textAlign: 'center',
              padding: '4px 0 2px',
            }}>
              MORE TOOLS COMING
            </div>
          </div>
        )}
      </div>

      {/* ── Certification Test Modal ──────────────────────────────────────── */}
      {showCertTest && (
        <CertificationTestModal onClose={() => setShowCertTest(false)} />
      )}
    </>
  );
}
