import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS } from '../../config/sections.js';
import { timingOf } from '../../config/presets.js';
import { makeStore, memoryBackend } from '../../src/core/store.js';
import { checkTotal, calibration, paperDone, validCheckSessions } from '../../src/core/check-sessions.js';
import { trainingDay, readiness } from '../../src/core/readiness.js';
import { examEvidence, debrief, sessionPlan, paperSeconds } from '../../src/core/assessment-coach.js';
import { PRACTICE_FAMILIES } from '../../src/practice/catalog.js';
import { PAPERS } from '../../src/checks/papers.js';
import { drillItem } from '../../src/checks/drills.js';
import { grade, numericValue, validAnswer } from '../../src/checks/material.js';
import { bruteForceBest } from '../../src/sections/ob/solver.js';

const day = 86400000, now = Date.UTC(2026,10,19,10);
function context() {
  let t=now;
  const backend=memoryBackend(), reload=()=>makeStore(backend,{}, {clock:()=>t});
  return {store:reload(),reload,setClock:x=>{t=x;}};
}
const exam = (section,finishedAt,score,extra={}) => ({
  section,finishedAt,score,mode:'exam',freshnessChecked:true,completePaper:true,
  max:SECTIONS[section].exam.count,timing:timingOf(SECTIONS[section].exam),...extra
});
function bestResponse(q) {
  if(q.kind==='number') return {value:String(q.answer)};
  if(q.kind==='rank') return {order:q.answerOrder};
  if(q.kind==='interval') return {lower:q.truth,upper:q.truth};
  return q.best ? {trades:q.best.trades} : {pass:true};
}
function validatedQuestion(q,id) {
  assert.ok(q.text && q.explanation);
  if(q.skill) assert.ok(PRACTICE_FAMILIES[id].some(f=>f.id===q.skill), q.skill);
  if(q.kind==='rank') {
    assert.equal(new Set(q.statements.map(s=>s.p)).size,3);
    assert.ok(q.statements.every(s=>s.p>=0 && s.p<=1));
  }
  assert.equal(grade(q,bestResponse(q)).score,1);
  assert.equal(grade(q,null).score,0);
}

