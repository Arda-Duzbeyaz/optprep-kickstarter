import { h, mount } from '../dom.js';
import { itemBody } from '../runner.js';
import { solutionPanel, feedbackBanner } from '../solution.js';
import { setRail } from '../sheet.js';
import { checkItem } from '../../core/check.js';
import { makeCountdown, examClockStatus } from '../../core/timer.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { transferItems, transferSummary, TRANSFER_SECTIONS, TRANSFER_TIMING } from '../../transfer/draw.js';
const scoreLine = (s) => `${s.regularCorrect}/${s.regularN} non-interval questions correct${s.intervalN ? `; interval mean ${s.intervalMean.toFixed(3)} (${s.intervalN} items)` : ''}`;
const timeMultiplier = (store) => { const n = Number(store.settings().extraTime); return Number.isFinite(n) && n > 1 ? n : 1; };

export function transferPage(root, { store }) {
  let cleanup = null;
  const timing = h('select', { 'aria-label': 'Transfer practice timing' }, h('option', { value: 'timed' }, 'Timed: 20 minutes overall, 90 seconds per item'), h('option', { value: 'untimed' }, 'Untimed'));
  const history = store.transferRuns().slice(-5).reverse(), extra = timeMultiplier(store);
  mount(root, h('h1', {}, 'Transfer Challenge'),
    h('p', { class: 'lede' }, 'Additional mathematical training: 15 questions across the five reasoning sections. Family names and methods stay hidden until review.'),
    h('p', {}, 'This is not an official Optiver assessment replica. Your Career Kickstarter preset and its clocks are unchanged.'),
    h('p', {}, 'Unseen questions and less familiar recorded structures are prioritised. A recorded structure is a conservative generator-branch signature, not proof that a mathematical idea is new to you. Tracking starts in this edition.'),
    h('p', {}, 'Attempt without hints. Answers and solutions appear at the end. Results stay separate from revision, mastery and assessment practice targets.'),
    extra > 1 ? h('p', { class: 'muted' }, `Your extra-time setting ×${extra} applies to both training clocks and is recorded with the result.`) : null,
    h('div', { class: 'row' }, timing, h('button', { class: 'btn primary', type: 'button', onclick: () => { cleanup = runTransfer(root, { store, timed: timing.value === 'timed' }); } }, 'Start Transfer Challenge')),
    h('h2', {}, 'Recent transfer sessions'),
    history.length ? h('ul', {}, history.map((r) => h('li', {}, `${new Date(r.finishedAt).toLocaleDateString()} · ${r.timed ? `timed${r.extraTime > 1 ? ` ×${r.extraTime}` : ''}` : 'untimed'}${r.completed ? '' : ' · partial'} · ${scoreLine(r.summary.all)} · ${r.summary.unseen.displayed} unseen recorded questions`))) : h('p', { class: 'muted' }, 'No transfer sessions yet.'));
  return () => cleanup?.();
}

