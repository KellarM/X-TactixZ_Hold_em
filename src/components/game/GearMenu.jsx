import { useState, useRef, useEffect } from 'react';

// ■■■ Post-Flop Game Rules Modal ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
function GameRulesModal({ onClose }) {
  const sections = [
    {
      title: '1. OVERVIEW',
      body: `Rapid Fire Texas Hold'em — Post-Flop Edition is a fast-paced electronic casino game combining Texas Hold'em hand rankings with multi-position live betting. After the Flop is dealt, four boards open simultaneously: Card Hand, Hand Ranking, Color, and River. Each board has independent odds and caps based on real post-flop probabilities.`,
    },
    {
      title: '2. THE DECK',
      body: `The game uses a 52-card deck with 10 fixed player hands pre-removed, leaving a 32-card community stock. The 10 player hands are the game's betting positions. Five community cards are dealt face-down at the start of each round and revealed one phase at a time.`,
    },
    {
      title: '3. HOW TO START — THE ANTE',
      body: `Before any cards are dealt, you must place an Ante. Your Ante is your entry into the round — it unlocks all four betting boards and sets the maximum bet cap for each. You can win it back plus a bonus based on how many boards you qualify on. Once the Ante is placed, press DEAL to receive the Flop.`,
    },
    {
      title: '4. POST-FLOP BETTING — PHASE 2',
      body: `After the Flop is dealt, three boards open for betting:\n\n• CARD HAND BOARD: Bet on any of the 10 player hands. The odds shown reflect each hand's real probability of winning after the Flop.\n• HAND RANKING BOARD: Bet on the rank category (Pair, Two Pair, Straight, Flush, etc.) of the winning hand.\n• COLOR BOARD: Bet on how many red or black cards appear in the final 5-card community board (3, 4, or 5 of a colour).\n\nEach board cap = 1× Ante. Positions with 0% probability are locked and cannot be bet.`,
    },
    {
      title: '5. THE TURN — DEAL & RIVER PHASE',
      body: `Once you have placed your post-flop bets, click DEAL TURN. The Turn card is revealed and all Card Hand, Rank, and Color bets are permanently frozen. The River board then opens:\n\n• RIVER — LOW / HIGH: Bet on whether the River card rank will be LOW (2–7) or HIGH (8–A).\n\nRiver board cap = sum of all Card + Rank + Color bets placed. Press DEAL RIVER to complete the hand.`,
    },
    {
      title: '6. BET CAPS SUMMARY',
      body: `• Card Hand Board: max = 1× Ante\n• Hand Ranking Board: max = 1× Ante\n• Color Board: max = 1× Ante\n• River Board: max = sum of above three boards combined\n\nYou may spread bets across multiple positions on each board as long as the total for that board does not exceed its cap.`,
    },
    {
      title: '7. RESOLUTION',
      body: `After the River card is dealt, all boards resolve simultaneously:\n\n• CARD HAND: The hand that forms the best 5-card combination using its 2 hole cards + all 5 community cards wins. All bets on that hand pay at the posted odds.\n• HAND RANKING: Bets on the correct rank category of the winning hand pay at the posted odds.\n• COLOR BOARD: The position matching the exact count of red or black community cards pays.\n• RIVER: Bets on the correct LOW (2–7) or HIGH (8–A) range of the River card pay at the posted odds.`,
    },
    {
      title: '8. LOCKED POSITIONS',
      body: `Positions are locked for two reasons:\n\n• DEAD (0% probability): Mathematically impossible given the Flop. Cannot win.\n• DOMINANT (100% probability): The outcome is already guaranteed. Locked to prevent trivial bets with no risk.\n\nLocked positions cannot be bet on and display as greyed out.`,
    },
    {
      title: '9. FOLD',
      body: `At any point during the post-flop or river betting phase, you may click FOLD to abandon the round. All bets placed after the Ante are refunded to your bank. The Ante is forfeited. Use FOLD to cut your losses if the board odds turn unfavourable.`,
    },
    {
      title: '10. RTP & FAIRNESS',
      body: `Rapid Fire Texas Hold'em — Post-Flop Edition uses a certified RNG shuffle (Fisher-Yates CSPRNG) with burn cards at deck positions 0–4. Odds are computed by complete enumeration of all remaining card combinations after the Flop (406 possible Turn+River pairs). The game is designed for entertainment purposes.`,
    },
  ];

  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #1a0f00 0%, #0a0600 100%)',
        border: '2px solid rgba(202,138,4,0.6)',
        borderRadius: 16, width: 560, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 12px 60px rgba(0,0,0,0.9)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(202,138,4,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#facc15', letterSpacing: '0.1em' }}>
            GAME RULES — POST-FLOP EDITION
          </span>
          <button onClick={onClose} style={{ color: '#facc15', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>
        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '12px 20px', flex: 1 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(202,138,4,0.15)', marginBottom: 4 }}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '10px 0', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: '#e2d9a0', fontWeight: 700, fontSize: 13,
                }}
              >
                <span>{s.title}</span>
                <span style={{ color: '#facc15', fontSize: 16 }}>{openIdx === i ? '▲' : '▼'}</span>
              </button>
              {openIdx === i && (
                <div style={{
                  paddingBottom: 12, color: '#c4b896', fontSize: 12, lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                }}>
                  {s.body}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ■■■ Inline Volume Control ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
function VolumeControlInline({ soundManager }) {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [showSlider, setShowSlider] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (soundManager) soundManager.setAmbientVolume(muted ? 0 : volume);
  }, [muted, volume, soundManager]);

  useEffect(() => {
    if (!showSlider) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowSlider(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSlider]);

  const iconStyle = { width: 16, height: 16 };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {showSlider && (
        <div style={{
          position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.92)', border: '1px solid rgba(202,138,4,0.4)',
          borderRadius: 10, padding: '10px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 300,
        }}>
          <span style={{ color: 'rgba(250,204,21,0.7)', fontSize: 10, fontWeight: 700 }}>
            {Math.round(volume * 100)}%
          </span>
          <input
            type="range" min="0" max="1" step="0.05" value={volume}
            onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
            style={{
              writingMode: 'vertical-lr', direction: 'rtl',
              height: 72, width: 16, cursor: 'pointer', accentColor: '#eab308',
            }}
          />
        </div>
      )}
      <button
        onClick={() => setMuted(m => !m)}
        onContextMenu={e => { e.preventDefault(); setShowSlider(s => !s); }}
        title="Left-click: mute/unmute | Right-click: volume slider"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          border: '1px solid rgba(202,138,4,0.4)', background: 'rgba(0,0,0,0.4)',
          color: '#facc15', cursor: 'pointer',
        }}
      >
        {muted || volume === 0
          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        }
      </button>
    </div>
  );
}

