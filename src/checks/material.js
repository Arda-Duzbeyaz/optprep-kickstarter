import { positionOutcome, intervalScore, validTrades } from '../core/check.js';
import { solve } from '../sections/ob/solver.js';
import { orderbookPrompt, MAX_TRADES } from '../sections/ob/lib.js';

export function number(text, answer, explanation, options = {}) {
  return { kind: 'number', text, answer, explanation, unit: '', tolerance: 1e-8, ...options };
}

export function probability(text, answer, explanation, skill) {
  return number(text, answer, explanation, { unit: 'probability', tolerance: 0.000501, skill });
}

export function ranking(text, statements, explanation, options = {}) {
  return { kind: 'rank', text, statements: statements.map(([label, p]) => ({ text: label, p })),
    answerOrder: statements.map((_, i) => i).sort((a, b) => statements[b][1] - statements[a][1]),
    explanation, ...options };
}

export function estimate(text, truth, unit, explanation, options = {}) {
  return { kind: 'interval', text, truth, unit, explanation, ...options };
}

export function board(products, quotes, explanation, skill) {
  const instruments = quotes.map(([name, legs, bid, ask], i) => ({ id: 'q' + i, name, legs, bid, ask }));
  const book = { products, instruments };
  const best = solve(book, MAX_TRADES);
  return { kind: 'orderbook', text: orderbookPrompt(MAX_TRADES,true),
    board: book, best, tradeLimit:MAX_TRADES, explanation, skill };
}

// Open entry removes multiple-choice cues. A percent sign always has its usual meaning.
export function numericValue(raw, unit) {
  const s = String(raw ?? '').trim().replaceAll('−', '-');
  const m = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*\/\s*(\d+(?:\.\d*)?))?\s*(%)?$/.exec(s);
  if (!m || (m[2] && Number(m[2]) === 0) || (m[3] && !['%', 'probability'].includes(unit))) return null;
  let value = Number(m[1]) / (m[2] ? Number(m[2]) : 1);
  if (m[3] && unit === 'probability') value /= 100;
  return Number.isFinite(value) ? value : null;
}

export function validAnswer(item, a) {
  if (!a) return false;
  if (item.kind === 'number') return numericValue(a.value, item.unit) !== null;
  if (item.kind === 'rank') return Array.isArray(a.order) && a.order.length === 3 &&
    new Set(a.order).size === 3 && a.order.every(v => Number.isInteger(v) && v >= 0 && v < 3);
  if (item.kind === 'interval') return Number.isFinite(Number(a.lower)) && Number(a.lower) > 0 &&
    Number.isFinite(Number(a.upper)) && Number(a.lower) <= Number(a.upper);
  return a.pass === true || validTrades(item.board, a.trades, item.tradeLimit ?? MAX_TRADES);
}

export function grade(item, a) {
  if (!validAnswer(item, a)) return { score: 0, skipped: true };
  if (item.kind === 'interval') {
    const lower = +a.lower, upper = +a.upper;
    const score = intervalScore(lower,upper,item.truth);
    const direction = score > 0 ? 'inside' : item.truth < lower ? 'below' : 'above';
    return { score, direction, lower, upper };
  }
  let correct;
  if (item.kind === 'number') correct = Math.abs(numericValue(a.value, item.unit) - item.answer) <= item.tolerance;
  else if (item.kind === 'rank') correct = item.answerOrder.every((v, i) => a.order[i] === v);
  else if (a.pass) correct = item.best === null;
  else {
    const position = positionOutcome(item.board, a.trades);
    correct = position.flat && position.profit > 0;
  }
  return { score: Number(correct) };
}

export function answerText(item) {
  if (item.kind === 'rank') return item.answerOrder.map(i => item.statements[i].text).join(' → ');
  if (item.kind === 'orderbook') {
    if (!item.best) return 'No opportunity within six trades.';
    const trades = item.best.trades.map(t => t.side + ' ' + item.board.instruments.find(q => q.id === t.id).name);
    return trades.join(', ') + ' for a profit of ' + item.best.profit + '.';
  }
  if (item.kind === 'interval') return item.truth.toLocaleString('en-GB', { maximumSignificantDigits: 8 }) + ' ' + item.unit;
  return item.answer.toLocaleString('en-GB', { maximumSignificantDigits: 8 }) + (item.unit === 'probability' ? '' : ' ' + item.unit);
}
