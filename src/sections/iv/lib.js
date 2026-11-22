// Shared builder for Intervals items: every family computes a truth and a coach object,
// and this file turns them into a contract-valid item with a closing "choose the width" step.
import { bestInterval } from './optimal.js';
import { fmtNum, intervalNumber } from '../../core/format.js';
import { intervalScore } from '../../core/check.js';

// Rounded display with enough significant figures to be useful as an interval end.
export function show(x) {
  if (!Number.isFinite(x)) return String(x);
  if (Number.isInteger(x)) return fmtNum(x);
  const a = Math.abs(x);
  const dp = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 4;
  return fmtNum(Number(x.toFixed(dp)));
}
// Same rounding without thousands separators, for interval ends typed into inputs.
export function plain(x) {
  const a = Math.abs(x);
  return String(Number(x.toFixed(a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 4)));
}

// Round outwards, retaining extra places if a two-decimal lower bound would
// round a small positive value to zero.
export function bracket(x) {
  const scale = 10 ** Math.max(2, 2 - Math.floor(Math.log10(x)));
  const lo = Math.floor(x * scale) / scale, hi = Math.ceil(x * scale) / scale;
  return [lo, hi];
}

export function exactInterval(truth) {
  const rounded = Number(truth.toFixed(6));
  const shortDecimal = rounded > 0 && Math.abs(truth - rounded) <= 4 * Number.EPSILON * truth;
  const [lower, upper] = shortDecimal ? [rounded, rounded] : bracket(truth);
  return { lower, upper, score: intervalScore(lower, upper, truth), shortDecimal };
}

const memo = new Map();
export function optimal(belief, center) {
  if (belief.kind === 'point') return { lower: center, upper: center, score: 1 };
  // the optimum scales with the centre: cache on the relative spread
  const rel = belief.kind === 'normal' ? belief.sd / center : belief.sd;
  const key = `${belief.kind}:${rel.toPrecision(3)}`;
  if (!memo.has(key)) memo.set(key, bestInterval({ kind: belief.kind, sd: Number(rel.toPrecision(3)) }, 1));
  const r = memo.get(key);
  return { lower: r.lower * center, upper: r.upper * center, score: r.score };
}

// The closing step every solution shares: how wide to go, and why.
export function widthStep(coach, truth) {
  if (coach.exact && coach.belief.kind === 'point') {
    const {lower,upper,score,shortDecimal}=exactInterval(truth);
    const shownScore=shortDecimal?'1':score.toFixed(4);
    return {
      say: shortDecimal ? `Enter the exact value as both bounds [${lower}, ${upper}].` : `Bracket the computed value (about ${intervalNumber(truth)}) with [${lower}, ${upper}].`,
      math: `score = ${lower} / ${upper} ${shortDecimal?'=':'≈'} ${shownScore}`,
      why: 'The score is lower divided by upper if the interval contains the value. When you only have a rounded decimal, round each bound outwards.',
    };
  }
  const o = optimal(coach.belief, truth);
  const normal = coach.belief.kind === 'normal', sd = coach.belief.sd;
  const below = normal ? (truth - o.lower) / sd : Math.log(truth / o.lower) / sd;
  const above = normal ? (o.upper - truth) / sd : Math.log(o.upper / truth) / sd;
  const spread = normal ? `±${show(sd)}` : `±${Math.round(sd * 100)}%`;
  return {
    say: `Illustrative model only: assume uncertainty of ${spread} (one standard deviation). If your central estimate were ${plain(truth)}, the model's approximate best interval would be [${plain(o.lower)}, ${plain(o.upper)}], expected trainer score ${o.score.toFixed(2)}. This error size has not been measured for you or Optiver candidates.`,
    math: `score if inside = ${plain(o.lower)} / ${plain(o.upper)} = ${(Number(plain(o.lower)) / Number(plain(o.upper))).toFixed(2)}`,
    why: normal
      ? `A miss scores 0 while width only costs the ratio lower/upper, so the optimum covers ${below.toFixed(1)} sd below and ${above.toFixed(1)} sd above: it leans high because a higher interval has a larger ratio.`
      : `A miss scores 0 while width only costs the ratio lower/upper, so the optimum covers ${below.toFixed(1)} sd each way on a log scale, which puts more room above the estimate than below.`,
  };
}

// A tick step of 1, 2 or 5 times a power of ten giving about eight ticks over span.
export function niceStep(span) {
  const raw = span / 8, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}
const r4 = (x) => Number(x.toPrecision(5));

