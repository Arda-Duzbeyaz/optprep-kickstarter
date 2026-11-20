// A section is "ready" when its last N exam runs all meet the target in config.
import { timingAtLeastAsStrict } from '../../config/presets.js';
export function runMeetsTarget(run, target) {
  switch (target.metric) {
    case 'net': return run.score >= target.value;
    case 'netPct': return run.max > 0 && run.score / run.max >= target.value;
    case 'mean': return run.max > 0 && run.score / run.max >= target.value;
    default: throw new Error(`unknown metric ${target.metric}`);
  }
}

export function eligibleExam(run, exam) {
  return run.completePaper !== false && !run.repeatCount &&
    (!exam || (run.freshnessChecked === true && timingAtLeastAsStrict(run, exam)));
}

const ukDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' });
export const trainingDay = time => ukDate.format(time);

// Use the final eligible paper each day, so a rapid retry cannot add another day of evidence.
export function dailyExams(runs, exam) {
  const days = new Map();
  for (const r of runs) {
    if (r.mode !== 'exam' || !eligibleExam(r,exam) || !Number.isFinite(r.finishedAt) ||
        !Number.isFinite(r.score) || r.max !== r.timing?.count || !(r.max > 0)) continue;
    const day = trainingDay(r.finishedAt);
    if (!days.has(day) || r.finishedAt >= days.get(day).finishedAt) days.set(day,r);
  }
  return [...days.values()].sort((a,b) => a.finishedAt-b.finishedAt);
}

export function readiness(examRuns, target, window = 3, exam, separateDays = false) {
  const sorted = separateDays ? dailyExams(examRuns,exam) :
    examRuns.filter(r => eligibleExam(r, exam)).sort((a, b) => a.finishedAt - b.finishedAt);
  const recent = sorted.slice(-window);
  let streak = 0;
  for (let i = recent.length - 1; i >= 0 && runMeetsTarget(recent[i], target); i--) streak++;
  return { ready: recent.length === window && streak === window, streak, needed: window };
}

// Zap-N: a game result { metric, value } against ZAPN_TARGETS. "...Over" metrics
// count excess moves or guesses, so lower is better.
export function zapnMeets(result, target) {
  if (!result || result.metric !== target.metric) return false;
  return target.metric.endsWith('Over') ? result.value <= target.value : result.value >= target.value;
}

export function zapnReadiness(runs, target, window = 3) {
  const exams = runs.filter((r) => r.mode === 'exam').sort((a, b) => a.at - b.at).slice(-window);
  let streak = 0;
  for (let i = exams.length - 1; i >= 0 && zapnMeets(exams[i], target); i--) streak++;
  return { ready: exams.length === window && streak === window, streak, needed: window };
}
