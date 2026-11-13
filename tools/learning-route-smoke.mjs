// Execute the shipped entry point and user journey with isolated browser storage.
// OPTPREP_TEST_JSDOM=/path/to/jsdom node tools/learning-route-smoke.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.OPTPREP_TEST_JSDOM||'jsdom');
const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'http://localhost/#/'});
for(const k of ['window','document','Node','HTMLElement','Element','localStorage','location','navigator','Event','CustomEvent','Blob','File'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
globalThis.matchMedia=dom.window.matchMedia=()=>({matches:true,addEventListener(){}});
dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
globalThis.confirm=()=>true;globalThis.fetch=async()=>({ok:false,json:async()=>({ok:false})});
let now=0,frame=0,checks=0;const frames=new Map(),intervals=[];
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
globalThis.requestAnimationFrame=f=>{frames.set(++frame,f);return frame;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
const origInterval=globalThis.setInterval;globalThis.setInterval=(...a)=>{const id=origInterval(...a);intervals.push(id);return id;};
const origNow=Date.now;Date.now=()=>Date.UTC(2026,10,13,12)+now;
const {blankV2}=await import('../src/core/migrate.js');
const initial=blankV2();initial.settings.preset={id:'kickstarter'};
initial.mastery={'bto:legacy':{lv:4,prun:2}};initial.mixedEvidence={'bto:legacy':{run:3}};
localStorage.setItem('optprep:v2',JSON.stringify(initial));
const root=document.getElementById('view'),state=()=>JSON.parse(localStorage.getItem('optprep:v2'));
const button=label=>[...root.querySelectorAll('button')].find(b=>b.textContent===label);
function ok(value,label){assert.ok(value,label);checks++;}function eq(a,b,label){assert.deepEqual(a,b,label);checks++;}
async function until(fn,label){for(let i=0;i<200;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error(`Timeout ${label}: ${root.textContent.slice(0,220)}`);}
async function route(hash,heading){location.hash=hash;await until(()=>root.querySelector('h1')?.textContent===heading,hash);}
async function practice(hash){await route(hash,'Beat the Odds: Practice');if(button('Start new 10-question block'))button('Start new 10-question block').click();await until(()=>root.querySelector('.prompt'),'practice prompt');}
function advance(ms=3000){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(now));}
function correct(){const item=state().activePractice.bto.current.item;root.querySelectorAll('[role=radio]')[item.answerIndex].click();advance();button('Submit').click();return item;}
try{
 const {render:renderTree}=await import('../src/study/diagrams/tree.js');
 const spec={root:{label:'Start',children:[{label:'A',p:'1/3',mark:true},{label:'B',p:'2/3'}]},total:'1/3'};
 const freeze=o=>{Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);};freeze(spec);
 const beforeTree=JSON.stringify(spec);ok(renderTree(spec).querySelector('circle'),'frozen tree renders');renderTree(spec);
 eq(JSON.stringify(spec),beforeTree,'rendering twice leaves the saved question JSON unchanged');
 await import('../app.js');await until(()=>root.querySelector('h1')?.textContent==='Today','Today');
 ok(root.textContent.includes('24 days to your deadline'));ok(root.textContent.includes('22:59'));ok(root.textContent.includes('23:59'));
 ok(root.textContent.includes('8 hours/week'));ok(root.querySelector('.daily-focus'));ok(root.querySelector('.daily-routine'));
 await route('#/s/bto','Beat the Odds');ok(button('Learn skills below'));ok(root.textContent.includes('0/2 difficulties verified'));
 for(const family of ['two-dice-sum','die-repeats']){
  await practice(`#/run/bto/practice/${family}`);ok(root.textContent.includes('Learning only · help allowed'));
  button('Mark covered').click();eq(state().learningCoverage[`bto:${family}`].covered,true);
  eq(state().recognition,{},'manual coverage creates no cold pass');
  await route('#/s/bto','Beat the Odds');
 }
 ok(root.querySelector('a[href="#/run/bto/mixed/covered"]'));
 await practice('#/run/bto/mixed/covered');
 const pool=state().activePractice.bto.familyPool;eq(pool,['two-dice-sum','die-repeats']);
 const seen=[];
 for(let i=0;i<10;i++){
  const current=state().activePractice.bto.current.item;
  ok(!root.querySelector('.qhead').textContent.includes('sum events'),'method hidden');
  ok(!root.querySelector('.practice-level-strip').textContent,'difficulty hidden before submission');
  const item=correct();seen.push(item.family);ok(pool.includes(item.family));
  if(i<4)eq(item.difficulty,1,'initial supported difficulty');
  if(i>=6)eq(item.difficulty,2,'new draws advance to the next supported difficulty');
  if(i<9)button('Next (Enter)').click();
 }
 eq(seen.filter(f=>f==='two-dice-sum').length,5);eq(new Set(seen.slice(0,2)).size,2,'breadth before repeating');
 for(const family of pool)eq(state().recognition[`bto:${family}`].passed,[1]);
 button('Finish').click();ok(root.textContent.includes('Block complete'));
 eq(state().activePractice.bto,undefined);eq(state().mastery,initial.mastery,'legacy counters retained');
 eq(state().mixedEvidence,initial.mixedEvidence,'legacy mixed history retained');
 button('Start another 10 questions').click();const family=state().activePractice.bto.current.item.family;
 button('Used outside help').click();correct();eq(state().recognition[`bto:${family}`].run,0);
 eq(state().recognition[`bto:${family}`].lastReason,'help');ok(root.textContent.includes('Help used: learning only'));
 button('Next (Enter)').click();const prompt=root.querySelector('.prompt').textContent;
 await route('#/','Today');ok(root.textContent.includes('Continue practice'));
 await practice('#/run/bto/mixed/covered');eq(root.querySelector('.prompt').textContent,prompt,'same saved question');
 ok(state().activePractice.bto.current.interrupted,'unanswered resumed attempts are tainted');
 correct();eq(state().recognition[`bto:${state().activePractice.bto.current.item.family}`].lastReason,'interrupted');
 await route('#/settings','Settings');
 const hours=root.querySelector('#prep-hours');hours.value='10';button('Save preparation plan').click();eq(state().settings.weeklyPrepHours,10);
 eq(state().settings.assessmentDeadline,'2026-12-06T22:59:00.000Z');eq(state().settings.dailyGoalMin,undefined,'habit default preserved');
 await route('#/','Today');ok(root.textContent.includes('10 hours/week'));
 await route('#/transfer/iv','Transfer Challenge');eq(root.querySelector('#transfer-scope').value,'iv');
 ok(root.textContent.includes('10 questions from one assessment'));root.querySelector('#transfer-timing').value='untimed';
 const ordinary=JSON.stringify({recognition:state().recognition,stats:state().stats,mastery:state().mastery});
 button('Start Transfer Challenge').click();
 for(let i=0;i<10;i++){ok(root.querySelector('.qhead').textContent.includes('Intervals'));button('Skip').click();}
 ok(root.textContent.includes('Transfer Challenge: review'));ok(!root.textContent.includes('0/0 non-interval'),'single-type review avoids meaningless denominators');eq(state().transferRuns.at(-1).section,'iv');
 eq(state().transferRuns.at(-1).count,10);eq(state().transferRuns.at(-1).timing.totalSeconds,900);
 eq(JSON.stringify({recognition:state().recognition,stats:state().stats,mastery:state().mastery}),ordinary,'Transfer stays separate');
 await route('#/progress/skills','Progress');ok(root.textContent.includes('Coverage records what you have learned'));ok(root.textContent.includes('all supported difficulties verified'));
 console.log(`${checks} learning-route assertions passed: deadline, coverage, cold mixed progression, real difficulty advancement, help, resume, settings, single-section transfer and progress preservation.`);
}finally{Date.now=origNow;globalThis.setInterval=origInterval;for(const id of intervals)clearInterval(id);dom.window.close();}
