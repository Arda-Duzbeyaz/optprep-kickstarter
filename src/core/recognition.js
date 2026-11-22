// Learning coverage is separate from cold performance. Checkpoints use the
// generator's real supported difficulty levels, not five invented repetitions.
export const COLD_STREAK = 3;
export const BTO_CHECKPOINT_MS = 75_000;
export const supportedLevels = (levels) => [...new Set((levels || []).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5))].sort((a, b) => a - b);

function streakAt(entry, level) {
  if (entry.streaks) return entry.streaks[level]?.length || 0;
  return entry.target === level ? Math.max(0, Math.min(COLD_STREAK - 1, entry.run || 0)) : 0;
}

export function recognitionProgress(entry = {}, levels = [1]) {
  entry ||= {};
  const available = supportedLevels(levels);
  if (!available.length) available.push(1);
  const passed = available.filter((n) => entry.passed?.includes(n));
  const review = available.filter((n) => passed.includes(n) && entry.review?.includes(n));
  const verified = passed.filter((n) => !review.includes(n));
  const target = review[0] ?? available.find((n) => !passed.includes(n)) ?? available.at(-1);
  const streak = streakAt(entry, target);
  return { levels: available, passed, verified, review, target, streak, remaining: COLD_STREAK - streak, attempts: entry.attempts || 0,
    streaks: Object.fromEntries(available.map((level) => [level, streakAt(entry, level)])),
    complete: verified.length === available.length && !review.length };
}

// Caller establishes a fresh, standard-time attempt. Beat the Odds tracks the
// actual difficulty because a timed paper can present any level of a skill.
export function recognitionStep(previous = {}, event, now = Date.now()) {
  previous ||= {};
  const { key, difficulty, levels, correct, skipped = false, hints = 0, ms, budgetMs,
    uninterrupted = true, aided = false, perDifficulty = false } = event;
  if (typeof key !== 'string' || !key || previous.keys?.includes(key)) return previous;
  const p = recognitionProgress(previous, levels);
  if (!p.levels.includes(difficulty)) return previous;
  const level = perDifficulty ? difficulty : p.target;
  const priorKeys = previous.streakKeys?.slice(0, previous.run || 0) || [];
  const streaks = { ...(previous.streaks || (previous.run && priorKeys.length ? { [previous.target]: priorKeys } : {})) };
  const next = { ...previous, passed: [...(previous.passed || [])], review: [...(previous.review || [])],
    keys: [...(previous.keys || []), key].slice(-128), attempts: (previous.attempts || 0) + 1,
    correct: (previous.correct || 0) + Number(!!correct && !hints), at: now };
  const atPace = Number.isFinite(ms) && ms > 0 && Number.isFinite(budgetMs) && budgetMs > 0 && ms <= budgetMs;
  const failed = aided ? 'help' : hints ? 'hint' : skipped ? 'skipped' : !correct ? 'incorrect'
    : !uninterrupted ? 'interrupted' : !atPace ? 'pace' : null;
  if (failed) {
    next.lastReason = failed;
    delete streaks[level];
    if (p.verified.includes(difficulty)) next.review.push(difficulty);
  } else if (difficulty !== level) {
    next.lastReason = 'other-difficulty';
  } else if (perDifficulty && p.verified.includes(difficulty)) {
    next.lastReason = 'maintained';
  } else {
    const keys = [...(streaks[level] || []), key];
    next.lastReason = 'qualifying';
    if (keys.length === COLD_STREAK) {
      if (!next.passed.includes(difficulty)) next.passed.push(difficulty);
      next.review = next.review.filter((n) => n !== difficulty);
      next.proofs = [...(previous.proofs || []), { difficulty, keys, at: now, budgetMs }].slice(-30);
      next.lastPassedAt = now; next.lastPassedDifficulty = difficulty; next.lastReason = 'passed';
      delete streaks[level];
    } else streaks[level] = keys;
  }
  next.target = recognitionProgress(next, levels).target;
  next.streakKeys = streaks[next.target] || [];
  next.run = next.streakKeys.length;
  if (perDifficulty) next.streaks = streaks;
  return next;
}

export function coverageInfo(coverage, legacy, recognition, stats) {
  const explicit = typeof coverage?.covered === 'boolean';
  const covered = explicit ? coverage.covered : (legacy?.lv || 0) >= 3 || !!recognition?.passed?.length;
  return { covered, started: covered || !!coverage || (stats?.n || 0) > 0,
    completedBlocks: coverage?.completedBlocks || 0, completedAt: coverage?.completedAt || null,
    learningAttempts: coverage?.attempts || 0, lastBlock: coverage?.lastBlock || null,
    mixedAttempts: coverage?.mixedAttempts || 0, revisionAttempts: coverage?.revisionAttempts || 0,
    source: explicit ? coverage.coveredBy === 'learning-block' ? 'completed learning block' : 'your coverage check'
      : (legacy?.lv || 0) >= 3 ? 'previous practice' : recognition?.passed?.length ? 'cold checkpoint' : null };
}
