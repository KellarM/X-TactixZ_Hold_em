// RNG Bonus sequence — pulse wave animation engine.
// Generates a back-and-forth bounce sequence for card hands (10 positions, 3 passes = 30 touches)
// and side bets (15 positions, 2 passes = 30 touches), both completing in ~10 seconds.
// Includes deceleration on the final settle steps, and lands on the RNG-chosen target.

import { useEffect, useRef, useCallback } from 'react';
import { playBing, playLand, playWin, playLose } from '@/lib/game/useBonusAudio';

// Generate a bouncing position sequence that ends on the target index.
// positionCount = 10 (cards) or 15 (side bets)
// totalBounceTouches = 30 (both)
// targetIdx = RNG-chosen landing position
function generateSequence(positionCount, totalBounceTouches, targetIdx) {
  const seq = [];
  let direction = 1;
  let pos = 0;

  for (let i = 0; i < totalBounceTouches; i++) {
    seq.push(pos);
    if (pos === positionCount - 1) direction = -1;
    if (pos === 0) direction = 1;
    pos += direction;
  }

  // After the bounce, add settle steps: smoothly step from the last bounce position
  // to the target, one position at a time.
  const lastPos = seq[seq.length - 1];
  const settleSteps = [];
  let cur = lastPos;
  while (cur !== targetIdx) {
    cur += (targetIdx > cur) ? 1 : -1;
    settleSteps.push(cur);
  }

  return [...seq, ...settleSteps];
}

// Compute the delay (ms) for each step in the sequence.
// Bounce phase: evenly spaced to fill bounceDuration ms.
// Settle phase: each step gets progressively longer (deceleration).
// Final landing hold: extra delay on the last step.
function computeDelays(seqLen, bounceTouches, bounceDuration = 8000) {
  const delays = [];
  const baseBounceDelay = bounceDuration / bounceTouches;

  for (let i = 0; i < seqLen; i++) {
    if (i < bounceTouches) {
      // Bounce phase — constant speed, with slight deceleration on last 5 bounces
      if (i >= bounceTouches - 5) {
        const decelFactor = 1 + (i - (bounceTouches - 5)) * 0.15;
        delays.push(baseBounceDelay * decelFactor);
      } else {
        delays.push(baseBounceDelay);
      }
    } else {
      // Settle phase — progressive deceleration
      const settleIdx = i - bounceTouches;
      delays.push(300 + settleIdx * 120);
    }
  }

  // Add a final hold on the landing position
  if (delays.length > 0) {
    delays[delays.length - 1] += 800;
  }

  return delays;
}

// Pitch for each touch — creates a "chasing" feel.
// Maps position index to a frequency that rises and falls, like the sound is moving.
function pitchForPosition(pos, positionCount, baseFreq = 600, range = 400) {
  // Sine wave from 0..PI based on position, giving a smooth rise and fall
  const normalized = pos / (positionCount - 1);
  const sine = Math.sin(normalized * Math.PI);
  return baseFreq + sine * range;
}

/**
 * BonusSequence — renders nothing visible. Orchestrates the pulse animation
 * by calling onPulse(cardPos, sidePos) on each tick, then onLand when both
 * sequences arrive at their targets, then onComplete after a brief hold.
 *
 * Props:
 *   cardIdx: 0-9  — RNG-chosen card hand bonus position
 *   sideIdx: 0-14 — RNG-chosen side bet bonus position
 *   onPulse: (cardPos, sidePos) => void
 *   onLand:  (cardPos, sidePos) => void
 *   onComplete: () => void
 *   soundEnabled: boolean
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

  // Clear all pending timers on unmount
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    completedRef.current = false;

    const cardSeq = generateSequence(10, 30, cardIdx);
    const sideSeq = generateSequence(15, 30, sideIdx);
    const cardDelays = computeDelays(cardSeq.length, 30, 8000);
    const sideDelays = computeDelays(sideSeq.length, 30, 8000);

    // Cumulative time trackers
    let cardTime = 0;
    let sideTime = 0;
    let landTime = 0;

    // Schedule card pulse touches
    cardDelays.forEach((delay, i) => {
      cardTime += delay;
      const t = setTimeout(() => {
        if (completedRef.current) return;
        onPulse(cardSeq[i], null);
        if (soundEnabled) {
          const pitch = pitchForPosition(cardSeq[i], 10);
          const isLast = i === cardSeq.length - 1;
          if (isLast) {
            playLand(pitch);
          } else {
            playBing(pitch, 0.06, 0.10);
          }
        }
      }, cardTime);
      timersRef.current.push(t);
    });

    // Schedule side bet pulse touches
    sideDelays.forEach((delay, i) => {
      sideTime += delay;
      const t = setTimeout(() => {
        if (completedRef.current) return;
        onPulse(null, sideSeq[i]);
        if (soundEnabled) {
          const pitch = pitchForPosition(sideSeq[i], 15, 500, 500);
          const isLast = i === sideSeq.length - 1;
          if (isLast) {
            playLand(pitch);
          } else {
            playBing(pitch, 0.06, 0.10);
          }
        }
      }, sideTime);
      timersRef.current.push(t);
    });

    // Schedule landing event — both sequences should be done by now
    landTime = Math.max(cardTime, sideTime);
    const landTimer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onLand(cardIdx, sideIdx);
    }, landTime);
    timersRef.current.push(landTimer);

    // Schedule completion callback — 1.5 seconds after landing
    const completeTimer = setTimeout(() => {
      onComplete();
    }, landTime + 1500);
    timersRef.current.push(completeTimer);

    return clearTimers;
  }, [cardIdx, sideIdx, onPulse, onLand, onComplete, soundEnabled, clearTimers]);

  return null; // This component renders nothing — it only orchestrates via callbacks
}
