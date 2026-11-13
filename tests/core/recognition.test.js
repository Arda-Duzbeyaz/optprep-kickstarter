import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recognitionProgress, recognitionStep, coverageInfo } from '../../src/core/recognition.js';
import { makeStore, memoryBackend } from '../../src/core/store.js';
import { migrate, blankV2 } from '../../src/core/migrate.js';
import { practiceItem } from '../../src/core/draw.js';
import { makeRng } from '../../src/core/rng.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { validPractice, practiceHref } from '../../src/core/practice.js';
const good = {correct:true,ms:2000,budgetMs:90000,difficulty:1,levels:[1,2]};
const step = (p,key,changes={}) => recognitionStep(p,{...good,key,...changes},100);

test('three distinct cold successes advance to the next supported generator difficulty',()=>{
  let p; p=step(p,'a');p=step(p,'b');assert.equal(recognitionProgress(p,[1,2]).streak,2);
  const duplicate=step(p,'b');assert.deepEqual(duplicate,p);
  p=step(p,'c');assert.deepEqual(p.passed,[1]);assert.equal(p.target,2);assert.equal(p.run,0);
  assert.deepEqual(p.proofs[0].keys,['a','b','c']);
  for(const key of ['d','e','f'])p=step(p,key,{difficulty:2});
  assert.equal(recognitionProgress(p,[1,2]).complete,true);
  assert.equal(p.target,2);assert.deepEqual(p.passed,[1,2]);
});
test('sparse generator levels do not invent intermediate checkpoints',()=>{
  let p;for(const key of ['a','b','c'])p=step(p,key,{difficulty:3,levels:[5,3,3]});
  assert.equal(p.target,5);assert.deepEqual(p.passed,[3]);
  assert.deepEqual(recognitionProgress(p,[3,5]).levels,[3,5]);
});
for(const [label,bad] of Object.entries({wrong:{correct:false},hint:{hints:1},help:{aided:true},slow:{ms:90001},zero:{ms:0},infinite:{ms:Infinity},invalidBudget:{budgetMs:NaN},paused:{uninterrupted:false}}))
  test(`${label} cannot complete a cold streak`,()=>{
    let p=step(step(undefined,'a'),'b');p=step(p,'c',bad);
    assert.equal(p.run,0);assert.deepEqual(p.passed,[]);assert.deepEqual(p.streakKeys,[]);
  });
test('a failure at a previously passed difficulty requests recheck without deleting proof',()=>{
  let p;for(const key of ['a','b','c'])p=step(p,key);
  p=step(p,'fail',{correct:false});assert.deepEqual(p.passed,[1]);assert.deepEqual(p.review,[1]);assert.equal(p.target,1);
  for(const key of ['d','e','f'])p=step(p,key);
  assert.deepEqual(p.review,[]);assert.equal(p.target,2);assert.equal(p.proofs.length,2);
});
test('passing a difficulty out of sequence does not skip required checkpoints',()=>{
  const p=step(undefined,'hard',{difficulty:2});assert.equal(p.run,0);assert.deepEqual(p.passed,[]);
  assert.deepEqual(step(p,'invalid',{difficulty:4}),p);
});
test('coverage is an explicit learning checklist with honest legacy fallback',()=>{
  assert.equal(coverageInfo(undefined,{lv:3}).covered,true);
  assert.equal(coverageInfo(undefined,{lv:2}).covered,false);
  assert.equal(coverageInfo({covered:false},{lv:5},{passed:[1]}).covered,false);
  assert.equal(coverageInfo({covered:true}).source,'your coverage check');
  const s=makeStore(memoryBackend());s.markCovered('bto','two-dice-sum');assert.equal(s.isEmpty(),false);
  const copy=makeStore(memoryBackend());copy.importJSON(s.exportJSON());assert.equal(copy.coverage('bto','two-dice-sum').covered,true);
  assert.deepEqual(copy.recognition(),{});
});
test('old v2 saves preserve mastery, runs, settings and unknown fields without fabricated recognition',()=>{
  const old=blankV2();delete old.learningCoverage;delete old.recognition;
  old.mastery={'bto:dice':{lv:5,prun:2}};old.mixedEvidence={'bto:dice':{run:3}};
  old.settings={dailyGoalMin:10};old.custom={keep:true};
  const {state}=migrate(old);for(const key of Object.keys(old))assert.deepEqual(state[key],old[key],key);
  assert.deepEqual(state.learningCoverage,{});assert.deepEqual(state.recognition,{});
});
test('malformed new progress records are rejected while the current progress remains intact',()=>{
 const store=makeStore(memoryBackend());store.markCovered('bto','dice');const before=store.exportJSON();
 for(const record of [{passed:{}},{review:'bad'},{keys:{}},{streakKeys:[2]},{proofs:{}},{run:3},{target:8},null]){
  const bad=blankV2();bad.recognition={'bto:dice':record};assert.equal(migrate(bad),null);
  assert.throws(()=>store.importJSON(JSON.stringify(bad)));assert.equal(store.exportJSON(),before);
 }
 const bad=blankV2();bad.learningCoverage={'bto:dice':{covered:'yes'}};assert.equal(migrate(bad),null);
});
test('per-family cold streaks survive unrelated questions, reloads and focused learning',()=>{
  const backend=memoryBackend();let s=makeStore(backend);
  for(const [fam,key] of [['one','a'],['two','b'],['one','c']])s.recordAnswer('bto',fam,{...good,key,mixed:true});
  s.recordAnswer('bto','one',{...good,correct:false,mixed:false});s=makeStore(backend);
  assert.equal(s.recognition()['bto:one'].run,2);assert.equal(s.recognition()['bto:two'].run,1);
  s.recordAnswer('bto','one',{...good,key:'d',mixed:true});assert.deepEqual(s.recognition()['bto:one'].passed,[1]);
});
test('mixed sampler respects frozen skill pools, breadth and per-family difficulty targets',()=>{
  const section=SECTION_MODULES.bto,pool=section.families.slice(0,3).map(f=>f.id),rng=makeRng('breadth');
  const targets=Object.fromEntries(section.families.slice(0,3).map(f=>[f.id,f.levels.at(-1)]));
  const seen=[];
  for(let i=0;i<3;i++){const item=practiceItem(section,rng,{}, {familyPool:pool,avoidFamilies:seen,targets});assert.ok(pool.includes(item.family));assert.equal(item.difficulty,targets[item.family]);seen.push(item.family);}
  assert.equal(new Set(seen).size,3);
  assert.throws(()=>practiceItem(section,rng,{}, {familyPool:[]}));
});
test('covered scope, frozen pool and outside-help marker round-trip in a resumable snapshot',()=>{
  const item=SECTION_MODULES.bto.families[0].generate(makeRng('saved-scope'),{difficulty:1});
  const s={version:1,section:'bto',family:null,scope:'covered',familyPool:[item.family,'die-repeats'],seed:1,rngState:4,index:0,count:10,log:[],xp0:0,lv0:{},savedAt:100,
    current:{item,hints:0,fresh:true,budgetMs:90000,elapsedMs:100,done:false,draft:null,response:null,aided:true}};
  assert.ok(validPractice(s));assert.equal(practiceHref(s),'#/run/bto/mixed/covered');
  const store=makeStore(memoryBackend());store.savePractice(s);assert.deepEqual(store.practiceSession('bto'),s);
  assert.equal(validPractice({...s,scope:'unknown'}),false);assert.equal(validPractice({...s,familyPool:[]}),false);
});
