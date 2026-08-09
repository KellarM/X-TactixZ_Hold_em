import React from 'react';
import PlayingCard from './PlayingCard';
import ToolBar from './ToolBar';

const CARD_TOKEN_REGEX = /(10|[2-9]|[AKQJ])([♠♥♦♣])/g;
const RED_SUITS = new Set(['♥', '♦']);

function renderColoredMessage(text) {
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  CARD_TOKEN_REGEX.lastIndex = 0;
  while ((match = CARD_TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    const isRed = RED_SUITS.has(match[2]);
    nodes.push(
      <span key={key++} style={{
        color: isRed ? '#ff4d4d' : '#000',
        textShadow: isRed
          ? '0 1px 2px rgba(0,0,0,0.85), 0 0 6px rgba(255,60,60,0.4)'
          : '0 1px 2px rgba(255,255,255,0.3)',
      }}>
        {match[0]}
      </span>
    );
    lastIndex = CARD_TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  return nodes;
}

// ── Community card layout ────────────────────────────────────────────────────
// 25% larger than original (56×80 → 70×100), content stays same size
const CARD_W = 70;
const CARD_H = 100;
const GAP = 10;        // gap between cards within the flop group (was 6)
const GROUP_GAP = 20;  // gap between flop/turn/river groups (was 14)
const LABEL_H = 18;
const LABEL_TOP_GAP = 6;

function CardSlot({ card, faceDown }) {
  if (!card || faceDown) {
    // CSS card back — no external image dependency
    return (
      <div style={{ width: CARD_W, height: CARD_H, flexShrink: 0 }}>
        <PlayingCard faceDown size="community" />
      </div>
    );
  }
  // Community cards: CSS/unicode-drawn (useImage={false}) — no external image loading
  return (
    <div style={{ width: CARD_W, height: CARD_H, flexShrink: 0 }}>
      <PlayingCard card={card} size="community" useImage={false} />
    </div>
  );
}

function CardGroup({ cards, indices, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: GAP }}>
        {indices.map((i) => (
          <CardSlot key={i} card={cards[i]} faceDown={!cards[i]} />
        ))}
      </div>
      <div style={{
        height: LABEL_H,
        marginTop: LABEL_TOP_GAP,
        fontSize: '0.65rem',
        fontWeight: 700,
        fontFamily: 'Oswald, sans-serif',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#e8b84b',
        textShadow: '0 0 2px #000, 1px 1px 2px #000, -1px -1px 2px #000, 2px 2px 0 #000',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
    </div>
  );
}

const LOGO_BADGE_URL = 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/7a23486be_xtactixz_template_badge.png';

function BrandLogo({ side = 'right' }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
      <img
        src={LOGO_BADGE_URL}
        alt="X-TactixZ Hold'em"
        style={{ width: 64, height: 'auto', display: 'block', borderRadius: 6, opacity: 0.92 }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}

export default function DealerArea({ statusMessage, community = [], phase }) {
  const cards = community;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>

      {/* ── Dealer Announcement bar — height: 32px exactly ── */}
      <div style={{
        height: 32,
        minHeight: 32,
        maxHeight: 32,
        width: '100%',
        flexShrink: 0,
        overflow: 'visible',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.5rem',
        border: '1px solid rgba(202,138,4,0.4)',
        background: 'linear-gradient(90deg, rgba(78,47,0,0.5) 0%, rgba(83,37,0,0.5) 100%)',
        boxSizing: 'border-box',
        padding: 0,
      }}>
        {statusMessage && (
          <span style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: '1.2rem',
            fontWeight: 700,
            fontStyle: 'italic',
            lineHeight: '32px',
            height: 32,
            transform: 'skewX(-8deg)',
            display: 'inline',
            color: '#f6d860',
            textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 6px rgba(180,130,40,0.4)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {renderColoredMessage(statusMessage)}
          </span>
        )}
      </div>

      {/* ── Community Cards area — height: 152px (unchanged), cards centred ── */}
      <div style={{
        height: 152,
        minHeight: 152,
        maxHeight: 152,
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',    // vertically centred — equal top/bottom spacing
        justifyContent: 'center', // horizontally centred — equal left/right spacing
        gap: '1rem',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: '0.75rem',
        border: '1.5px solid #C5A059',
        background: 'rgba(0,0,0,0.35)',
        boxSizing: 'border-box',
        overflow: 'visible',
        position: 'relative',
      }}>
        {/* ── Left side: Logo badge + ToolBar (hidden by default, summoned via Ctrl+Alt+J+L) ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 10,
          paddingLeft: 8,
          userSelect: 'none',
          minHeight: 0,
        }}>
          <img
            src={LOGO_BADGE_URL}
            alt="X-TactixZ Hold'em"
            style={{ width: 64, height: 'auto', display: 'block', borderRadius: 6, opacity: 0.92, flexShrink: 0 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <ToolBar />
        </div>

        {/* Card groups — Flop (3) + Turn (1) + River (1) — centred with proportional gaps */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: GROUP_GAP, flexShrink: 0 }}>
          <CardGroup cards={cards} indices={[0, 1, 2]} label="Flop" />
          <CardGroup cards={cards} indices={[3]} label="Turn" />
          <CardGroup cards={cards} indices={[4]} label="River" />
        </div>

        <BrandLogo side="right" />
      </div>

    </div>
  );
}
