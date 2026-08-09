import React, { useState, useEffect } from 'react';
import PlayingCard, { CARD_IMAGES } from './PlayingCard';
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
import { FIXED_HANDS, formatPayout, SUIT_SYMBOL, SUIT_COLOR } from '@/lib/game/cards';
import { MOBILE_CHIPS } from '@/lib/game/useGame';
import { formatMoney } from '@/lib/game/cards';
import { Settings } from 'lucide-react';

const LOGO_BADGE_URL = 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/7a23486be_xtactixz_template_badge.png';
const BONUS_MARKER_URL = 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/9d8e784cb_logo_gold_v3.png';
const GOLD_LOCK_URL = 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/06edfeada_gold_lock_cropped.png';

// ── Compact card render for mobile hand positions ──────────────────────────
const CARD_W = 29;
const CARD_H = 40;

function MiniCard({ card }) {
  const key = card.rank + '_' + card.suit;
  const imgUrl = CARD_IMAGES[key];

  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={card.rank}
        className="rounded shadow-md"
        style={{ width: CARD_W, height: CARD_H, objectFit: 'cover', display: 'block' }}
      />
    );
  }
  const color = SUIT_COLOR[card.suit] || '#000';
  return (
    <div
      className="bg-white rounded flex flex-col items-center justify-center font-bold"
      style={{ width: CARD_W, height: CARD_H, fontSize: '0.5rem', color: color, lineHeight: 1.1, textAlign: 'center' }}
    >
      <span>{card.rank}</span>
      <span style={{ fontSize: '0.6rem' }}>{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
}

// ── Compact betting slot for mobile ─────────────────────────────────────────
function MobileBettingSlot({
  oddsLabel, locked, bet, rankLabel,
  isLeading, isWinner, isResolved,
  bonusPulse, bonusIndex,
  hand, onPlace, onRemove,
}) {
  const goldHighlighted = isWinner || (isLeading && !isResolved);
  const isBonusActive = bonusPulse && bonusPulse.card === bonusIndex;
  const isBonusPulsing = isBonusActive && !bonusPulse.landed;
  const isBonusLanded = isBonusActive && bonusPulse.landed;
  const markerFading = isBonusLanded && bonusPulse.markerFading;

  let borderColor = '#C5A059';
  let borderWidth = '2px';
  if (isBonusLanded && !markerFading) { borderColor = '#FFD700'; borderWidth = '2px'; }
  else if (isBonusPulsing) { borderColor = '#C5A059'; borderWidth = '2px'; }
  else if (isWinner) { borderColor = '#FFD700'; borderWidth = '3px'; }
  else if (isLeading && !isResolved) { borderColor = '#e5c158'; borderWidth = '2.5px'; }
  else if (locked) { borderColor = '#6b6146'; borderWidth = '2px'; }

  let background = 'var(--theme-bg, #04122b)';
  let animation = 'none';
  if (isBonusLanded && !markerFading) { background = '#2a2000'; }
  else if (isBonusPulsing) { background = '#2a2000'; }
  else if (isWinner) {
    animation = 'rf-winner-settle 0.6s ease-out forwards';
    background = 'linear-gradient(135deg, #b8860b 0%, #d4a017 30%, #c9900e 60%, #8B6914 100%)';
  } else if (isLeading && !isResolved) {
    animation = 'rf-leader-pulse 2.0s ease-in-out infinite';
    background = 'linear-gradient(135deg, #b8860b 0%, #d4a017 30%, #c9900e 60%, #8B6914 100%)';
  }

  const rankColor = goldHighlighted ? '#000' : locked ? '#5a5240' : '#8a9ab0';
  const bottomLabel = locked ? (rankLabel || 'Dead') : rankLabel;

  return (
    <div
      className="relative rounded-md"
      style={{
        background: background,
        border: borderWidth + ' solid ' + borderColor,
        animation: animation,
        opacity: locked ? 0.90 : 1,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: locked ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.2s, border-width 0.2s',
        overflow: 'visible',
        userSelect: 'none',
        padding: '2px 1px',
      }}
      onClick={() => { if (!locked) onPlace(); }}
      onContextMenu={(e) => { e.preventDefault(); if (!locked && bet > 0) onRemove(); }}
    >
      {/* Bonus marker overlay */}
      {isBonusActive && (
        <img
          src={BONUS_MARKER_URL}
          alt="Bonus"
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'contain', pointerEvents: 'none',
            zIndex: 30, opacity: markerFading ? 0 : 1,
            transition: 'opacity 1s ease-out',
          }}
        />
      )}

      {/* Bonus badge */}
      {isBonusLanded && bonusPulse && bonusPulse.markerFading && (
        <div style={{
          position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
          background: bonusPulse.cardWon
            ? 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%)'
            : 'linear-gradient(135deg, #888 0%, #555 50%, #888 100%)',
          color: '#000', fontSize: 7, fontWeight: 900, padding: '1px 4px', borderRadius: 3,
          zIndex: 41, letterSpacing: '0.3px', whiteSpace: 'nowrap',
          border: '1px solid ' + (bonusPulse.cardWon ? '#FFE566' : '#aaa'),
          opacity: 0, animation: 'rf-badge-appear 0.4s ease-out 0.3s forwards',
          pointerEvents: 'none',
        }}>
          {bonusPulse.cardWon ? '\u00D7' + bonusPulse.cardMult : 'PICK'}
        </div>
      )}

      {/* WIN badge */}
      {isWinner && isResolved && (
        <div style={{
          position: 'absolute', top: 1, right: 2,
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          color: '#000', fontSize: 6, fontWeight: 900, padding: '0px 3px', borderRadius: 2,
          zIndex: 20, letterSpacing: '0.3px', pointerEvents: 'none',
        }}>WIN</div>
      )}

      {/* Odds label */}
      <div style={{
        color: goldHighlighted ? '#000' : (locked ? '#9a8f6e' : '#FFD700'),
        fontSize: '0.5rem', fontWeight: 700, lineHeight: 1, textAlign: 'center',
        width: '100%', flexShrink: 0, padding: '1px 2px 0px',
      }}>
        {oddsLabel}
      </div>

      {/* Cards */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 2, padding: '0 2px', position: 'relative',
        filter: locked ? 'grayscale(1) brightness(0.6)' : 'none',
      }}>
        {hand.cards.map((c, i) => (
          <MiniCard key={i} card={c} />
        ))}
      </div>

      {/* Lock overlay */}
      {locked && (
        <div style={{
          position: 'absolute', inset: '14px 0 10px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 5, pointerEvents: 'none',
        }}>
          <img src={GOLD_LOCK_URL} alt="Locked"
            style={{ width: 16, height: 'auto', opacity: 0.85 }} />
        </div>
      )}

      {/* Rank label */}
      {bottomLabel && (
        <div style={{
          fontSize: '0.36rem', fontWeight: 700, letterSpacing: '0.3px',
          textAlign: 'center', padding: '0px 2px 1px', width: '100%',
          flexShrink: 0, lineHeight: 1, color: rankColor, textTransform: 'uppercase',
        }}>
          {bottomLabel}
        </div>
      )}

      {/* Chip overlay */}
      {bet > 0 && !locked && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 20, cursor: 'pointer',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))', pointerEvents: 'auto',
          }}
        >
          <Chip amount={bet} scale={0.36} />
        </span>
      )}
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

  const odds = game.flopOdds;
  const isResolved = phase === 'resolved';

  const locked = (id) => {
    if (!odds) return true;
    const o = odds.cardOdds.find(x => x.handId === id);
    return !o || o.locked;
  };
  const payout = (id) => {
    if (!odds) return null;
    const o = odds.cardOdds.find(x => x.handId === id);
    return o ? o.payout : null;
  };

  const COMM_CARD_W = 28;
  const COMM_CARD_H = 40;
  const COMM_GAP = 3;

  return (
    <div
      className={'velvet-board theme-' + boardTheme}
      style={{
        color: '#FFFFFF',
        width: '100dvw',
        height: '100dvh',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* LEFT COLUMN -- 60% */}
      <div style={{
        width: '60%', display: 'flex', flexDirection: 'column',
        borderRight: '1.5px solid rgba(202,138,4,0.4)', overflow: 'hidden',
      }}>
        {/* Dealer message bar -- 18px */}
        <div style={{
          flexShrink: 0, height: 18, display: 'flex', alignItems: 'center',
          padding: '0 6px', overflow: 'hidden', whiteSpace: 'nowrap',
          background: 'linear-gradient(90deg, rgba(55,22,0,0.95), rgba(70,28,0,0.95))',
          borderBottom: '1px solid rgba(202,138,4,0.4)',
        }}>
          <span style={{
            fontFamily: 'Oswald, sans-serif', fontSize: '0.6rem', fontWeight: 700,
            fontStyle: 'italic', color: '#f6d860',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {game.statusMessage || ''}
          </span>
        </div>

        {/* Community cards -- 52px height */}
        <div style={{
          flexShrink: 0, height: 52, maxHeight: 52, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.3rem',
          background: 'rgba(0,0,0,0.5)',
          borderBottom: '1px solid rgba(202,138,4,0.4)',
          padding: '0 4px',
        }}>
          <img src={LOGO_BADGE_URL} alt="XT"
            style={{ width: 18, height: 'auto', borderRadius: 2, flexShrink: 0, opacity: 0.7 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: COMM_GAP }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: COMM_CARD_W, height: COMM_CARD_H, flexShrink: 0 }}>
                {game.community[i] ? (
                  <PlayingCard card={game.community[i]} size="community" useImage={false} />
                ) : (
                  <PlayingCard faceDown size="community" />
                )}
              </div>
            ))}
            <div style={{ width: COMM_CARD_W, height: COMM_CARD_H, flexShrink: 0 }}>
              {game.community[3] ? (
                <PlayingCard card={game.community[3]} size="community" useImage={false} />
              ) : (
                <PlayingCard faceDown size="community" />
              )}
            </div>
            <div style={{ width: COMM_CARD_W, height: COMM_CARD_H, flexShrink: 0 }}>
              {game.community[4] ? (
                <PlayingCard card={game.community[4]} size="community" useImage={false} />
              ) : (
                <PlayingCard faceDown size="community" />
              )}
            </div>
          </div>
          <img src={LOGO_BADGE_URL} alt="XT"
            style={{ width: 18, height: 'auto', borderRadius: 2, flexShrink: 0, opacity: 0.7 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Reveal prompt */}
        {awaitingReveal && <RevealPrompt onReveal={handleRevealClick} />}

        {/* 5x2 Hand grid -- compact */}
        <div style={{
          flex: 1, minHeight: 0, display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(2, 1fr)',
          gap: 2, padding: 2,
        }}>
          {FIXED_HANDS.map((hand, handArrayIdx) => (
            <MobileBettingSlot
              key={hand.id}
              hand={hand}
              oddsLabel={formatPayout(payout(hand.id))}
              locked={locked(hand.id)}
              bet={game.bets.card[hand.id] || 0}
              rankLabel={game.handEvals[hand.id] || null}
              isLeading={game.leadingHandIds.includes(hand.id)}
              isWinner={game.winnerHandIds.includes(hand.id)}
              isResolved={isResolved}
              bonusPulse={bonusPulse}
              bonusIndex={handArrayIdx}
              onPlace={() => handlePlaceBet('card', hand.id)}
              onRemove={() => handleRemoveBet('card', hand.id)}
            />
          ))}
        </div>

        {/* Action bar -- chips, ante, deal, bank, gear */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          gap: 3, padding: '3px 5px',
          borderTop: '1px solid rgba(202,138,4,0.3)',
          background: 'rgba(0,0,0,0.65)',
        }}>
          {/* Chips */}
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

          {/* Ante circle -- 28px */}
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
            display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 42,
          }}>
            <span style={{ fontSize: '0.35rem', color: '#a8956a', fontWeight: 700, letterSpacing: '0.04em' }}>BET</span>
            <span style={{ fontSize: '0.55rem', color: '#FFD700', fontWeight: 900 }}>{formatMoney(game.totalWagered)}</span>
          </div>

          {/* Clear bets */}
          {(phase === 'postflop' || phase === 'postturn') && game.totalWagered > 0 && (
            <button onClick={actions.clearBets}
              style={{ flexShrink: 0, padding: '2px 4px', borderRadius: 3,
                border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(127,29,29,0.4)',
                color: '#fca5a5', fontSize: 7, fontWeight: 700, cursor: 'pointer' }}>CLR</button>
          )}

          {/* New hand */}
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
            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#FFD700', textShadow: '0 0 4px rgba(251,191,36,0.7)' }}>
              {formatMoney(game.bank)}
            </span>
          </div>

          {/* Gear */}
          <button onClick={() => setShowSettings(true)}
            title="Settings"
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
      </div>

      {/* RIGHT COLUMN -- 40% */}
      <div style={{ width: '40%', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
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

      {/* Overlays & Modals */}
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
