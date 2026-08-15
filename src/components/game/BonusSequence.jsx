// RNG Bonus sequence — 3 separate bonus areas with random jump animation.
// Area 1: Card Hands (10 positions, ×5 multiplier)
// Area 2: Rank Hands (7 positions, ×4 multiplier)
// Area 3: Color + River (8 positions, ×3 multiplier)
// All 3 sequences SYNCHRONIZE their landing — shorter ones stretch their
// final hold so all arrive at their targets on the same tick.
//
// SPEED FIX: The animation quickens up at the end and stops sharply.
// No more slow-then-slower deceleration — the final bounces accelerate
// into a fast snap landing.

import { useEffect, useRef, useCallback } from 'react';
import { playBing, playSettleTick, playLand, playWin, playLose } from '@/lib/game/useBonusAudio';

// Generate a RANDOM JUMP sequence — each position is randomly chosen,
// but never the same as the previous one or its immediate neighbor.
function generateRandomJumpSequence(positionCount, totalTouches, targetIdx) {
  const seq = [];
  let prev = -1;

  for (let i = 0; i < totalTouches; i++) {
    let next;
    let attempts = 0;
    do {
      next = Math.floor(Math.random() * positionCount);
      attempts++;
    } while (
      attempts < 20 &&
      (next === prev ||
       next === prev - 1 ||
       next === prev + 1)
    );
    seq.push(next);
    prev = next;
  }

  // Fast snap to target — at most 1-2 quick hops, then LAND
  const settleSteps = [];
  let cur = seq[seq.length - 1];

  if (cur === targetIdx) {
    // Already at target — one fake-out hop then back
    const fakeOut = Math.floor(Math.random() * positionCount);
    settleSteps.push(fakeOut);
    settleSteps.push(targetIdx);
  } else {
    // Direct path — step toward target, but FAST
    while (cur !== targetIdx) {
      cur += (targetIdx > cur) ? 1 : -1;
      settleSteps.push(cur);
    }
  }

  return [...seq, ...settleSteps];
}

// Compute delays — ACCELERATING end, not decelerating.
// Bounce phase: constant speed, last 4 touches get FASTER.
// Settle phase: quick steps, each faster than the last — snap to target.
function computeDelays(seqLen, bounceTouches, bounceDuration = 5500) {
  const delays = [];
  const baseDelay = bounceDuration / bounceTouches;

  for (let i = 0; i < seqLen; i++) {
    if (i < bounceTouches) {
      if (i >= bounceTouches - 4) {
        // ACCELERATE: last 4 bounces get progressively faster
        // 0.85x, 0.70x, 0.55x, 0.40x — quickening into the settle
        const accelFactor = 1 - (i - (bounceTouches - 4)) * 0.08;
        delays.push(baseDelay * Math.max(0.55, accelFactor));
      } else {
        delays.push(baseDelay * (0.85 + Math.random() * 0.3));
      }
    } else {
      // Settle: fast steps, each QUICKER than the last — sharp snap
      const settleIdx = i - bounceTouches;
      delays.push(Math.max(100, 280 - settleIdx * 30));
    }
  }

  // Final landing hold — short and sharp
  if (delays.length > 0) {
    delays[delays.length - 1] += 700;
  }

  return delays;
}

function pitchForStep(pos, positionCount, stepIdx, totalBounceTouches, seqLen, baseFreq = 700, range = 300) {
  if (stepIdx >= totalBounceTouches) {
    // Settle phase — rising pitch as it snaps to target
    const settleProgress = (stepIdx - totalBounceTouches) / Math.max(1, seqLen - totalBounceTouches);
    return baseFreq + range * (1 + settleProgress * 0.5);
  }
  const normalized = pos / Math.max(1, positionCount - 1);
  return baseFreq + normalized * range + (Math.random() - 0.5) * 80;
}

/**
 * BonusSequence — renders nothing visible. Orchestrates the pulse animation
 * by calling onPulse(cardPos, rankPos, colorRiverPos) on each tick, then onLand
 * when all 3 sequences arrive at their targets simultaneously, then onComplete.
 */
