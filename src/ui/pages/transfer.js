import { h, mount } from '../dom.js';
import { itemBody } from '../runner.js';
import { solutionPanel, feedbackBanner } from '../solution.js';
import { setRail } from '../sheet.js';
import { checkItem } from '../../core/check.js';
import { makeCountdown, examClockStatus } from '../../core/timer.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { transferItems, transferSummary, TRANSFER_SECTIONS, TRANSFER_TIMING, SECTION_TRANSFER_TIMING } from '../../transfer/draw.js';
import { SECTIONS } from '../../../config/sections.js';
const scoreLine = (s) => [s.regularN ? `${s.regularCorrect}/${s.regularN} non-interval questions correct` : '',
  s.intervalN ? `interval mean ${s.intervalMean.toFixed(3)} (${s.intervalN} items)` : ''].filter(Boolean).join('; ') || 'No questions in this group';
const timeMultiplier = (store) => { const n = Number(store.settings().extraTime); return Number.isFinite(n) && n > 1 ? n : 1; };

export function transferPage(root, { store, section = 'bto' }) {
  let cleanup = null;
  const timing = h('select', { id: 'transfer-timing', 'aria-label': 'Transfer practice timing' }, h('option', { value: 'timed' }, 'Timed'), h('option', { value: 'untimed' }, 'Untimed'));
  const scope = h('select', { id: 'transfer-scope', 'aria-label': 'Transfer assessment' }, TRANSFER_SECTIONS.map((s) => h('option', { value: s }, SECTIONS[s].title)), h('option', { value: 'all' }, 'All five · optional broader mix'));
  scope.value = TRANSFER_SECTIONS.includes(section) || section === 'all' ? section : 'bto';
  const clockNote = h('p', { class: 'small-note muted' });
  const updateNote = () => { clockNote.textContent = scope.value === 'all' ? '15 questions · 20 minutes overall · 90 seconds per question if timed.' : '10 questions from one assessment · 15 minutes overall · 90 seconds per question if timed.'; };
  scope.addEventListener('change', updateNote); updateNote();
  const history = store.transferRuns().slice(-5).reverse(), extra = timeMultiplier(store);
  mount(root, h('h1', {}, 'Transfer Challenge'),
    h('p', { class: 'lede' }, 'Test unfamiliar questions within one assessment. Methods stay hidden and solutions appear at the end.'),
    h('p', {}, 'Additional training, not an official Optiver assessment replica. Results and training clocks stay separate. For invitation-aligned section practice, use Timed section instead.'),
    extra > 1 ? h('p', { class: 'muted' }, `Your extra-time setting ×${extra} applies to both training clocks and is recorded with the result.`) : null,
    h('div', { class: 'prep-fields' }, h('label', { for: 'transfer-scope' }, 'Assessment', scope), h('label', { for: 'transfer-timing' }, 'Timing', timing)), clockNote,
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { cleanup = runTransfer(root, { store, timed: timing.value === 'timed', section: scope.value }); } }, 'Start Transfer Challenge')),
    h('details', { class: 'level-guide' }, h('summary', {}, 'What this challenge measures'),
      h('p', {}, 'Unseen questions and less familiar recorded structures are prioritised. A recorded structure is a generator-branch signature, not proof that an idea is new to you. Attempt without help; results stay separate from mixed checkpoints and exam targets.'),
      h('p', {}, 'The all-five option is optional broader reasoning practice. The real assessments are taken separately; cross-assessment mixing is not required for progress. These training clocks are not verified Optiver item limits.')),
    h('h2', {}, 'Recent transfer sessions'),
    history.length ? h('ul', {}, history.map((r) => h('li', {}, `${new Date(r.finishedAt).toLocaleDateString()} · ${SECTIONS[r.section]?.title || 'All five'} · ${r.timed ? `timed${r.extraTime > 1 ? ` ×${r.extraTime}` : ''}` : 'untimed'}${r.completed ? '' : ' · partial'} · ${scoreLine(r.summary.all)} · ${r.summary.unseen.displayed} unseen recorded questions`))) : h('p', { class: 'muted' }, 'No transfer sessions yet.'));
  return () => cleanup?.();
}

export function runTransfer(root, { store, seed = Date.now(), timed = true, items: fixedRows, section = 'all' } = {}) {
  if (section !== 'all' && !TRANSFER_SECTIONS.includes(section)) throw new Error('Unsupported transfer assessment');
  const timing = section === 'all' ? TRANSFER_TIMING : SECTION_TRANSFER_TIMING;
  const questionHistory = Object.fromEntries(TRANSFER_SECTIONS.map((s) => [s, store.recentQuestionKeys(s)]));
  const structureHistory = Object.fromEntries(TRANSFER_SECTIONS.map((s) => [s, store.recentStructureKeys(s)]));
  const rows = fixedRows || transferItems(SECTION_MODULES, { seed, questionHistory, structureHistory,
    ...(section === 'all' ? {} : { sections: [section], perSection: timing.count }) });
  const extra = timeMultiplier(store), total = timed ? makeCountdown(timing.totalSeconds * 1000 * extra) : null;
  const records = [], responses = [], displayed = new Set();
  let index = 0, current = null, perItem = null, frame = 0, finished = false;
  const timer = h('span', { class: 'timer', 'aria-live': 'off' }), itemTimer = h('span', { class: 'timer', 'aria-live': 'off' });
  const start = performance.now();
  const paint = (el, ms) => { const s = Math.ceil(ms / 1000); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function show() {
    if (index >= rows.length) return finish(true);
    const row = rows[index]; displayed.add(index); store.rememberQuestion(row.item);
    const shownIndex = index;
    perItem = timed ? makeCountdown(timing.perItemSeconds * 1000 * extra) : null;
    const body = itemBody(row.item, { preview: false, notation: store.settings().divNotation, keys: store.settings().answerKeys !== false,
      onChange: () => {
        // Keep the last response actually entered within both deadlines. A
        // throttled animation frame must not allow later input to replace it.
        if (!finished && index === shownIndex && current && (!timed || !examClockStatus(total, perItem).expired)) current.response = body.view.response();
      } });
    current = { body, started: performance.now(), response: body.view.response() };
    mount(root, h('h1', { class: 'visually-hidden' }, 'Transfer Challenge'), h('div', { class: 'panel exam' },
      h('div', { class: 'qhead' }, h('span', {}, `${section === 'all' ? 'Transfer training' : SECTIONS[section].title + ' · Transfer training'} · Question ${index + 1} of ${rows.length}`), timed ? h('span', {}, 'Total ', timer, ' · Question ', itemTimer) : h('span', {}, 'Untimed')),
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
    store.recordTransferRun({ seed: String(seed), section, timing: { ...timing }, timed, extraTime: extra, completed, count: rows.length, ms: Math.round(performance.now() - start), summary, items: saved });
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
