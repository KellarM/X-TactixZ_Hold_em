import React from 'react';
import { useGame } from '@/lib/game/useGame';
import { formatMoney } from '@/lib/game/cards';
import { useGameSounds } from '@/hooks/useGameSounds';
import PreviousHands from '@/components/game/PreviousHands';
import DealerArea from '@/components/game/DealerArea';
import CardBoard from '@/components/game/CardBoard';
import RightSidebar from '@/components/game/RightSidebar';
import BottomFooter from '@/components/game/BottomFooter';
import ResultOverlay from '@/components/game/ResultOverlay';
import GearMenu from '@/components/game/GearMenu';

// ■■ Layout constants ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// Previous Hands rail: w-56 = 224px
// Right sidebar: 285px — full height, OUTSIDE the footer zone
// Gap between columns: 6px
// Outer padding: 6px

const SIDEBAR_WIDTH = 285;
const GAP = 6;
const PAD = 6;

export default function GameTable() {
  const game = useGame();
  const { phase, actions } = game;
  const { soundManager } = useGameSounds();

  const handleResetBank = () => {
    actions.newHand && actions.newHand();
    if (typeof actions.resetBank === 'function') actions.resetBank();
  };

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
      className="flex"
      style={{ background: '#051025', color: '#FFFFFF', height: '100vh', overflow: 'hidden' }}
    >
      {/* ■■■ LEFT + CENTER COLUMN — flex-1, contains its own footer ■■■ */}
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
        {/* ■■ Main content row ■■ */}
        <div
          className="flex flex-1 min-h-0"
          style={{ padding: PAD, gap: GAP }}
        >
          {/* LEFT: Previous Hands — 224px */}
          <div style={{ width: 224, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <PreviousHands history={game.history} />
          </div>

          {/* CENTER: Dealer area + Card Board */}
          <div className="flex-1 flex flex-col min-w-0" style={{ gap: GAP }}>
            <DealerArea
              statusMessage={game.statusMessage}
              community={game.community}
              revealed={game.revealed}
              phase={phase}
            />
            <div className="flex-1 min-h-0">
              <CardBoard
                odds={game.flopOdds}
                bets={game.bets}
                caps={game.caps}
                phase={phase}
                onPlace={actions.placeBet}
                onRemove={actions.removeBet}
                handEvals={game.handEvals}
                leadingHandIds={game.leadingHandIds}
                winnerHandIds={game.winnerHandIds}
              />
            </div>
          </div>
        </div>

        {/* ■■ Footer — spans ONLY left+center, stops at right sidebar ■■ */}
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
            onSettings={null}
            gearMenu={<GearMenu soundManager={soundManager} onResetBank={handleResetBank} />}
          />
        </div>

        {phase === 'resolved' && game.result && (
          <ResultOverlay result={game.result} onClose={actions.newHand} />
        )}
      </div>

      {/* ■■■ RIGHT SIDEBAR — 285px, full height, OUTSIDE footer zone ■■■ */}
      <div
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: PAD,
          paddingLeft: 0,
        }}
      >
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
  );
}