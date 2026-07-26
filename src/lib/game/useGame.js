import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FIXED_HANDS,
  DEALER_STOCK,
  RANK_LABELS,
  COLOR_POSITIONS,
  formatMoney
} from './cards';
import { shuffleDeck, dealCommunity } from './shuffle';
import { computePostFlopOdds, computeRiverOdds } from './oddsEngine';
import { settleRound } from './gameLogic';

export const CHIPS = [
  { value: 0.01, label: '1¢' },
  { value: 0.05, label: '5¢' },
  { value: 0.10, label: '10¢' },
  { value: 0.25, label: '25¢' },
  { value: 0.50, label: '50¢' },
  { value: 1.00, label: '$1' }
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

export function useGame() {
  const [phase, setPhase] = useState('ante'); // ante | postflop | postturn | resolved
  const [bank, setBank] = useState(START_BANK);
  const [ante, setAnte] = useState(0);
  const [deck, setDeck] = useState([]);      // 5 community cards in deal order
  const [revealed, setRevealed] = useState(0);
  const [bets, setBets] = useState(emptyBets());
  const [selectedChip, setSelectedChip] = useState(0.01);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [flopOdds, setFlopOdds] = useState(null);
  const [computing, setComputing] = useState(false);

  const community = deck.slice(0, revealed);
  const flop = deck.slice(0, 3);
  const turn = revealed >= 4 ? deck[3] : null;
  const river = revealed >= 5 ? deck[4] : null;

  // Compute post-flop odds (heavy ~150ms) after the flop paints.
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

  // River odds (post-turn) — cheap counting, synchronous.
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
      card: ante,
      rank: ante,
      color: ante,
      river: boardTotals.card + boardTotals.rank + boardTotals.color
    };
  }, [ante, phase, boardTotals]);

  const totalWagered = useMemo(() => {
    return ante + boardTotals.card + boardTotals.rank + boardTotals.color + boardTotals.river;
  }, [ante, boardTotals]);

  // ---- Actions ----

  const addToAnte = useCallback((amount) => {
    setAnte(a => {
      const next = +(a + amount).toFixed(2);
      return next > bank ? bank : next;
    });
  }, [bank]);

  const clearAnte = useCallback(() => setAnte(0), []);

  const deal = useCallback(() => {
    if (ante <= 0 || ante > bank) return;
    setBank(b => +(b - ante).toFixed(2));
    const shuffled = shuffleDeck(DEALER_STOCK);
    const community5 = dealCommunity(shuffled);
    setDeck(community5);
    setRevealed(3);
    setBets(emptyBets());
    setResult(null);
    setFlopOdds(null);
    setPhase('postflop');
  }, [ante, bank]);

  const placeBet = useCallback((board, position) => {
    const amount = selectedChip;
    if (amount <= 0) return;
    const cap = board === 'river'
      ? (boardTotals.card + boardTotals.rank + boardTotals.color)
      : ante;
    let boardCurrent, positionCurrent;
    if (board === 'river') {
      positionCurrent = bets.river[position] || 0;
      boardCurrent = bets.river.low + bets.river.high;
    } else {
      positionCurrent = bets[board][position] || 0;
      boardCurrent = Object.values(bets[board]).reduce((a, b) => a + b, 0);
    }
    if (boardCurrent + amount > cap + 1e-9) return;
    if (amount > bank) return;
    setBank(+(bank - amount).toFixed(2));
    if (board === 'river') {
      setBets({ ...bets, river: { ...bets.river, [position]: +(positionCurrent + amount).toFixed(2) } });
    } else {
      setBets({ ...bets, [board]: { ...bets[board], [position]: +(positionCurrent + amount).toFixed(2) } });
    }
  }, [selectedChip, ante, bank, bets, boardTotals]);

  const removeBet = useCallback((board, position) => {
    const current = board === 'river' ? (bets.river[position] || 0) : (bets[board][position] || 0);
    if (!current) return;
    setBank(+(bank + current).toFixed(2));
    if (board === 'river') {
      setBets({ ...bets, river: { ...bets.river, [position]: 0 } });
    } else {
      const nextBoard = { ...bets[board] };
      delete nextBoard[position];
      setBets({ ...bets, [board]: nextBoard });
    }
  }, [bank, bets]);

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
    setRevealed(5);
    const community5 = deck.slice(0, 5);
    const settlement = settleRound(community5, FIXED_HANDS, bets, flopOdds, riverOdds);
    setBank(b => +(b + settlement.winnings).toFixed(2));
    setResult(settlement);
    setHistory(prev => [settlement.historyEntry, ...prev].slice(0, 20));
    setPhase('resolved');
  }, [deck, bets, flopOdds, riverOdds]);

  const fold = useCallback(() => {
    // refund placed bets; ante is lost
    const refund = boardTotals.card + boardTotals.rank + boardTotals.color + boardTotals.river;
    setBank(b => +(b + refund).toFixed(2));
    setHistory(prev => [{
      hand: 'FOLD',
      handCards: null,
      type: 'FOLD',
      rb: '—',
      color: '#888888'
    }, ...prev].slice(0, 20));
    setDeck([]);
    setRevealed(0);
    setBets(emptyBets());
    setAnte(0);
    setResult(null);
    setFlopOdds(null);
    setPhase('ante');
  }, [boardTotals]);

  const newHand = useCallback(() => {
    setDeck([]);
    setRevealed(0);
    setBets(emptyBets());
    setAnte(0);
    setResult(null);
    setFlopOdds(null);
    setPhase('ante');
  }, []);

  const statusMessage = useMemo(() => {
    if (phase === 'ante') {
      return ante > 0
        ? `Phase 1 — Ante set at ${formatMoney(ante)}. Press DEAL to receive the flop.`
        : "Phase 1 — Texas Hold'em is open for play. Phase 2 — Place Hand, Rank, and Color bets after the flop.";
    }
    if (phase === 'postflop') {
      if (computing) return 'Phase 2 — Calculating dynamic odds for all boards…';
      return 'Phase 2 — Place Hand, Rank, and Color bets. Dead and dominant positions are locked. Confirm to deal the Turn.';
    }
    if (phase === 'postturn') {
      return 'Phase 3 — Turn dealt. Place your River bet (LOW 2–7 or HIGH 8–A), then deal the River.';
    }
    if (phase === 'resolved') {
      if (!result) return 'Phase 4 — Round resolved.';
      if (result.resolution.boardWin) return 'Phase 4 — The Board wins. All Hand and Rank bets lose.';
      const label = result.historyEntry.type;
      return `Phase 4 — Round resolved. Winning hand achieved: ${label}.`;
    }
    return '';
  }, [phase, ante, computing, result]);

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
      setSelectedChip
    }
  };
}