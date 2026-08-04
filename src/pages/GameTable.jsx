import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/lib/game/useGame';
import { formatMoney } from '@/lib/game/cards';
import { useGameSounds } from '@/lib/game/useGameSounds';
import PreviousHands from '@/components/game/PreviousHands';
import DealerArea from '@/components/game/DealerArea';
import CardBoard from '@/components/game/CardBoard';
import RightSidebar from '@/components/game/RightSidebar';
import BottomFooter from '@/components/game/BottomFooter';
import ResultOverlay from '@/components/game/ResultOverlay';
import BonusSequence from '@/components/game/BonusSequence';
import { playWin, playLose, setBonusSfxEnabled } from '@/lib/game/useBonusAudio';
import SettingsModal from '@/components/game/SettingsModal';
import HowToPlayModal from '@/components/game/HowToPlayModal';
import OnboardingIndicator from '@/components/game/OnboardingIndicator';

export default function GameTable() {
  const game = useGame();
  const { phase, actions } = game;
  const sounds = useGameSounds();

  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [boardTheme, setBoardThemeState] = useState(() => {
    try { return localStorage.getItem('rfpf_theme') || 'blue'; } catch { return 'blue'; }
  });

  const setBoardTheme = (t) => {
    setBoardThemeState(t);
    try { localStorage.setItem('rfpf_theme', t); } catch {}
  };
  // ── Result overlay delay — 5 seconds after resolution before modal appears ──
  // Winner indicators light up immediately; the modal waits so players can read the board.
  const [showResult, setShowResult] = useState(false);
  const [bonusPulse, setBonusPulse] = useState({ card: null, side: null, landed: false, cardWon: false, sideWon: false, cardMult: 2, sideMult: 3 });
  const [bonusActive, setBonusActive] = useState(false);
  const [playerStats, setPlayerStats] = useState({
    totalBets: 0, totalWins: 0,
    roundsPlayed: 0, roundsWon: 0,
    highestMultiplier: 0,
    highestBalance: null, lowestBalance: null,
  });

  // Start ambient on first user interaction
  useEffect(() => {
    const handler = () => sounds.preloadSounds();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  // Sync bonus audio SFX gate with the game SFX channel
  useEffect(() => {
    setBonusSfxEnabled(sounds.isSfxEnabled());
  }, [sounds]);

  // ── Bonus sequence + result overlay timing ─────────────────────────────
  // When phase becomes 'resolved':
  // 1. Bonus sequence runs (~10 seconds) — pulse waves on card hands + side bets
  // 2. After bonus completes, show the result overlay (with bonus info)
  // If no bonus data (safety fallback), show overlay after 5 seconds.
  useEffect(() => {
    if (phase === 'resolved' && game.result) {
      setShowResult(false);
      setBonusPulse({ card: null, side: null, landed: false, cardWon: false, sideWon: false, cardMult: 2, sideMult: 3 });

      if (game.bonus) {
        // Start bonus sequence — BonusSequence component handles the animation
        setBonusActive(true);
      } else {
        // Fallback: no bonus, show after 5 seconds
        const timer = setTimeout(() => setShowResult(true), 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowResult(false);
      setBonusActive(false);
      setBonusPulse({ card: null, side: null, landed: false, cardWon: false, sideWon: false, cardMult: 2, sideMult: 3 });
    }
  }, [phase, game.result, game.bonus]);

  // Bonus sequence callbacks
  const handleBonusPulse = useCallback((cardPos, sidePos) => {
    setBonusPulse(prev => ({
      ...prev,
      card: cardPos !== null ? cardPos : prev.card,
      side: sidePos !== null ? sidePos : prev.side,
      landed: false,
    }));
  }, []);

  const handleBonusLand = useCallback((cardIdx, sideIdx) => {
    if (!game.bonus) return;
    setBonusPulse({
      card: cardIdx,
      side: sideIdx,
      landed: true,
      cardWon: game.bonus.cardWon,
      sideWon: game.bonus.sideWon,
      cardMult: game.bonus.cardMult,
      sideMult: game.bonus.sideMult,
    });
    // Play win or lose sound based on whether the bonus paid
    if (game.bonus.cardWon || game.bonus.sideWon) {
      playWin();
    } else {
      playLose();
    }
  }, [game.bonus]);

  const handleBonusComplete = useCallback(() => {
    setBonusActive(false);
    setShowResult(true);
  }, []);

  // Track stats per resolved hand
  useEffect(() => {
    if (phase === 'resolved' && game.result) {
      const r = game.result;
      const betTotal  = r.totalWagered ?? 0;
      const winTotal  = r.totalPayout  ?? 0;
      const multiplier = betTotal > 0 ? winTotal / betTotal : 0;
      setPlayerStats(prev => ({
        totalBets:         prev.totalBets + betTotal,
        totalWins:         prev.totalWins + winTotal,
        roundsPlayed:      prev.roundsPlayed + 1,
        roundsWon:         prev.roundsWon + (winTotal > betTotal ? 1 : 0),
        highestMultiplier: Math.max(prev.highestMultiplier, multiplier),
        highestBalance:    prev.highestBalance == null ? game.bank : Math.max(prev.highestBalance, game.bank),
        lowestBalance:     prev.lowestBalance  == null ? game.bank : Math.min(prev.lowestBalance,  game.bank),
      }));
    }
  }, [phase]);

  const handlePlaceBet = useCallback((...args) => {
    sounds.playChipPlace();
    actions.placeBet(...args);
  }, [actions]);

  const handleRemoveBet = useCallback((...args) => {
    sounds.playChipRemove();
    actions.removeBet(...args);
  }, [actions]);

  const handleDeal = () => {
    sounds.playCardDeal();
    if (phase === 'ante')      actions.deal();
    else if (phase === 'postflop') actions.dealTurn();
    else if (phase === 'postturn') actions.dealRiver();
  };

  let dealLabel = 'DEAL';
  let subLabel  = 'PLACE AN ANTE TO DEAL';
  let canDeal   = false;
  if (phase === 'ante') {
    subLabel = game.ante > 0
      ? `ANTE ${formatMoney(game.ante)} — PRESS TO DEAL FLOP`
      : 'SELECTING A CHIP PLACES AN ANTE, THEN DEAL';
    canDeal = game.ante > 0 && game.ante <= game.bank;
  } else if (phase === 'postflop') {
    dealLabel = 'DEAL TURN';
    subLabel  = game.selectedChip
      ? 'PLACE BETS ON ANY BOARD — THEN DEAL TURN'
      : 'SELECT A CHIP, THEN PLACE BETS ON ANY BOARD';
    canDeal   = !game.computing;
  } else if (phase === 'postturn') {
    dealLabel = 'DEAL RIVER';
    subLabel  = 'PLACE RIVER BET OR DEAL NOW';
    canDeal   = true;
  }

  return (
    <div
      className={`velvet-board theme-${boardTheme}`}
      style={{
        color: '#FFFFFF',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ■■ Main content row — zero bottom padding so footer connects flush ■■ */}
      <div
        style={{
          flex: '1 1 0',
          minHeight: 0,
          display: 'flex',
          padding: '6px 6px 0 6px',
          gap: 6,
        }}
      >
        {/* LEFT: Previous Hands */}
        <div style={{ width: 224, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <PreviousHands history={game.history} />
        </div>

        {/* CENTER: Dealer area + Card Board */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
          <DealerArea
            statusMessage={game.statusMessage}
            community={game.community}
            revealed={game.revealed}
            phase={phase}
          />
          <div style={{ flex: '1 1 0', minHeight: 0 }}>
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
        </div>

        {/* RIGHT: Sidebar — full height of content row */}
        <div style={{ width: 285, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          />
        </div>
      </div>

      {/* ■■ Footer — full width, flush against content row ■■ */}
      <div style={{ flexShrink: 0, width: '100%' }}>
        <BottomFooter
          bank={game.bank}
          ante={game.ante}
          totalWagered={game.totalWagered}
          selectedChip={game.selectedChip}
          phase={phase}
          canDeal={canDeal}
          dealLabel={dealLabel}
          subLabel={subLabel}
          onChipSelect={(v) => {
            if (phase === 'ante') actions.addToAnte(v);
            else actions.setSelectedChip(v);
          }}
          onClearAnte={actions.clearAnte}
          onClearBets={actions.clearBets}
          onFold={actions.fold}
          onDeal={handleDeal}
          onNewHand={actions.newHand}
          onSettings={() => setShowSettings(true)}
        />
      </div>

      {/* ── RNG Bonus sequence — runs during resolution, before result overlay ── */}
      {bonusActive && game.bonus && (
        <BonusSequence
          cardIdx={game.bonus.cardIdx}
          sideIdx={game.bonus.sideIdx}
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
        onResetBank={actions.resetBank}
      />
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <OnboardingIndicator />
    </div>
  );
}