import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStore, memoryBackend, KEY } from '../../src/core/store.js';
import { blankV2, migrate } from '../../src/core/migrate.js';
import { validPractice, validResponse, drillPassed, practiceHref } from '../../src/core/practice.js';
import { levelProgress, mixedStep } from '../../src/core/progression.js';
import { makeRng } from '../../src/core/rng.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { validateItem } from '../../src/core/contract.js';
import { questionKey } from '../../src/core/questions.js';

function snapshot(section = 'bto') {
  const item = SECTION_MODULES[section].families[0].generate(makeRng('save-test'), { difficulty: 1 });
  return { version: 1, section, family: item.family, seed: 'save-test', rngState: 42, index: 0, count: 10,
    log: [], xp0: 0, lv0: {}, savedAt: 10,
    current: { item, hints: 0, fresh: true, budgetMs: 90000, elapsedMs: 1200, done: false, response: null, draft: null } };
}

test('practice snapshots round-trip independently for every task and preserve old progress', () => {
  const backend = memoryBackend(), store = makeStore(backend);
  store.state.mastery = { 'bto:two-dice-sum': { lv: 4, run: 0, prun: 2 } };
  store.state.settings = { preset: { id: 'kickstarter' }, answerKeys: false };
  const mastery = structuredClone(store.mastery());
  for (const section of ['bto', 'nl', 'll', 'iv', 'ob', 'mm']) { const s = snapshot(section); assert.ok(validPractice(s)); store.savePractice(s); }
  const reloaded = makeStore(backend);
  assert.equal(reloaded.practiceSessions().length, 6);
  assert.deepEqual(reloaded.mastery(), mastery);
  assert.deepEqual(reloaded.settings(), store.settings());
  reloaded.clearPractice('bto');
  assert.equal(reloaded.practiceSessions().length, 5);
  assert.deepEqual(reloaded.mastery(), mastery);
  const copy = makeStore(memoryBackend()); copy.importJSON(reloaded.exportJSON());
  assert.deepEqual(copy.state.activePractice, reloaded.state.activePractice);
});

test('new fields safely default on old v2 saves without inventing mixed evidence', () => {
  const old = blankV2(); delete old.activePractice; delete old.mixedEvidence;
  old.mastery = { 'bto:two-dice-sum': { lv: 5, run: 0, prun: 0 } }; old.unknown = { keep: true };
  const next = migrate(old, 10).state;
  assert.deepEqual(next.mastery, old.mastery); assert.deepEqual(next.unknown, old.unknown);
  assert.deepEqual(next.activePractice, {}); assert.deepEqual(next.mixedEvidence, {});
  assert.deepEqual(migrate(next, 20).state, next);
});

test('corrupt, incompatible or unsafe snapshots are not restored', () => {
  for (const change of [s => s.version = 2, s => s.count = 0, s => s.count = 101, s => s.index = 10,
    s => s.rngState = -1, s => s.current.elapsedMs = NaN, s => s.current.item = {},
    s => s.current.hints = 999, s => s.current.draft = {choice: 99}, s => s.log = [{}],
    s => s.family = 'another-family', s => s.current.done = true]) {
    const s = snapshot(); change(s); assert.equal(validPractice(s), false);
  }
  const store = makeStore(memoryBackend()); store.state.activePractice.bto = { version: 999 };
  assert.equal(store.practiceSession('bto'), null);
  assert.deepEqual(store.state.activePractice.bto, { version: 999 }, 'reading does not erase unsupported data');
});

test('answered snapshot and progress commit once, including after a store reload', () => {
  const backend = memoryBackend(), store = makeStore(backend), s = snapshot(), it = s.current.item;
  store.savePractice(s); s.current.done = true; s.current.response = s.current.draft = { choice: it.answerIndex };
  s.current.elapsedMs = 2000;
  s.log.push({ family: it.family, correct: true, score: 1, ms: 2000, hints: 0 });
  const event = { correct: true, ms: 2000, budgetMs: 90000, fresh: true, practiceSnapshot: s,
    nextSrs: { [`bto:${it.family}`]: { box: 2, due: 100 } } };
  assert.equal(store.recordAnswer('bto', it.family, event), true);
  const state = store.exportJSON(), loaded = makeStore(backend);
  assert.equal(loaded.practiceSession('bto').current.done, true);
  assert.equal(loaded.recordAnswer('bto', it.family, event), false);
  assert.equal(loaded.exportJSON(), state);
});

test('practice-only saves protect against an empty-store backend adoption', () => {
  const store = makeStore(memoryBackend()); assert.equal(store.isEmpty(), true);
  store.savePractice(snapshot()); assert.equal(store.isEmpty(), false);
});

test('partial interval drafts and valid permutations/trades restore without accepting invalid controls', () => {
  const interval = snapshot('iv').current.item;
  assert.equal(validResponse(interval, { lower: '42', upper: '' }, { draft: true }), true);
  assert.equal(validResponse(interval, { lower: '42', upper: '' }), false);
  assert.equal(validResponse(interval, { lower: {}, upper: '' }, { draft: true }), false);
  const rank = snapshot('ll').current.item;
  assert.equal(validResponse(rank, {order:[2,0,1]}, {draft:true}), true);
  assert.equal(validResponse(rank, {order:[0,0,1]}, {draft:true}), false);
  const book = snapshot('ob').current.item;
  assert.equal(validResponse(book, {trades:book.best.trades}), true);
  assert.equal(validResponse(book, {trades:[{id:'missing',side:'buy'}]}), false);
});

