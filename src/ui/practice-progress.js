import { h } from './dom.js';
import { bubbles } from './sheet.js';
import { levelProgress, LEVEL_NAMES } from '../core/progression.js';
import { practiceHref } from '../core/practice.js';
import { familyTitle } from '../sections/catalog.js';
import { SECTIONS } from '../../config/sections.js';

export function levelLabel(m) {
  const p = levelProgress(m);
  return h('span', { class: 'skill-level-label' }, `Level ${p.level}/5 · ${p.label}`);
}

export function nextLevelText(m) {
  const p = levelProgress(m);
  return p.next ? `${p.streak}/3 towards Level ${p.next}${p.paced ? ' · at pace' : ''}` : 'All five practice levels reached';
}

export function skillProgress(store, section, family, { budgetMs, notice } = {}) {
  const key = `${section}:${family}`, m = store.mastery()[key], p = levelProgress(m);
  const evidence = store.mixedEvidence?.()[key], mixed = Math.min(3, evidence?.run || 0);
  const met = p.level === 5 && mixed === 3;
  return h('section', { class: 'skill-progress', 'aria-label': 'Skill progress' },
    h('div', { class: 'row skill-progress-head' }, h('strong', {}, familyTitle(section, family)),
      met ? h('span', { class: 'stamp stamp-mastered' }, 'Training goal met') : null),
    notice ? h('p', { class: 'skill-notice', role: 'status' }, notice) : null,
    h('div', { class: 'skill-progress-grid' },
      h('div', {}, h('span', { class: 'small-note muted' }, 'Practice level'),
        h('div', { class: 'row' }, bubbles(5, p.level), levelLabel(m)),
        h('p', { class: 'small-note' }, nextLevelText(m)),
        p.next ? h('p', { class: 'small-note muted' }, `${p.remaining} more correct, fresh, unhinted answer${p.remaining === 1 ? '' : 's'} in a row${p.paced ? ` within ${Number((budgetMs / 1000).toFixed(2))} seconds each` : ''}.`) : null),
      h('div', {}, h('span', { class: 'small-note muted' }, 'Mixed-practice check'),
        h('p', { class: 'num' }, `${mixed}/3`, mixed === 3 ? ' · Check met' : evidence?.attempts ? ' · Building evidence' : ' · Not checked yet'),
        h('p', { class: 'small-note muted' }, 'Fresh questions, no topic label or hints, uninterrupted and within practice pace. Selected-topic practice does not count.'))),
    h('p', { class: 'small-note muted skill-meaning' }, 'Level 3 = practised; Level 5 = at pace. Both Level 5 and the mixed check meet this app’s training goal. Test broader reasoning in ', h('a', { href: '#/transfer' }, 'Transfer Challenge'), '.'));
}

export function levelGuide() {
  return h('details', { class: 'level-guide' }, h('summary', {}, 'How levels and skill checks work'),
    h('p', {}, 'The five bubbles are practice levels for each skill. Every submitted answer updates the counter immediately; it continues across sessions.'),
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Level'), h('th', {}, 'Milestone'), h('th', {}, 'To earn it'))),
      h('tbody', {}, LEVEL_NAMES.map((name, i) => h('tr', {}, h('td', { class: 'num' }, String(i)), h('td', {}, name),
        h('td', {}, i === 0 ? 'Start here' : i === 5 ? '3 more fresh, unhinted correct answers within practice pace' : '3 more fresh, unhinted correct answers in a row'))))),
    h('p', {}, 'For example: two qualifying answers show 2/3. A third earns one level and the counter starts again at 0/3. A mistake, hint or review question resets that counter; earned levels stay.'),
    h('p', {}, 'Each skill has its own counter. Answers on other skills do not advance or reset it.'),
    h('p', {}, 'Mock results are a separate benchmark: they do not award or reset practice levels. Their accuracy and pace are still recorded.'),
    h('p', {}, 'Pausing an unanswered question saves it for learning, but that answer cannot establish pace or pass a mixed check. Pause between answered questions when you want an uninterrupted pace attempt.'),
    h('p', {}, 'A skill counts as practised on the roadmap at Level 3. You can move to another skill then, and return for consistency, pace and mixed practice.'),
    h('p', {}, 'Levels track practice evidence, not the difficulty number printed on a question. Mixed checks require three fresh correct answers in a row with the method hidden, without hints and within pace. They do not establish that the questions use different mathematical structures.'),
    h('p', { class: 'small-note muted' }, 'Existing levels are preserved. Mixed checks start with new evidence; old answers cannot establish whether a topic label was visible. These are training milestones, not Optiver grades.'));
}

export function resumePracticeCards(store, ids) {
  const sessions = (store.practiceSessions?.() || []).filter((s) => !ids || ids.includes(s.section));
  if (!sessions.length) return null;
  return h('section', { class: 'resume-practice', 'aria-label': 'Saved practice' },
    h('h2', {}, 'Continue practice'),
    sessions.map((s) => h('div', { class: 'resume-practice-card' },
      h('div', {}, h('strong', {}, SECTIONS[s.section].title),
        h('p', { class: 'small-note muted' }, `${s.family ? familyTitle(s.section, s.family) : 'Mixed practice'} · ${s.log.length}/${s.count} answered${s.current.done ? ' · feedback saved' : ' · current question saved'}`)),
      h('a', { class: 'btn primary', href: practiceHref(s) }, 'Resume practice'))));
}
