// GameRulesContent — rendered inside SettingsModal's "Game Rules" tab.
// Pulls live Ante structure + Bonus multiplier values so the rules text
// always matches whatever is currently active. Written as plain game rules
// with zero operator/tool/backend language.

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  getSavedStructureId,
  getStructureById,
  getAnteTierDescriptions,
} from '../../lib/game/anteStructures';
import { getSavedBonusMultipliers } from '../../lib/game/bonusMultipliers';

const GOLD = '#C5A059';
const GOLD_BRIGHT = '#FFD700';
const BODY_TEXT = '#cbd5e1';
const MUTED = '#8a9ab0';
const PANEL_BG = 'rgba(197,160,89,0.07)';
const BORDER = 'rgba(197,160,89,0.25)';

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      borderRadius: 10,
      overflow: 'hidden',
      border: `1px solid ${BORDER}`,
      background: 'rgba(0,0,0,0.25)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{
          color: GOLD_BRIGHT, fontWeight: 800, fontSize: 11,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {title}
        </span>
        {open
          ? <ChevronUp size={14} color={MUTED} />
          : <ChevronDown size={14} color={MUTED} />
        }
      </button>
      {open && (
        <div style={{ padding: '4px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Rule({ children }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 12, lineHeight: 1.6, color: BODY_TEXT }}>
      <span style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}>•</span>
      <span>{children}</span>
    </div>
  );
}

function RuleBold({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 12, lineHeight: 1.6, color: BODY_TEXT }}>
      <span style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}>•</span>
      <span><strong style={{ color: '#fff' }}>{label}</strong>{children && <span> — {children}</span>}</span>
    </div>
  );
}