// ■■■ Main GearMenu ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
export default function GearMenu({ soundManager, onResetBank }) {
  const [open, setOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const actionBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px 14px', cursor: 'pointer', fontSize: 13,
    color: '#e2d9a0', fontWeight: 700, borderRadius: 8,
    border: '1px solid rgba(202,138,4,0.4)',
    background: 'rgba(60,35,0,0.5)', width: '100%',
    transition: 'background 0.15s',
  };

  return (
    <>
      <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
        {/* Gear button */}
        <button
          onClick={() => setOpen(o => !o)}
          title="Settings"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
            border: open ? '1px solid rgba(234,179,8,0.8)' : '1px solid rgba(202,138,4,0.4)',
            background: open ? 'rgba(120,70,0,0.45)' : 'rgba(0,0,0,0.45)',
            color: '#facc15', fontSize: 18, lineHeight: 1,
            transition: 'all 0.15s',
          }}
        >
          ⚙
        </button>

        {open && (
          <div style={{
            position: 'absolute', bottom: 42, right: 0,
            background: 'linear-gradient(160deg, #1a0f00 0%, #0f0800 100%)',
            border: '2px solid rgba(202,138,4,0.5)',
            borderRadius: 14, width: 220,
            boxShadow: '0 8px 40px rgba(0,0,0,0.85)', zIndex: 200,
            padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {/* Title */}
            <div style={{ paddingBottom: 6, borderBottom: '1px solid rgba(202,138,4,0.25)' }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#facc15', letterSpacing: '0.1em' }}>
                SETTINGS
              </span>
            </div>

            {/* Sound / Volume */}
            {soundManager && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid rgba(202,138,4,0.15)', paddingBottom: 8,
              }}>
                <span style={{ fontSize: 13, color: '#e2d9a0', fontWeight: 600 }}>Sound</span>
                <div style={{ marginLeft: 'auto' }}>
                  <VolumeControlInline soundManager={soundManager} />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                style={actionBtnStyle}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,45,0,0.6)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(60,35,0,0.5)'}
                onClick={() => { onResetBank && onResetBank(); setOpen(false); }}
              >
                🔄 Reset Bank
              </button>
              <button
                style={actionBtnStyle}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,45,0,0.6)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(60,35,0,0.5)'}
                onClick={() => { setShowRules(true); setOpen(false); }}
              >
                📖 Game Rules
              </button>
            </div>
          </div>
        )}
      </div>
      {showRules && <GameRulesModal onClose={() => setShowRules(false)} />}
    </>
  );
}