test('RNG restoration preserves the stream and independent forks exactly', () => {
  for (const seed of ['test-resume', 0, 42, 0xffffffff]) {
    const a = makeRng(seed); for (let i = 0; i < 19; i++) a.next();
    const b = makeRng(seed); b.setState(a.getState());
    for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
    assert.equal(a.fork('same').next(), b.fork('same').next());
    assert.throws(() => b.setState(-1)); assert.throws(() => b.setState(2**32));
  }
});

test('all supported generators retain mathematically verified answers after JSON snapshot serialization', () => {
  let cases = 0;
  for (const section of Object.values(SECTION_MODULES)) for (const family of section.families)
    for (const difficulty of family.levels || [1]) for (const seed of [19, 113, 9083]) {
      const item = family.generate(makeRng(`snapshot:${seed}`), { difficulty });
      const copy = JSON.parse(JSON.stringify(item));
      assert.deepEqual(validateItem(copy), [], item.id);
      assert.equal(questionKey(copy), questionKey(item));
      const verified = family.verify(copy, makeRng(`verify-snapshot:${seed}`));
      assert.ok(verified === true || verified?.ok === true, `${item.id}: ${JSON.stringify(verified)}`);
      cases++;
    }
  assert.ok(cases > 500);
});

test('level counters explain the existing thresholds without changing them', () => {
  assert.deepEqual(levelProgress({lv:1,run:2}), {level:1,label:'Learning',streak:2,remaining:1,next:2,paced:false});
  assert.equal(levelProgress({lv:4,prun:1}).paced, true);
  assert.equal(levelProgress({lv:5}).remaining, 0);
  assert.equal(levelProgress({lv:5}).label, 'At pace');
});

test('mixed checks reject repeats and reset on mistakes, hints and slow answers', () => {
  const good = {correct:true,ms:2000,budgetMs:90000,hints:0}; let m;
  for(let i=0;i<3;i++) m=mixedStep(m,{...good,key:String(i)},i+1);
  assert.equal(m.run,3); assert.equal(m.metAt,3);
  assert.deepEqual(mixedStep(m,{...good,key:'2'}),m);
  for (const bad of [{correct:false},{hints:1},{ms:91000},{ms:0},{uninterrupted:false}]) {
    const reset = mixedStep(m,{...good,...bad,key:'new'}); assert.equal(reset.run,0); assert.equal(reset.metAt,3);
  }
});

test('pausing builds accuracy evidence but cannot manufacture a pace or mixed-check pass', () => {
  const store=makeStore(memoryBackend());
  store.state.mastery['bto:toy']={lv:4,run:0,prun:2};
  store.recordAnswer('bto','toy',{correct:true,ms:2000,budgetMs:90000,fresh:true,mixed:true,key:'paused',uninterrupted:false});
  assert.equal(store.mastery()['bto:toy'].lv,4);assert.equal(store.mastery()['bto:toy'].prun,0);
  assert.equal(store.mixedEvidence()['bto:toy'].run,0);
  store.state.mastery['bto:toy']={lv:1,run:2,prun:0};
  store.recordAnswer('bto','toy',{correct:true,ms:2000,budgetMs:90000,fresh:true,uninterrupted:false});
  assert.equal(store.mastery()['bto:toy'].lv,2);
});

test('mock answers retain practice counters while still recording assessment statistics', () => {
  for(const mastery of [{lv:1,run:2,prun:0},{lv:4,run:0,prun:2}])for(const correct of [true,false]){
    const store=makeStore(memoryBackend());store.state.mastery['bto:toy']=structuredClone(mastery);
    store.recordAnswer('bto','toy',{mode:'exam',correct,ms:2000,budgetMs:90000});
    assert.deepEqual(store.mastery()['bto:toy'],mastery);
    assert.equal(store.stats()['bto:toy'].n,1);
  }
});

test('only fresh unlabelled practice or drill answers contribute to mixed evidence', () => {
  const store = makeStore(memoryBackend());
  const good = {correct:true,ms:2000,budgetMs:90000,fresh:true,mixed:true};
  for (const [i, event] of [{mixed:false},{fresh:false},{mode:'exam'},{mode:'learn'},{mode:'mistakes'}].entries())
    store.recordAnswer('bto','toy',{...good,...event,key:`excluded${i}`});
  assert.deepEqual(store.mixedEvidence(),{});
  for(let i=0;i<3;i++) store.recordAnswer('bto','toy',{...good,key:`eligible${i}`});
  assert.equal(store.mixedEvidence()['bto:toy'].run,3);
});

test('ten-question checkpoint rejects early exits, mismatched counts and inflated scores', () => {
  const run={mode:'drill',max:10,score:8,items:Array.from({length:10},(_,i)=>({score:i<9?1:-1})),completed:true,plannedCount:10};
  assert.equal(drillPassed(run),true);
  assert.equal(drillPassed({...run,max:1,score:1,items:[{}],completed:false}),false);
  assert.equal(drillPassed({...run,plannedCount:20}),false);
  assert.equal(drillPassed({...run,items:[{}]}),false);
  assert.equal(drillPassed({...run,score:6}),false);
  assert.equal(drillPassed({...run,score:100}),false);
  assert.equal(drillPassed({...run,score:Infinity}),false);
  const old={...run}; delete old.completed;delete old.plannedCount;
  assert.equal(drillPassed(old),true,'legacy complete ten-item drill retains its checkpoint');
  assert.equal(practiceHref({section:'bto',family:null}),'#/run/bto/practice');
});