test('reserved papers contain 50 scorable questions, separate from workshop material',()=>{
  let count=0;
  for(const [id,papers] of Object.entries(PAPERS)) {
    assert.deepEqual(Object.keys(papers),['a','b']);
    const identity=q=>JSON.stringify([q.text,q.table,q.board]);
    const workshopPrompts=new Set(Array.from({length:30},(_,i)=>identity(drillItem(id,'distinct',i))));
    for(const form of Object.values(papers)) {
      assert.equal(form.length,5);
      for(const item of form) {
        validatedQuestion(item,id);
        assert.equal(workshopPrompts.has(identity(item)),false);
        if(id==='iv') assert.match(item.source[1],/^https:\/\//);
        count++;
      }
    }
  }
  assert.equal(count,50);
});

test('fixed probability and numerical answers agree with independent calculations',()=>{
  const bto=[...PAPERS.bto.a,...PAPERS.bto.b];
  const goldGold=3*2, goldSilver=3*2; // count pairs with the displayed token in position one
  const expected=[goldGold/(goldGold+goldSilver), (7+3+4+5+6)/6, 1-(5*4*3)/(7*6*5),
    4*(3/4)**3, ((1/3)*(1/2)**2+(2/3)*(1/4)**2)/((1/3)*(1/2)+(2/3)*(1/4)),
    (4*3)/(6*5-2), (1/3)/(1-(2/3)*(1/2)), 24, (15*7-21*3)/36,
    (1*4+2*3+3*2+4)/10];
  bto.forEach((q,i)=>assert.ok(Math.abs(q.answer-expected[i]) < 1e-8));
  assert.deepEqual([...PAPERS.nl.a,...PAPERS.nl.b].map(q=>q.answer),[100,15,23,72,211,6.4,19.2,84,45,70]);
});

test('open numbers distinguish probabilities from percentage units and reject ambiguous input',()=>{
  assert.equal(numericValue('1 / 4','probability'),.25);
  assert.equal(numericValue('25%','probability'),.25);
  assert.equal(numericValue('25%','%'),25);
  assert.equal(numericValue('−2.5',''),-2.5);
  for(const x of ['','0/0','3/0','Infinity','1x','2^3']) assert.equal(numericValue(x,''),null);
  assert.equal(numericValue('3%','kg'),null);
  assert.equal(grade(PAPERS.bto.a[1],{value:'4.167'}).score,1);
  assert.equal(grade(PAPERS.bto.a[1],{value:'4.16'}).score,0);
});

test('bounded independent enumeration verifies the ten trade-or-pass problems',()=>{
  const boards=[...PAPERS.ob.a,...PAPERS.ob.b], profits=[2,null,2,2,2,null,2,4,2,2];
  boards.forEach((q,i)=>{
    assert.equal(bruteForceBest(q.board,6)?.profit??null,profits[i]);
    assert.equal(grade(q,{pass:true}).score,Number(profits[i]===null));
    assert.equal(validAnswer(q,{trades:Array(7).fill({id:'q0',side:'buy'})}),false);
  });
  const q=boards[7];
  const simple=[{id:'q2',side:'buy'},{id:'q0',side:'sell'},{id:'q1',side:'sell'}];
  assert.equal(grade(q,{trades:simple}).score,1);
});

test('all 2,500 workshop draws preserve answer keys, repair links and reproducible positions',()=>{
  for(const id of Object.keys(PAPERS)) for(let seed=0;seed<100;seed++) for(let i=0;i<5;i++) {
    const q=drillItem(id,seed,i);
    validatedQuestion(q,id);
    assert.deepEqual(drillItem(id,seed,i),q);
    if(id==='ll' && q.skill==='conditional-rates') {
      const sorted=q.statements.map(x=>x.p).sort((a,b)=>a-b);
      assert.ok(sorted[2]-sorted[0]<.02);
    }
  }
});

test('paper starts and submits are idempotent, reloadable and enforce their original deadline',()=>{
  const ctx=context(), a=ctx.store;
  const key=a.startCheck('bto','a',10);
  assert.equal(a.updateCheck(key,0,{value:'1 / 2'}),true);
  const b=ctx.reload();assert.deepEqual(b.state.checkSessions[key].draft,{value:'1 / 2'});
  assert.equal(b.startCheck('bto','a',200,3),key);
  ctx.setClock(now+9999);
  assert.equal(a.updateCheck(key,0,{value:'1/2'},{score:1,skill:'information-protocols'}),true);
  assert.equal(b.updateCheck(key,0,null,{score:0}),false);
  ctx.setClock(now+10000);
  assert.equal(b.updateCheck(key,1,{value:'4'},{score:1}),false);
  assert.equal(b.startCheck('bto','a',10),key);
  assert.equal(b.state.checkSessions[key].endsAt,now+10000);
  assert.ok(paperDone(b.state.checkSessions[key],now+10000));
  assert.equal(checkTotal(b.state.checkSessions[key]),1);
  assert.equal(b.state.runs.length,0);
  assert.equal(b.xpTotal(),0);
});

test('workshops preserve half-filled drafts, rotate on completion and round-trip with existing progress',()=>{
  const {store,reload}=context();
  store.recordAnswer('bto','conditional-dice',{correct:true,ms:1000});
  const old=JSON.parse(store.exportJSON());delete old.checkSessions;
  store.importJSON(JSON.stringify(old));
  const key=store.startCheck('iv','drill',0);
  store.updateCheck(key,0,{lower:'4',upper:''});
  const restored=reload();
  assert.equal(restored.state.stats['bto:conditional-dice'].n,1);
  assert.deepEqual(restored.state.checkSessions[key].draft,{lower:'4',upper:''});
  assert.equal(restored.startCheck('iv','drill',0),key);
  for(let i=0;i<5;i++) restored.updateCheck(key,i,null,{score:0});
  assert.notEqual(restored.startCheck('iv','drill',0),key);
  const imported=makeStore(memoryBackend());
  imported.importJSON(restored.exportJSON());
  assert.deepEqual(imported.state.checkSessions,restored.state.checkSessions);
  assert.equal(validCheckSessions(imported.state.checkSessions),true);
});

test('interval calibration never leaks results from a running paper or an unanswered question',()=>{
  const {store}=context();
  const k=store.startCheck('iv','a',200);
  const record=(key,i,lower,upper,truth)=>store.updateCheck(key,i,{lower,upper},grade({kind:'interval',truth},{lower,upper}));
  record(k,0,10,30,20);
  assert.equal(calibration(store.state.checkSessions,30,now),null);
  const d=store.startCheck('iv','drill',0);
  record(d,0,1,2,4);record(d,1,10,50,6);store.updateCheck(d,2,null,{score:0});
  assert.deepEqual(calibration(store.state.checkSessions,30,now),{n:2,inside:0,above:1,below:1,typicalWidth:3.5});
  assert.deepEqual(calibration(store.state.checkSessions,30,now+200000),{n:3,inside:1,above:1,below:1,typicalWidth:3});
});

test('three distinct London practice days ignore repeats, early exits, variants and outside work',()=>{
  const {store}=context(), id='nl';
  const runs=[exam(id,now-2*day,20),exam(id,now-day,20),exam(id,now,20),exam(id,now+1,1),
    exam(id,now+2,26,{completePaper:false}),exam(id,now+3,26,{mode:'outside'}),exam(id,now+4,26,{repeatCount:1}),
    exam(id,now+5,26,{mode:'exam-variant'}),exam(id,now+6,26,{timing:{count:26,totalSeconds:3000}})];
  assert.equal(examEvidence(id,runs).streak,0);
  runs.push(exam(id,now+7,20));assert.equal(examEvidence(id,runs).streak,3);
  assert.equal(readiness(runs,SECTIONS.nl.target,3,SECTIONS.nl.exam,true).streak,3);
  assert.equal(examEvidence(id,[exam(id,now,21),exam(id,now+1,22),exam(id,now+2,23)]).streak,1);
  assert.equal(trainingDay(Date.UTC(2026,6,1,23,15)),trainingDay(Date.UTC(2026,6,2,1)));
  assert.equal(sessionPlan(store.state,now).rows.length,5);
});

test('planner starts with quantitative baselines, fits shorter sessions and respects completed portal sections',()=>{
  const {store}=context();
  assert.deepEqual(sessionPlan(store.state,now,120).actions.slice(0,2).map(a=>a.id),['bto','nl']);
  for(const budget of [30,60,120]) assert.ok(sessionPlan(store.state,now,budget).minutes<=budget);
  store.setSetting('assessmentsFinished',Object.fromEntries(Object.keys(PAPERS).map(id=>[id,true])));
  assert.equal(sessionPlan(store.state,now).actions[0].id,'zapn');
  for(const game of ['pincode','theswitch','codecompare']) store.recordZapn(game,{mode:'practice'});
  assert.equal(sessionPlan(store.state,now).actions[0].href,'#/coach/zapn');
  store.setSetting('assessmentsFinished',{...store.settings().assessmentsFinished,zapn:true});
  assert.equal(sessionPlan(store.state,now).actions.length,0);
});

test('after a weak section the recommendation moves from the measured skill to mixed practice to a later timed check',()=>{
  const {store}=context(), id='bto', state=store.state;
  const item={family:'conditional-dice',outcome:'wrong',ms:30000,score:-1};
  state.runs=[exam(id,now,2,{items:[item,{family:'linearity',outcome:'unreached',score:0,ms:0}]})];
  const next=t=>sessionPlan(state,t).rows.find(r=>r.id===id).next;
  assert.equal(debrief(id,state.runs[0]).unreached,1);
  assert.equal(next(now).href,'#/run/bto/practice/conditional-dice');
  state.runs.push({section:id,mode:'practice',completed:true,family:'conditional-dice',finishedAt:now+10});
  assert.equal(next(now+20).kind,'mixed');
  state.runs.push({section:id,mode:'practice',completed:true,family:null,finishedAt:now+30});
  assert.equal(next(now+40).kind,'practice');
  assert.equal(next(now+day).kind,'retest');
});

test('reserved checks follow a good full paper and check actual coverage on uncertain inputs',()=>{
  const {store,setClock}=context(), id='iv';
  store.state.runs.push(exam(id,now,17));
  const next=t=>sessionPlan(store.state,t).rows.find(r=>r.id===id).next;
  assert.equal(next(now).kind,'paper');
  setClock(now+1);const key=store.startCheck(id,'a',paperSeconds(id));
  assert.equal(next(now+2).kind,'resume');
  for(let i=0;i<5;i++) store.updateCheck(key,i,{lower:1,upper:10000},{score:.0001,direction:'inside'});
  assert.notEqual(next(now+2).kind,'repair');
  assert.equal(next(now+day).kind,'retest');
});
