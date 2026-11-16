import { PRACTICE_MODULES } from './index.js';
import { finiteVariants } from './finite-variants.js';
import { questionSeen } from '../core/questions.js';

// Only complete configured domains can establish a shortage. A bounded random
// search is deliberately not used to declare a skill mathematically exhausted.
export function checkpointAvailability(section, family, progress, history) {
  if (progress.complete) return null;
  const generator = PRACTICE_MODULES[section]?.families.find((f) => f.id === family);
  if (!generator) return null;
  const variants = finiteVariants(generator, progress.target);
  if (!variants) return null;
  const seen = new Set(history || []), remaining = variants.filter((item) => !questionSeen(seen, item)).length;
  return { total: variants.length, remaining, needed: progress.remaining, blocked: remaining < progress.remaining, difficulty: progress.target };
}
export function availabilityText(status) {
  return status?.blocked ? `Fresh checkpoint evidence unavailable at difficulty ${status.difficulty}: ${status.remaining} unseen question${status.remaining === 1 ? '' : 's'} remain; ${status.needed} cold successes are still needed. Your learning and existing passes are preserved. Use another skill or independent unfamiliar problems.` : '';
}
