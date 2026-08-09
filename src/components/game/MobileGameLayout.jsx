import React, { useState } from 'react';
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
      {/* ── Community cards bar — compact ── */}
      <div style={{
        flexShrink: 0, height: 44, maxHeight: 44, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        background: 'rgba(0,0,0,0.5)',
        borderBottom: '1px solid rgba(202,138,4,0.4)',
        padding: '0 4px',
      }}>
        <img src={LOGO_BADGE_URL} alt=""
          style={{ width: 16, height: 'auto', borderRadius: 2, flexShrink: 0, opacity: 0.7 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span style={{
          fontFamily: 'Oswald, sans-serif', fontSize: '0.55rem', fontWeight: 700,
          fontStyle: 'italic', color: '#f6d860',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 120, flexShrink: 1,
        }}>
          {game.statusMessage || ''}
        </span>
        {/* Flop */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 28, height: 38, flexShrink: 0 }}>
            {game.community[i] ? (
              <PlayingCard card={game.community[i]} size="community" useImage={false} />
            ) : (
              <PlayingCard faceDown size="community" />
            )}
          </div>
        ))}
        {/* Turn */}
        <div style={{ width: 28, height: 38, flexShrink: 0 }}>
          {game.community[3] ? (
            <PlayingCard card={game.community[3]} size="community" useImage={false} />
          ) : (
            <PlayingCard faceDown size="community" />
          )}
        </div>
        {/* River */}
        <div style={{ width: 28, height: 38, flexShrink: 0 }}>
          {game.community[4] ? (
            <PlayingCard card={game.community[4]} size="community" useImage={false} />
          ) : (
            <PlayingCard faceDown size="community" />
          )}
        </div>
        <img src={LOGO_BADGE_URL} alt=""
          style={{ width: 16, height: 'auto', borderRadius: 2, flexShrink: 0, opacity: 0.7 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Reveal prompt */}
      {awaitingReveal && <RevealPrompt onReveal={handleRevealClick} />}

      {/* ── Card Board — compact mode ── */}
      <div style={{ flex: '1 1 0', minHeight: 0, padding: '3px 4px 0 4px' }}>
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
      </div>

      {/* ── Right Sidebar — Rank + Color + River stacked ── */}
      <div style={{ flex: '0 0 auto', maxHeight: '38%', padding: '0 4px', overflow: 'hidden' }}>
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

      {/* ── Footer — chips, ante, deal, bank, gear ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        gap: 3, padding: '3px 5px',
        borderTop: '1px solid rgba(202,138,4,0.3)',
        background: 'rgba(0,0,0,0.65)',
      }}>
        {/* Chips — 4 only */}
        <div style={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          {MOBILE_CHIPS.map(chip => {
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
                <Chip amount={chip.value} scale={0.34} />
              </button>
            );
          })}
        </div>

        {/* Ante circle */}
        <div
          onClick={phase === 'ante' && game.ante > 0 ? actions.clearAnte : undefined}
          style={{
            cursor: phase === 'ante' && game.ante > 0 ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
            border: game.ante > 0 ? '2px solid #FFD700' : '2px solid #C5A059',
            background: game.ante > 0
              ? 'radial-gradient(circle, rgba(255,215,0,0.08) 60%, rgba(0,0,0,0.5) 100%)'
              : 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%)',
            boxShadow: game.ante > 0 ? '0 0 6px 2px rgba(255,215,0,0.7)' : 'none',
            animation: game.ante > 0 ? 'rf-ante-glow 1.6s ease-in-out infinite' : 'none',
          }}
        >
          {game.ante > 0 ? (
            <Chip amount={game.ante} scale={0.24} />
          ) : (
            <span style={{ color: '#000', fontSize: 6, fontWeight: 900, letterSpacing: '0.3px' }}>ANTE</span>
          )}
        </div>

        {/* Bet sum */}
        <div style={{
          flexShrink: 0, padding: '1px 4px', borderRadius: 4,
          border: '1px solid rgba(234,179,8,0.4)', background: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 38,
        }}>
          <span style={{ fontSize: '0.35rem', color: '#a8956a', fontWeight: 700, letterSpacing: '0.04em' }}>BET</span>
          <span style={{ fontSize: '0.5rem', color: '#FFD700', fontWeight: 900 }}>{formatMoney(game.totalWagered)}</span>
        </div>

        {/* Clear / New */}
        {(phase === 'postflop' || phase === 'postturn') && game.totalWagered > 0 && (
          <button onClick={actions.clearBets}
            style={{ flexShrink: 0, padding: '2px 4px', borderRadius: 3,
              border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(127,29,29,0.4)',
              color: '#fca5a5', fontSize: 7, fontWeight: 700, cursor: 'pointer' }}>CLR</button>
        )}
        {phase === 'resolved' && (
          <button onClick={actions.newHand}
            style={{ flexShrink: 0, padding: '2px 5px', borderRadius: 3,
              border: '1px solid rgba(34,197,94,0.5)', background: 'rgba(20,83,45,0.4)',
              color: '#86efac', fontSize: 7, fontWeight: 700, cursor: 'pointer' }}>NEW</button>
        )}

        <div style={{ flex: 1 }} />

        {/* Deal button */}
        <button
          onClick={handleDeal}
          disabled={!canDeal}
          style={{
            flexShrink: 0, padding: '3px 10px', borderRadius: 5,
            border: '1.5px solid #4ade80',
            background: canDeal ? '#15803d' : '#0a3a1a',
            color: '#fff', fontWeight: 900, fontSize: '0.55rem',
            cursor: canDeal ? 'pointer' : 'default',
            letterSpacing: '0.04em', opacity: canDeal ? 1 : 0.4,
          }}
        >
          {dealLabel}
        </button>

        {/* Bank */}
        <div style={{
          flexShrink: 0, padding: '1px 4px', borderRadius: 4,
          border: '1.5px solid #eab308', background: '#000',
        }}>
          <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#FFD700', textShadow: '0 0 4px rgba(251,191,36,0.7)' }}>
            {formatMoney(game.bank)}
          </span>
        </div>

        {/* Gear */}
        <button onClick={() => setShowSettings(true)}
          style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: 5,
            border: '1px solid rgba(234,179,8,0.5)', background: 'rgba(0,0,0,0.5)',
            color: '#fde047', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Settings size={12} />
        </button>
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
