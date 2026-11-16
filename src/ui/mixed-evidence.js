import { h } from './dom.js';
import { mixedSummary } from '../core/mixed-training.js';
export function mixedEvidence(rows) {
  const s = mixedSummary(rows);
  if (!s.total) return null;
  return h('section', { class: 'mixed-evidence', 'aria-label': 'Independent mixed performance' },
    h('p', {}, h('strong', {}, s.known ? `${s.independent}/${s.known} independent within training pace` : 'Earlier mixed conditions are unknown')),
    s.known ? h('p', { class: 'small-note muted' }, `${s.slow} over budget · ${s.helped} helped · ${s.interrupted} interrupted. These counts can overlap. Only fresh, unaided, uninterrupted answers on standard time qualify.`) : null,
    s.unknown ? h('p', { class: 'small-note muted' }, `${s.unknown} earlier answer${s.unknown === 1 ? '' : 's'} lack recorded conditions and are excluded from this rate. Their scores and progress are preserved.`) : null,
    s.known ? h('details', { class: 'small-note muted' }, h('summary', {}, 'Recorded question variety'),
      h('p', {}, `${s.newBranches} first recorded branches · ${s.unknownBranches} with older, coarse branch history. These labels track authored task distinctions, not proof of conceptual transfer. Use a later Batch check and independent unfamiliar problems.`)) : null);
}
