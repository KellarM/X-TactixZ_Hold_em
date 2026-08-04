import React from 'react';
import { FIXED_HANDS, formatMoney, CAT_TO_LABEL } from '@/lib/game/cards';
import PlayingCard from './PlayingCard';

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — matched exactly to original DetailedPayoutDisplay.jsx
// ═══════════════════════════════════════════════════════════════════════════

const gold = {
  color: 'transparent',
  background: 'linear-gradient(180deg,#ffe566 0%,#c9960a 45%,#ffe566 80%,#a07005 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))',
};

const blackOutline = {
  textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
};

const ACCENT = '#eab308'; // gold accent — same as Player 1 in original

const NEW_HAND_BTN = {
  background: 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
  boxShadow: 'inset 0 1px 2px rgba(255,255,200,0.6), inset 0 -1px 2px rgba(100,60,0,0.5), 0 1px 4px rgba(0,0,0,0.5)',
  color: '#000',
  fontWeight: 900,
  fontSize: 15,
  letterSpacing: '0.12em',
  border: '1px solid #000',
  borderRadius: 10,
  width: '100%',
  padding: '12px 0',
  cursor: 'pointer',
  fontFamily: 'Oswald, sans-serif',
};

// ─── Get human-readable card label from hand id ────────────────────────────
// Defensive Number() coercion — id may arrive as a string or number depending
// on caller; FIXED_HANDS.id is always a number, so normalize before compare.
function getHandLabel(id) {
  const numId = Number(id);
  const hand = FIXED_HANDS.find(h => h.id === numId);
  return hand ? hand.label : `Hand ${id}`;
}

