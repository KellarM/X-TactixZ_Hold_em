import React, { useState, useRef, useLayoutEffect } from 'react';
import CardBoard from './CardBoard';
import RightSidebar from './RightSidebar';
import Chip from './Chip';
import ResultOverlay from './ResultOverlay';
import BonusSequence from './BonusSequence';
import RevealPrompt from './RevealPrompt';
import SettingsModal from './SettingsModal';
import HowToPlayModal from './HowToPlayModal';
import GameRulesModal from './GameRulesModal';
import OnboardingIndicator from './OnboardingIndicator';
import PlayingCard from './PlayingCard';
import { MOBILE_CHIPS } from '@/lib/game/useGame';
import { formatMoney } from '@/lib/game/cards';
import { Settings } from 'lucide-react';

const LOGO_BADGE_URL = 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/7a23486be_xtactixz_template_badge.png';

// ── Scale-to-fit wrapper ─────────────────────────────────────────────────────
// Renders `children` at their NATURAL (desktop-tested) pixel size inside an
// off-screen-sized box, then uniformly shrinks the whole box with a CSS
// transform so it always fits the actual space available — width AND height —
// without ever needing to touch the internals of the wrapped component.
function ScaleToFit({ naturalWidth, naturalHeight, children }) {
  const outerRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      const s = Math.min(w / naturalWidth, h / naturalHeight, 1);
      if (s > 0 && isFinite(s)) setScale(s);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [naturalWidth, naturalHeight]);

  return (
    <div
      ref={outerRef}
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{
        width: naturalWidth, height: naturalHeight,
        transform: `scale(${scale})`, transformOrigin: 'center center',
        flexShrink: 0,
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Self-sizing scale wrapper (width-driven) ────────────────────────────────
// Unlike ScaleToFit above (which centers content inside an INDEPENDENTLY
// sized box — used where we WANT padding, e.g. the community card row),
// this variant measures only the available WIDTH, computes the scale, and
// sets its OWN height to exactly naturalHeight*scale. There is no separate
// guessed box size to mismatch against, so it is IMPOSSIBLE for this to
// leave extra empty space — the box is always exactly as tall as its
// scaled content, nothing more.
function ScaleToFitWidth({ naturalWidth, naturalHeight, children }) {
  const outerRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      if (w === 0) return;
      const s = Math.min(w / naturalWidth, 1);
      if (s > 0 && isFinite(s)) setScale(s);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [naturalWidth]);

  return (
    <div ref={outerRef} style={{ width: '100%', height: naturalHeight * scale, overflow: 'hidden' }}>
      <div style={{
        width: naturalWidth, height: naturalHeight,
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function MobileGameLayout({
  game, phase, actions, sounds,
  bonusPulse, setBonusPulse,
  bonusActive, setBonusActive,
  awaitingReveal, setAwaitingReveal,
  showResult, setShowResult,
  playerStats, setPlayerStats,
  boardTheme, setBoardTheme,
  showSettings, setShowSettings,
  showHowToPlay, setShowHowToPlay,
  showGameRules, setShowGameRules,
  dealLabel, subLabel, canDeal,
  handlePlaceBet, handleRemoveBet, handleDeal, handleRevealClick,
  handleBonusPulse, handleBonusLand, handleBonusComplete,
  onFold, onClearBets, onNewHand,
}) {
  // Natural size of 5 community cards (70x100 each, fixed) + gaps
  const COMM_NATURAL_W = 70 * 5 + 4 * 4; // 366
  const COMM_NATURAL_H = 100;

  // Natural size of the compact CardBoard: 5 cols x 2 rows of 'sm' cards
  // (62x88 each, 2 per slot) + odds/rank label rows + gaps/padding/border.
  const BOARD_NATURAL_W = 700;
  const BOARD_NATURAL_H = 320;

  return (
    <div
      className={'velvet-board theme-' + boardTheme}
      style={{
        color: '#FFFFFF',
        width: '100dvw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Dealer status message bar ── */}
      <div style={{
        flexShrink: 0, height: 12, display: 'flex', alignItems: 'center',
        padding: '0 6px', overflow: 'hidden', whiteSpace: 'nowrap',
        // Transparent — lets the velvet-board's own radial gradient show
        // through, which IS the brighter blue Michael pointed to between
        // the gold-bordered panels. A flat hex can only match one exact
        // point on that gradient; transparency matches everywhere, exactly.
        background: 'transparent',
        borderBottom: '1px solid rgba(202,138,4,0.3)',
      }}>
        <span style={{
          fontFamily: 'Oswald, sans-serif', fontSize: '0.5rem', fontWeight: 700,
          fontStyle: 'italic', color: '#f6d860',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {game.statusMessage || ''}
        </span>
      </div>

      {/* ── Community cards row — expanded box, cards stay their original size ──
          Outer box is now taller (per Michael's yellow-box spec). The card
          SCALING box below is still fixed at the ORIGINAL 58px height, so
          ScaleToFit computes the exact same scale as before — cards render
          at their previous size, not bigger. Centering that fixed-size box
          inside the taller outer row (alignItems:center) is what produces
          the even top/bottom padding around the cards. ── */}
      <div style={{
        flexShrink: 0, height: 62, display: 'flex', alignItems: 'center',
        gap: 4, padding: '0 4px',
        background: 'transparent',
        borderBottom: '1px solid rgba(202,138,4,0.4)',
      }}>
        <img src={LOGO_BADGE_URL} alt=""
          style={{ width: 14, height: 'auto', borderRadius: 2, flexShrink: 0, opacity: 0.7 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div style={{ flex: 1, height: 52, minWidth: 0 }}>
          <ScaleToFit naturalWidth={COMM_NATURAL_W} naturalHeight={COMM_NATURAL_H}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <React.Fragment key={i}>
                  {game.community[i] ? (
                    <PlayingCard card={game.community[i]} size="community" useImage={false} />
                  ) : (
                    <PlayingCard faceDown size="community" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </ScaleToFit>
        </div>
        <img src={LOGO_BADGE_URL} alt=""
          style={{ width: 14, height: 'auto', borderRadius: 2, flexShrink: 0, opacity: 0.7 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Reveal prompt */}
      {awaitingReveal && <RevealPrompt onReveal={handleRevealClick} />}

      {/* ── Card Board — real desktop component, self-sized to its content ──
          ScaleToFitWidth measures width, computes scale, and sets ITS OWN
          height to exactly naturalHeight*scale — no guessed aspect-ratio
          box to mismatch against, so there is no possible leftover gap
          between this and the dealer area above it. ── */}
      <div style={{ flexShrink: 0, width: '100%', padding: '0 4px' }}>
        <ScaleToFitWidth naturalWidth={BOARD_NATURAL_W} naturalHeight={BOARD_NATURAL_H}>
          <CardBoard
            odds={game.flopOdds}
            bets={game.bets}
            caps={game.caps}
            phase={phase}
            onPlace={handlePlaceBet}
            onRemove={handleRemoveBet}
            handEvals={game.handEvals}
            leadingHandIds={game.leadingHandIds}
            winnerHandIds={game.winnerHandIds}
            bonusPulse={bonusPulse}
            compact={true}
          />
        </ScaleToFitWidth>
      </div>

      {/* ── Right Sidebar — Rank + Color + River stacked ──
          Now the flexible element: CardBoard above is a fixed aspect-ratio
          box, so RightSidebar naturally absorbs whatever height is left. ── */}
      <div style={{ flex: '1 1 0', minHeight: 0, padding: '4px 4px 0 4px', overflow: 'hidden' }}>
        <RightSidebar
          phase={phase}
          flopOdds={game.flopOdds}
          riverOdds={game.riverOdds}
          bets={game.bets}
          caps={game.caps}
          boardTotals={game.boardTotals}
          ante={game.ante}
          onPlace={handlePlaceBet}
          onRemove={handleRemoveBet}
          leadingRankLabel={game.leadingRankLabel}
          winnerRankLabel={game.winnerRankLabel}
          leadingColorKeys={game.leadingColorKeys}
          winnerColorKeys={game.winnerColorKeys}
          leadingRiverSide={game.leadingRiverSide}
          winnerRiverSide={game.winnerRiverSide}
          bonusPulse={bonusPulse}
          mobileLayout={true}
        />
      </div>

      {/* ── Footer (Player Area) — 2-row grid ──
          Row 1: Chips | Ante | CLR | spacer | Deal | spacer | FOLD | Gear
          Row 2:  —    |  —  | Bet |  —    |  —   |  —    | Bank |  —
          Bet sits directly under CLR, Bank sits directly under FOLD.
          Grid columns: auto auto auto 1fr auto 1fr auto auto */}
      <div style={{
        flexShrink: 0,
        display: 'grid',
        gridTemplateColumns: 'auto auto auto 1fr auto 1fr auto auto',
        gridTemplateRows: 'auto auto',
        columnGap: 3,
        rowGap: 0,
        padding: '3px 5px',
        borderTop: '1px solid rgba(202,138,4,0.3)',
        background: 'rgba(0,0,0,0.65)',
      }}>
        {/* ═══ ROW 1 ═══ */}

        {/* Chips — 2 rows of 3: top = .50/$1/$5, bottom = .01/.10/.25 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', gridRow: 1, gridColumn: 1 }}>
          <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {MOBILE_CHIPS.slice(3).map(chip => {
              const active = game.selectedChip === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => {
                    if (phase === 'ante') { sounds.playChipPlace(); actions.addToAnte(chip.value); }
                    else { actions.setSelectedChip(chip.value); }
                  }}
                  style={{
                    lineHeight: 0, border: 'none', background: 'transparent', padding: 0,
                    cursor: 'pointer', flexShrink: 0,
                    transform: active ? 'scale(1.15) translateY(-1px)' : 'scale(1)',
                    filter: active ? 'drop-shadow(0 0 3px rgba(251,191,36,0.9))' : 'none',
                    opacity: active ? 1 : 0.55, transition: 'all 0.15s',
                  }}
                >
                  <Chip amount={chip.value} scale={0.52} />
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {MOBILE_CHIPS.slice(0, 3).map(chip => {
              const active = game.selectedChip === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => {
                    if (phase === 'ante') { sounds.playChipPlace(); actions.addToAnte(chip.value); }
                    else { actions.setSelectedChip(chip.value); }
                  }}
                  style={{
                    lineHeight: 0, border: 'none', background: 'transparent', padding: 0,
                    cursor: 'pointer', flexShrink: 0,
                    transform: active ? 'scale(1.15) translateY(-1px)' : 'scale(1)',
                    filter: active ? 'drop-shadow(0 0 3px rgba(251,191,36,0.9))' : 'none',
                    opacity: active ? 1 : 0.55, transition: 'all 0.15s',
                  }}
                >
                  <Chip amount={chip.value} scale={0.52} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Ante circle */}
        <div
          onClick={phase === 'ante' && game.ante > 0 ? actions.clearAnte : undefined}
          style={{
            cursor: phase === 'ante' && game.ante > 0 ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, width: 38.5, height: 38.5, borderRadius: '50%',
            border: game.ante > 0 ? '2.75px solid #FFD700' : '2.75px solid #C5A059',
            background: game.ante > 0
              ? 'radial-gradient(circle, rgba(255,215,0,0.08) 60%, rgba(0,0,0,0.5) 100%)'
              : 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%)',
            boxShadow: game.ante > 0 ? '0 0 6px 2px rgba(255,215,0,0.7)' : 'none',
            animation: game.ante > 0 ? 'rf-ante-glow 1.6s ease-in-out infinite' : 'none',
            gridRow: 1, gridColumn: 2, alignSelf: 'center',
          }}
        >
          {game.ante > 0 ? (
            <Chip amount={game.ante} scale={0.33} />
          ) : (
            <span style={{ color: '#000', fontSize: 7.5, fontWeight: 900, letterSpacing: '0.3px' }}>ANTE</span>
          )}
        </div>

        {/* CLR button — Row 1, column 3 (Bet sits below it in Row 2) */}
        <div style={{ gridRow: 1, gridColumn: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 16, paddingBottom: 2 }}>
          {(phase === 'postflop' || phase === 'postturn') && game.totalWagered > 0 && (
            <button onClick={onClearBets}
              style={{ padding: '2px 6px', borderRadius: 3,
                border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(127,29,29,0.4)',
                color: '#fca5a5', fontSize: 7, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap' }}>CLR</button>
          )}
        </div>

        {/* Deal button — Row 1, column 5 (spans both spacers) */}
        <button
          onClick={handleDeal}
          disabled={!canDeal}
          style={{
            width: 70, height: 46,
            padding: 0,
            borderRadius: 6,
            border: '2.0625px solid #4ade80',
            background: canDeal ? '#15803d' : '#0a3a1a',
            color: '#fff', fontWeight: 900, fontSize: '0.72rem',
            cursor: canDeal ? 'pointer' : 'default',
            letterSpacing: '0.04em', opacity: canDeal ? 1 : 0.4,
            whiteSpace: 'normal',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1.1,
            textAlign: 'center',
            gridRow: 1, gridColumn: 5, alignSelf: 'center',
          }}
        >
          <span style={{ width: '100%', whiteSpace: 'normal', textAlign: 'center' }}>{dealLabel}</span>
        </button>

        {/* FOLD button — Row 1, column 7 (Bank sits below it in Row 2) */}
        <div style={{ gridRow: 1, gridColumn: 7, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 16, paddingBottom: 2 }}>
          {(phase === 'postflop' || phase === 'postturn') && (
            <button onClick={onFold}
              style={{ padding: '2px 6px', borderRadius: 3,
                border: '1px solid #C5A059', background: 'rgba(127,29,29,0.4)',
                color: '#FF6B6B', fontSize: 7, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap' }}>FOLD</button>
          )}
        </div>

        {/* Gear */}
        <button onClick={() => setShowSettings(true)}
          style={{
            width: 30.25, height: 30.25, borderRadius: 6,
            border: '1px solid rgba(234,179,8,0.5)', background: 'rgba(0,0,0,0.5)',
            color: '#fde047', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            gridRow: 1, gridColumn: 8, alignSelf: 'center',
          }}
        >
          <Settings size={16.5} />
        </button>

        {/* ═══ ROW 2 — Bet & Bank displays only ═══ */}

        {/* Bet display — Row 2, column 3 (directly under CLR) */}
        <div style={{
          gridRow: 2, gridColumn: 3, justifySelf: 'center',
          padding: '1.25px 5px', borderRadius: 5,
          border: '1px solid rgba(234,179,8,0.4)', background: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.48rem', color: '#a8956a', fontWeight: 700, letterSpacing: '0.04em' }}>BET</span>
          <span style={{ fontSize: '0.69rem', color: '#FFD700', fontWeight: 900 }}>{formatMoney(game.totalWagered)}</span>
        </div>

        {/* Bank display — Row 2, column 7 (directly under FOLD) */}
        <div style={{
          gridRow: 2, gridColumn: 7, justifySelf: 'center',
          padding: '1.375px 5.5px', borderRadius: 5,
          border: '2.0625px solid #eab308', background: '#000',
        }}>
          <span style={{ fontSize: '0.69rem', fontWeight: 900, color: '#FFD700', textShadow: '0 0 4px rgba(251,191,36,0.7)' }}>
            {formatMoney(game.bank)}
          </span>
        </div>
      </div>

      {/* ── Overlays & Modals ── */}
      {bonusActive && game.bonus && (
        <BonusSequence
          cardIdx={game.bonus.cardIdx}
          rankIdx={game.bonus.rankIdx}
          colorRiverIdx={game.bonus.colorRiverIdx}
          onPulse={handleBonusPulse}
          onLand={handleBonusLand}
          onComplete={handleBonusComplete}
          soundEnabled={sounds.isSoundEnabled()}
        />
      )}

      {showResult && game.result && (
        <ResultOverlay result={game.result} ante={game.ante} bonus={game.bonus} onClose={actions.newHand} />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        playerStats={playerStats}
        boardTheme={boardTheme}
        setBoardTheme={setBoardTheme}
        onHowToPlay={() => { setShowSettings(false); setShowHowToPlay(true); }}
        onGameRules={() => { setShowSettings(false); setShowGameRules(true); }}
        onResetBank={() => { actions.resetBank(); setPlayerStats({ totalBets: 0, totalWins: 0, roundsPlayed: 0, roundsWon: 0, highestMultiplier: 0, highestBalance: null, lowestBalance: null }); }}
      />
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <GameRulesModal isOpen={showGameRules} onClose={() => setShowGameRules(false)} />
      <OnboardingIndicator />
    </div>
  );
}