// The scoring picture, the arithmetic of the score, the ask and the check, shared by every family.
// fam.picture?(params, truth) supplies a picture of the computation itself where one helps more.
function ivExtras(fam, { text, truth, unit, coach, params, exact }) {
  const u = unit === '%' ? '%' : unit ? ` ${unit}` : '';
  const q = text.split(/(?<=[.?])\s+/).filter((s) => s.includes('?')).pop() || text;
  const ask = `We want an interval [lower, upper] that contains the answer to: "${q.trim()}" The narrower it is while still containing it, the higher the score.`;
  const fast = fam.fast?.(params, truth) || (coach.belief.kind === 'point' ? fam.lesson.rule : `${fam.lesson.rule} ${coach.note || ''}`.trim());
  if (coach.exact && coach.belief.kind === 'point') {
    const {lower,upper,score,shortDecimal}=exactInterval(truth);
    const bounds=`[${lower}, ${upper}]`, wide = [r4(truth * 0.99), r4(truth * 1.01)];
    const shownScore=shortDecimal?'1':score.toFixed(4);
    return {
      ask, fast,
      check: `${bounds} scores ${shownScore}. A 1% margin on each side, [${wide[0]}, ${wide[1]}], scores about ${(wide[0] / wide[1]).toFixed(2)}.`,
      picture: fam.picture?.(params, truth) ?? {
        diagram: 'table',
        spec: { columns: ['Computed value', 'Decimal', 'Interval to submit', 'Score'], rows: [[exact ? String(exact).split(' = ')[0] : `${intervalNumber(truth)}${u}`, `${shortDecimal?'':'≈ '}${intervalNumber(truth)}${u}`, bounds, shownScore]] },
        caption: shortDecimal ? 'Both bounds match the computed value.' : 'The two bounds round outwards so the computed value is inside.',
      },
    };
  }
  const o = optimal(coach.belief, truth);
  const normal = coach.belief.kind === 'normal', sd = coach.belief.sd;
  const spread = normal ? sd : truth * sd;
  const step = niceStep(o.upper - o.lower + 2 * spread);
  const min = Math.floor((o.lower - spread) / step) * step, max = Math.ceil((o.upper + spread) / step) * step;
  const lo = Number(plain(o.lower)), hi = Number(plain(o.upper));
  return {
    ask, fast,
    check: `Size the width from your error, not your nerves: an estimate off by one sd (about ${normal ? show(sd) : `${Math.round(sd * 100)}%`}) still lands inside [${plain(o.lower)}, ${plain(o.upper)}], while a zero-width guess scores 0 on almost any miss.`,
    picture: fam.picture?.(params, truth) ?? {
      diagram: 'numberline',
      spec: { min: r4(min), max: r4(max), step: r4(step), barriers: [lo, hi], target: Number(plain(truth)), marks: [{ x: lo, label: plain(o.lower) }, { x: hi, label: plain(o.upper) }] },
      caption: `Hindsight illustration using the assumed ${normal ? `±${show(sd)}` : `±${Math.round(sd * 100)}%`} error model, centred on the truth (dot). It is not a measurement of your accuracy. Use your own repeated errors to judge width; lognormal symmetry gives unequal distances on the original scale.`,
    },
  };
}

// Assemble the item. `steps` explain the computation; the width step is appended.
// params: plain JSON with every input behind `truth`, so an external pipeline can recompute it.
export function ivItem(fam, rng, difficulty, { text, visual, truth, unit, coach, steps, hints, params, exact }) {
  const it = {
    id: `iv:${fam.id}:${rng.seed}`,
    section: 'iv',
    family: fam.id,
    difficulty,
    kind: 'interval',
    prompt: visual ? { text, visual } : { text },
    truth,
    unit,
    coach,
    answer: { value: truth, display: show(truth), ...(exact ? { exact } : {}) },
    solution: { ...ivExtras(fam, { text, truth, unit, coach, params, exact }), steps: [...steps, widthStep(coach, truth)], rule: fam.lesson.rule, anchor: fam.lesson.anchor },
    hints,
    params,
  };
  return it;
}

export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// Non-overlapping random centres in a w x h box (rejection sampling; n stays small).
export function scatter(rng, n, w, h, minDist, margin = minDist) {
  const pts = [];
  for (let tries = 0; pts.length < n && tries < n * 400; tries++) {
    const x = rng.float(margin, w - margin), y = rng.float(margin, h - margin);
    if (pts.every(([a, b]) => (a - x) ** 2 + (b - y) ** 2 >= minDist * minDist)) pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  return pts.length === n ? pts : null;
}
