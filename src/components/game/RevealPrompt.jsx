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
      {/* Full-screen click catcher — "click ANYWHERE" per spec. position:fixed
          removes this from normal flex flow, so it renders full-viewport
          regardless of where this component is mounted in the tree. */}
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

      {/* Visible banner — sits in-flow exactly where this component is
          rendered (between the community-card box and the Card Board). */}
      <div
        onClick={onReveal}
        style={{
          position: 'relative',
          zIndex: 501,
          flexShrink: 0,
          height: 46,
          minHeight: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0.5rem',
          border: '2px solid #FFD700',
          background: 'linear-gradient(90deg, rgba(90,58,0,0.6) 0%, rgba(130,75,0,0.6) 50%, rgba(90,58,0,0.6) 100%)',
          animation: 'rf-reveal-border-glow 1.4s ease-in-out infinite',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '1.15rem',
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
