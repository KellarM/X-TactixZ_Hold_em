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
import SettingsModal from '@/components/game/SettingsModal';

export default function GameTable() {
  const game = useGame();
  const { phase, actions } = game;
  const sounds = useGameSounds();

  const [showSettings, setShowSettings] = useState(false);
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
      : 'SELECT A CHIP, PLACE AN ANTE, THEN DEAL';
    canDeal = game.ante > 0 && game.ante <= game.bank;
  } else if (phase === 'postflop') {
    dealLabel = 'DEAL TURN';
    subLabel  = 'CONFIRM BETS — DEAL THE TURN';
    canDeal   = !game.computing;
  } else if (phase === 'postturn') {
    dealLabel = 'DEAL RIVER';
    subLabel  = 'PLACE RIVER BET OR DEAL NOW';
    canDeal   = true;
  }

  return (
    <div
      style={{
        background: '#051025',
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
            onPlace={handlePlaceBet}
            onRemove={handleRemoveBet}
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

      {phase === 'resolved' && game.result && (
        <ResultOverlay result={game.result} onClose={actions.newHand} />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        playerStats={playerStats}
      />
    </div>
  );
}