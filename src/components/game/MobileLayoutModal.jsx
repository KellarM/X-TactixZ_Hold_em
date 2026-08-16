import { Smartphone } from 'lucide-react';

const LAYOUTS = [
  {
    id: 'A',
    label: 'Layout A',
    description: 'Community Cards → Card Board → Rank/Color/River (Default)',
  },
  {
    id: 'B',
    label: 'Layout B',
    description: 'Rank/Color/River → Card Board → Community Cards',
  },
  {
    id: 'C',
    label: 'Layout C',
    description: 'Card Board → Community Cards → Rank/Color/River (below footer)',
  },
  {
    id: 'D',
    label: 'Layout D',
    description: 'Full-width horizontal strips: River → Color → Rank → Cards',
  },
];

export default function MobileLayoutModal({ current = 'A', onSelect, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: 'linear-gradient(160deg, #0d1f3c 0%, #071228 100%)',
        border: '2px solid #e8b84b',
        borderRadius: 16,
        boxShadow: '0 0 24px rgba(232,184,75,0.3), 0 8px 32px rgba(0,0,0,0.8)',
        padding: '24px', width: '360px', maxWidth: '90vw',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Smartphone size={20} style={{ color: '#facc15' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fde047', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
            Mobile Portrait Layout
          </h2>
        </div>

        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.5 }}>
          Select the board arrangement for mobile portrait mode. This affects all phones viewing the game.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {LAYOUTS.map(layout => {
            const active = current === layout.id;
            return (
              <button key={layout.id} onClick={() => onSelect?.(layout.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                  border: active ? '2px solid #facc15' : '1px solid rgba(202,138,4,0.3)',
                  background: active ? 'rgba(100,60,0,0.5)' : 'rgba(0,0,0,0.3)',
                  transition: 'all 0.15s',
                }}>
                <div style={{
                  flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '16px',
                  color: active ? '#fde047' : '#94a3b8',
                  border: active ? '2px solid #facc15' : '1px solid rgba(202,138,4,0.3)',
                  background: active ? 'rgba(250,204,21,0.15)' : 'rgba(0,0,0,0.4)',
                }}>
                  {layout.id}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: active ? '#fde047' : '#e2e8f0' }}>
                    {layout.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {layout.description}
                  </div>
                </div>
                {active && (
                  <div style={{ flexShrink: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#facc15', boxShadow: '0 0 8px rgba(250,204,21,0.6)' }} />
                )}
              </button>
            );
          })}
        </div>

        <button onClick={onClose}
          style={{
            marginTop: '20px', width: '100%', padding: '10px', borderRadius: '10px',
            border: '1px solid rgba(202,138,4,0.3)', background: 'rgba(0,0,0,0.3)',
            color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#facc15'; e.currentTarget.style.color = '#fde047'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(202,138,4,0.3)'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          Close
        </button>
      </div>
    </>
  );
}