export default function BonusSequence({
  cardIdx,
  rankIdx,
  colorRiverIdx,
  onPulse,
  onLand,
  onComplete,
  soundEnabled = true,
}) {
  const timersRef = useRef([]);
  const completedRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    completedRef.current = false;

    const BOUNCE_TOUCHES = 16;
    const BOUNCE_DURATION = 8000;

    // Generate 3 independent sequences
    const cardSeq = generateRandomJumpSequence(10, BOUNCE_TOUCHES, cardIdx);
    const rankSeq = generateRandomJumpSequence(7, BOUNCE_TOUCHES, rankIdx);
    const colorRiverSeq = generateRandomJumpSequence(8, BOUNCE_TOUCHES, colorRiverIdx);

    let cardDelays = computeDelays(cardSeq.length, BOUNCE_TOUCHES, BOUNCE_DURATION);
    let rankDelays = computeDelays(rankSeq.length, BOUNCE_TOUCHES, BOUNCE_DURATION);
    let colorRiverDelays = computeDelays(colorRiverSeq.length, BOUNCE_TOUCHES, BOUNCE_DURATION);

    // ── SYNCHRONIZE: stretch shorter sequences so all 3 land together ──
    const cardTime = cardDelays.reduce((a, b) => a + b, 0);
    const rankTime = rankDelays.reduce((a, b) => a + b, 0);
    const colorRiverTime = colorRiverDelays.reduce((a, b) => a + b, 0);
    const maxTime = Math.max(cardTime, rankTime, colorRiverTime);

    if (cardTime < maxTime) cardDelays[cardDelays.length - 1] += (maxTime - cardTime);
    if (rankTime < maxTime) rankDelays[rankDelays.length - 1] += (maxTime - rankTime);
    if (colorRiverTime < maxTime) colorRiverDelays[colorRiverDelays.length - 1] += (maxTime - colorRiverTime);

    // ── Schedule card pulse touches ──
    let cardTimeAcc = 0;
    cardDelays.forEach((delay, i) => {
      cardTimeAcc += delay;
      const isSettle = i >= BOUNCE_TOUCHES;
      const settleIdx = i - BOUNCE_TOUCHES;
      const settleTotal = cardSeq.length - BOUNCE_TOUCHES;
      const t = setTimeout(() => {
        if (completedRef.current) return;
        onPulse(cardSeq[i], null, null);
        if (soundEnabled) {
          const isLast = i === cardSeq.length - 1;
          if (isLast) {
            playLand(1200, 0.20);
          } else if (isSettle) {
            playSettleTick(600, settleIdx, settleTotal, 0.08);
          } else {
            const pitch = pitchForStep(cardSeq[i], 10, i, BOUNCE_TOUCHES, cardSeq.length, 700, 300);
            playBing(pitch, 0.07, 0.12);
          }
        }
      }, cardTimeAcc);
      timersRef.current.push(t);
    });

    // ── Schedule rank pulse touches ──
    let rankTimeAcc = 0;
    rankDelays.forEach((delay, i) => {
      rankTimeAcc += delay;
      const isSettle = i >= BOUNCE_TOUCHES;
      const settleIdx = i - BOUNCE_TOUCHES;
      const settleTotal = rankSeq.length - BOUNCE_TOUCHES;
      const t = setTimeout(() => {
        if (completedRef.current) return;
        onPulse(null, rankSeq[i], null);
        if (soundEnabled) {
          const isLast = i === rankSeq.length - 1;
          if (isLast) {
            playLand(1000, 0.18);
          } else if (isSettle) {
            playSettleTick(550, settleIdx, settleTotal, 0.08);
          } else {
            const pitch = pitchForStep(rankSeq[i], 7, i, BOUNCE_TOUCHES, rankSeq.length, 600, 350);
            playBing(pitch, 0.07, 0.12);
          }
        }
      }, rankTimeAcc);
      timersRef.current.push(t);
    });

    // ── Schedule color+river pulse touches ──
    let crTimeAcc = 0;
    colorRiverDelays.forEach((delay, i) => {
      crTimeAcc += delay;
      const isSettle = i >= BOUNCE_TOUCHES;
      const settleIdx = i - BOUNCE_TOUCHES;
      const settleTotal = colorRiverSeq.length - BOUNCE_TOUCHES;
      const t = setTimeout(() => {
        if (completedRef.current) return;
        onPulse(null, null, colorRiverSeq[i]);
        if (soundEnabled) {
          const isLast = i === colorRiverSeq.length - 1;
          if (isLast) {
            playLand(800, 0.16);
          } else if (isSettle) {
            playSettleTick(500, settleIdx, settleTotal, 0.08);
          } else {
            const pitch = pitchForStep(colorRiverSeq[i], 8, i, BOUNCE_TOUCHES, colorRiverSeq.length, 500, 400);
            playBing(pitch, 0.07, 0.12);
          }
        }
      }, crTimeAcc);
      timersRef.current.push(t);
    });

    // ── Synchronized landing — all 3 sequences arrive together ──
    const landTimer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onLand(cardIdx, rankIdx, colorRiverIdx);
    }, maxTime);
    timersRef.current.push(landTimer);

    // ── Completion callback — show result overlay after short landing hold ──
    const completeTimer = setTimeout(() => {
      onComplete();
    }, maxTime + 4500);
    timersRef.current.push(completeTimer);

    return clearTimers;
  }, [cardIdx, rankIdx, colorRiverIdx, onPulse, onLand, onComplete, soundEnabled, clearTimers]);

  return null;
}
