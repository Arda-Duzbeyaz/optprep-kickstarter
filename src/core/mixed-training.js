// Selection evidence is separate from earned recognition, learning and scores.
// Coverage slots and weakness slots alternate across saved block boundaries.
import { practiceSuccess } from './check.js';
export const MIXED_EVIDENCE_VERSION = 1;
export const MIXED_ITEM_HISTORY_LIMIT = 1000;
const natural = (n) => Number.isSafeInteger(n) && n >= 0;
const record = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

export function validMixedTraining(value) {
  if (!record(value)) return false;
  return Object.entries(value).every(([section, state]) => /^[\w-]+$/.test(section) && record(state) && natural(state.turn) &&
    record(state.families) && Object.keys(state.families).length <= 200 && Object.entries(state.families).every(([id, row]) =>
      /^[\w-]+$/.test(id) && record(row) && natural(row.last) && row.last <= state.turn &&
      Number.isInteger(row.difficulty) && row.difficulty >= 1 && row.difficulty <= 5 &&
      natural(row.paceDebt) && row.paceDebt <= 4 && typeof row.lastKey === 'string' && row.lastKey.length <= 100));
}

export function recordMixedAttempt(previous, family, event) {
  const old = previous || { turn: 0, families: {} }, row = old.families[family];
  if (typeof event.key !== 'string' || !event.key || event.key.length > 100 ||
    !Number.isInteger(event.difficulty) || event.difficulty < 1 || event.difficulty > 5 || row?.lastKey === event.key) return old;
  const sameDifficulty = row?.difficulty === event.difficulty;
  let paceDebt = sameDifficulty ? row.paceDebt : 0;
  const independent = event.fresh && event.standardTime && !event.hints && !event.aided && event.uninterrupted;
  if (independent && event.correct && event.ms > 0 && event.budgetMs > 0) {
    paceDebt = event.ms > event.budgetMs ? Math.min(4, paceDebt + 1) : Math.max(0, paceDebt - 1);
  }
  return { turn: old.turn + 1, families: { ...old.families,
    [family]: { last: old.turn + 1, difficulty: event.difficulty, paceDebt, lastKey: event.key } } };
}

export function mixedWeights(base, evidence, recognition = {}, section = '') {
  return Object.fromEntries(Object.entries(base).map(([id, weight]) => {
    const row = evidence?.families?.[id], entry = recognition[`${section}:${id}`];
    const debt = row && (!entry?.target || entry.target === row.difficulty) ? row.paceDebt : 0;
    const review = entry?.review?.length ? 2 : 0;
    return [id, weight * (1 + Math.min(4, debt || 0) + review)];
  }));
}

export const isCoverageTurn = (evidence) => !!evidence && evidence.turn % 2 === 0;
export function oldestCandidates(ids, evidence) {
  const oldest = Math.min(...ids.map((id) => evidence?.families?.[id]?.last || 0));
  return ids.filter((id) => (evidence?.families?.[id]?.last || 0) === oldest);
}

export function independentAtPace(row) {
  return validMixedRow(row) && row.evidenceVersion === MIXED_EVIDENCE_VERSION && practiceSuccess(row.section, row) && !row.skipped && row.fresh && row.standardTime &&
    !row.hints && !row.aided && !row.interrupted && row.ms > 0 && row.budgetMs > 0 && row.ms <= row.budgetMs;
}

export function mixedSummary(rows) {
  const known = rows.filter((row) => validMixedRow(row) && row.evidenceVersion === MIXED_EVIDENCE_VERSION);
  return { total: rows.length, known: known.length, unknown: rows.length - known.length,
    correct: rows.filter((row) => row?.correct).length, independent: known.filter(independentAtPace).length,
    slow: known.filter((row) => row.ms > row.budgetMs).length,
    helped: known.filter((row) => row.aided || row.hints > 0).length,
    interrupted: known.filter((row) => row.interrupted).length,
    newBranches: known.filter((row) => row.structureStatus === 'unseen').length,
    unknownBranches: known.filter((row) => row.structureStatus === 'legacy-unknown').length };
}

export function validMixedRow(row) {
  if (!record(row)) return false;
  if (row.evidenceVersion === undefined) return true;
  return row.evidenceVersion === MIXED_EVIDENCE_VERSION && ['bto','nl','ll','iv','ob','mm'].includes(row.section) &&
    typeof row.key === 'string' && row.key.length > 0 && row.key.length <= 100 &&
    Number.isInteger(row.difficulty) && row.difficulty >= 1 && row.difficulty <= 5 &&
    typeof row.structure === 'string' && row.structure.length <= 1000 &&
    Array.isArray(row.operations) && row.operations.length <= 12 && row.operations.every((v) => typeof v === 'string' && v.length <= 100) &&
    ['unseen','seen','legacy-unknown'].includes(row.structureStatus) &&
    ['fresh','aided','interrupted','standardTime'].every((key) => typeof row[key] === 'boolean') &&
    Number.isFinite(row.budgetMs) && row.budgetMs > 0;
}

const EXTRA_FIELDS = ['evidenceVersion','section','key','difficulty','structure','operations','structureStatus','fresh','aided','interrupted','budgetMs','standardTime'];
// Remove only new, optional detail from old mixed rows. Original results remain.
export function boundMixedDetails(runs, limit = MIXED_ITEM_HISTORY_LIMIT) {
  let retained = 0;
  return [...runs].reverse().map((run) => {
    if (!Array.isArray(run.items)) return run;
    const items = [...run.items].reverse().map((row) => {
      if (row?.evidenceVersion !== MIXED_EVIDENCE_VERSION || retained++ < limit) return row;
      return Object.fromEntries(Object.entries(row).filter(([key]) => !EXTRA_FIELDS.includes(key)));
    }).reverse();
    return { ...run, items };
  }).reverse();
}
