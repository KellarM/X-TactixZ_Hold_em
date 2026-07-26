import React from 'react';
import { useGame } from '@/lib/game/useGame';
import { formatMoney } from '@/lib/game/cards';
import PreviousHands from '@/components/game/PreviousHands';
import DealerArea from '@/components/game/DealerArea';
import CardBoard from '@/components/game/CardBoard';
import RankBoard from '@/components/game/RankBoard';
import ColorBoard from '@/components/game/ColorBoard';
import RiverBoard from '@/components/game/RiverBoard';
import InfoPanels from '@/components/game/InfoPanels';
import BottomFooter from '@/components/game/BottomFooter';
import ResultOverlay from '@/components/game/ResultOverlay';

export default function GameTable() {
  const game = useGame();
  const { phase, actions } = game;

  // Deal-button config per phase
  let dealLabel = 'DEAL';
  let subLabel = 'PLACE A BET TO DEAL';
  let canDeal = false;
  if (phase === 'ante') {
    dealLabel = 'DEAL';
    subLabel = game.ante > 0 ? `ANTE ${formatMoney(game.ante)} — PRESS TO DEAL FLOP` : 'PLACE A BET TO DEAL';
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

        {/* Center: Dealer area + boards */}
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
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            <ColorBoard
              odds={game.flopOdds}
              bets={game.bets}
              caps={game.caps}
              onPlace={actions.placeBet}
              onRemove={actions.removeBet}
            />
            <RiverBoard
              odds={game.riverOdds}
              bets={game.bets}
              caps={game.caps}
              phase={phase}
              onPlace={actions.placeBet}
              onRemove={actions.removeBet}
            />
          </div>
        </div>

        {/* Right: Rank board + info panels */}
        <div style={{ width: 230, flexShrink: 0 }} className="flex flex-col">
          <div className="flex flex-col" style={{ gap: 12 }}>
            <RankBoard
              odds={game.flopOdds}
              bets={game.bets}
              caps={game.caps}
              onPlace={actions.placeBet}
              onRemove={actions.removeBet}
            />
            <InfoPanels phase={phase} boardTotals={game.boardTotals} />
            {phase !== 'ante' && phase !== 'resolved' && (
              <div className="flex" style={{ gap: 8 }}>
                <button
                  onClick={actions.clearBets}
                  className="flex-1 rounded-md py-2"
                  style={{ background: '#1a1030', border: '1px solid #C5A059', color: '#C5A059', fontWeight: 700, fontSize: 11 }}
                >
                  CLEAR BETS
                </button>
                <button
                  onClick={actions.fold}
                  className="flex-1 rounded-md py-2"
                  style={{ background: '#3a1020', border: '1px solid #C5A059', color: '#FF6B6B', fontWeight: 700, fontSize: 11 }}
                >
                  FOLD
                </button>
              </div>
            )}
          </div>
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