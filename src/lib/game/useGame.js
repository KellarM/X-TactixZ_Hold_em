import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  FIXED_HANDS,
  DEALER_STOCK,
  RANK_LABELS,
  COLOR_POSITIONS,
  SUIT_SYMBOL,
  SUIT_COLOR,
  CAT_TO_LABEL,
  SIDE_BET_POSITIONS,
  formatMoney
} from './cards';
import { shuffleDeck, dealCommunity, secureRandInt } from './shuffle';
import { computePostFlopOdds, computeRiverOdds } from './oddsEngine';
import { captureHand } from '../captureApi';
import { settleRound } from './gameLogic';
import { bestHand, compare5, evaluate5, combinations } from './pokerEvaluator';

const SHORT_SUIT = { spades: "s", hearts: "h", diamonds: "d", clubs: "c" };
function shortCard(card) { return `${card.rank}${SHORT_SUIT[card.suit]}`; }

// Best 5-card hand from a variable pool (2 hole + 3/4/5 community).
// Recomputes index combos for the actual pool size (5, 6, or 7 cards).
const COMBO_CACHE = {};
function combosFor(n) {
  if (n < 5) return [];
  if (n === 5) return [[0, 1, 2, 3, 4]];
  if (!COMBO_CACHE[n]) {
    COMBO_CACHE[n] = combinations(
      Array.from({ length: n }, (_, i) => i),
      5
    );
  }
  return COMBO_CACHE[n];
}

function bestFromPool(pool) {
  if (!pool || pool.length < 5) return null;
  const idxs = combosFor(pool.length);
  let best = null;
  for (const idx of idxs) {
    const e = evaluate5([pool[idx[0]], pool[idx[1]], pool[idx[2]], pool[idx[3]], pool[idx[4]]]);
    if (!best || compare5(e, best) > 0) best = e;
  }
  return best;
}

export const CHIPS = [
  { value: 0.01, label: '1¢' },
  { value: 0.05, label: '5¢' },
  { value: 0.10, label: '10¢' },
  { value: 0.25, label: '25¢' },
  { value: 0.50, label: '50¢' },
  { value: 1.00, label: '$1' },
  { value: 5.00, label: '$5' }
];

const START_BANK = 99.99;
function emptyBets() {
  return {
    card: {},
    rank: {},
    color: {},
    river: { low: 0, high: 0 }
  };
}

function boardTotal(bets, board) {
  if (board === 'river') return bets.river.low + bets.river.high;
  return Object.values(bets[board]).reduce((a, b) => a + b, 0);
}

// Describe a card as "K♠" style for dealer messages
function cardDisplay(card) {
  if (!card) return '';
  const sym = SUIT_SYMBOL[card.suit] || '';
  return `${card.rank}${sym}`;
}

// Find the leading hand(s) against the current community board
function findLeadingHands(community) {
  if (!community || community.length < 3) return { handIds: [], rankName: null };
  const evals = FIXED_HANDS.map(h => {
    const pool = [...h.cards, ...community];
    const result = bestFromPool(pool);
    return { id: h.id, label: h.label, result };
  }).filter(e => e.result !== null);

  if (evals.length === 0) return { handIds: [], rankName: null };

  let best = evals[0];
  for (const e of evals) {
    if (compare5(e.result, best.result) > 0) best = e;
  }
  const leaders = evals.filter(e => compare5(e.result, best.result) === 0);
  return { handIds: leaders.map(e => e.id), rankName: best.result.name };
}

// Evaluate current best hand rank for each fixed hand against community
function evaluateHandRanks(community) {
  if (!community || community.length < 3) return {};
  const out = {};
  for (const h of FIXED_HANDS) {
    const pool = [...h.cards, ...community];
    if (pool.length < 5) { out[h.id] = null; continue; }
    try {
      const result = bestFromPool(pool);
      out[h.id] = result ? result.name : null;
    } catch {
      out[h.id] = null;
    }
  }
  return out;
}

