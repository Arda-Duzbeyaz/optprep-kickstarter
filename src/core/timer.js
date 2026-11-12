// Countdown with an injectable clock so exam timing is testable.
// Both clocks apply when a section has an overall deadline and an item deadline.
export function examClockStatus(total, item) {
  const remaining = Math.min(total?.remaining() ?? Infinity, item?.remaining() ?? Infinity);
  return { remaining: Number.isFinite(remaining) ? remaining : 0,
    expired: total?.expired() ? 'total' : item?.expired() ? 'item' : null };
}

export function makeCountdown(ms, now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
  let start = now();
  let penalty = 0;
  const remaining = () => Math.max(0, ms - (now() - start) - penalty);
  return {
    remaining,
    elapsed: () => now() - start,
    expired: () => remaining() <= 0,
    penalize: (p) => { penalty += p; },
    restart: () => { start = now(); penalty = 0; },
  };
}
