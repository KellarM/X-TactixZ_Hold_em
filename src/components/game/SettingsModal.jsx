import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, BarChart2, BookOpen } from 'lucide-react';
import { useGameSounds } from '@/lib/game/useGameSounds';
import { formatMoney } from '@/lib/game/cards';

const COLORS = [
  { id: 'red',   label: 'Red',   dot: '#b30000' },
  { id: 'blue',  label: 'Blue',  dot: '#0a2a6e' },
  { id: 'green', label: 'Green', dot: '#0a4a1e' },
];

const OVERLAY = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  zIndex: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const PANEL = {
  background: 'linear-gradient(160deg, #0d1f3c 0%, #071228 100%)',
  border: '1.5px solid #C5A059',
  borderRadius: 14,
  width: 380,
  maxWidth: '95vw',
  padding: '24px 24px 20px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};
const GOLD     = '#C5A059';
const GOLD_DARK = '#3d3013';
const GOLD_BTN = 'linear-gradient(135deg, #e5c158 0%, #d4af37 50%, #bf953f 100%)';

const RULES_SECTIONS = [
  {
    title: 'OBJECTIVE',
    body: [
      'Rapid Fire Texas Hold\u2019em is a fast-paced hybrid casino game.',
      'You bet on poker hand outcomes \u2014 not against other players or a dealer.',
      'All bets resolve simultaneously after the River card is dealt.',
    ],
  },
  {
    title: '1 \u00b7 ANTE PHASE',
    body: [
      'Select a chip, then place your Ante to begin.',
      'Ante is dead money \u2014 it does NOT count toward any win.',
      'The Flop (3 community cards) is dealt, revealing early odds.',
      'Three betting boards open: Card, Rank, and Color.',
      'Each board accepts bets up to your Ante amount.',
    ],
  },
  {
    title: '2 \u00b7 CARD BOARD',
    body: [
      '10 fixed two-card hands are displayed, each with its own odds.',
      'Bet on which hand will make the best 5-card poker hand using community cards.',
      'Only the winning hand pays; ties split the payout.',
      'Betting all 10 hands locks the Card Board.',
    ],
  },
  {
    title: '3 \u00b7 RANK BOARD',
    body: [
      'Bet on the final poker hand rank of the best 5-card hand.',
      'Options: One Pair, Two Pair, Three of a Kind, Straight, Flush, Full House, Four of a Kind.',
      'Royal Flush and Straight Flush are NOT bettable \u2014 if either appears, all Rank bets LOSE.',
      'Your total Rank bets must equal your total Card Board bet to unlock Color and River boards.',
    ],
  },
  {
    title: '4 \u00b7 COLOR BOARD',
    body: [
      'Bet on how many red vs black cards appear in the final 5-card board.',
      '6 positions: 3 Red, 4 Red, 5 Red, 3 Black, 4 Black, 5 Black.',
      'Must be an EXACT match to win.',
      'Unlocks only after Rank bets equal Card Board bets.',
    ],
  },
  {
    title: '5 \u00b7 TURN & RIVER',
    body: [
      'The Turn (4th community card) is dealt \u2014 all pre-deal boards lock.',
      'The River board opens: bet HIGH or LOW on the final card.',
      'Low = 2 through 7. High = 8 through Ace.',
      'River bet max = Snowball Cap (sum of ALL your pre-deal bets).',
    ],
  },
  {
    title: '6 \u00b7 RESOLUTION',
    body: [
      'The River (5th community card) is dealt.',
      'ALL boards resolve simultaneously.',
      'Winning bets pay at their displayed odds.',
      'Losing bets are collected by the house.',
    ],
  },
  {
    title: '7 \u00b7 LOCKOUT RULES',
    body: [
      'Bets are LOCKED when the outcome is near-certain or impossible.',
      'Probability > 80% = LOCKED (dominant outcome \u2014 no value bet).',
      'Probability = 0% = LOCKED (dead outcome \u2014 cannot win).',
      'Locked positions show \u201cLOCKED\u201d text and cannot accept bets.',
    ],
  },
];

function StatRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(197,160,89,0.12)' }}>
      <span style={{ color: '#8a9ab0', fontSize: 13 }}>{label}</span>
      <span style={{ color: highlight || '#FFD700', fontWeight: 700, fontSize: 13 }}>{value}</span>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose, playerStats = {}, boardTheme = 'blue', setBoardTheme }) {
  const sounds = useGameSounds();
  const [soundOn, setSoundOn] = useState(true);
  const [volume, setVolume] = useState(40);
  const [tab, setTab] = useState('sound');

  useEffect(() => {
    if (isOpen) {
      setVolume(Math.round(sounds.getAmbientVolume() * 100));
      setSoundOn(sounds.isSoundEnabled());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSoundToggle = () => {
    const next = !soundOn;
    setSoundOn(next);
    sounds.setSoundEnabled(next);
  };

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    sounds.setAmbientVolume(v / 100);
  };

  const stats = playerStats || {};
  const totalBets    = stats.totalBets    || 0;
  const totalWins    = stats.totalWins    || 0;
  const roundsPlayed = stats.roundsPlayed || 0;
  const roundsWon    = stats.roundsWon    || 0;
  const profit   = totalWins - totalBets;
  const roi      = totalBets > 0 ? ((profit / totalBets) * 100).toFixed(1) : '0.0';
  const winRate  = roundsPlayed > 0 ? ((roundsWon / roundsPlayed) * 100).toFixed(0) : '0';
  const avgBet   = roundsPlayed > 0 ? (totalBets / roundsPlayed).toFixed(2) : '0.00';
  const bestMult = stats.highestMultiplier || 0;

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div style={PANEL} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: GOLD, fontWeight: 800, fontSize: 17, letterSpacing: '1px' }}>SETTINGS</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD }}>
            <X size={20} />
          </button>
        </div>

        {/* Board Color */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(197,160,89,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            BOARD COLOR
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(t => (
              <button key={t.id}
                onClick={() => setBoardTheme && setBoardTheme(t.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 700, fontSize: 12,
                  color: boardTheme === t.id ? '#fde047' : '#94a3b8',
                  border: boardTheme === t.id ? '2px solid #facc15' : '1px solid rgba(197,160,89,0.3)',
                  background: boardTheme === t.id ? 'rgba(100,60,0,0.55)' : 'rgba(0,0,0,0.3)',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: t.dot, border: '2px solid rgba(255,255,255,0.25)',
                  display: 'block',
                }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'sound', icon: <Volume2 size={14} />, label: 'Sound' },
            { id: 'stats', icon: <BarChart2 size={14} />, label: 'Player Stats' },
            { id: 'rules', icon: <BookOpen size={14} />, label: 'Rules' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8,
                background: tab === t.id ? GOLD_BTN : 'rgba(197,160,89,0.1)',
                border: `1px solid ${tab === t.id ? GOLD : 'rgba(197,160,89,0.3)'}`,
                color: tab === t.id ? GOLD_DARK : GOLD,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Sound Tab */}
        {tab === 'sound' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(197,160,89,0.07)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {soundOn ? <Volume2 size={20} color={GOLD} /> : <VolumeX size={20} color="#6a7a8a" />}
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Casino Sounds</div>
                  <div style={{ color: '#8a9ab0', fontSize: 11 }}>Ambient crowd, chips &amp; cards</div>
                </div>
              </div>
              <button
                onClick={handleSoundToggle}
                style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: soundOn ? '#22c55e' : '#374151', position: 'relative', transition: 'background 0.2s' }}
              >
                <div style={{ position: 'absolute', top: 3, left: soundOn ? 23 : 3, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
              </button>
            </div>

            {/* Volume slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 14px', background: 'rgba(197,160,89,0.07)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Ambient Volume</span>
                <span style={{ color: GOLD, fontWeight: 800, fontSize: 13 }}>{volume}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={volume}
                onChange={handleVolumeChange}
                disabled={!soundOn}
                style={{ width: '100%', height: 6, accentColor: GOLD, opacity: soundOn ? 1 : 0.4, cursor: soundOn ? 'pointer' : 'not-allowed' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8a9ab0', fontSize: 10 }}>0%</span>
                <span style={{ color: '#8a9ab0', fontSize: 10 }}>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StatRow label="Rounds Played"   value={roundsPlayed} />
            <StatRow label="Rounds Won"      value={roundsWon} />
            <StatRow label="Win Rate"        value={`${winRate}%`} />
            <StatRow label="Total Bets"      value={formatMoney(totalBets)} />
            <StatRow label="Total Wins"      value={formatMoney(totalWins)} />
            <StatRow label="Profit / Loss"   value={`${profit >= 0 ? '+' : ''}${formatMoney(profit)}`} highlight={profit >= 0 ? '#22c55e' : '#ef4444'} />
            <StatRow label="ROI"             value={`${roi}%`} highlight={Number(roi) >= 0 ? '#22c55e' : '#ef4444'} />
            <StatRow label="Avg Bet / Round" value={formatMoney(Number(avgBet))} />
            <StatRow label="Best Multiplier" value={bestMult > 0 ? `${bestMult.toFixed(1)}x` : '—'} />
            {stats.highestBalance != null && (
              <StatRow label="Peak Balance" value={formatMoney(stats.highestBalance)} highlight="#22c55e" />
            )}
          </div>
        )}

        {/* Rules Tab */}
        {tab === 'rules' && (
          <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {RULES_SECTIONS.map((sec, i) => (
              <div key={i}>
                <div style={{ color: GOLD, fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', marginBottom: 5 }}>
                  {sec.title}
                </div>
                {sec.body.map((line, j) => (
                  <div key={j} style={{ color: '#c4d0e0', fontSize: 12, lineHeight: 1.5, paddingLeft: 8, borderLeft: '2px solid rgba(197,160,89,0.2)', marginBottom: 3 }}>
                    {line}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          style={{ background: GOLD_BTN, color: GOLD_DARK, border: 'none', borderRadius: 8, padding: '9px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.5px' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}