export function useGame() {
  const handCounter = useRef(0);
  const [phase, setPhase] = useState('ante');
  const [bonus, setBonus] = useState(null);
  const [bank, setBank] = useState(START_BANK);
  const [ante, setAnte] = useState(0);
  const [deck, setDeck] = useState([]);
  const [revealed, setRevealed] = useState(0);
  const [bets, setBets] = useState(emptyBets());
  const [selectedChip, setSelectedChip] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [flopOdds, setFlopOdds] = useState(null);
  const [computing, setComputing] = useState(false);

  const community = deck.slice(0, revealed);
  const flop = deck.slice(0, 3);
  const turn = revealed >= 4 ? deck[3] : null;
  const river = revealed >= 5 ? deck[4] : null;

  // ■■ Live hand evaluations (rank name per hand against current board) ■■■■■■
  const handEvals = useMemo(() => {
    if (revealed < 3) return {};
    return evaluateHandRanks(community);
  }, [community, revealed]);

  // ■■ Leading hand(s) — gold highlight target ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  const { handIds: leadingHandIds, rankName: leadingRankName } = useMemo(() => {
    if (phase === 'resolved' || revealed < 3) return { handIds: [], rankName: null };
    return findLeadingHands(community);
  }, [community, revealed, phase]);

  // ■■ Winner hand(s) after resolution ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  const winnerHandIds = useMemo(() => {
    if (phase !== 'resolved' || !result) return [];
    return result.resolution?.winners || [];
  }, [phase, result]);

  // Compute post-flop odds after flop
  useEffect(() => {
    if (revealed >= 3) {
      setComputing(true);
      const id = setTimeout(() => {
        const odds = computePostFlopOdds(deck.slice(0, 3), DEALER_STOCK, FIXED_HANDS);
        setFlopOdds(odds);
        setComputing(false);
      }, 40);
      return () => clearTimeout(id);
    } else {
      setFlopOdds(null);
    }
  }, [deck, revealed]);

  const riverOdds = useMemo(() => {
    if (revealed < 4) return null;
    return computeRiverOdds(deck.slice(0, 4), DEALER_STOCK);
  }, [deck, revealed]);

  const boardTotals = useMemo(() => ({
    card: boardTotal(bets, 'card'),
    rank: boardTotal(bets, 'rank'),
    color: boardTotal(bets, 'color'),
    river: boardTotal(bets, 'river')
  }), [bets]);

  const caps = useMemo(() => {
    if (phase === 'ante' || ante === 0) return { card: 0, rank: 0, color: 0, river: 0 };
    return {
      card: Math.max(0, ante - boardTotals.card),
      rank: Math.max(0, ante - boardTotals.rank),
      color: Math.max(0, ante - boardTotals.color),
      river: Math.max(0, (boardTotals.card + boardTotals.rank + boardTotals.color) - boardTotals.river)
    };
  }, [ante, phase, boardTotals]);

  const totalWagered = useMemo(() => {
    return ante + boardTotals.card + boardTotals.rank + boardTotals.color + boardTotals.river;
  }, [ante, boardTotals]);

  // ---- Actions ----

  const addToAnte = useCallback((amount) => {
    setAnte(a => {
      const next = +(a + amount).toFixed(2);
      if (next > bank) return bank;  // Can't ante more than you have
      setBank(b => +(b - amount).toFixed(2));  // Deduct immediately
      return next;
    });
  }, [bank]);

  const clearAnte = useCallback(() => {
    setBank(b => +(b + ante).toFixed(2));  // Refund the ante back to bank
    setAnte(0);
  }, [ante]);

  const deal = useCallback(() => {
    if (ante <= 0) return;
    // Bank was already deducted in real-time as ante was built — no deduction here
    const shuffled = shuffleDeck(DEALER_STOCK);
    const community5 = dealCommunity(shuffled);
    setDeck(community5);
    setRevealed(3);
    setBets(emptyBets());
    setResult(null);
    setBonus(null);
    setFlopOdds(null);
    setSelectedChip(ante);  // Auto-select the ante amount as the default betting chip
    setPhase('postflop');
  }, [ante, bank]);

  const placeBet = useCallback((board, position) => {
    // Phase guard: card/rank/color only during postflop; river only during postturn
    if (board === 'river' && phase !== 'postturn') return;
    if (board !== 'river' && phase !== 'postflop') return;
    const amount = selectedChip;
    if (!amount || amount <= 0) return;  // No chip selected — can't place bet

    // Use functional updaters to avoid stale closure issues — reads fresh state every time
    setBets(prevBets => {
      const cap = board === 'river'
        ? (Object.values(prevBets.card).reduce((a,b)=>a+b,0) +
           Object.values(prevBets.rank).reduce((a,b)=>a+b,0) +
           Object.values(prevBets.color).reduce((a,b)=>a+b,0))
        : ante;
      let boardCurrent, positionCurrent;
      if (board === 'river') {
        positionCurrent = prevBets.river[position] || 0;
        boardCurrent = (prevBets.river.low || 0) + (prevBets.river.high || 0);
      } else {
        positionCurrent = prevBets[board][position] || 0;
        boardCurrent = Object.values(prevBets[board]).reduce((a, b) => a + b, 0);
      }
      if (boardCurrent + amount > cap + 1e-9) return prevBets; // over cap — no change
      // Deduct from bank only when bet is actually accepted
      setBank(b => +(b - amount).toFixed(2));
      if (board === 'river') {
        return { ...prevBets, river: { ...prevBets.river, [position]: +(positionCurrent + amount).toFixed(2) } };
      }
      return { ...prevBets, [board]: { ...prevBets[board], [position]: +(positionCurrent + amount).toFixed(2) } };
    });
  }, [phase, selectedChip, ante]);

  const removeBet = useCallback((board, position) => {
    // Phase guard: can only remove bets during the phase they were placed
    if (board === 'river' && phase !== 'postturn') return;
    if (board !== 'river' && phase !== 'postflop') return;
    setBets(prevBets => {
      const current = board === 'river'
        ? (prevBets.river[position] || 0)
        : (prevBets[board][position] || 0);
      if (!current) return prevBets;
      setBank(b => +(b + current).toFixed(2));
      if (board === 'river') {
        return { ...prevBets, river: { ...prevBets.river, [position]: 0 } };
      }
      const nextBoard = { ...prevBets[board] };
      delete nextBoard[position];
      return { ...prevBets, [board]: nextBoard };
    });
  }, [phase]);

  const clearBets = useCallback(() => {
    const refund = boardTotals.card + boardTotals.rank + boardTotals.color + boardTotals.river;
    if (refund > 0) setBank(+(bank + refund).toFixed(2));
    setBets(emptyBets());
  }, [bank, boardTotals]);

  const dealTurn = useCallback(() => {
    setRevealed(4);
    setPhase('postturn');
  }, []);

  const dealRiver = useCallback(() => {
    // Reveal River card + set phase to resolved IMMEDIATELY
    // Winner indicators (gold pulses) activate the instant the river turns.
    // The result OVERLAY is delayed 5 seconds at the GameTable component level.
    setRevealed(5);
    const community5 = deck.slice(0, 5);
    const settlement = settleRound(community5, FIXED_HANDS, bets, flopOdds, riverOdds);
    setBank(b => +(b + settlement.winnings).toFixed(2));
    setResult(settlement);

    // ── RNG BONUS ──────────────────────────────────────────────────────
    // Two separate CSPRNG calls: one for card hands (0-9), one for side bets (0-14)
    const bonusCardIdx = secureRandInt(9);
    const bonusSideIdx = secureRandInt(14);
    const cardMult = 2;
    const sideMult = 3;

    // Determine if bonus hits winning positions the player bet on
    let bonusWinnings = 0;
    let cardWon = false;
    let sideWon = false;
    let cardPayout = 0;
    let sidePayout = 0;

    // Card hand bonus: check if the bonus card hand is a winner with a bet
    if (!settlement.resolution.boardWin) {
      const cardDetail = settlement.details.card.find(
        d => d.won && Number(d.id) === (bonusCardIdx + 1) // hand ids are 1-10, indices 0-9
      );
      if (cardDetail) {
        cardWon = true;
        cardPayout = Math.round(cardDetail.amt * cardDetail.payout * (cardMult - 1) * 100) / 100;
        bonusWinnings += cardPayout;
      }
    }

    // Side bet bonus: check the 15 side bet positions
    const sidePosition = SIDE_BET_POSITIONS[bonusSideIdx];

    // Check rank positions (indices 0-6)
    if (bonusSideIdx < 7 && !settlement.resolution.boardWin) {
      const rankLabel = SIDE_BET_POSITIONS[bonusSideIdx];
      const rankDetail = settlement.details.rank.find(
        d => d.won && d.label === rankLabel
      );
      if (rankDetail) {
        sideWon = true;
        sidePayout = Math.round(rankDetail.amt * rankDetail.payout * (sideMult - 1) * 100) / 100;
        bonusWinnings += sidePayout;
      }
    }
    // Check color positions (indices 7-12)
    else if (bonusSideIdx < 13) {
      const colorKey = SIDE_BET_POSITIONS[bonusSideIdx];
      const colorDetail = settlement.details.color.find(
        d => d.won && d.k === colorKey
      );
      if (colorDetail) {
        sideWon = true;
        sidePayout = Math.round(colorDetail.amt * colorDetail.payout * (sideMult - 1) * 100) / 100;
        bonusWinnings += sidePayout;
      }
    }
    // Check river positions (indices 13-14)
    else {
      const riverSide = SIDE_BET_POSITIONS[bonusSideIdx];
      const riverDetail = (Array.isArray(settlement.details.river) ? settlement.details.river : [])
        .find(d => d.won && d.side === riverSide);
      if (riverDetail) {
        sideWon = true;
        sidePayout = Math.round(riverDetail.amt * riverDetail.payout * (sideMult - 1) * 100) / 100;
        bonusWinnings += sidePayout;
      }
    }

    // Add bonus winnings to bank
    bonusWinnings = Math.round(bonusWinnings * 100) / 100;
    if (bonusWinnings > 0) {
      setBank(b => +(b + bonusWinnings).toFixed(2));
    }

    setBonus({
      cardIdx: bonusCardIdx,
      sideIdx: bonusSideIdx,
      cardMult,
      sideMult,
      cardWon,
      sideWon,
      cardPayout,
      sidePayout,
      bonusWinnings,
    });
    setHistory(prev => [settlement.historyEntry, ...prev].slice(0, 18));
    setPhase('resolved');

    // ── Auto-capture for Certification Test ──────────────────────────────
    try {
      handCounter.current += 1;
      const res = settlement.resolution;
      const flop = community5.slice(0, 3);
      const turn = community5[3];
      const river = community5[4];

      // Card board winners
      const cardWinners = res.boardWin ? [] : res.winners.map(hid => {
        const odds = flopOdds?.cardOdds?.find(o => o.handId === hid);
        return {
          handIndex: hid,
          probability: odds ? odds.probability : 0,
          payout: odds ? odds.payout : 0,
          rtp: odds ? odds.probability * (odds.payout + 1) : 0,
        };
      });

      // Rank board winner
      const rankLabel = res.boardWin ? null : CAT_TO_LABEL[res.winningCategory];
      const rankWinner = (rankLabel && flopOdds?.rankOdds?.[rankLabel]) ? [{
        position: rankLabel,
        probability: flopOdds.rankOdds[rankLabel].probability,
        payout: flopOdds.rankOdds[rankLabel].payout,
        rtp: flopOdds.rankOdds[rankLabel].probability * (flopOdds.rankOdds[rankLabel].payout + 1),
      }] : [];

      // Color board winner
      const colorKey = res.reds >= 3 ? `${res.reds}R` : `${res.blacks}B`;
      const colorWinner = (flopOdds?.colorOdds?.[colorKey]) ? [{
        position: colorKey,
        probability: flopOdds.colorOdds[colorKey].probability,
        payout: flopOdds.colorOdds[colorKey].payout,
        rtp: flopOdds.colorOdds[colorKey].probability * (flopOdds.colorOdds[colorKey].payout + 1),
      }] : [];

      // River board winner
      const riverSide = res.riverLow ? 'low' : 'high';
      const riverWinner = (riverOdds && riverOdds[riverSide]) ? [{
        position: riverSide,
        probability: riverOdds[riverSide].probability,
        payout: riverOdds[riverSide].payout,
        rtp: riverOdds[riverSide].probability * (riverOdds[riverSide].payout + 1),
      }] : [];

      // Blended RTPs
      const cardRtp = cardWinners.length > 0 ? cardWinners[0].rtp : 0;
      const rankRtp = rankWinner.length > 0 ? rankWinner[0].rtp : 0;
      const colorRtp = colorWinner.length > 0 ? colorWinner[0].rtp : 0;
      const riverRtp = riverWinner.length > 0 ? riverWinner[0].rtp : 0;

      captureHand({
        handNumber: handCounter.current,
        sessionDate: new Date().toISOString(),
        flopCards: flop.map(shortCard).join(' '),
        turnCard: shortCard(turn),
        riverCard: shortCard(river),
        cardBoardWinners: cardWinners,
        rankBoardWinners: rankWinner,
        colorBoardWinners: colorWinner,
        riverBoardWinners: riverWinner,
        threeBoardBlendedRtp: (cardRtp + rankRtp + colorRtp) / 3,
        totalBlendedRtp: (cardRtp + rankRtp + colorRtp + riverRtp) / 4,
      });
    } catch (captureErr) {
      console.error('[Capture] Error:', captureErr);
    }

  }, [deck, bets, flopOdds, riverOdds]);

  const fold = useCallback(() => {
    const refund = boardTotals.card + boardTotals.rank + boardTotals.color + boardTotals.river;
    setBank(b => +(b + refund).toFixed(2));
    setHistory(prev => [{
      hand: 'FOLD',
      handCards: null,
      type: 'FOLD',
      rb: '—',
      color: '#888888'
    }, ...prev].slice(0, 18));
    setDeck([]);
    setRevealed(0);
    setBets(emptyBets());
    setAnte(0);
    setResult(null);
    setBonus(null);
    setFlopOdds(null);
    setSelectedChip(null);  // No chip pre-selected on fold/new round
    setPhase('ante');
  }, [boardTotals]);

  const newHand = useCallback(() => {
    setDeck([]);
    setRevealed(0);
    setBets(emptyBets());
    setAnte(0);
    setResult(null);
    setBonus(null);
    setFlopOdds(null);
    setSelectedChip(null);  // No chip pre-selected on new round
    setPhase('ante');
  }, []);

  // Test-mode helper: full reset to a fresh $100 bankroll + new ante round
  const resetBank = useCallback(() => {
    setBank(100);
    setDeck([]);
    setRevealed(0);
    setBets(emptyBets());
    setAnte(0);
    setResult(null);
    setBonus(null);
    setFlopOdds(null);
    setSelectedChip(null);
    setPhase('ante');
  }, []);

  // ■■ Dealer status message — rich, card-aware ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  const statusMessage = useMemo(() => {
    if (phase === 'ante') {
      return ante > 0
        ? `Phase 1 — Ante set at ${formatMoney(ante)}. Press DEAL to receive the flop.`
        : "Phase 1 — Texas Hold'em is open for play. Phase 2 — Place Hand, Rank, and Color bets after the flop.";
    }
    if (phase === 'postflop') {
      if (computing) return 'Phase 2 — Calculating dynamic odds for all boards…';
      const flopStr = flop.map(cardDisplay).join(' ');
      if (leadingRankName && leadingHandIds.length > 0) {
        const leaderHand = FIXED_HANDS.find(h => h.id === leadingHandIds[0]);
        const leaderLabel = leaderHand ? leaderHand.label : '';
        return `Flop: ${flopStr} — ${leaderLabel} leads (${leadingRankName}) — Place bets, then deal Turn.`;
      }
      return `Flop: ${flopStr} — Phase 2: Place Hand, Rank, and Color bets. Deal Turn when ready.`;
    }
    if (phase === 'postturn') {
      const turnStr = turn ? cardDisplay(turn) : '';
      if (leadingRankName && leadingHandIds.length > 0) {
        const leaderHand = FIXED_HANDS.find(h => h.id === leadingHandIds[0]);
        const leaderLabel = leaderHand ? leaderHand.label : '';
        return `Turn: ${turnStr} — ${leaderLabel} leads (${leadingRankName}) — River bet open! LOW 2–7 or HIGH 8–A.`;
      }
      return `Turn: ${turnStr} — Phase 3: Place River bet (LOW 2–7 or HIGH 8–A), then deal River.`;
    }
    if (phase === 'resolved') {
      if (!result) return 'Phase 4 — Round resolved.';
      if (result.resolution?.boardWin) {
        const riverStr = river ? cardDisplay(river) : '';
        return `River: ${riverStr} — Board Wins! All Hand and Rank bets lose.`;
      }
      const riverStr = river ? cardDisplay(river) : '';
      const label = result.historyEntry?.type || 'Unknown';
      if (winnerHandIds.length > 0) {
        const winnerHand = FIXED_HANDS.find(h => h.id === winnerHandIds[0]);
        const winnerLabel = winnerHand ? winnerHand.label : '';
        return `River: ${riverStr} — Winner: ${winnerLabel} — ${label}! Round complete.`;
      }
      return `River: ${riverStr} — Round resolved. ${label}.`;
    }
    return '';
  }, [phase, ante, computing, result, flop, turn, river, leadingRankName, leadingHandIds, winnerHandIds]);

  // ■■ Leading rank label mapped to RANK_LABELS format ■■■■■■■■■■■■■■■■■■■■
  const leadingRankLabel = useMemo(() => {
    if (!leadingRankName || revealed < 3) return null;
    const nameMap = {
      'Four of a Kind': '4 Of A Kind',
      'Full House':     'Full House',
      'Flush':          'Flush',
      'Straight':       'Straight',
      'Three of a Kind':'3 Of A Kind',
      'Two Pair':      '2 Pair',
      'One Pair':      '1 Pair',
      'High Card':     null,  // not bettable
    };
    return nameMap[leadingRankName] || null;
  }, [leadingRankName, revealed]);

  // ■■ Winner rank label from resolution ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  const winnerRankLabel = useMemo(() => {
    if (phase !== 'resolved' || !result?.resolution) return null;
    if (result.resolution.boardWin) return null;  // board wins — no rank pays
    const cat = result.resolution.winningCategory;
    return CAT_TO_LABEL[cat] || null;
  }, [phase, result]);

  // ■■ Leading color keys — which color positions match current community count ■■
  const leadingColorKeys = useMemo(() => {
    if (revealed < 3) return [];
    const reds = community.filter(c => SUIT_COLOR[c.suit] === 'red').length;
    const blacks = community.filter(c => SUIT_COLOR[c.suit] === 'black').length;
    const keys = [];
    if (reds >= 3) keys.push(`${reds}R`);
    if (blacks >= 3) keys.push(`${blacks}B`);
    return keys;
  }, [community, revealed]);

  // ■■ Winner color keys from resolution ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  const winnerColorKeys = useMemo(() => {
    if (phase !== 'resolved' || !result?.resolution) return [];
    const r = result.resolution;
    const keys = [];
    if (r.reds >= 3)    keys.push(`${r.reds}R`);
    if (r.blacks >= 3)  keys.push(`${r.blacks}B`);
    return keys;
  }, [phase, result]);

  // ■■ Leading river side — lower payout = favourite ■■■■■■■■■■■■■■■■■■■■■
  const leadingRiverSide = useMemo(() => {
    if (revealed < 4 || !riverOdds) return null;
    const pl = riverOdds.low.probability;
    const ph = riverOdds.high.probability;
    if (pl > ph) return 'low';
    if (ph > pl) return 'high';
    return null;  // exact tie
  }, [riverOdds, revealed]);

  // ■■ Winner river side from resolution ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  const winnerRiverSide = useMemo(() => {
    if (phase !== 'resolved' || !result?.resolution) return null;
    return result.resolution.riverLow ? 'low' : 'high';
  }, [phase, result]);

  return {
    phase,
    bank,
    ante,
    deck,
    revealed,
    community,
    flop,
    turn,
    river,
    bets,
    selectedChip,
    history,
    result,
    flopOdds,
    riverOdds,
    boardTotals,
    caps,
    totalWagered,
    computing,
    statusMessage,
    handEvals,
    leadingHandIds,
    winnerHandIds,
    leadingRankLabel,
    winnerRankLabel,
    leadingColorKeys,
    winnerColorKeys,
    leadingRiverSide,
    winnerRiverSide,
    bonus,
    actions: {
      addToAnte,
      clearAnte,
      deal,
      placeBet,
      removeBet,
      clearBets,
      dealTurn,
      dealRiver,
      fold,
      newHand,
      resetBank,
      setSelectedChip
    }
  };
}