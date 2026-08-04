// RNG Bonus sequence — random jump animation engine.
// Card hands: 10 positions, random jumps (never neighbor-to-neighbor), 30 touches, ~10 seconds.
// Side bets: 15 positions, random jumps, 30 touches, ~10 seconds.
// Both land on the RNG-chosen target with deceleration on the final steps.

import { useEffect, useRef, useCallback } from 'react';
import { playBing, playLand, playWin, playLose } from '@/lib/game/useBonusAudio';

// Generate a RANDOM JUMP sequence — each position is randomly chosen,
// but never the same as the previous one or its immediate neighbor.
// This creates a "jumping around" feel rather than a sequential sweep.
// The sequence ends on the target with smooth deceleration steps.
function generateRandomJumpSequence(positionCount, totalTouches, targetIdx) {
  const seq = [];
  let prev = -1; // no previous at start

  for (let i = 0; i < totalTouches; i++) {
    let next;
    let attempts = 0;
    do {
      next = Math.floor(Math.random() * positionCount);
      attempts++;
      // Avoid: same as previous, or immediate neighbor of previous
      // (unless we've tried too many times — then allow it)
    } while (
      attempts < 20 &&
      (next === prev ||
       next === prev - 1 ||
       next === prev + 1)
    );
    seq.push(next);
    prev = next;
  }

  // After the random jumps, add a "settle" phase that smoothly lands on the target.
  // Pick 3-5 steps that approach the target with decreasing distance.
  const settleSteps = [];
  let cur = seq[seq.length - 1];

  // If we're already on target, add a couple of fake-out jumps first
  if (cur === targetIdx) {
    // Jump to a random spot, then come back to target
    const fakeOut = Math.floor(Math.random() * positionCount);
    settleSteps.push(fakeOut);
    cur = fakeOut;
  }

  // Step toward target one position at a time
  while (cur !== targetIdx) {
    cur += (targetIdx > cur) ? 1 : -1;
    settleSteps.push(cur);
  }

  return [...seq, ...settleSteps];
}

// Compute delays for each step — constant during random phase,
// progressively longer during settle phase (deceleration).
function computeDelays(seqLen, bounceTouches, bounceDuration = 8000) {
  const delays = [];
  const baseDelay = bounceDuration / bounceTouches;

  for (let i = 0; i < seqLen; i++) {
    if (i < bounceTouches) {
      // Random jump phase — mostly constant, slight randomization for organic feel
      if (i >= bounceTouches - 5) {
        // Slight deceleration on last 5 jumps before settle
        const decelFactor = 1 + (i - (bounceTouches - 5)) * 0.2;
        delays.push(baseDelay * decelFactor);
      } else {
        delays.push(baseDelay * (0.85 + Math.random() * 0.3)); // ±15% randomization
      }
    } else {
      // Settle phase — progressive deceleration
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

// Pitch for each touch — random jumps get random pitches within a range,
// settle steps get a descending pitch (winding down toward landing).
function pitchForStep(pos, stepIdx, totalBounceTouches, seqLen, baseFreq = 700, range = 300) {
  if (stepIdx >= totalBounceTouches) {
    // Settle phase — descending pitch
    const settleProgress = (stepIdx - totalBounceTouches) / Math.max(1, seqLen - totalBounceTouches);
    return baseFreq + range * (1 - settleProgress);
  }
  // Random jump phase — pitch based on position (higher position = higher pitch)
  const normalized = pos / 10; // approximate
  return baseFreq + normalized * range + (Math.random() - 0.5) * 80;
}

/**
 * BonusSequence — renders nothing visible. Orchestrates the pulse animation
 * by calling onPulse(cardPos, sidePos) on each tick, then onLand when both
 * sequences arrive at their targets, then onComplete after a brief hold.
 *
 * Card hands use RANDOM JUMPS (never neighbor-to-neighbor).
 * Side bets use RANDOM JUMPS (never neighbor-to-neighbor).
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

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    completedRef.current = false;

    const cardSeq = generateRandomJumpSequence(10, 30, cardIdx);
    const sideSeq = generateRandomJumpSequence(15, 30, sideIdx);
    const cardDelays = computeDelays(cardSeq.length, 30, 8000);
    const sideDelays = computeDelays(sideSeq.length, 30, 8000);

    let cardTime = 0;
    let sideTime = 0;

    // Schedule card pulse touches
    cardDelays.forEach((delay, i) => {
      cardTime += delay;
      const t = setTimeout(() => {
        if (completedRef.current) return;
        onPulse(cardSeq[i], null);
        if (soundEnabled) {
          const pitch = pitchForStep(cardSeq[i], i, 30, cardSeq.length, 700, 300);
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
          const pitch = pitchForStep(sideSeq[i], i, 30, sideSeq.length, 500, 400);
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

    // Schedule landing event
    const landTime = Math.max(cardTime, sideTime);
    const landTimer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onLand(cardIdx, sideIdx);
    }, landTime);
    timersRef.current.push(landTimer);

    // Schedule completion callback
    const completeTimer = setTimeout(() => {
      onComplete();
    }, landTime + 1500);
    timersRef.current.push(completeTimer);

    return clearTimers;
  }, [cardIdx, sideIdx, onPulse, onLand, onComplete, soundEnabled, clearTimers]);

  return null;
}
