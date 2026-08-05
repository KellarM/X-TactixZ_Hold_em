import React from 'react';

// ── Reveal Prompt ────────────────────────────────────────────────────────────
// Shown after the bonus sequence lands (or immediately, in the rare no-bonus
// safety-fallback case) INSTEAD of auto-opening the result overlay. The player
// must click anywhere on screen to open it. This gives the winning boards
// (with their gold WIN borders + bonus explode/fizzle effects) a deliberate
// moment on screen before anything covers them.

const STYLE_ID = 'rf-reveal-prompt-animations';

function injectStyles() {
  if (typeof document === 'undefined') return;
  // Always (re)write textContent instead of bailing when the tag already
  // exists — see CardBoard.jsx / RightSidebar.jsx for why.
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `
    @keyframes rf-reveal-text-pulse {
      0%, 100% { opacity: 1;    text-shadow: 0 0 10px rgba(255,215,0,0.8), 0 0 24px rgba(255,180,0,0.5); transform: scale(1); }
      50%      { opacity: 0.88; text-shadow: 0 0 18px rgba(255,235,120,1), 0 0 40px rgba(255,200,0,0.8); transform: scale(1.03); }
    }
    @keyframes rf-reveal-border-glow {
      0%, 100% { box-shadow: 0 0 14px 3px rgba(255,215,0,0.5), inset 0 0 14px rgba(255,215,0,0.15); border-color: #FFD700; }
      50%      { box-shadow: 0 0 28px 9px rgba(255,215,0,0.85), inset 0 0 28px rgba(255,215,0,0.3); border-color: #FFEA8A; }
    }
  `;
}

export default function RevealPrompt({ onReveal }) {
  React.useEffect(() => { injectStyles(); }, []);

  return (
    <>
      {/* Full-screen click catcher */}
      <div
        onClick={onReveal}
        role="button"
        aria-label="Open result window"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 500,
          cursor: 'pointer',
          background: 'transparent',
        }}
      />

      {/* Visible banner — position:fixed so it floats over the content
          WITHOUT taking up flex space or pushing the board down. Positioned
          in the gap between the community cards and the Card Board. */}
      <div
        onClick={onReveal}
        style={{
          position: 'fixed',
          top: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 501,
          height: 40,
          minHeight: 40,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0.5rem',
          border: '2px solid #FFD700',
          background: 'linear-gradient(90deg, rgba(90,58,0,0.85) 0%, rgba(130,75,0,0.85) 50%, rgba(90,58,0,0.85) 100%)',
          animation: 'rf-reveal-border-glow 1.4s ease-in-out infinite',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '1.1rem',
          fontWeight: 900,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: '#FFE566',
          animation: 'rf-reveal-text-pulse 1.4s ease-in-out infinite',
          whiteSpace: 'nowrap',
        }}>
          Click Anywhere / Open Window
        </span>
      </div>
    </>
  );
}
