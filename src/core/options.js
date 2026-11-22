// Multiple-choice builder for "pick the closest value" questions.
// Prefer a named misconception. Fillers keep the option count stable without
// implying we know how the learner arrived at a particular choice.
export const OPTION_ESTIMATE_HELP = 'Estimate the scale from the stated conditions, then compare the answer choices.';

const defaultGap = (c) => Math.max(0.012, Math.abs(c) * 0.07);

export function buildMcq(rng, { correct, distractors, format, count = 5, minGap = defaultGap, fillers, numberFromLabel }) {
  const correctLabel = format(correct);
  const shownCorrect = numberFromLabel ? numberFromLabel(correctLabel) : correct;
  const gap = minGap(correct);
  const chosen = [];
  const seen = new Set([correctLabel]);
  const shownChoices = [];
  const accept = (value, label) => {
    const shown = numberFromLabel ? numberFromLabel(label) : value;
    if (seen.has(label) || !Number.isFinite(shown) || Math.abs(shown - shownCorrect) < gap) return false;
    if (numberFromLabel && Math.abs(shown - correct) <= Math.abs(shownCorrect - correct)) return false;
    if (shownChoices.some((other) => Math.abs(other - shown) < gap / 2)) return false;
    seen.add(label);
    shownChoices.push(shown);
    return true;
  };
  for (const d of rng.shuffle(distractors)) {
    if (chosen.length === count - 1) break;
    if (!Number.isFinite(d.value) || !d.misconception) continue;
    const l = format(d.value);
    if (!accept(d.value, l)) continue;
    chosen.push({ label: l, value: d.value, misconception: d.misconception, ...(d.generic ? { generic: true } : {}) });
  }
  // Fallback fillers keep the option count stable when a family's error list runs dry.
  const extra = fillers || defaultFillers(correct);
  for (const f of extra) {
    if (chosen.length === count - 1) break;
    if (!Number.isFinite(f.value)) continue;
    const l = format(f.value);
    if (!accept(f.value, l)) continue;
    chosen.push({ label: l, value: f.value, misconception: f.misconception || OPTION_ESTIMATE_HELP,
      ...(!f.misconception || f.generic ? { generic: true } : {}) });
  }
  if (chosen.length < count - 1) throw new Error(`buildMcq: only ${chosen.length + 1} distinct options for ${correct}`);
  const options = [...chosen, { label: correctLabel, value: correct, misconception: null }]
    .sort((a, b) => a.value - b.value);
  return { options, answerIndex: options.findIndex((o) => o.misconception === null) };
}

function defaultFillers(c) {
  const isProb = c >= 0 && c <= 1;
  const cands = isProb
    ? [c / 2, c * 1.5, 1 - c, c * c, Math.sqrt(c), c + 0.1, c - 0.1, c * 2, c + 0.2, c - 0.2]
    : [c * 2, c / 2, c * 1.5, c * 0.75, c + 1, c - 1, c * 3, c / 3];
  return cands
    .filter((v) => (isProb ? v > 0 && v < 1 : v !== 0))
    .map((value) => ({ value, generic: true }));
}
