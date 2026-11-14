// Finishing a focused learning block is evidence of coverage, not cold skill.
// Keep this ledger separate from XP, time, accuracy and recognition checkpoints.
import { PRACTICE_BLOCK_SIZE, validPractice } from './practice.js';

export function learningBlock(run, at) {
  if (run?.mode !== 'practice' || !run.family || typeof run.blockId !== 'string' || !run.blockId ||
    run.completed !== true || run.plannedCount !== PRACTICE_BLOCK_SIZE || run.max !== PRACTICE_BLOCK_SIZE ||
    !Array.isArray(run.items) || run.items.length !== PRACTICE_BLOCK_SIZE ||
    run.items.some((r) => !r || typeof r !== 'object' || r.family !== run.family || typeof r.correct !== 'boolean' ||
      !Number.isFinite(r.score) || r.skipped !== undefined && typeof r.skipped !== 'boolean') ||
    !Number.isFinite(at) || at < 0) return null;
  return { id: run.blockId, at, questions: run.items.length,
    correct: run.items.filter((r) => r.correct).length, skipped: run.items.filter((r) => r.skipped).length };
}

export function addLearningBlock(previous = {}, block) {
  if (!block || previous.blockIds?.includes(block.id)) return previous;
  return { ...previous, completedBlocks: (previous.completedBlocks || 0) + 1,
    blockIds: [...(previous.blockIds || []), block.id], completedAt: block.at, lastBlock: block,
    // Wrong or assisted answers still count as learning. Skipped questions have
    // not been worked through, so a block with skips does not tick coverage.
    ...(!block.skipped ? { covered: true, coveredBy: 'learning-block' } : {}) };
}

export function snapshotLearningBlock(snapshot, at) {
  if (!snapshot?.family || !validPractice(snapshot) || !snapshot.current.done) return null;
  return learningBlock({ mode: 'practice', family: snapshot.family, blockId: String(snapshot.seed),
    items: snapshot.log, max: snapshot.log.length, plannedCount: snapshot.count,
    completed: snapshot.log.length === snapshot.count }, at);
}

// Recover only retained full focused blocks. XP, time and aggregate answer
// counts alone never imply completion. Old homogeneous runs also need a
// focused-learning ledger, because their summaries did not store the family.
export function recoverLearningBlocks(state) {
  const coverage = { ...state.learningCoverage };
  const recover = (key, block) => {
    const previous = coverage[key];
    coverage[key] = addLearningBlock(previous, block);
    // A deliberate request to revisit a skill remains a request to revisit.
    if (previous?.covered === false && previous.coveredBy !== 'learning-block')
      coverage[key] = { ...coverage[key], covered: false, coveredBy: previous.coveredBy };
  };
  for (const [index, run] of state.runs.entries()) {
    const family = run.family || run.items?.[0]?.family;
    const key = `${run.section}:${family}`;
    if (!family || !run.family && (!(coverage[key]?.attempts >= PRACTICE_BLOCK_SIZE) || run.scope !== undefined)) continue;
    const block = learningBlock({ ...run, family,
      blockId: run.blockId || `legacy-learning:${index}:${run.finishedAt}:${key}` }, run.finishedAt);
    if (block) recover(key, block);
  }
  for (const snapshot of Object.values(state.activePractice)) {
    const block = snapshotLearningBlock(snapshot, snapshot?.savedAt);
    if (block) {
      const key = `${snapshot.section}:${snapshot.family}`;
      recover(key, block);
    }
  }
  return coverage;
}
