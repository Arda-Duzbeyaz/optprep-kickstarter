export const INVITATION_DEADLINE = '2026-12-06T22:59:00.000Z';
export const DEFAULT_WEEKLY_HOURS = 8;
const DAY = 86400000;
export function preparationPlan(settings = {}, now = Date.now()) {
  const supplied = settings.assessmentDeadline;
  const parsed = typeof supplied === 'string' ? Date.parse(supplied) : NaN;
  const deadline = Number.isFinite(parsed) ? parsed : Date.parse(INVITATION_DEADLINE);
  const hours = Number(settings.weeklyPrepHours);
  const weeklyHours = hours > 0 && hours <= 40 ? hours : DEFAULT_WEEKLY_HOURS;
  const remaining = Math.max(0, deadline - now), days = Math.ceil(remaining / DAY);
  const phase = remaining === 0 ? 'due' : days > 14 ? 'learn-mix' : days > 4 ? 'timed-repair' : 'consolidate';
  const title = { due: 'Deadline reached', 'learn-mix': 'Build coverage and start mixing', 'timed-repair': 'Timed sections and targeted repair', consolidate: 'Consolidate and complete assessments' }[phase];
  const advice = { due: 'The preparation deadline has passed. Check your assessment portal for completion status.',
    'learn-mix': 'Learn a few skills with help, mark them covered, then test them in mixed batches. Do not wait for the entire syllabus before checking recognition.',
    'timed-repair': 'Give timed section attempts priority. Use mixed results to choose one weakness to repair, then test it again on a later day.',
    consolidate: 'Use short reviews and familiar routines. Complete your assessments with a buffer before the deadline; avoid an exhaustive last-minute syllabus pass.' }[phase];
  return { deadline, iso: new Date(deadline).toISOString(), days, weeklyHours, phase, title, advice,
    estimatedHours: Math.round(remaining / DAY / 7 * weeklyHours * 10) / 10 };
}

export function deadlineLabel(ms, zone = 'Europe/London') {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zone }).format(ms);
}
