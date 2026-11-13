// XP and skill levels. Levels 1-4 need three clean answers in a row (right, no hints,
// fresh question); level 5 needs three more inside the exam's time per question.
export const MAX_LEVEL = 5;
export const MAX_FREEZES = 2;
export const LEVEL_NAMES = ['New', 'Learning', 'Building accuracy', 'Practised', 'Consistent', 'At pace'];

export function levelProgress(m = {}) {
  const level = Math.max(0, Math.min(MAX_LEVEL, m.lv || 0));
  const streak = Math.max(0, Math.min(2, level < 4 ? m.run || 0 : m.prun || 0));
  return { level, label: LEVEL_NAMES[level], streak, remaining: level === MAX_LEVEL ? 0 : 3 - streak,
    next: level === MAX_LEVEL ? null : level + 1, paced: level === 4 };
}

// Separate evidence for recognising a method without a selected-family label.
// These are three fresh instances, not a claim of three different concepts.
export function mixedStep(previous = {}, { key, correct, hints = 0, ms, budgetMs, uninterrupted = true }, now = Date.now()) {
  const keys = Array.isArray(previous.keys) ? previous.keys : [];
  if (typeof key !== 'string' || keys.includes(key)) return previous;
  const qualifies = !!correct && !hints && uninterrupted && ms > 0 && budgetMs > 0 && ms <= budgetMs;
  const run = qualifies ? Math.min(3, (previous.run || 0) + 1) : 0;
  return { ...previous, run, attempts: (previous.attempts || 0) + 1, correct: (previous.correct || 0) + Number(qualifies),
    keys: [...keys, key].slice(-64), at: now, ...(run === 3 ? { metAt: now } : {}) };
}

export function xpFor(ev) {
  switch (ev.type) {
    case 'answer':
      if (ev.mode === 'exam' || !ev.correct || (ev.ms != null && ev.ms < 1500)) return 0;
      return ev.hints ? 1 : 2;
    case 'check': return ev.clean ? 1 : 0;
    case 'lesson-mastered': return 10;
    case 'review-passed': return 5;
    case 'checkpoint': return Math.max(0, Math.round(ev.net || 0)) + (ev.targetMet ? 10 : 0);
    case 'game': return 5;
    default: return 0;
  }
}

export function levelStep(m = { lv: 0, run: 0, prun: 0 }, { clean, paced }, now = Date.now()) {
  const next = { lv: m.lv || 0, run: m.run || 0, prun: m.prun || 0, at: now };
  if (!clean) return { ...next, run: 0, prun: 0 };
  if (next.lv < 4) {
    next.run += 1;
    if (next.run >= 3) { next.lv += 1; next.run = 0; }
    return next;
  }
  if (next.lv === 4) {
    next.prun = paced ? next.prun + 1 : 0;
    if (next.prun >= 3) { next.lv = MAX_LEVEL; next.prun = 0; }
  }
  return next;
}

// 'new' | 'learning' | 'needs-review' | 'mastered'. Review is due when the spaced-repetition
// box for the skill comes due (a miss drops it to box 1, due at once).
export function skillState(m, srsEntry, now = Date.now()) {
  if (!m || (!m.lv && !m.run)) return 'new';
  if (srsEntry && srsEntry.box < 5 && srsEntry.due <= now && m.lv > 0) return 'needs-review';
  return m.lv >= MAX_LEVEL ? 'mastered' : 'learning';
}
