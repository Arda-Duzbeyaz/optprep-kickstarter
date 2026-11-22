import { h, mount } from './dom.js';
import { bubbles } from './sheet.js';
import { levelProgress } from '../core/progression.js';
import { BTO_CHECKPOINT_MS, recognitionProgress } from '../core/recognition.js';
import { practiceHref } from '../core/practice.js';
import { practiceFamilyTitle as familyTitle, PRACTICE_FAMILIES as FAMILIES } from '../practice/catalog.js';
import { SECTIONS } from '../../config/sections.js';
import { checkpointAvailability, availabilityText } from '../practice/availability.js';

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
  return p.complete ? 'All supported difficulties verified' : !p.attempts && !p.passed.length ? 'Mixed checks not started'
    : `Difficulty ${p.target} · ${p.streak}/3 cold successes${p.review.length ? ' · recheck due' : ''}`;
}

export function otherCheckpointText(p) {
  return p.levels.filter((level) => level !== p.target && (p.streaks[level] || p.passed.includes(level)))
    .map((level) => `Difficulty ${level}: ${p.verified.includes(level) ? 'verified' : `${p.streaks[level]}/3${p.review.includes(level) ? ' in recheck' : ''}`}`).join(' · ');
}

export function learningStatus(c) {
  return c.covered ? c.completedBlocks ? 'Learning complete' : 'Covered'
    : c.completedBlocks ? 'Learning needs a revisit' : c.started ? 'Learning in progress' : 'To learn';
}

export function learningEvidence(c) {
  return `${c.completedBlocks || 0} learning block${c.completedBlocks === 1 ? '' : 's'} completed · ${c.learningAttempts || 0} focused answers`;
}

export function checkpointLabel(p) {
  return h('span', { class: 'skill-level-label' }, `${p.verified.length}/${p.levels.length} difficulties verified`);
}

export function skillProgress(store, section, family, { budgetMs, notice, learning = false, onCoverage } = {}) {
  const key = `${section}:${family}`, root = h('section', { class: 'skill-progress', 'aria-label': 'Skill progress' });
  const bto = section === 'bto';
  const seconds = Number(((bto ? BTO_CHECKPOINT_MS : budgetMs) / 1000).toFixed(2));
  function render() {
    const p = skillCheckpoint(store, section, family), coverage = store.coverage(section, family);
    const availability = checkpointAvailability(section, family, p, store.recentQuestionKeys?.(section));
    const cold = h('div', {},
      h('div', { class: 'row' }, bubbles(p.levels.length, p.verified.length), checkpointLabel(p)),
      h('p', { class: 'small-note' }, `Difficulty ${p.target} · ${p.streak}/3 cold successes${p.review.length ? ' · recheck due' : ''}`),
      bto && otherCheckpointText(p) ? h('p', { class: 'small-note' }, otherCheckpointText(p)) : null,
      h('p', { class: 'small-note muted' }, `Three consecutive fresh, correct, unaided answers at the same difficulty, each within ${seconds} s, verify it. ${bto ? 'Mixed practice and timed Beat the Odds share this progress.' : 'Other skills can appear between them.'}`),
      availability?.blocked ? h('p', { class: 'small-note muted checkpoint-availability', role: 'status' }, availabilityText(availability)) : null);
    mount(root,
      h('div', { class: 'row skill-progress-head' }, h('strong', {}, familyTitle(section, family)),
        p.complete ? h('span', { class: 'stamp stamp-mastered' }, bto ? 'Mastery checks complete' : 'Mixed checks complete') : null),
      notice ? h('p', { class: 'skill-notice', role: 'status' }, notice) : null,
      h('div', { class: 'skill-progress-grid' },
        h('div', {}, h('strong', {}, learning ? 'Learning only · help allowed' : 'Learning coverage'),
          h('p', { class: coverage.covered ? 'learning-complete' : null }, bubbles(1, Number(coverage.covered), { label: 'Learning coverage' }), ' ', learningStatus(coverage)),
          h('p', { class: 'small-note' }, learningEvidence(coverage)),
          learning ? h('p', { class: 'small-note muted' }, 'Finish all 10 questions without skips to tick learning automatically. Accuracy and help do not affect learning completion. Mixed checks test what you can do independently.') : null,
          learning ? h('button', { class: 'btn small', type: 'button', onclick: () => { store.markCovered(section, family, !coverage.covered); render(); onCoverage?.(); } }, coverage.covered ? 'Mark for learning' : 'Mark covered') : h('a', { href: `#/run/${section}/practice/${family}` }, 'Learn or repair this skill')),
        learning ? h('details', { class: 'cold-next-stage' }, h('summary', {}, bto ? 'Mastery checkpoints' : 'Next stage: cold mixed checks'),
          h('p', { class: 'small-note' }, bto ? 'See your cold results from mixed practice and timed runs here.' : 'These counters advance in mixed practice, after learning. A zero here does not undo your completed learning.'), cold)
          : h('div', {}, h('strong', {}, bto ? 'Mastery checkpoints' : 'Mixed recognition'), cold)),
      h('p', { class: 'small-note muted skill-meaning' }, 'These checks test fresh instances at authored generator difficulties. They do not prove unfamiliar mathematical structures or an Optiver pass.'),
      (store.mastery()[key] || store.mixedEvidence?.()[key]) ? h('details', { class: 'legacy-progress' }, h('summary', {}, 'Previous practice record'),
        h('p', { class: 'small-note muted' }, `Earlier Level ${store.mastery()[key]?.lv || 0}/5 and mixed evidence are retained. They are not relabelled as passes under the new rules.`)) : null);
  }
  render(); return root;
}

