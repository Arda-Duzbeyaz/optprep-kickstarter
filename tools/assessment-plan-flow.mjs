// Exercise the delivered routes with isolated, synthetic browser storage.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { blankV2 } from '../src/core/migrate.js';
import { makeStore } from '../src/core/store.js';
import { independent } from '../src/checks/independent.js';
import { PAPERS } from '../src/checks/papers.js';
import { drillItem } from '../src/checks/drills.js';
import { grade } from '../src/checks/material.js';

const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'), {url:'http://localhost/#/'});
for (const k of ['window','document','Node','HTMLElement','Element','localStorage','location','navigator','Event','CustomEvent','Blob','File'])
  Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
globalThis.matchMedia=dom.window.matchMedia=()=>({matches:true,addEventListener(){}});
window.scrollTo=()=>{};window.HTMLElement.prototype.scrollIntoView=()=>{};
globalThis.fetch=async()=>({ok:false,json:async()=>({ok:false})});
globalThis.confirm=()=>true;
let elapsed=0,frame=0,questions=0,assertions=0;
const frames=new Map(),timers=new Set(),errors=[];
const dateNow=Date.now,interval=globalThis.setInterval;
Date.now=()=>Date.UTC(2026,10,19,10)+elapsed;
Object.defineProperty(globalThis,'performance',{value:{now:()=>elapsed},configurable:true});
globalThis.requestAnimationFrame=f=>{frames.set(++frame,f);return frame;};
globalThis.cancelAnimationFrame=k=>frames.delete(k);
globalThis.setInterval=(...args)=>{const i=interval(...args);timers.add(i);return i;};
window.addEventListener('error',e=>errors.push(e.error?.stack || e.message));
const state=()=>JSON.parse(localStorage.getItem('optprep:v2')), root=document.getElementById('view');
const old=blankV2();delete old.checkSessions;
old.settings.preset={id:'kickstarter'};old.activity.xpBase=37;old.stats['bto:conditional-dice']={n:2,correct:1,ms:1100};
localStorage.setItem('optprep:v2',JSON.stringify(old));
const check=(v,m)=>{assert.ok(v,m);assertions++;};
const eq=(v,x,m)=>{assert.deepEqual(v,x,m);assertions++;};
const btn=text=>[...root.querySelectorAll('button')].find(b=>b.textContent===text);
const link=href=>[...root.querySelectorAll('a')].find(a=>a.getAttribute('href')===href);
async function until(pred,label) {
  for(let n=0;n<300;n++){if(pred())return;await new Promise(r=>setTimeout(r,5));}
  throw Error(label+' · '+root.textContent.slice(0,450));
}
async function go(hash) {
  if(location.hash===hash)return;
  const prev=root.firstElementChild;
  location.hash=hash;
  await until(()=>root.firstElementChild!==prev,hash);
  check(!['Page not found','This page failed to load'].includes(root.querySelector('h1')?.textContent),hash);
}
function input(field,value) {
  field.value=String(value);
  field.dispatchEvent(new Event('input',{bubbles:true}));
}
function advance(ms) {
  elapsed+=ms;
  const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(elapsed));
}
function answer(q) {
  const form=root.querySelector('form');
  if(q.kind==='number') input(form.querySelector('input'),q.answer);
  else if(q.kind==='interval') {
    input(form.querySelector('[aria-label="Lower bound"]'),q.truth);
    input(form.querySelector('[aria-label="Upper bound"]'),q.truth);
  } else if(q.kind==='rank') {
    q.answerOrder.forEach((index,target)=>{
      while([...form.querySelectorAll('.rank-row')].findIndex(row=>+row.dataset.si===index)>target)
        form.querySelector('.rank-row[data-si="'+index+'"] [aria-label="Move up"]').click();
    });
  } else if(!q.best) form.querySelector('input[type=checkbox]').click();
  else for(const t of q.best.trades) {
    const i=q.board.instruments.findIndex(ins=>ins.id===t.id);
    form.querySelectorAll('.ob-table tbody tr')[i].querySelector('.ob-'+t.side).click();
  }
  return form;
}
try {
  await import('../app.js');
  await until(()=>root.querySelector('h1')?.textContent==='Today','Home');
  check(link('#/run/bto/exam'),'baseline on Today');
  await go('#/coach');
  for(const id of [...Object.keys(PAPERS),'zapn']) check(link('#/coach/'+id),'coach link '+id);
  const select=root.querySelector('[aria-label="Available session time"]');
  select.value='30';select.dispatchEvent(new Event('change',{bubbles:true}));
  eq(state().settings.sessionMinutes,30,'session budget survives reload');

  for(const [section,forms] of Object.entries(PAPERS)){
    await go('#/coach/'+section);
    for(const form of ['a','b','c','drill']) check(link('#/checks/'+section+'/'+form),'section entry '+form);
    for(const form of ['a','b','c','drill']){
      const hash='#/checks/'+section+'/'+form, workshop=form==='drill';
      await go(hash);
      btn(workshop?'Start workshop':'Start first attempt').click();
      const key=Object.keys(state().checkSessions).find(k=>k.startsWith(section+':'+form));
      const start=state().checkSessions[key];
      for(let i=0;i<5;i++){
        const q=workshop?drillItem(section,key,i):(form==='c'?independent[section]:forms[form])[i];
        check(root.querySelector('.check-prompt').textContent===q.text,'correct generated question');
        if(!workshop){
          eq(root.querySelectorAll('details').length,0,'reserved answers withheld');
          eq(root.querySelectorAll('a[target="_blank"]').length,0,'reference hidden until finish');
        }
        if(section==='bto' && form==='a' && i===0){
          btn('Submit answer').click();check(root.querySelector('[role=status]').textContent.includes('Enter'),'empty validation');
          input(root.querySelector('form input'),'1 / 2');
          await go('#/coach/bto');await go(hash);
          eq(root.querySelector('form input').value,'1 / 2','return restores typed answer');
          eq(state().checkSessions[key].endsAt,start.endsAt,'original clock');
        }
        if(section==='iv' && form==='a' && i===0){
          input(root.querySelector('[aria-label="Lower bound"]'),2);
          await go('#/coach/iv');await go(hash);
          eq(root.querySelector('[aria-label="Lower bound"]').value,'2','partial bounds survive navigation');
          eq(root.querySelector('[aria-label="Upper bound"]').value,'','empty upper bound retained');
        }
        const el=answer(q);
        advance(800);
        el.querySelector('button[type=submit]').click();
        const row=state().checkSessions[key].answers[i];
        eq(row.score,1,'answer through visible controls');
        eq(grade(q,row.response).score,1,'stored response matches grader');
        if(workshop && i<4) check(root.querySelector('.check-last')?.textContent.includes(q.explanation),'immediate workshop feedback');
        questions++;
      }
      check(root.querySelector('h1').textContent.endsWith('review'),'review shown');
      check(root.querySelectorAll('details').length>=5,'review for all five items');
      if(section==='iv' && !workshop && form!=='c') eq(root.querySelectorAll('details a[target="_blank"]').length,5,'sources available in review');
      if(!workshop){
        const snapshot=state().checkSessions[key];
        await go('#/coach/'+section);await go(hash);
        eq(state().checkSessions[key],snapshot,'finished first attempt preserved');
        eq(btn('Start first attempt'),undefined,'no retake of reserved form');
      }
    }
  }

  check(root.textContent.includes('review'),'final workshop review');
  await go('#/coach/nl');
  const outside=root.querySelector('details form'), numbers=outside.querySelectorAll('input[type=number]');
  input(numbers[0],4);input(numbers[1],5);input(numbers[2],7);
  outside.querySelector('button[type=submit]').click();
  const r=state().runs.find(r=>r.mode==='outside');
  eq([r.score,r.max,r.ms],[4,5,420000],'outside result saved');
  check(root.textContent.includes('0/3'),'outside work never inflates timed streak');
  await go('#/coach/iv');check(root.textContent.includes('20/20'),'calibration across forms and workshop');
  const migrated=makeStore(localStorage);
  eq(migrated.state.stats['bto:conditional-dice'],old.stats['bto:conditional-dice'],'original topic progress retained');
  eq(migrated.xpTotal(),37,'workshop and papers kept out of unfinished topic and XP');
  await go('#/run/bto/exam');btn('Start the clock').click();btn('Finish exam').click();
  check(root.textContent.includes('Ended early'),'early exit clearly identified');
  await go('#/coach/bto');check(root.textContent.includes('0/3'),'early exit excluded');
  await go('#/run/ll/exam');btn('Start the clock').click();
  advance(1500001);
  const timed=state().runs.filter(r=>r.section==='ll' && r.mode==='exam').at(-1);
  eq(timed.finishReason,'time','whole-paper expiry recorded');
  eq(timed.items[0].outcome,'skipped','untouched initial rank cannot earn credit on timeout');
  check(timed.items.slice(1).every(r=>r.outcome==='unreached'),'unvisited items classified separately');
  await go('#/coach/zapn');
  for(const id of ['codecompare','pincode','theswitch']) check(link('#/zapn/'+id+'/practice'),'starter game '+id);
  root.querySelector('input[type=checkbox]').click();
  eq(state().settings.assessmentsFinished.zapn,true,'manual completion saved');
  eq(errors,[],'no uncaught UI errors');
  console.log('Assessment-plan router passed · '+assertions+' assertions · '+questions+' question submissions.');
} finally {
  Date.now=dateNow;globalThis.setInterval=interval;timers.forEach(clearInterval);dom.window.close();
}
