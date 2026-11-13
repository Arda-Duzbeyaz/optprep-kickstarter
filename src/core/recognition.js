// Learning coverage is separate from cold performance. Checkpoints use the
// generator's real supported difficulty levels, not five invented repetitions.
export const COLD_STREAK = 3;
export const supportedLevels = (levels) => [...new Set((levels || []).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5))].sort((a, b) => a - b);

export function recognitionProgress(entry = {}, levels = [1]) {
  entry ||= {};
  const available = supportedLevels(levels);
  if (!available.length) available.push(1);
  const passed = available.filter((n) => entry.passed?.includes(n));
  const review = available.filter((n) => passed.includes(n) && entry.review?.includes(n));
  const verified = passed.filter((n) => !review.includes(n));
  const target = review[0] ?? available.find((n) => !passed.includes(n)) ?? available.at(-1);
  const streak = entry.target === target ? Math.max(0, Math.min(2, entry.run || 0)) : 0;
  return { levels: available, passed, verified, review, target, streak, remaining: COLD_STREAK - streak,
    complete: verified.length === available.length && !review.length };
}

// Caller establishes a mixed, fresh, standard-time attempt. A per-skill streak
// survives questions on other skills, but a failed attempt on this skill resets it.
export function recognitionStep(previous = {}, event, now = Date.now()) {
  previous ||= {};
  const { key, difficulty, levels, correct, hints = 0, ms, budgetMs, uninterrupted = true, aided = false } = event;
  if (typeof key !== 'string' || !key || previous.keys?.includes(key)) return previous;
  const p = recognitionProgress(previous, levels);
  if (!p.levels.includes(difficulty)) return previous;
  const next = { ...previous, passed: [...p.passed], review: [...p.review], target: p.target, run: p.streak,
    streakKeys: [...(previous.target === p.target ? previous.streakKeys || [] : [])],
    keys: [...(previous.keys || []), key].slice(-128), attempts: (previous.attempts || 0) + 1,
    correct: (previous.correct || 0) + Number(!!correct && !hints), at: now };
  const qualifies = !!correct && !hints && !aided && uninterrupted && Number.isFinite(ms) && ms > 0 && Number.isFinite(budgetMs) && budgetMs > 0 && ms <= budgetMs;
  next.lastReason = aided ? 'help' : hints ? 'hint' : !correct ? 'incorrect' : !uninterrupted ? 'interrupted'
    : !(ms > 0 && budgetMs > 0 && ms <= budgetMs) ? 'pace' : difficulty !== p.target ? 'other-difficulty' : 'qualifying';
  if (!qualifies) {
    next.run = 0; next.streakKeys = [];
    if (p.passed.includes(difficulty) && !next.review.includes(difficulty)) next.review.push(difficulty);
    next.target = recognitionProgress(next, levels).target;
    return next;
  }
  if (difficulty !== p.target) return next;
  next.run++; next.streakKeys.push(key);
  if (next.run === COLD_STREAK) {
    if (!next.passed.includes(difficulty)) next.passed.push(difficulty);
    next.review = next.review.filter((n) => n !== difficulty);
    next.proofs = [...(previous.proofs || []), { difficulty, keys: [...next.streakKeys], at: now, budgetMs }].slice(-30);
    next.lastPassedAt = now; next.lastPassedDifficulty = difficulty; next.lastReason = 'passed';
    next.run = 0; next.streakKeys = []; next.target = recognitionProgress(next, levels).target;
  }
  return next;
}

export function coverageInfo(coverage, legacy, recognition, stats) {
  const explicit = typeof coverage?.covered === 'boolean';
  const covered = explicit ? coverage.covered : (legacy?.lv || 0) >= 3 || !!recognition?.passed?.length;
  return { covered, started: covered || !!coverage || (stats?.n || 0) > 0,
    source: explicit ? 'your coverage check' : (legacy?.lv || 0) >= 3 ? 'previous practice' : recognition?.passed?.length ? 'mixed checkpoint' : null };
}
