import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { activePreset, presetSections } from '../../../config/presets.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { runExam } from '../runner.js';
import { moreGames, zapSampler } from '../../core/assessment-coach.js';
import { BTO_CHECKPOINT_MS } from '../../core/recognition.js';
import { formatLine } from './format.js';

// Full mock: the scored sections in portal order, each on its own clock,
// with a pause screen between them (the real tasks are separate portal items).
export function mockPage(root, { store }) {
  const order = presetSections(activePreset()).filter((id) => id !== 'zapn' && SECTION_MODULES[id]?.families.length);
  const results = [];
  let stop = null;
  const seed = Date.now();

  function intro() {
    mount(root,
      h('h1', {}, 'Full mock'),
      h('p', { class: 'muted' }, 'The scored sections back to back, in portal order, each on its own clock. Each section must be a full paper without questions in your saved history; if the fresh search fails, it stops before that section starts. The Kickstarter mock ends with a link to a short Zap-N practice game.'),
      h('div', { class: 'panel' }, h('table', {}, h('tbody', {}, order.map((id, i) => h('tr', {}, h('td', { class: 'num' }, String(i + 1)), h('td', {}, SECTIONS[id].title), h('td', { class: 'muted' }, formatLine(SECTIONS[id])))))),
        h('div', { class: 'row', style: { marginTop: '16px' } }, h('button', { class: 'btn primary', type: 'button', onclick: () => next(0) }, 'Start the mock'))));
  }

  function next(i) {
    if (i >= order.length) return done();
    const id = order[i];
    mount(root, h('div', { class: 'panel' },
      h('h2', { style: { marginTop: 0 } }, `Next: ${SECTIONS[id].title}`),
      h('p', {}, formatLine(SECTIONS[id])),
      h('p', { class: 'muted' }, SECTIONS[id].blurb),
      id === 'bto' && !(Number(store.settings().extraTime) > 1) ? h('p', { class: 'small-note' }, `Fresh, correct, unaided answers within ${BTO_CHECKPOINT_MS / 1000} seconds count towards mastery when the section ends.`) : null,
      h('button', { class: 'btn primary', type: 'button', onclick: () => {
        const box = h('div', {});
        const cont = h('div', { class: 'row', style: { marginTop: '12px' } });
        mount(root, box, cont);
        stop = runExam(box, { sectionId: id, store, seed: `${seed}:${id}`, mock: true, onDone: (r) => {
          results.push({ id, ...r });
          cont.replaceChildren(h('button', { class: 'btn primary', type: 'button', onclick: () => next(i + 1) }, i + 1 < order.length ? `Continue to ${SECTIONS[order[i + 1]].title}` : 'See mock results'));
        } });
      } }, 'Start section')));
  }

  function done() {
    const games = zapSampler(store.state.zapn);
    const game = games.find(g=>!g.tried) || moreGames(store.state.zapn).find(g=>!g.tried) || games[0];
    const next = activePreset().id === 'kickstarter' ?
      h('a', { class:'btn primary', href:'#/zapn/'+game.id+'/practice' }, 'Continue to Zap-N · '+game.title) :
      h('a', { class:'btn primary', href:'#/zapn' }, 'Zap-N');
    mount(root, h('h1', {}, 'Mock results'), h('div', { class: 'panel' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Section'), h('th', { style: { textAlign: 'right' } }, 'Score'), h('th', {}, 'Target'))),
      h('tbody', {}, results.map((r) => h('tr', {}, h('td', {}, SECTIONS[r.id].title), h('td', { class: 'num', style: { textAlign: 'right' } }, r.id === 'iv' ? `${r.score.toFixed(2)} / ${r.max}` : `${r.score} / ${r.max}`), h('td', { class: 'muted' }, SECTIONS[r.id].target.label)))))),
      h('div', { class: 'row', style: { marginTop: '16px' } }, next, h('a', { class: 'btn', href: '#/' }, 'Readiness')));
  }

  intro();
  return () => stop?.();
}
