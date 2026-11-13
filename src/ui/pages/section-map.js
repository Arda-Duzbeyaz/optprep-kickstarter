// A section's roadmap data: its skills (from the family catalog), concept lessons and
// checkpoints. Today and the section page both draw from it; it never loads a generator.
import { SECTIONS } from '../../../config/sections.js';
import { FAMILIES } from '../../sections/catalog.js';
import { roadmap } from '../../core/path.js';
import { readiness } from '../../core/readiness.js';
import { lessonForFamily, bookLessons } from '../../study/catalog.js';
import { statusOf } from '../../study/progress.js';
import { formatLine } from './format.js';
import { drillPassed } from '../../core/practice.js';

function checkpoints(store, id) {
  const cfg = SECTIONS[id];
  const drills = store.runs(id, 'drill');
  const sets = Object.values(store.sets(id));
  return [
    { id: 'drill', title: 'Drill: 10 questions on the clock', href: `#/run/${id}/drill`, passed: drills.some(drillPassed) },
    { id: 'set', title: 'Timed set from the library', href: `#/s/${id}/sets`, passed: sets.some((s) => s.mode === 'timed') },
    { id: 'exam', title: `Timed practice: ${formatLine(cfg)}`, href: `#/run/${id}/exam`, passed: readiness(store.runs(id, 'exam'), cfg.target, 3, cfg.exam).ready },
  ];
}

export function sectionMap(store, id) {
  const lessons = bookLessons(id).filter((l) => l.kind !== 'family' && l.kind !== 'game').map((l) => ({ id: l.id, title: l.title, status: statusOf(store, l.id) }));
  return roadmap({
    sectionId: id, families: FAMILIES[id], lessons, checkpoints: checkpoints(store, id),
    mastery: store.mastery(), recognition: store.recognition(),
    coverage: Object.fromEntries(FAMILIES[id].map((f) => [`${id}:${f.id}`, store.coverage(id, f.id)])),
    srs: store.srs, lessonFor: (fid) => lessonForFamily(id, fid),
  });
}