export default function GameRulesContent() {
  // Pull live config values so rules always match what's active
  const structureId = useMemo(() => { try { return getSavedStructureId(); } catch { return 'C'; } }, []);
  const structure = useMemo(() => getStructureById(structureId), [structureId]);
  const tiers = useMemo(() => getAnteTierDescriptions(structure, 4), [structure]);
  const bonusMults = useMemo(() => { try { return getSavedBonusMultipliers(); } catch { return { card: 5, rank: 4, colorRiver: 3 }; } }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>

      {/* Title */}
      <div style={{
        textAlign: 'center', padding: '6px 0 2px',
        fontSize: 13, fontWeight: 900, color: GOLD_BRIGHT, letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Rapid Fire Post-Flop — Game Rules
      </div>

      {/* Overview */}
      <Section title="How the Game Works" defaultOpen={true}>
        <Rule>Rapid Fire Post-Flop is a fast-paced poker-based betting game. You pay an Ante to see the Flop, then wager on three betting boards as the community cards are revealed. All bets are optional at every stage.</Rule>
        <RuleBold label="10 Fixed Hands">Ten two-card hands are dealt face-up before each round. The best 5-card poker hand formed from each hand's 2 cards plus the 5 community cards determines the winner.</RuleBold>
        <RuleBold label="32-Card Stock">After the 10 hands are removed, 32 community cards remain. Five are dealt as community cards: Flop (3), Turn (1), and River (1).</RuleBold>
        <RuleBold label="Dynamic Odds">All odds are calculated from the remaining cards in the deck after the Flop. They update in real time as each card is revealed.</RuleBold>
      </Section>

      {/* The Ante */}
      <Section title="The Ante">
        <RuleBold label="Ante">Select a chip denomination and place your Ante, then press Deal. The Ante is your cost to see the Flop — it is not returned by default.</RuleBold>
        <RuleBold label="Dead Money">The Ante is dead money. It does not count toward any board bet or the River cap. You win it back only through the Ante return rules below.</RuleBold>
        <Rule>All subsequent bets are optional. You may place bets on any or all boards, or fold at any stage.</Rule>
      </Section>

      {/* After the Flop */}
      <Section title="After the Flop">
        <Rule>Once the Flop is dealt, the Card, Rank, and Color boards open for betting. All bets are optional — you may bet on one, some, or all three boards, or none at all.</Rule>
        <RuleBold label="Per-Board Cap">The total amount you can wager on each individual board cannot exceed your Ante. You may spread your wager across multiple positions within a board, but the combined total on that board is capped at the Ante.</RuleBold>
        <RuleBold label="Qualifying for Ante Return">
          To have a board count toward your Ante return, the full Ante amount must be placed on a single winning position on that board. Splitting the Ante across multiple positions — even if the total equals the Ante — will not qualify that board.
        </RuleBold>
        <RuleBold label="Card Board">Bet on which of the 10 fixed hands will win the round. Each hand has its own odds based on the Flop.</RuleBold>
        <RuleBold label="Rank Board">Bet on the poker rank of the winning hand (One Pair through Four of a Kind). Odds depend on the current board state.</RuleBold>
        <RuleBold label="Color Board">Bet on the exact number of Red or Black cards in the 5 community cards. Only one color side is live per round based on the Flop's composition.</RuleBold>
        <Rule>When you are satisfied with your bets, press Deal to reveal the Turn card.</Rule>
      </Section>

      {/* After the Turn — River */}
      <Section title="After the Turn — The River">
        <Rule>Once the Turn is dealt, the River board opens for betting. Betting the River is optional.</Rule>
        <RuleBold label="River Cap">You may wager up to the combined total of your Card, Rank, and Color bets. The Ante does not count toward this cap.</RuleBold>
        <RuleBold label="Qualifying for Ante Return">
          The same qualifying rule applies: the full Ante must be placed on a single winning River position for the River board to count toward your Ante return.
        </RuleBold>
        <RuleBold label="Low / High">Bet whether the River card will be Low (2 through 7) or High (8 through Ace). Odds are calculated from the remaining unseen cards.</RuleBold>
        <Rule>Press Deal to reveal the River card and resolve all boards.</Rule>
      </Section>

      {/* Resolution */}
      <Section title="Resolution">
        <Rule>All four boards resolve simultaneously when the River card is revealed.</Rule>
        <RuleBold label="Card Board">Pays if the hand you backed forms the highest 5-card poker hand. Payout is based on that hand's posted odds.</RuleBold>
        <RuleBold label="Rank Board">Pays if the winning hand achieves the rank you bet. Payout uses the odds posted for the actual winning hand.</RuleBold>
        <RuleBold label="Color Board">Pays based on the exact count of Red or Black cards across all 5 community cards. The count must match your bet exactly.</RuleBold>
        <RuleBold label="River Board">Pays based on whether the River card is Low (2–7) or High (8–A) and your selected side's posted odds.</RuleBold>
        <RuleBold label="Board Win">If the community board beats all 10 player hands, all Card and Rank bets lose. Color and River bets still resolve independently.</RuleBold>
      </Section>

      {/* RNG Bonus */}
      <Section title="Bonus Round">
        <Rule>During resolution, the game randomly highlights one Card Hand position, one Rank position, and one Color or River position.</Rule>
        <RuleBold label="Bonus Payout">
          If your winning bet lands on a highlighted position, that bet pays out at {bonusMults.card}× for Card Hands, {bonusMults.rank}× for Rank Hands, and {bonusMults.colorRiver}× for Color &amp; River — instead of its normal odds.
        </RuleBold>
        <Rule>A bet that loses does not receive a bonus payout, even if its position is highlighted.</Rule>
      </Section>

      {/* Ante Return — live from config */}
      <Section title="Ante Return">
        <Rule>The Ante is returned based on how many of the four boards (Card, Rank, Color, River) you qualify on — meaning the full Ante was placed on a single winning position.</Rule>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {tiers.map((tier, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 10px', borderRadius: 7,
              background: tier.kind === 'loss' ? 'rgba(180,40,40,0.12)' : tier.kind === 'bonus' ? 'rgba(197,160,89,0.1)' : 'rgba(100,116,139,0.08)',
              border: `1px solid ${tier.kind === 'loss' ? 'rgba(239,68,68,0.2)' : tier.kind === 'bonus' ? BORDER : 'rgba(100,116,139,0.15)'}`,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: tier.kind === 'loss' ? '#ff6b6b' : tier.kind === 'bonus' ? GOLD_BRIGHT : '#94a3b8',
              }}>
                {tier.range} {tier.boardWord}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: tier.kind === 'loss' ? '#ff6b6b' : tier.kind === 'bonus' ? '#22c55e' : '#94a3b8',
              }}>
                {tier.outcome}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Odds & RTP — placeholder for later */}
      <Section title="Odds &amp; RTP" defaultOpen={false}>
        <Rule style={{ color: MUTED, fontStyle: 'italic' }}>
          Odds and RTP information will be added in a future update.
        </Rule>
      </Section>

    </div>
  );
}
