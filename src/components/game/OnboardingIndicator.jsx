import { useState, useEffect } from 'react';

/**
 * OnboardingIndicator
 * Shows a pulsing gold highlight + tooltip bubble pointing at the gear button
 * every time the game is loaded or refreshed.
 * Dismissed by clicking anywhere on the screen.
 * Does NOT reappear on "next game" transitions within the same session —
 * only on a fresh page load.
 *
 * The indicator wraps around the gear button — pass the gear button as children.
 */
export default function OnboardingIndicator({ children }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show on every page load, after a short delay so the page fully renders
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;

    function dismiss() {
      setVisible(false);
    }

    // Dismiss on ANY click anywhere
    document.addEventListener('click', dismiss, { once: true, capture: true });
    // Also dismiss on touch (mobile)
    document.addEventListener('touchstart', dismiss, { once: true, capture: true });

    return () => {
      document.removeEventListener('click', dismiss, { capture: true });
      document.removeEventListener('touchstart', dismiss, { capture: true });
    };
  }, [visible]);

  if (!visible) return children;

  return (
    <>
      {/* Transparent full-screen overlay — captures the dismiss click */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.55)',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Pulsing ring around the gear button area */}
      <div style={{ position: 'relative', zIndex: 9999 }}>
        {children}

        {/* Pulsing highlight ring around gear button */}
        <div
          style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: 14,
            border: '3px solid #facc15',
            pointerEvents: 'none',
            animation: 'rf-onboard-pulse 1.5s ease-in-out infinite',
            zIndex: 9999,
          }}
        />

        {/* Tooltip bubble — appears above the gear button */}
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 16px)',
            right: 0,
            background: 'linear-gradient(160deg, #1a0f00 0%, #0f0800 100%)',
            border: '2px solid #facc15',
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: '0 0 24px rgba(250,204,21,0.4), 0 8px 32px rgba(0,0,0,0.9)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10000,
            animation: 'rf-onboard-slide 0.4s ease-out',
          }}
        >
          {/* Arrow pointing down at the gear button */}
          <div
            style={{
              position: 'absolute',
              bottom: -10,
              right: 10,
              width: 0, height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '10px solid #facc15',
            }}
          />
          <div style={{
            color: '#facc15',
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: '0.05em',
            marginBottom: 4,
          }}>
            👋 NEW HERE?
          </div>
          <div style={{
            color: '#e2d9a0',
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.5,
          }}>
            Tap the ⚙ gear for Game Rules,<br />How to Play, Tutorials & Volume Control
          </div>
          <div style={{
            color: 'rgba(250,204,21,0.5)',
            fontSize: 10,
            fontWeight: 600,
            marginTop: 8,
            fontStyle: 'italic',
          }}>
            Click anywhere to dismiss
          </div>
        </div>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes rf-onboard-pulse {
          0%, 100% {
            box-shadow: 0 0 8px 2px rgba(250,204,21,0.5);
            opacity: 1;
          }
          50% {
            box-shadow: 0 0 24px 8px rgba(250,204,21,0.9);
            opacity: 0.85;
          }
        }
        @keyframes rf-onboard-slide {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
