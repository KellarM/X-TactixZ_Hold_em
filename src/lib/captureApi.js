// API client for the Certification Test capture system.
// Calls Base44 backend functions deployed on the Superagent.

const CAPTURE_URL = 'https://veronica-vale-8515a406.base44.app/functions/captureHand';
const FETCH_URL  = 'https://veronica-vale-8515a406.base44.app/functions/getCapturedHands';

/**
 * Send a resolved hand's data to the entity database.
 * Called automatically after every River resolution.
 */
export async function captureHand(handData) {
  try {
    const res = await fetch(CAPTURE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handData),
    });
    return await res.json();
  } catch (err) {
    console.error('[Capture] Failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Fetch all captured hands with accumulated RTP statistics.
 * Called when the Certification Test modal opens.
 */
export async function fetchCapturedHands() {
  try {
    const res = await fetch(FETCH_URL, { method: 'GET' });
    return await res.json();
  } catch (err) {
    console.error('[Capture] Fetch failed:', err);
    return { totalHands: 0, hands: [], averages: { threeBoardBlended: 0, totalBlended: 0 } };
  }
}

/**
 * Recalculate payouts and RTP for a captured hand under new house edge values.
 * Pure math — no server call needed.
 *
 * @param {object} hand — A captured hand record with winning positions per board.
 * @param {number} heCard — New house edge for Card board (0–1).
 * @param {number} heRank — New house edge for Rank board (0–1).
 * @param {number} heColor — New house edge for Color board (0–1).
 * @returns {object} Recalculated RTPs per board + blended values.
 */
export function recalcHandRtp(hand, heCard, heRank) {
  const HE_COLOR = 0.04; // Color board HE is LOCKED at 4% (96% RTP)
  const HE_RIVER = 0.08; // River board HE is LOCKED at 8% (92% RTP)

  // Card board — 0 if board won (no card winner), else 1 - newHE
  const cardRtp = (hand.cardWinners && hand.cardWinners.length > 0)
    ? 1 - heCard
    : 0;

  // Rank board — 0 if board won, else 1 - newHE
  const rankRtp = (hand.rankWinners && hand.rankWinners.length > 0)
    ? 1 - heRank
    : 0;

  // Color board — LOCKED, always has a winner, RTP = 1 - HE_COLOR = 96%
  const colorRtp = 1 - HE_COLOR;

  // River board — fixed, uses its own HE
  const riverRtp = 1 - HE_RIVER;

  const threeBoardBlended = (cardRtp + rankRtp + colorRtp) / 3;
  const totalBlended = (cardRtp + rankRtp + colorRtp + riverRtp) / 4;

  return {
    cardRtp,
    rankRtp,
    colorRtp,
    riverRtp,
    threeBoardBlended,
    totalBlended,
  };
}

/**
 * Recalculate what each winning position's payout WOULD be under new HE.
 * payout = (1 - HE) / p - 1
 */
export function recalcPayout(probability, houseEdge) {
  if (probability <= 0) return 0;
  return (1 - houseEdge) / probability - 1;
}
