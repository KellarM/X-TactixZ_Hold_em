import React from 'react';
import { useGame } from '@/lib/game/useGame';
import { formatMoney } from '@/lib/game/cards';
import PreviousHands from '@/components/game/PreviousHands';
import DealerArea from '@/components/game/DealerArea';
import CardBoard from '@/components/game/CardBoard';
import RightSidebar from '@/components/game/RightSidebar';
import BottomFooter from '@/components/game/BottomFooter';
import ResultOverlay from '@/components/game/ResultOverlay';

export default function GameTable() {
  const game = useGame();
  const { phase, actions } = game;

  // Deal-button config per phase
  let dealLabel = 'DEAL';
  let subLabel = 'PLACE AN ANTE TO DEAL';
  let canDeal = false;
  if (phase === 'ante') {
    dealLabel = 'DEAL';
    subLabel = game.ante > 0 ? `ANTE ${formatMoney(game.ante)} — PRESS TO DEAL FLOP` : 'SELECT A CHIP, PLACE AN ANTE, THEN DEAL';
    canDeal = game.ante > 0 && game.ante <= game.bank;
  } else if (phase === 'postflop') {
    dealLabel = 'DEAL TURN';
    subLabel = 'CONFIRM BETS — DEAL THE TURN';
    canDeal = !game.computing;
  } else if (phase === 'postturn') {
    dealLabel = 'DEAL RIVER';
    subLabel = 'PLACE RIVER BET OR DEAL NOW';
    canDeal = true;
  }

  const onDeal = () => {
    if (phase === 'ante') actions.deal();
    else if (phase === 'postflop') actions.dealTurn();
    else if (phase === 'postturn') actions.dealRiver();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#051025', color: '#FFFFFF' }}
    >
      <div className="flex-1 flex p-3" style={{ gap: 12, minHeight: 0 }}>
        {/* Left: Previous Hands */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <PreviousHands history={game.history} />
        </div>

        {/* Center: Dealer area + card board + ante spot */}
        <div className="flex-1 flex flex-col" style={{ gap: 12, minWidth: 0 }}>
          <DealerArea
            statusMessage={game.statusMessage}
            community={game.community}
            revealed={game.revealed}
            phase={phase}
          />
          <CardBoard
            odds={game.flopOdds}
            bets={game.bets}
            caps={game.caps}
            phase={phase}
            onPlace={actions.placeBet}
            onRemove={actions.removeBet}
          />
        </div>

        {/* Right: Rank + Color + River boards (with locked placeholders) */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <RightSidebar
            phase={phase}
            flopOdds={game.flopOdds}
            riverOdds={game.riverOdds}
            bets={game.bets}
            caps={game.caps}
            boardTotals={game.boardTotals}
            onPlace={actions.placeBet}
            onRemove={actions.removeBet}
            onClearBets={actions.clearBets}
            onFold={actions.fold}
          />
        </div>
      </div>

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
        onDeal={onDeal}
        onNewHand={actions.newHand}
        onSettings={() => {}}
      />

      {phase === 'resolved' && game.result && (
        <ResultOverlay result={game.result} onClose={actions.newHand} />
      )}
    </div>
  );
}