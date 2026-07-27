import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, BarChart2 } from 'lucide-react';
import { useGameSounds } from '@/lib/game/useGameSounds';
import { formatMoney } from '@/lib/game/cards';

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

function StatRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(197,160,89,0.12)' }}>
      <span style={{ color: '#8a9ab0', fontSize: 13 }}>{label}</span>
      <span style={{ color: highlight || '#FFD700', fontWeight: 700, fontSize: 13 }}>{value}</span>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose, playerStats = {} }) {
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'sound', icon: <Volume2 size={14} />, label: 'Sound' },
            { id: 'stats', icon: <BarChart2 size={14} />, label: 'Player Stats' },
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