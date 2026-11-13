// Ordinary practice is a bounded, resumable block. Timed assessments use their
// existing runner and clocks. Untrusted imports must not restore broken controls.
import { validateItem } from './contract.js';
import { checkItem } from './check.js';

export const PRACTICE_BLOCK_SIZE = 10;
export const DRILL_COUNT = 10;
export const PRACTICE_VERSION = 1;
const record = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const finite = (n) => Number.isFinite(n) && n >= 0;

export function practiceHref(session) {
  return `#/run/${session.section}/practice${session.family ? `/${session.family}` : ''}`;
}

export function validResponse(item, response, { draft = false } = {}) {
  if (response == null) return draft;
  if (!record(response)) return false;
  if (response.skip === true) return !draft;
  if (item.kind === 'mcq') return Number.isInteger(response.choice) && response.choice >= 0 && response.choice < item.options.length;
  if (item.kind === 'rank') return Array.isArray(response.order) && response.order.length === item.statements.length &&
    new Set(response.order).size === response.order.length && response.order.every((v) => Number.isInteger(v) && v >= 0 && v < item.statements.length);
  if (item.kind === 'interval') return ['lower', 'upper'].every((k) => draft
    ? (response[k] === '' || typeof response[k] === 'string' && Number.isFinite(Number(response[k])) || Number.isFinite(response[k]))
    : Number.isFinite(response[k]));
  if (item.kind === 'orderbook') return Array.isArray(response.trades) && response.trades.length <= 1000 && response.trades.every((t) =>
    record(t) && ['buy', 'sell'].includes(t.side) && item.board.instruments.some((ins) => ins.id === t.id));
  return false;
}

export function validPractice(s, section = s?.section) {
  try {
    if (!record(s) || s.version !== PRACTICE_VERSION || s.section !== section ||
      !(s.family == null || typeof s.family === 'string' && /^[\w-]+$/.test(s.family)) ||
      !(typeof s.seed === 'string' || Number.isFinite(s.seed)) ||
      !Number.isInteger(s.rngState) || s.rngState < 0 || s.rngState > 0xffffffff ||
      !Number.isInteger(s.count) || s.count < 1 || s.count > 100 ||
      !Number.isInteger(s.index) || s.index < 0 || s.index >= s.count ||
      !Array.isArray(s.log) || !finite(s.xp0) || !record(s.lv0) || !finite(s.savedAt)) return false;
    const c = s.current, item = c?.item;
    if (!record(c) || !record(item) || item.section !== section || (s.family && item.family !== s.family) || validateItem(item).length ||
      typeof c.fresh !== 'boolean' || typeof c.done !== 'boolean' || !finite(c.elapsedMs) ||
      (c.interrupted !== undefined && typeof c.interrupted !== 'boolean') ||
      !Number.isInteger(c.hints) || c.hints < 0 || c.hints > item.hints.length ||
      !Number.isFinite(c.budgetMs) || c.budgetMs <= 0 || !validResponse(item, c.draft, { draft: true }) ||
      s.log.length !== s.index + Number(c.done) || s.log.some((r) => !record(r) || typeof r.family !== 'string' ||
        typeof r.correct !== 'boolean' || !Number.isFinite(r.score) || !finite(r.ms) || !Number.isInteger(r.hints) || r.hints < 0)) return false;
    if (c.done) {
      if (!validResponse(item, c.response)) return false;
      const result = checkItem(item, c.response), last = s.log.at(-1);
      if (last.family !== item.family || last.correct !== result.correct || Math.abs(last.score - result.score) > 1e-9 || last.hints !== c.hints || last.ms !== c.elapsedMs) return false;
    }
    return true;
  } catch { return false; }
}

// A partial run cannot pass the ten-question checkpoint. A legacy run retaining
// all ten answers is sufficient completion evidence; its history is preserved.
export function drillPassed(run) {
  return run?.mode === 'drill' && run.completed !== false && (run.plannedCount ?? DRILL_COUNT) === DRILL_COUNT &&
    run.max === DRILL_COUNT && Number.isFinite(run.score) && run.score <= run.max && Array.isArray(run.items) && run.items.length === DRILL_COUNT &&
    run.items.every((r) => Number.isFinite(r.score) && r.score >= -1 && r.score <= 1) &&
    Math.abs(run.items.reduce((n, r) => n + r.score, 0) - run.score) < 1e-6 && run.score / run.max >= .7;
}