export function runTransfer(root, { store, seed = Date.now(), timed = true, items: fixedRows } = {}) {
  const questionHistory = Object.fromEntries(TRANSFER_SECTIONS.map((s) => [s, store.recentQuestionKeys(s)]));
  const structureHistory = Object.fromEntries(TRANSFER_SECTIONS.map((s) => [s, store.recentStructureKeys(s)]));
  const rows = fixedRows || transferItems(SECTION_MODULES, { seed, questionHistory, structureHistory });
  const extra = timeMultiplier(store), total = timed ? makeCountdown(TRANSFER_TIMING.totalSeconds * 1000 * extra) : null;
  const records = [], responses = [], displayed = new Set();
  let index = 0, current = null, perItem = null, frame = 0, finished = false;
  const timer = h('span', { class: 'timer', 'aria-live': 'off' }), itemTimer = h('span', { class: 'timer', 'aria-live': 'off' });
  const start = performance.now();
  const paint = (el, ms) => { const s = Math.ceil(ms / 1000); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function show() {
    if (index >= rows.length) return finish(true);
    const row = rows[index]; displayed.add(index); store.rememberQuestion(row.item);
    const shownIndex = index;
    perItem = timed ? makeCountdown(TRANSFER_TIMING.perItemSeconds * 1000 * extra) : null;
    const body = itemBody(row.item, { preview: false, notation: store.settings().divNotation, keys: store.settings().answerKeys !== false,
      onChange: () => {
        // Keep the last response actually entered within both deadlines. A
        // throttled animation frame must not allow later input to replace it.
        if (!finished && index === shownIndex && current && (!timed || !examClockStatus(total, perItem).expired)) current.response = body.view.response();
      } });
    current = { body, started: performance.now(), response: body.view.response() };
    mount(root, h('h1', { class: 'visually-hidden' }, 'Transfer Challenge'), h('div', { class: 'panel exam' },
      h('div', { class: 'qhead' }, h('span', {}, `Transfer training · Question ${index + 1} of ${rows.length}`), timed ? h('span', {}, 'Total ', timer, ' · Question ', itemTimer) : h('span', {}, 'Untimed')),
      row.repeat ? h('p', { class: 'muted' }, 'Review item: this question was recorded before and is reported separately.') : null,
      body.el, h('div', { class: 'row' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => advance() }, 'Submit and next'),
        h('button', { class: 'btn', type: 'button', onclick: () => advance(true) }, 'Skip'),
        h('button', { class: 'btn', type: 'button', onclick: () => {
          if (finished || settleExpiry()) return;
          if (confirm('Finish this training session? The current answer will be saved. Unreached questions will not be marked as seen.')) { saveCurrent(); finish(records.filter(Boolean).length === rows.length); }
        } }, 'Finish session'))));
    setRail(index / rows.length, `Transfer question ${index + 1} of ${rows.length}`);
    paint(timer, total?.remaining() || 0); paint(itemTimer, perItem?.remaining() || 0); root.querySelector('.prompt')?.focus();
  }
  function saveCurrent(skip = false) {
    if (!current || records[index]) return;
    const row = rows[index], response = skip ? { skip: true } : current.response || { skip: true };
    const result = checkItem(row.item, response); responses[index] = response;
    records[index] = { section: row.item.section, family: row.item.family, difficulty: row.item.difficulty, key: row.key, structure: row.structure,
      repeat: row.repeat, newStructure: row.newStructure, correct: result.correct, score: result.score, skipped: !!result.skipped,
      ms: Math.round(performance.now() - current.started), prompt: row.item.prompt.text };
  }
  function advance(skip = false) { if (finished || settleExpiry()) return; saveCurrent(skip); index++; show(); }
  function settleExpiry() {
    if (!timed || finished) return false;
    const expired = examClockStatus(total, perItem).expired;
    if (!expired) return false;
    saveCurrent();
    if (expired === 'total') finish(records.filter(Boolean).length === rows.length);
    else { index++; show(); }
    return true;
  }
  function onKey(event) {
    if (finished || !current) return;
    if (settleExpiry()) { event.preventDefault(); return; }
    current.body.view.keyHandler?.(event);
    if (event.key === 'Enter' && !event.repeat && !event.target.closest?.('button') && rows[index].item.kind !== 'orderbook') { event.preventDefault(); advance(); }
  }
  function tick() {
    if (finished) return;
    paint(timer, total.remaining()); paint(itemTimer, perItem.remaining());
    settleExpiry();
    if (!finished) frame = requestAnimationFrame(tick);
  }
  function finish(completed) {
    if (finished) return;
    finished = true; cancelAnimationFrame(frame); document.removeEventListener('keydown', onKey);
    const saved = records.filter(Boolean), summary = transferSummary(saved);
    store.recordTransferRun({ seed: String(seed), timed, extraTime: extra, completed, count: rows.length, ms: Math.round(performance.now() - start), summary, items: saved });
    mount(root, h('h1', {}, 'Transfer Challenge: review'),
      h('p', {}, `${completed ? 'Completed' : 'Partial session'} · ${timed ? `timed${extra > 1 ? ` ×${extra}` : ''}` : 'untimed'} · ${scoreLine(summary.all)}.`),
      h('p', { class: 'muted' }, 'Additional-training results stay separate from revision and exam targets. Different score types are not combined into an invented pass mark.'),
      h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Recorded exposure'), h('th', {}, 'Displayed'), h('th', {}, 'Performance'))),
        h('tbody', {}, [['Unseen questions', summary.unseen], ['New recorded structures', summary.newStructure], ['Familiar recorded structures', summary.familiarStructure], ['Repeated questions', summary.review]].map(([label, s]) => h('tr', {}, h('td', {}, label), h('td', {}, String(s.displayed)), h('td', {}, scoreLine(s)))))),
      h('p', { class: 'small-note muted' }, 'The two structure rows partition unseen questions. Signatures track known generator branches, not proof of conceptual novelty or Optiver calibration.'),
      ...rows.flatMap((row, i) => {
        if (!displayed.has(i)) return [];
        const result = checkItem(row.item, responses[i] || { skip: true });
        const question = itemBody(row.item, { preview: false, keys: false, notation: store.settings().divNotation });
        question.view.setResponse?.(responses[i]);
        question.view.lock?.();
        question.view.reveal?.(result, responses[i]);
        const supportedPractice = SECTION_MODULES[row.item.section]?.families.some((f) => f.id === row.item.family);
        return [h('details', { class: 'panel' }, h('summary', {}, `Question ${i + 1} · ${row.item.section.toUpperCase()} · ${row.item.family} · ${result.skipped ? 'skipped' : row.item.kind === 'interval' ? `score ${result.score.toFixed(3)}` : result.correct ? 'correct' : 'incorrect'}`),
          question.el, feedbackBanner(row.item, result, responses[i] || { skip: true }), solutionPanel(row.item, { stepwise: false, actions: supportedPractice }))];
      }), h('a', { class: 'btn primary', href: '#/' }, 'Back to Today'));
    setRail(1, 'Transfer session finished');
  }
  document.addEventListener('keydown', onKey); show(); if (timed) frame = requestAnimationFrame(tick);
  return () => { finished = true; cancelAnimationFrame(frame); document.removeEventListener('keydown', onKey); };
}