export function levelGuide(section) {
  return h('details', { class: 'level-guide' }, h('summary', {}, 'How learning and mixed checkpoints work'),
    h('p', {}, 'Learn a named skill with explanations, hints or ChatGPT. Completing all 10 questions without skips automatically ticks learning and saves a completed block, even before you leave the last answer. This records learning coverage, not proficiency. You can also mark a skill covered yourself, or mark it for learning again.'),
    h('p', {}, 'Mix covered skills after learning a few topics. Mixed batches hide the skill and difficulty until submission. Three fresh, correct, unaided, uninterrupted answers at the current supported difficulty, within the displayed training budget, verify that difficulty and move the next draw to the next supported level.'),
    !section || section === 'bto' ? h('p', {}, `In Beat the Odds, mixed practice and standard timed sections (including the section in Full mock) share a ${BTO_CHECKPOINT_MS / 1000}-second mastery cutoff. A timed answer contributes to the difficulty that was asked. An unsuccessful eligible attempt resets the streak for that difficulty. A miss at a verified difficulty puts it up for recheck.`) : null,
    section !== 'bto' ? h('p', {}, 'Each skill has its own counter. A failed, aided, paused or slow eligible attempt resets its streak. A later miss on a verified difficulty marks it for recheck and the earlier pass stays recorded.') : null,
    h('p', {}, 'Freshness is based on the questions saved in this browser. Select “Used outside help” if you consult assistance. Extra time, repeats, named-topic practice and batch checks are excluded from checkpoint credit.'),
    h('p', {}, 'Small configured pools can run out of unseen questions. New learning and mixed draws stop rather than repeat; older saved revision items cannot earn cold credit. A known shortage is labelled Fresh checkpoint evidence unavailable. It does not undo learning or earlier passes. Use independent unfamiliar problems to test broader reasoning.'),
    h('p', {}, 'Mixed practice alternates rolling coverage with weakness turns across block boundaries. Weakness turns consider accuracy, pace failures and rechecks. A ten-question block does not have to include every covered skill.'),
    h('p', {}, 'Supported levels belong to the existing generators. A dice skill with levels 1 and 2 has two checkpoints; there are no invented levels 3–5. The budgets and difficulty labels are training choices, not independently calibrated Optiver limits.'),
    h('p', { class: 'small-note muted' }, 'Old five-level practice records and mixed streaks are preserved as history. Batch check uses the same practice library but withholds feedback until the end and keeps its results separate.'));
}

export function resumePracticeCards(store, ids, { compact = false, kind } = {}) {
  const sessions = (store.practiceSessions?.() || []).filter((s) => (!ids || ids.includes(s.section)) && (!kind || (kind === 'learning' ? !!s.family : !s.family)));
  if (!sessions.length) return null;
  return h('section', { class: `resume-practice${compact ? ' resume-practice-compact' : ''}`, 'aria-label': 'Saved practice' },
    h('h2', { class: compact ? 'visually-hidden' : null }, kind === 'learning' ? 'Continue learning' : 'Saved learning and mixed practice'),
    sessions.map((s) => h('div', { class: 'resume-practice-card' },
      h('div', {}, compact ? null : h('strong', {}, SECTIONS[s.section].title),
        h('p', { class: 'small-note muted' }, `${s.family ? `Learning: ${familyTitle(s.section, s.family)}` : s.scope === 'covered' ? 'Mixed covered skills' : 'Mixed all skills'} · ${s.log.length}/${s.count} answered${s.current.done ? ' · feedback saved' : ' · current question saved'}`)),
      h('a', { class: 'btn primary', href: practiceHref(s), 'aria-label': s.family ? `Resume learning: ${familyTitle(s.section, s.family)}` : `Resume mixed practice: ${SECTIONS[s.section].title}, ${s.scope === 'covered' ? 'covered skills' : 'all skills'}` }, s.family ? 'Resume learning' : 'Resume mixed practice'))));
}
