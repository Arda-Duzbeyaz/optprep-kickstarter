// Home: today's goal, the one next step, and the answer sheet for every task in the
// candidate's battery. First launch asks which battery they will sit.
import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { PRESETS, DEFAULT_PRESET, activatePreset, activePreset, presetSections } from '../../../config/presets.js';
import { FAMILIES, GAMES } from '../../sections/catalog.js';
import { preparationPlan, deadlineLabel } from '../../core/preparation.js';
import { readiness } from '../../core/readiness.js';
import { bubbles, field, choice, setRail } from '../sheet.js';
import { icon } from '../icons.js';
import { sectionMap } from './section-map.js';
import { resumePracticeCards } from '../practice-progress.js';
import { mixedPracticeAction } from '../practice-actions.js';

export function presetPicker(store, { onDone, compact = false } = {}) {
  let picked = store.settings().preset?.id || DEFAULT_PRESET;
  const options = Object.values(PRESETS).map((p) => ({ value: p.id, label: p.title, hint: p.who }));
  return h('div', { class: 'preset-picker' },
    choice({ legend: 'Battery', hideLegend: true, options, value: picked, onChange: (v) => { picked = v; } }),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => { store.setSetting('preset', { id: picked }); store.setSetting('presetConfirm', false); activatePreset({ id: picked }); onDone?.(); } }, compact ? 'Save' : 'Start')));
}

// One quiet row per task: name, progress, and Ready when earned. Details live on the roadmap.
function taskRow(store, id, map) {
  if (id === 'zapn') {
    const games = GAMES.filter((g) => activePreset().zapn.includes(g.id));
    const played = games.filter((g) => store.zapnRuns(g.id).length).length;
    return h('li', {}, h('a', { class: 'task-row', href: '#/zapn' },
      h('span', { class: 'task-name' }, 'Zap-N games'),
      h('span', { class: 'task-progress num' }, `${played} of ${games.length} played`)));
  }
  const cfg = SECTIONS[id];
  const ready = readiness(store.runs(id, 'exam'), cfg.target, 3, cfg.exam).ready;
  return h('li', {}, h('a', { class: 'task-row', href: `#/s/${id}` },
    h('span', { class: 'task-name' }, cfg.title),
    ready ? h('span', { class: 'stamp stamp-mastered' }, 'Practice target met') : null,
    h('span', { class: 'task-progress num' }, `${map.skillsDone}/${map.skillsTotal} covered · ${map.verified} verified`),
    map.due ? h('span', { class: 'stamp stamp-needs-review' }, `${map.due} to review`) : null));
}

