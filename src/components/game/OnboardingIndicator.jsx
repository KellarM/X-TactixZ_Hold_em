import { useState, useEffect } from 'react';

/**
 * OnboardingIndicator — Post-Flop variant
 * Renders at GameTable level (NOT wrapping gear button) using position:fixed.
 * Gear button is at bottom-right of the screen — positions calculated from there.
 * Shows on every page load after 600ms. Dismissed by clicking anywhere.
 */
export default function OnboardingIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    function dismiss() { setVisible(false); }
    document.addEventListener('click', dismiss, { once: true, capture: true });
    document.addEventListener('touchstart', dismiss, { once: true, capture: true });
    return () => {
      document.removeEventListener('click', dismiss, { capture: true });
      document.removeEventListener('touchstart', dismiss, { capture: true });
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {/* Full-screen dark overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.55)',
        pointerEvents: 'none',
      }} />



      {/* Tooltip bubble — fixed above gear button, anchored bottom-right */}
      <div style={{
        position: 'fixed',
        bottom: 64,
        right: 8,
        zIndex: 10001,
        background: 'linear-gradient(160deg, #1a0f00 0%, #0f0800 100%)',
        border: '2px solid #facc15',
        borderRadius: 12,
        padding: '14px 18px',
        boxShadow: '0 0 24px rgba(250,204,21,0.4), 0 8px 32px rgba(0,0,0,0.9)',
        pointerEvents: 'none',
        animation: 'rf-onboard-slide 0.4s ease-out',
        minWidth: 220,
      }}>
        {/* Arrow pointing down at gear */}
        <div style={{
          position: 'absolute',
          bottom: -10,
          right: 14,
          width: 0, height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '10px solid #facc15',
        }} />
        <div style={{
          color: '#facc15', fontWeight: 900,
          fontSize: 14, letterSpacing: '0.05em', marginBottom: 4,
        }}>
          👋 NEW HERE?
        </div>
        <div style={{
          color: '#e2d9a0', fontSize: 12,
          fontWeight: 600, lineHeight: 1.5,
        }}>
          Tap the ⚙ gear for Game Rules,<br />How to Play &amp; Volume Control
        </div>
        <div style={{
          color: 'rgba(250,204,21,0.5)', fontSize: 10,
          fontWeight: 600, marginTop: 8, fontStyle: 'italic',
        }}>
          Click anywhere to dismiss
        </div>
      </div>

      <style>{`
        @keyframes rf-onboard-gear-glow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(250,204,21,0.6); border-color: #facc15; }
          50%       { box-shadow: 0 0 24px 8px rgba(250,204,21,0.95); border-color: #fde047; }
        }
        @keyframes rf-onboard-slide {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .rf-onboard-gear {
          animation: rf-onboard-gear-glow 1.5s ease-in-out infinite !important;
        }
      `}</style>
    </>
  );
}
