// RNG Bonus sequence — random jump animation engine.
// Card hands: 10 positions, random jumps (never neighbor-to-neighbor), 30 touches, ~10 seconds.
// Side bets: 15 positions, random jumps, 30 touches, ~10 seconds.
// Both sequences SYNCHRONIZE their landing — the shorter one stretches its
// final hold so both arrive at their targets on the same tick.

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

  // Settle phase — smoothly approach target
  const settleSteps = [];
  let cur = seq[seq.length - 1];

  if (cur === targetIdx) {
    const fakeOut = Math.floor(Math.random() * positionCount);
    settleSteps.push(fakeOut);
    cur = fakeOut;
  }

  while (cur !== targetIdx) {
    cur += (targetIdx > cur) ? 1 : -1;
    settleSteps.push(cur);
  }

  return [...seq, ...settleSteps];
}

// Compute delays — constant during random phase, progressive during settle.
function computeDelays(seqLen, bounceTouches, bounceDuration = 8000) {
  const delays = [];
  const baseDelay = bounceDuration / bounceTouches;

  for (let i = 0; i < seqLen; i++) {
    if (i < bounceTouches) {
      if (i >= bounceTouches - 5) {
        const decelFactor = 1 + (i - (bounceTouches - 5)) * 0.2;
        delays.push(baseDelay * decelFactor);
      } else {
        delays.push(baseDelay * (0.85 + Math.random() * 0.3));
      }
    } else {
      const settleIdx = i - bounceTouches;
      delays.push(350 + settleIdx * 150);
    }
  }

  // Final landing hold
  if (delays.length > 0) {
    delays[delays.length - 1] += 900;
  }

  return delays;
}

function pitchForStep(pos, stepIdx, totalBounceTouches, seqLen, baseFreq = 700, range = 300) {
  if (stepIdx >= totalBounceTouches) {
    const settleProgress = (stepIdx - totalBounceTouches) / Math.max(1, seqLen - totalBounceTouches);
    return baseFreq + range * (1 - settleProgress);
  }
  const normalized = pos / 10;
  return baseFreq + normalized * range + (Math.random() - 0.5) * 80;
}

/**
 * BonusSequence — renders nothing visible. Orchestrates the pulse animation
 * by calling onPulse(cardPos, sidePos) on each tick, then onLand when both
 * sequences arrive at their targets simultaneously, then onComplete.
 *
 * SYNCHRONIZATION: Both sequences are generated independently, then the
 * shorter one's final hold delay is stretched so both land at the same
 * timestamp. One synchronized landing moment = one dramatic beat.
 */
export default function BonusSequence({
  cardIdx,
  sideIdx,
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

    const cardSeq = generateRandomJumpSequence(10, 30, cardIdx);
    const sideSeq = generateRandomJumpSequence(15, 30, sideIdx);
    let cardDelays = computeDelays(cardSeq.length, 30, 8000);
    let sideDelays = computeDelays(sideSeq.length, 30, 8000);

    // ── SYNCHRONIZE: stretch the shorter sequence's final hold ──
    const cardTotalTime = cardDelays.reduce((a, b) => a + b, 0);
    const sideTotalTime = sideDelays.reduce((a, b) => a + b, 0);
    const maxTime = Math.max(cardTotalTime, sideTotalTime);

    if (cardTotalTime < maxTime) {
      cardDelays[cardDelays.length - 1] += (maxTime - cardTotalTime);
    }
    if (sideTotalTime < maxTime) {
      sideDelays[sideDelays.length - 1] += (maxTime - sideTotalTime);
    }

    // Both now finish at exactly maxTime
    let cardTime = 0;
    let sideTime = 0;

    // ── Schedule card pulse touches ──
    cardDelays.forEach((delay, i) => {
      cardTime += delay;
      const isSettle = i >= 30;
      const settleIdx = i - 30;
      const settleTotal = cardSeq.length - 30;
      const t = setTimeout(() => {
        if (completedRef.current) return;
        onPulse(cardSeq[i], null);
        if (soundEnabled) {
          const isLast = i === cardSeq.length - 1;
          if (isLast) {
            playLand(1200, 0.20);
          } else if (isSettle) {
            playSettleTick(600, settleIdx, settleTotal, 0.10);
          } else {
            const pitch = pitchForStep(cardSeq[i], i, 30, cardSeq.length, 700, 300);
            playBing(pitch, 0.07, 0.12);
          }
        }
      }, cardTime);
      timersRef.current.push(t);
    });

    // ── Schedule side bet pulse touches ──
    sideDelays.forEach((delay, i) => {
      sideTime += delay;
      const isSettle = i >= 30;
      const settleIdx = i - 30;
      const settleTotal = sideSeq.length - 30;
      const t = setTimeout(() => {
        if (completedRef.current) return;
        onPulse(null, sideSeq[i]);
        if (soundEnabled) {
          const isLast = i === sideSeq.length - 1;
          if (isLast) {
            playLand(1000, 0.18);
          } else if (isSettle) {
            playSettleTick(500, settleIdx, settleTotal, 0.10);
          } else {
            const pitch = pitchForStep(sideSeq[i], i, 30, sideSeq.length, 500, 400);
            playBing(pitch, 0.07, 0.12);
          }
        }
      }, sideTime);
      timersRef.current.push(t);
    });

    // ── Synchronized landing event — both sequences arrive together ──
    const landTimer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onLand(cardIdx, sideIdx);
    }, maxTime);
    timersRef.current.push(landTimer);

    // ── Completion callback — show result overlay after landing hold ──
    // Extended by 3s (was 1500ms) so the win explode/glow is actually
    // visible before the result overlay covers it.
    const completeTimer = setTimeout(() => {
      onComplete();
    }, maxTime + 4500);
    timersRef.current.push(completeTimer);

    return clearTimers;
  }, [cardIdx, sideIdx, onPulse, onLand, onComplete, soundEnabled, clearTimers]);

  return null;
}
