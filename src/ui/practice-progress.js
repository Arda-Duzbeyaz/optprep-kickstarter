import { h, mount } from './dom.js';
import { bubbles } from './sheet.js';
import { levelProgress } from '../core/progression.js';
import { recognitionProgress } from '../core/recognition.js';
import { practiceHref } from '../core/practice.js';
import { familyTitle, FAMILIES } from '../sections/catalog.js';
import { SECTIONS } from '../../config/sections.js';

export function levelLabel(m) {
  const p = levelProgress(m);
  return h('span', { class: 'skill-level-label' }, `Level ${p.level}/5 · ${p.label}`);
}

export function nextLevelText(m) {
  const p = levelProgress(m);
  return p.next ? `${p.streak}/3 towards Level ${p.next}${p.paced ? ' · at pace' : ''}` : 'All five practice levels reached';
}

export function skillCheckpoint(store, section, family) {
  const levels = FAMILIES[section]?.find((f) => f.id === family)?.levels || [1];
  return recognitionProgress(store.recognition?.()[`${section}:${family}`], levels);
}

export function checkpointText(p) {
  return p.complete ? 'All supported difficulties verified' : `Difficulty ${p.target} · ${p.streak}/3 cold successes${p.review.length ? ' · recheck due' : ''}`;
}

export function checkpointLabel(p) {
  return h('span', { class: 'skill-level-label' }, `${p.verified.length}/${p.levels.length} difficulties verified`);
}

export function skillProgress(store, section, family, { budgetMs, notice, learning = false, onCoverage } = {}) {
  const key = `${section}:${family}`, root = h('section', { class: 'skill-progress', 'aria-label': 'Skill progress' });
  function render() {
    const p = skillCheckpoint(store, section, family), coverage = store.coverage(section, family);
    mount(root,
      h('div', { class: 'row skill-progress-head' }, h('strong', {}, familyTitle(section, family)),
        p.complete ? h('span', { class: 'stamp stamp-mastered' }, 'Mixed checks complete') : null),
      notice ? h('p', { class: 'skill-notice', role: 'status' }, notice) : null,
      h('div', { class: 'skill-progress-grid' },
        h('div', {}, h('strong', {}, learning ? 'Learning only · help allowed' : 'Learning coverage'),
          h('p', {}, coverage.covered ? `Covered · ${coverage.source}` : 'Not marked covered yet'),
          learning ? h('button', { class: 'btn small', type: 'button', onclick: () => { store.markCovered(section, family, !coverage.covered); render(); onCoverage?.(); } }, coverage.covered ? 'Mark for learning' : 'Mark covered') : h('a', { href: `#/run/${section}/practice/${family}` }, 'Learn or repair this skill')),
        h('div', {}, h('strong', {}, 'Mixed recognition'),
          h('div', { class: 'row' }, bubbles(p.levels.length, p.verified.length), checkpointLabel(p)),
          h('p', { class: 'small-note' }, checkpointText(p)),
          h('p', { class: 'small-note muted' }, `Three consecutive cold successes on this skill, each within the ${Number((budgetMs / 1000).toFixed(2))} s training budget. Other skills can appear between them. Hints, outside help, slow or interrupted answers cannot qualify.`))),
      h('p', { class: 'small-note muted skill-meaning' }, 'These checks test fresh instances at authored generator difficulties. They do not prove unfamiliar mathematical structures or an Optiver pass.'),
      (store.mastery()[key] || store.mixedEvidence?.()[key]) ? h('details', { class: 'legacy-progress' }, h('summary', {}, 'Previous practice record'),
        h('p', { class: 'small-note muted' }, `Earlier Level ${store.mastery()[key]?.lv || 0}/5 and mixed evidence are retained. They are not relabelled as passes under the new rules.`)) : null);
  }
  render(); return root;
}

export function levelGuide() {
  return h('details', { class: 'level-guide' }, h('summary', {}, 'How learning and mixed checkpoints work'),
    h('p', {}, 'Learn a named skill with explanations, hints or ChatGPT. Mark it covered when you understand the method and can explain a simple example. Coverage is your learning checklist, not proof of proficiency.'),
    h('p', {}, 'The 0/3 counter belongs to one skill at one difficulty. Questions on other skills can appear between its successes. A miss, help, interruption or over-budget attempt on this skill resets its current counter; it does not erase other skills.'),
    h('p', {}, 'Mix covered skills after learning a few topics. Mixed batches hide the skill and difficulty until submission. Three fresh, correct, unaided, uninterrupted answers at the current supported difficulty, within the displayed training budget, verify that difficulty and move the next draw to the next supported level.'),
    h('p', {}, 'Each skill has its own counter. A failed, aided, paused or slow eligible attempt resets its streak. A later miss on a verified difficulty marks it for recheck; the earlier pass remains recorded. Questions on other skills do not reset it.'),
    h('p', {}, 'Fresh means first recorded exposure in this browser, not a guaranteed unfamiliar mathematical structure. Use “Used outside help” in a mixed batch if you consult assistance. Extra-time practice, repeats, named-topic practice, mocks and Transfer Challenges cannot earn these checkpoints.'),
    h('p', {}, 'Supported levels belong to the existing generators. A dice skill with levels 1 and 2 has two checkpoints; there are no invented levels 3–5. The budgets and difficulty labels are training choices, not independently calibrated Optiver limits.'),
    h('p', { class: 'small-note muted' }, 'Old five-level practice records and mixed streaks are preserved as history. They do not fabricate new cold checkpoints. Transfer Challenge is a separate, unfamiliar-question benchmark; choose a single assessment there.'));
}

export function resumePracticeCards(store, ids) {
  const sessions = (store.practiceSessions?.() || []).filter((s) => !ids || ids.includes(s.section));
  if (!sessions.length) return null;
  return h('section', { class: 'resume-practice', 'aria-label': 'Saved practice' },
    h('h2', {}, 'Continue practice'),
    sessions.map((s) => h('div', { class: 'resume-practice-card' },
      h('div', {}, h('strong', {}, SECTIONS[s.section].title),
        h('p', { class: 'small-note muted' }, `${s.family ? familyTitle(s.section, s.family) : s.scope === 'covered' ? 'Mixed covered skills' : 'Mixed all skills'} · ${s.log.length}/${s.count} answered${s.current.done ? ' · feedback saved' : ' · current question saved'}`)),
      h('a', { class: 'btn primary', href: practiceHref(s) }, 'Resume practice'))));
}
