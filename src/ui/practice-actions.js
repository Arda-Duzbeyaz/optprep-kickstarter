import { h } from './dom.js';
import { SECTIONS } from '../../config/sections.js';
import { PRACTICE_FAMILIES } from '../practice/catalog.js';
import { BTO_CHECKPOINT_MS } from '../core/recognition.js';

export function mixedPracticeAction(store, id, { primary = true } = {}) {
  const families = PRACTICE_FAMILIES[id], covered = families.filter((f) => store.coverage(id,f.id).covered).length;
  const saved = store.settings().mixedPool?.[id];
  const session = store.practiceSessions?.().find((s) => s.section === id && !s.family);
  const selected = saved === 'all' || saved === 'covered' && covered >= 2 ? saved
    : session && (session.scope !== 'covered' || covered >= 2) ? session.scope || 'all' : covered >= 2 ? 'covered' : 'all';
  const selectId = `mixed-pool-${id}`;
  const pool = h('select', { id: selectId, 'aria-label': 'Mixed practice question pool', onchange: () => {
    store.setSetting('mixedPool',{...store.settings().mixedPool,[id]:pool.value}); update();
  } }, h('option', { value: 'all' }, `All ${families.length} skills`),
    h('option', { value: 'covered', disabled: covered < 2 }, `Covered skills (${covered})${covered < 2 ? ' · learn at least 2 first' : ''}`));
  pool.value = selected;
  const start = h('a', { class: `btn${primary ? ' primary' : ''}`, 'data-action': 'mixed-practice' }, 'Start mixed practice · 10 questions');
  const note = h('p', { class: 'small-note muted' });
  function update() {
    start.href = `#/run/${id}/mixed/${pool.value}`;
    const block = store.practiceSession?.(id, null, pool.value);
    start.textContent = block && !block.family && (block.scope || 'all') === pool.value
      ? `Resume mixed practice · ${block.log.length}/${block.count} answered` : 'Start mixed practice · 10 questions';
    note.textContent = `${pool.value === 'all' ? 'All skills, including ones you have not covered yet' : 'Only skills you marked covered'}. Questions stay within ${SECTIONS[id].title}. Saved separately from topic learning.`;
  }
  update();
  return h('div', { class: 'mixed-practice-action' },
    h('label', { for: selectId }, 'Question pool', pool), start, note,
    h('p', { class: 'small-note muted' }, id === 'bto'
      ? `Work at your own pace. Fresh, correct, unaided answers submitted within ${BTO_CHECKPOINT_MS / 1000} seconds count towards mastery.`
      : 'No forced timeout. The displayed pace budget controls checkpoint credit. Coverage carries across blocks; other turns target accuracy and pace weaknesses.'));
}