export function pathPage(root, { store }) {
  const preset = store.settings().preset;
  if (!preset) {
    mount(root,
      h('h1', {}, 'Which online assessment are you sitting?'),
      h('p', { class: 'lede' }, 'This sets the tasks on your sheet, their timing and the exam replicas. You can change it later in Settings.'),
      field(null, presetPicker(store, { onDone: () => pathPage(root, { store }) })));
    setRail(0, 'Not started');
    return;
  }
  const active = activePreset();
  const ids = presetSections(active);
  const maps = ids.filter((id) => id !== 'zapn' && FAMILIES[id]).map((id) => ({ id, map: sectionMap(store, id) }));
  const mapOf = Object.fromEntries(maps.map((m) => [m.id, m.map]));
  const plan = preparationPlan(store.settings());
  const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short' }).format(Date.now()));
  const weakest = [...maps].sort((a,b) => a.map.verified / a.map.skillsTotal - b.map.verified / b.map.skillsTotal || a.map.skillsDone / a.map.skillsTotal - b.map.skillsDone / b.map.skillsTotal)[0]?.id;
  const focusId = ({ 1: 'bto', 2: 'nl', 3: 'll', 4: 'iv', 5: 'ob', 6: weakest, 0: weakest })[weekday];
  const focus = maps.find((m) => m.id === focusId) || maps[0];
  const nextSkill = focus?.map.units.flatMap((u) => u.rows).find((r) => r.kind === 'skill' && (!r.covered || r.state === 'needs-review'));
  const goal = store.goalMin();
  const minutes = Math.floor(store.todayMs() / 60e3);
  const st = store.streak();
  setRail(Math.min(1, minutes / goal), `${minutes} of ${goal} minutes today`);

  mount(root,
    h('h1', {}, 'Today'),
    active.id === 'kickstarter' ? h('section', { class: 'prep-deadline panel' },
      h('div', { class: 'row' }, h('strong', {}, plan.days ? `${plan.days} days to your deadline` : 'Preparation deadline reached'), h('a', { class: 'small-note', href: '#/settings' }, 'Edit plan')),
      h('p', { class: 'small-note' }, `${deadlineLabel(plan.deadline)} UK · ${deadlineLabel(plan.deadline, 'Europe/Paris')} CET`),
      h('p', { class: 'small-note muted' }, `${plan.weeklyHours} hours/week · approximately ${plan.estimatedHours} preparation hours remaining.`),
      h('details', { class: 'daily-routine' }, h('summary', {}, plan.title), h('p', {}, plan.advice), h('p', { class: 'small-note muted' }, 'Planning guidance only; this app does not start or submit your real assessments.'))) : null,
    resumePracticeCards(store, ids),
    focus ? h('section', { class: 'panel daily-focus' },
      h('p', { class: 'eyebrow' }, weekday === 0 ? 'Weekly benchmark' : weekday === 6 ? 'Catch-up and repair' : 'Suggested assessment today'),
      h('h2', {}, SECTIONS[focus.id].title),
      h('p', {}, focus.map.skillsDone < 2 ? 'Learn a few skills with help. Mark them covered, then start mixed checks.' : 'Start a cold mixed batch. Review mistakes with ChatGPT, then repair one weakness.'),
      weekday === 0 ? h('a', { class: 'btn primary', href: `#/run/${focus.id}/exam` }, 'Take a timed section') : null,
      weekday !== 0 && focus.map.skillsDone < 2 ? h('p', {}, h('a', { class: 'btn primary', href: nextSkill?.href || `#/s/${focus.id}` }, 'Learn the next skill')) : null,
      mixedPracticeAction(store,focus.id,{primary:weekday !== 0 && focus.map.skillsDone >= 2}),
      h('p', { class: 'small-note' }, h('a', { href: `#/s/${focus.id}` }, 'Choose or repair a skill')),
      h('details', { class: 'daily-routine' }, h('summary', {}, 'How to use your preparation time'),
        h('ol', {}, h('li', {}, 'Attempt without help: 25 minutes of mixed checks or one timed section.'), h('li', {}, 'Review: 15 minutes explaining mistakes and the underlying method with ChatGPT.'), h('li', {}, 'Repair: 15 minutes of focused learning on one weak skill.'), h('li', {}, 'Record one lesson and choose the next topic: 5 minutes.')),
        h('p', { class: 'small-note muted' }, 'At 8 hours/week, use six one-hour sessions and one two-hour session for timed sections plus review. Shorter days are fine: resume the saved block. Paused unanswered questions are learning-only.'),
        h('p', { class: 'small-note' }, 'Learn → mixed check → repair → timed section. Keep each mixed batch within one assessment. Use unfamiliar challenges after the basics; cross-assessment mixing is optional extra training.'))) : null,
    h('div', { class: 'today' },
      h('div', { class: 'today-goal' },
        bubbles(goal, minutes, { label: null, size: goal > 12 ? 'sm' : 'md' }),
        h('span', { class: 'num' }, `${minutes}/${goal} min habit goal`)),
      h('div', { class: 'today-stats' },
        h('span', { class: 'stat' }, icon('fire', { size: 18 }), h('span', { class: 'num' }, String(st.current)), st.current === 1 ? ' day' : ' days'),
        h('span', { class: 'stat' }, icon('bolt', { size: 18 }), h('span', { class: 'num' }, String(store.xpTotal())), ' XP'),
        st.freezes ? h('span', { class: 'stat muted' }, h('span', { class: 'num' }, String(st.freezes)), st.freezes === 1 ? ' freeze' : ' freezes') : null)),
    h('div', { class: 'tasks-head' }, h('h2', {}, 'Your tasks'), h('a', { class: 'small-note muted', href: '#/settings' }, `Battery: ${active.title}`)),
    h('ul', { class: 'task-list' }, ids.map((id) => (id === 'zapn' || mapOf[id] ? taskRow(store, id, mapOf[id]) : null))),
    h('details', { class: 'level-guide' }, h('summary', {}, 'More training tools'), h('ul', { class: 'task-list task-list-after' }, h('li', {}, h('a', { class: 'task-row', href: '#/transfer' },
      h('span', { class: 'task-name' }, 'Batch check', h('span', { class: 'task-blurb' }, 'Same practice library; answers and feedback only at the end. Optional, with separate results.')))), h('li', {}, h('a', { class: 'task-row', href: '#/mk' },
      h('span', { class: 'task-name' }, 'Market making', h('span', { class: 'task-blurb' }, 'After the online assessment: quote two-sided markets against a trader who knows more than you.')),
      h('span', { class: 'task-progress num' }, store.zapnRuns('mk').length ? `${store.zapnRuns('mk').length} sessions` : 'bonus'))))));
}
