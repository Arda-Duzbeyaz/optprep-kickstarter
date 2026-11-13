// A section's roadmap, drawn as its answer sheet: units from Foundations to Exam pace,
// one numbered row per lesson, skill or checkpoint, five level bubbles per skill, and a
// single current row. The exam format and question library sit in the header field.
import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { REPORTED, SOURCES, activePreset } from '../../../config/presets.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { srsDue } from '../../core/srs.js';
import { buildLibrary, librarySets, setCount } from '../../core/library.js';
import { bookLessons } from '../../study/catalog.js';
import { sectionMap } from './section-map.js';
import { bubbles, stamp, setRail } from '../sheet.js';
import { icon } from '../icons.js';
import { formatLine } from './format.js';
import { levelGuide, checkpointLabel, checkpointText, resumePracticeCards } from '../practice-progress.js';

// Some 80-in-8 reports write division as 735 : 15. The learner picks; items keep ÷ underneath.
function notationToggle(store) {
  const box = h('input', { type: 'checkbox', checked: store.settings().divNotation === 'colon', onchange: () => store.setSetting('divNotation', box.checked ? 'colon' : 'obelus') });
  return h('label', { class: 'check-line small-note' }, box, 'Write division as 735 : 15, as some European tests print it');
}


function row(r, n, id) {
  // One action per row; the title opens the lesson, so the row never needs two buttons.
  const titleHref = r.href;
  const verb = r.kind === 'skill' ? (r.state === 'needs-review' ? 'Repair' : 'Learn') : r.kind === 'lesson' ? 'Read' : 'Start';
  const actions = [h('a', { class: `btn small${r.current ? ' primary' : ' ghost'}`, href: r.href, 'aria-label': `${verb}: ${r.title}` }, verb)];
  return h('li', { class: `grid-row${r.current ? ' is-current' : ''}${r.later ? ' is-later' : ''}${r.done ? ' is-done' : ''}`, id: r.current ? 'current-row' : null, 'aria-current': r.current ? 'step' : null },
    h('span', { class: 'grid-num num' }, String(n)),
    h('span', { class: 'grid-body' },
      h('a', { class: 'grid-title', href: titleHref }, r.title),
      r.current && r.kind === 'skill' && r.skill ? h('span', { class: 'grid-skill' }, r.skill) : null,
      r.current ? h('span', { class: 'you-are-here' }, icon('pencil', { size: 14 }), 'Suggested next step') : null),
    h('span', { class: 'grid-level' },
      r.kind === 'skill' ? [bubbles(r.checkpoint.levels.length, r.checkpoint.verified.length, { label: `${r.checkpoint.verified.length} of ${r.checkpoint.levels.length} difficulties verified` }), checkpointLabel(r.checkpoint), h('span', { class: 'skill-next small-note muted' }, checkpointText(r.checkpoint))] : bubbles(1, r.done ? 1 : 0, { label: r.done ? 'Done' : 'Not done', current: r.current })),
    h('span', { class: 'grid-state' }, r.state === 'needs-review' ? stamp(r.state)
      : r.kind === 'skill' ? h('span', { class: r.covered ? 'stamp stamp-mastered' : 'small-note muted' }, r.covered ? 'Covered' : 'To learn') : r.done ? stamp('mastered') : null),
    h('span', { class: 'grid-actions' }, actions));
}

export function sectionPage(root, { store, id }) {
  const cfg = SECTIONS[id];
  const mod = SECTION_MODULES[id];
  if (!cfg || !mod) return mount(root, h('h1', {}, 'Unknown task'), h('p', {}, h('a', { href: '#/' }, 'Back to your sheet')));
  const map = sectionMap(store, id);
  const lib = buildLibrary(mod, { size: setCount(cfg.exam.count) * cfg.exam.count });
  const nSets = librarySets(lib, cfg.exam.count).length;
  const due = srsDue(store.srs).filter((k) => k.startsWith(`${id}:`)).length;
  const rep = REPORTED[id];
  setRail(map.skillsTotal ? map.skillsDone / map.skillsTotal : 0, `${map.skillsDone} of ${map.skillsTotal} skills covered`);
  let n = 0;
  mount(root,
    h('h1', {}, cfg.title),
    h('p', { class: 'lede' }, cfg.blurb),
    resumePracticeCards(store, [id]),
    h('section', { class: 'format-line' },
      h('p', { class: 'num-ish' }, 'Practice format · ', formatLine(cfg)),
      h('div', { class: 'row' },
        map.skillsDone >= 2 ? h('a', { class: 'btn primary', href: `#/run/${id}/mixed/covered` }, 'Mixed check · covered skills') : h('button', { class: 'btn primary', type: 'button', onclick: () => root.querySelector('#skills')?.scrollIntoView({ block: 'start' }) }, 'Learn skills below'),
        h('a', { class: 'btn', href: `#/run/${id}/exam` }, 'Timed section')),
      h('p', { class: 'small-note' }, 'Learn a skill with help, mark it covered, then test recognition in a 10-question mixed batch. Three fresh, unaided, paced successes verify each supported difficulty.'),
      id === 'iv' ? h('p', { class: 'small-note muted' }, 'A mixed checkpoint requires an interval score of at least 0.70, a training goal. Coverage and mean score appear under Progress → Pace.') : null,
      h('p', { class: 'quiet-links small-note' },
        due ? [h('a', { href: `#/run/${id}/mistakes` }, `Review ${due} due`), ' '] : null,
        h('a', { href: `#/run/${id}/mixed/all` }, 'Mix all skills'), ' ',
        ['bto','nl','ll','iv','ob'].includes(id) ? [h('a', { href: `#/transfer/${id}` }, 'Unfamiliar challenge'), ' '] : null,
        cfg.variants.map((v, i) => [h('a', { href: `#/run/${id}/exam/v${i}` }, `Extra format: ${v.label}`), ' ']),
        h('a', { href: `#/s/${id}/sets` }, `Library, ${nSets} sets`), ' ',
        bookLessons(id).length ? h('a', { href: `#/study/book/${id}` }, 'Study book') : null),
      h('details', { class: 'small-note' }, h('summary', {}, 'Timing, assumptions and practice targets'),
        activePreset().note ? h('p', {}, activePreset().note) : null,
        h('p', {}, `Trainer bar: ${cfg.target.label}. `, rep ? ['Reported pass: ', rep.text, ' (', h('a', { href: SOURCES[rep.source].url, target: '_blank', rel: 'noopener' }, 'source'), ').'] : null)),
      id === 'mm' ? notationToggle(store) : null),
    h('p', { class: 'small-note muted' }, `${map.skillsDone}/${map.skillsTotal} skills covered · ${map.verified}/${map.skillsTotal} skills with all mixed checkpoints verified. Coverage is your learning checklist; checkpoints measure cold practice performance.`),
    levelGuide(),
    h('div', { id: 'skills' }, map.units.filter((u) => u.band !== 'foundations').map((u) => h('section', { class: 'unit' },
      h('header', { class: 'unit-head' },
        h('h2', {}, u.title),
        h('span', { class: 'num muted' }, `${u.done} of ${u.total}`)),
      h('ol', { class: 'grid', start: n + 1 }, u.rows.map((r) => row(r, ++n, id)))))),
    map.units.some((u) => u.band === 'foundations') ? h('details', { class: 'level-guide' }, h('summary', {}, 'Optional foundation lessons'), map.units.filter((u) => u.band === 'foundations').map((u) => h('ol', { class: 'grid' }, u.rows.map((r) => row(r, ++n, id))))) : null);
}