// Get the actual card objects [{rank, suit}, {rank, suit}] for a hand id —
// used to render real card icons (not just text) in the win display.
function getHandCards(id) {
  const numId = Number(id);
  const hand = FIXED_HANDS.find(h => h.id === numId);
  return hand ? hand.cards : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUADRANT — one board section (identical structure to original game)
// ═══════════════════════════════════════════════════════════════════════════
function Quadrant({ title, wins, placedBets = [], accentColor }) {
  const hasWin = wins.length > 0;
  const hasBet = hasWin || placedBets.length > 0;

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: `1.5px solid ${hasWin ? accentColor : hasBet ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 10,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Board title */}
      <div
        style={{
          fontSize: '0.72rem',
          fontFamily: 'Oswald, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: hasWin ? accentColor : hasBet ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
          marginBottom: 4,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>

      {/* Content area */}
      {!hasBet ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.18)', fontStyle: 'italic' }}>No bet</span>
        </div>
      ) : !hasWin ? (
        /* Lost bets — show "Bets Did Not Win" label only */
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#f87171',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}>
            Bets Did Not Win
          </span>
        </div>
      ) : (
        /* Win rows */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
          {wins.map((win, idx) => {
            const profit = win.amt * win.payout;
            const total  = win.amt * (win.payout + 1);
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 6,
                  padding: '3px 6px',
                  flex: '1 1 0',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                }}
              >
                {/* Row 1: cards/label + bet/odds */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, maxWidth: '58%', overflow: 'hidden' }}>
                    {win.cards && (
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        {win.cards.map((c, ci) => (
                          <PlayingCard key={ci} card={c} size="xs" />
                        ))}
                      </div>
                    )}
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      color: '#fff',
                      ...blackOutline,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {win.label}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', ...blackOutline, whiteSpace: 'nowrap' }}>
                      Bet: {formatMoney(win.amt)}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', ...blackOutline, whiteSpace: 'nowrap' }}>
                      Odds: {win.payout.toFixed(2)}:1
                    </div>
                  </div>
                </div>
                {/* Row 2: payout calculation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fde68a', whiteSpace: 'nowrap' }}>
                    {formatMoney(profit)} + {formatMoney(win.amt)}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: accentColor, whiteSpace: 'nowrap' }}>
                    = {formatMoney(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ResultOverlay({ result, ante = 0, bonus = null, onClose }) {
  if (!result) return null;
  const { resolution, details, winnings, historyEntry } = result;

  // ── Board bet totals (excluding ante — ante is dead money) ──
  const boardBetTotal =
    details.card.reduce((a, b) => a + b.amt, 0) +
    details.rank.reduce((a, b) => a + b.amt, 0) +
    details.color.reduce((a, b) => a + b.amt, 0) +
    (Array.isArray(details.river) ? details.river.reduce((a, b) => a + b.amt, 0) : 0);

  // Total wagered = ante (dead) + all board bets
  const totalWagered = ante + boardBetTotal;

  // Net win = what came back minus everything spent (ante is a cost, never returned)
  const netWin = winnings - totalWagered;

  // Total win = winnings returned (board wins only — ante never returned)
  const totalWin = winnings;

  const isBoardWin = resolution.boardWin;
  const hasWin = winnings > 0;

  // ── Build placedBets structures for each quadrant (for "lost" display) ──
  const placedCard  = details.card.map(d => ({ label: getHandLabel(d.id), bet: d.amt }));
  const placedRank  = details.rank.map(d => ({ label: d.label, bet: d.amt }));
  const placedColor = details.color.map(d => ({ label: `Color ${d.k}`, bet: d.amt }));
  const placedRiver = (Array.isArray(details.river) ? details.river : [])
    .map(r => ({ label: `River ${r.side?.toUpperCase()}`, bet: r.amt }));

  // ── Build win rows for each quadrant ──
  const cardWins  = details.card
    .filter(d => d.won)
    .map(d => ({ label: getHandLabel(d.id), cards: getHandCards(d.id), amt: d.amt, payout: d.payout }));

  const rankWins  = details.rank
    .filter(d => d.won)
    .map(d => ({ label: d.label, amt: d.amt, payout: d.payout }));

  const colorWins = details.color
    .filter(d => d.won)
    .map(d => ({ label: `Color ${d.k}`, amt: d.amt, payout: d.payout }));

  const riverWins = (Array.isArray(details.river) ? details.river : [])
    .filter(r => r.won)
    .map(r => ({ label: `River ${r.side?.toUpperCase()}`, amt: r.amt, payout: r.payout }));

  // ── Summary headline ──
  const headlineText = isBoardWin
    ? 'BOARD WINS'
    : hasWin
      ? 'YOU WIN!'
      : 'NO WIN';

  const headlineColor = isBoardWin ? '#ef4444' : hasWin ? ACCENT : '#ef4444';

  // ══════════════════════════════════════════════════════════════
  // BACKDROP
  // ══════════════════════════════════════════════════════════════
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.0)' }}
      onClick={onClose}
    >
      {/* ── NO WIN / BOARD WIN — compact red modal ─────────────────────── */}
      {!hasWin ? (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 500,
            maxWidth: '96vw',
            height: 420,
            background: 'linear-gradient(135deg,rgba(10,4,4,0.99) 0%,rgba(40,8,8,0.99) 50%,rgba(10,4,4,0.99) 100%)',
            border: '2px solid #7f1d1d',
            borderRadius: 16,
            boxShadow: '0 0 60px rgba(180,0,0,0.4), 0 0 120px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Red accent bars */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#7f1d1d,#ef4444,#7f1d1d)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#7f1d1d,#ef4444,#7f1d1d)' }} />

          {/* Logo */}
          <img
            src="https://media.base44.com/images/public/69f3a45ad82dff5b772d4de2/2667063a3_image.png"
            alt="Rapid Fire Texas Hold'em"
            style={{ width: 90, height: 'auto', marginBottom: 18, filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.5))' }}
          />

          {/* Headline */}
          <div style={{
            fontFamily: 'Oswald, sans-serif',
            fontWeight: 900,
            fontSize: '3rem',
            letterSpacing: '0.06em',
            color: '#ef4444',
            textShadow: '0 0 30px rgba(239,68,68,0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
            lineHeight: 1,
            marginBottom: 14,
          }}>
            {headlineText}
          </div>

          {/* Divider */}
          <div style={{ width: 200, height: 2, background: 'linear-gradient(90deg,transparent,#ef4444,transparent)', marginBottom: 14 }} />

          {/* Sub text */}
          <div style={{
            fontFamily: 'Oswald, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            ...blackOutline,
            marginBottom: 20,
          }}>
            Better Luck Next Round
          </div>

          {/* Total wagered */}
          {totalWagered > 0 && (
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              {ante > 0 && (
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,100,100,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Ante (dead money): -{formatMoney(ante)}
                </div>
              )}
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                Total Wagered
              </div>
              <div style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#f87171',
                textShadow: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000',
              }}>
                -{formatMoney(totalWagered)}
              </div>
            </div>
          )}

          <button onClick={onClose} style={{ ...NEW_HAND_BTN, width: '80%' }}>NEW HAND</button>
        </div>

      ) : (
      /* ── WIN modal — 2×2 quadrant layout matching original game ─────── */
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 500,
            maxWidth: '96vw',
            position: 'absolute',
            top: 'calc(50% - 210px)',
            bottom: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,rgba(60,20,5,0.98) 0%,rgba(25,8,2,0.99) 100%)',
            border: `2px solid ${ACCENT}`,
            borderRadius: 16,
            boxShadow: `0 0 50px rgba(0,0,0,0.85), 0 0 20px ${ACCENT}44`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Gold accent top bar */}
          <div style={{ height: 3, background: ACCENT, flexShrink: 0 }} />

          {/* ── Header ── */}
          <div style={{
            flexShrink: 0,
            textAlign: 'center',
            padding: '8px 48px 6px',
            borderBottom: `1px solid ${ACCENT}44`,
          }}>
            <div style={{
              ...gold,
              fontSize: '1.4rem',
              fontWeight: 900,
              fontFamily: 'Oswald, sans-serif',
              lineHeight: 1,
            }}>
              {headlineText}
            </div>
            <div style={{
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              ...blackOutline,
              letterSpacing: '0.08em',
              marginTop: 2,
            }}>
              WINNER
            </div>
            {isBoardWin && (
              <div style={{ color: '#f87171', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                Board wins — card & rank bets lose
              </div>
            )}
          </div>

          {/* ── 2×2 Quadrant Grid ── */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '3fr 2fr',
              gap: 6,
              padding: 6,
            }}
          >
            <Quadrant
              title="Card Board Win"
              wins={cardWins}
              placedBets={placedCard}
              accentColor={ACCENT}
            />
            <Quadrant
              title="Color Board Win"
              wins={colorWins}
              placedBets={placedColor}
              accentColor={ACCENT}
            />
            <Quadrant
              title="Rank Board Win"
              wins={rankWins}
              placedBets={placedRank}
              accentColor={ACCENT}
            />
            <Quadrant
              title="River Board Win"
              wins={riverWins}
              placedBets={placedRiver}
              accentColor={ACCENT}
            />
          </div>

          {/* ── Totals bar — 3 columns: Total Wagered | Net Win | Total Win ── */}
          {/* Ante row above totals */}
          {ante > 0 && (
            <div style={{
              flexShrink: 0,
              background: 'rgba(180,0,0,0.18)',
              borderTop: '1px solid rgba(239,68,68,0.3)',
              padding: '4px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'rgba(255,180,180,0.75)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'Oswald, sans-serif',
              }}>
                Ante (dead money — price to see the flop)
              </div>
              <div style={{
                fontSize: '0.88rem',
                fontWeight: 900,
                color: '#f87171',
                fontFamily: 'Oswald, sans-serif',
                ...blackOutline,
                whiteSpace: 'nowrap',
              }}>
                -{formatMoney(ante)}
              </div>
            </div>
          )}

          {/* 3-column totals */}
          <div
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${ACCENT}44`,
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            {[
              {
                label: 'Total Wagered',
                value: formatMoney(totalWagered),
                color: '#fff',
              },
              {
                label: 'Net Win',
                value: (netWin >= 0 ? '+' : '') + formatMoney(netWin),
                color: netWin >= 0 ? '#4ade80' : '#f87171',
              },
              {
                label: 'Total Win',
                value: formatMoney(totalWin),
                color: '#4ade80',
              },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Oswald, sans-serif',
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color,
                  fontFamily: 'Oswald, sans-serif',
                  ...blackOutline,
                  whiteSpace: 'nowrap',
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* ── RNG BONUS summary — shows bonus results if any bonus paid ── */}
          {bonus && (bonus.cardWon || bonus.sideWon) && (
            <div style={{
              flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,165,0,0.10) 100%)',
              borderTop: '1px solid rgba(255,215,0,0.4)',
              padding: '6px 12px',
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {bonus.cardWon && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontFamily: 'Oswald, sans-serif',
                  }}>
                    Card Bonus ×{bonus.cardMult}
                  </div>
                  <div style={{
                    fontSize: '1rem', fontWeight: 900, color: '#fbbf24',
                    fontFamily: 'Oswald, sans-serif',
                    ...blackOutline,
                  }}>
                    +{formatMoney(bonus.cardPayout)}
                  </div>
                </div>
              )}
              {bonus.sideWon && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontFamily: 'Oswald, sans-serif',
                  }}>
                    Side Bet Bonus ×{bonus.sideMult}
                  </div>
                  <div style={{
                    fontSize: '1rem', fontWeight: 900, color: '#fbbf24',
                    fontFamily: 'Oswald, sans-serif',
                    ...blackOutline,
                  }}>
                    +{formatMoney(bonus.sidePayout)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NEW HAND button ── */}
          <div style={{ padding: '8px 12px 10px' }}>
            <button onClick={onClose} style={NEW_HAND_BTN}>NEW HAND</button>
          </div>

        </div>
      )}
    </div>
  );
}