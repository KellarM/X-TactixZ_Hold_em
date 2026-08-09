import React, { useState, useCallback } from 'react';
import PlayingCard from './PlayingCard';
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
import PreviousHands from './PreviousHands';
import { formatMoney } from '@/lib/game/cards';
import { CHIPS } from '@/lib/game/useGame';
import { Settings, RotateCcw } from 'lucide-react';

const LOGO_BADGE_URL = 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/7a23486be_xtactixz_template_badge.png';

// Community card constants (scaled down from desktop 70×100)
const CARD_W = 48;
const CARD_H = 68;
const GAP = 6;
const GROUP_GAP = 12;
const LABEL_H = 14;

function MiniCardSlot({ card, faceDown }) {
  if (!card || faceDown) {
    return (
      <div style={{ width: CARD_W, height: CARD_H, flexShrink: 0 }}>
        <PlayingCard faceDown size="community" />
      </div>
    );
  }
  return (
    <div style={{ width: CARD_W, height: CARD_H, flexShrink: 0 }}>
      <PlayingCard card={card} size="community" useImage={false} />
    </div>
  );
}

function MiniCardGroup({ cards, indices, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: GAP }}>
        {indices.map((i) => (
          <MiniCardSlot key={i} card={cards[i]} faceDown={!cards[i]} />
        ))}
      </div>
      <div style={{
        height: LABEL_H,
        marginTop: 2,
        fontSize: '0.5rem',
        fontWeight: 700,
        fontFamily: 'Oswald, sans-serif',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#e8b84b',
        textShadow: '0 0 2px #000, 1px 1px 2px #000',
        userSelect: 'none',
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Mobile-optimized community cards row ───────────────────────────────────
function MobileCommunityCards({ community, statusMessage }) {
  const cards = community;
  return (
    <>
      {/* Dealer message bar — 24px fixed */}
      <div style={{
        height: 24, minHeight: 24, maxHeight: 24,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '0.4rem',
        border: '1px solid rgba(202,138,4,0.4)',
        background: 'linear-gradient(90deg, rgba(78,47,0,0.5) 0%, rgba(83,37,0,0.5) 100%)',
        overflow: 'hidden', whiteSpace: 'nowrap',
        margin: '4px 4px 0 4px',
        padding: '0 6px',
      }}>
        <span style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '0.7rem',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#f6d860',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {statusMessage || ''}
        </span>
      </div>

      {/* Community cards — 90px fixed, badges flanking at 28px */}
      <div style={{
        height: 90, minHeight: 90, maxHeight: 90,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem',
        borderRadius: '0.6rem',
        border: '1.5px solid #C5A059',
        background: 'rgba(0,0,0,0.35)',
        margin: '4px 4px 0 4px',
        padding: '2px 4px',
        boxSizing: 'border-box',
        overflow: 'visible',
      }}>
        {/* Left badge — mirrors right badge centering */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={LOGO_BADGE_URL}
            alt="X-TactixZ Hold'em"
            style={{ width: 28, height: 'auto', display: 'block', borderRadius: 4, opacity: 0.92, flexShrink: 0 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: GROUP_GAP, flexShrink: 0 }}>
          <MiniCardGroup cards={cards} indices={[0, 1, 2]} label="Flop" />
          <MiniCardGroup cards={cards} indices={[3]} label="Turn" />
          <MiniCardGroup cards={cards} indices={[4]} label="River" />
        </div>

        {/* Right badge */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={LOGO_BADGE_URL}
            alt="X-TactixZ Hold'em"
            style={{ width: 28, height: 'auto', display: 'block', borderRadius: 4, opacity: 0.92, flexShrink: 0 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>
    </>
  );
}

// ── Mobile footer — compact chip rail, ante, deal, bank, gear ───────────────
function MobileFooter({
  bank, ante, totalWagered, selectedChip,
  phase, canDeal, dealLabel, subLabel,
  onChipSelect, onClearAnte, onClearBets, onDeal, onNewHand,
  onSettings, anteStructureId,
}) {
  const showActions = phase === 'postflop' || phase === 'postturn';
  const showClearBets = showActions && totalWagered > 0;
  const showNewHand = phase === 'resolved';

  return (
    <div style={{
      flexShrink: 0,
      width: '100%',
      background: 'var(--theme-bg, #050d21)',
      borderTop: '2px solid #C5A059',
      padding: '4px 6px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      boxSizing: 'border-box',
      overflow: 'visible',
    }}>
      {/* Sub-label */}
      {subLabel && (
        <div style={{
          textAlign: 'center',
          fontSize: '0.5rem',
          fontWeight: 700,
          color: '#e8b84b',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flexShrink: 0,
        }}>
          {subLabel}
        </div>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

        {/* Chips — compact scale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {CHIPS.map((chip, idx) => {
            const active = selectedChip === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => onChipSelect(chip.value)}
                title={chip.label}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: active ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                  filter: active
                    ? 'drop-shadow(0 0 4px rgba(255,215,0,0.9))'
                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
                  opacity: active ? 1 : 0.65,
                  transition: 'transform 0.12s ease, filter 0.12s ease',
                }}
              >
                <Chip amount={chip.value} scale={0.42} />
              </button>
            );
          })}
        </div>

        {/* Ante circle — 36px */}
        <div
          onClick={phase === 'ante' && ante > 0 ? onClearAnte : undefined}
          style={{
            cursor: phase === 'ante' && ante > 0 ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            width: 36, height: 36, borderRadius: '50%',
            border: ante > 0 ? '2px solid #FFD700' : '2px solid #C5A059',
            background: ante > 0
              ? 'radial-gradient(circle, rgba(255,215,0,0.08) 60%, rgba(0,0,0,0.5) 100%)'
              : 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
            boxShadow: ante > 0
              ? '0 0 8px 3px rgba(255,215,0,0.7)'
              : 'none',
            animation: ante > 0 ? 'rf-ante-glow 1.6s ease-in-out infinite' : 'none',
          }}
        >
          {ante > 0 ? (
            <Chip amount={ante} scale={0.32} />
          ) : (
            <span style={{
              color: '#000', fontSize: 7, fontWeight: 900,
              letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1,
            }}>ANTE</span>
          )}
        </div>

        {/* Bet Sum — compact */}
        <div style={{
          flexShrink: 0,
          padding: '2px 6px',
          borderRadius: 5,
          border: '1px solid rgba(234,179,8,0.4)',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          minWidth: 52,
        }}>
          <span style={{ fontSize: '0.4rem', color: '#a8956a', fontWeight: 700, letterSpacing: '0.05em' }}>BET SUM</span>
          <span style={{ fontSize: '0.7rem', color: '#FFD700', fontWeight: 900 }}>{formatMoney(totalWagered)}</span>
        </div>

        {/* Clear / New Hand button */}
        {showClearBets && (
          <button
            onClick={onClearBets}
            style={{
              flexShrink: 0, padding: '3px 6px', borderRadius: 4,
              border: '1px solid rgba(239,68,68,0.5)',
              background: 'rgba(127,29,29,0.4)',
              color: '#fca5a5', fontSize: '0.5rem', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            CLEAR
          </button>
        )}
        {showNewHand && (
          <button
            onClick={onNewHand}
            style={{
              flexShrink: 0, padding: '3px 8px', borderRadius: 4,
              border: '1px solid rgba(34,197,94,0.5)',
              background: 'rgba(20,83,45,0.4)',
              color: '#86efac', fontSize: '0.5rem', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            NEW HAND
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Deal button — compact */}
        <button
          onClick={onDeal}
          disabled={!canDeal}
          style={{
            flexShrink: 0,
            padding: '4px 14px',
            borderRadius: 6,
            border: '2px solid #4ade80',
            background: canDeal ? '#15803d' : '#0a3a1a',
            color: '#fff',
            fontWeight: 900,
            fontSize: '0.6rem',
            cursor: canDeal ? 'pointer' : 'default',
            letterSpacing: '0.04em',
            opacity: canDeal ? 1 : 0.4,
          }}
        >
          {dealLabel}
        </button>

        {/* Bank — compact */}
        <div style={{
          flexShrink: 0,
          padding: '2px 6px',
          borderRadius: 5,
          border: '2px solid #eab308',
          background: '#000',
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#FFD700', textShadow: '0 0 5px rgba(251,191,36,0.7)' }}>
            {formatMoney(bank)}
          </span>
        </div>

        {/* Gear button */}
        <button
          onClick={onSettings}
          title="Settings"
          style={{
            flexShrink: 0,
            width: 28, height: 28, borderRadius: '50%',
            border: '1px solid rgba(234,179,8,0.5)',
            background: 'rgba(0,0,0,0.5)',
            color: '#fde047',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Main MobileGameLayout component ──────────────────────────────────────────
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
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div
      className={`velvet-board theme-${boardTheme}`}
      style={{
        color: '#FFFFFF',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Community cards + dealer bar ── */}
      <MobileCommunityCards
        community={game.community}
        statusMessage={game.statusMessage}
      />

      {/* ── Reveal prompt ── */}
      {awaitingReveal && <RevealPrompt onReveal={handleRevealClick} />}

      {/* ── Card Board — frozen height, 2-row grid (already built into CardBoard) ── */}
      <div style={{
        flex: '0 0 auto',
        minHeight: 0,
        padding: '4px 4px 0 4px',
      }}>
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
        />
      </div>

      {/* ── Side boards — Rank (left) + Color/River (right), giving up height equally ── */}
      <div style={{
        flex: '1 1 0',
        minHeight: 0,
        display: 'flex',
        gap: 4,
        padding: '4px 4px 0 4px',
      }}>
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

      {/* ── Footer ── */}
      <MobileFooter
        bank={game.bank}
        ante={game.ante}
        totalWagered={game.totalWagered}
        selectedChip={game.selectedChip}
        phase={phase}
        canDeal={canDeal}
        dealLabel={dealLabel}
        subLabel={subLabel}
        anteStructureId={game.anteStructure}
        onChipSelect={(v) => {
          if (phase === 'ante') {
            sounds.playChipPlace();
            actions.addToAnte(v);
          } else {
            actions.setSelectedChip(v);
          }
        }}
        onClearAnte={actions.clearAnte}
        onClearBets={actions.clearBets}
        onDeal={handleDeal}
        onNewHand={actions.newHand}
        onSettings={() => setShowSettings(true)}
      />

      {/* ── History full-screen modal ── */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.96)', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderBottom: '1px solid rgba(234,179,8,0.3)',
            background: 'rgba(20,8,0,0.98)', flexShrink: 0,
          }}>
            <span style={{ color: '#fde047', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>📜 Hand History</span>
            <button onClick={() => setShowHistory(false)}
              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(234,179,8,0.5)',
                background: 'rgba(234,179,8,0.15)', color: '#fde047', fontSize: 14, fontWeight: 900,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '8px', overflowY: 'auto' }}>
            <PreviousHands history={game.history} />
          </div>
        </div>
      )}

      {/* ── RNG Bonus sequence ── */}
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
