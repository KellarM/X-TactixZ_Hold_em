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
  const { phase, actions, handEvals, leadingHandIds, winnerHandIds } = game;

  let dealLabel = 'DEAL';
  let subLabel = 'PLACE AN ANTE TO DEAL';
  let canDeal = false;
  if (phase === 'ante') {
    dealLabel = 'DEAL';
    subLabel = game.ante > 0
      ? `ANTE ${formatMoney(game.ante)} — PRESS TO DEAL FLOP`
      : 'SELECT A CHIP, PLACE AN ANTE, THEN DEAL';
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
      className="flex flex-col"
      style={{ background: '#051025', color: '#FFFFFF', height: '100vh', overflow: 'hidden' }}
    >
      {/* ■■ Main content row ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ */}
      <div
        className="flex flex-1 min-h-0"
        style={{ padding: 6, gap: 6 }}
      >
        {/* LEFT: Previous Hands */}
        <div style={{ width: 224, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <PreviousHands history={game.history} />
        </div>

        {/* CENTER: Dealer area + Card Board */}
        <div className="flex-1 flex flex-col min-w-0" style={{ gap: 6 }}>
          <DealerArea
            statusMessage={game.statusMessage}
            community={game.community}
            revealed={game.revealed}
            phase={phase}
          />

          {/* Card Board — flex-1 fills remaining center height */}
          <div className="flex-1 min-h-0">
            <CardBoard
              odds={game.flopOdds}
              bets={game.bets}
              caps={game.caps}
              phase={phase}
              onPlace={actions.placeBet}
              onRemove={actions.removeBet}
              handEvals={handEvals}
              leadingHandIds={leadingHandIds}
              winnerHandIds={winnerHandIds}
            />
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ width: 285, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <RightSidebar
            phase={phase}
            flopOdds={game.flopOdds}
            riverOdds={game.riverOdds}
            bets={game.bets}
            caps={game.caps}
            boardTotals={game.boardTotals}
            onPlace={actions.placeBet}
            onRemove={actions.removeBet}
          />
        </div>
      </div>

      {/* ■■ Footer ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ */}
      <div style={{ flexShrink: 0 }}>
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
          onDeal={onDeal}
          onNewHand={actions.newHand}
          onSettings={() => {}}
        />
      </div>

      {phase === 'resolved' && game.result && (
        <ResultOverlay result={game.result} onClose={actions.newHand} />
      )}
    </div>
  );
}