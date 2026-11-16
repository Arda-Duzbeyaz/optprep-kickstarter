// Real view controls in jsdom; synthetic clock/state only, no production user data.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.OPTPREP_TEST_JSDOM||'jsdom');
const dom=new JSDOM('<main id="view"></main><div id="live"></div>',{url:'http://localhost/',pretendToBeVisual:true});
for(const key of ['window','document','Node','HTMLElement','Element','Event'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.matchMedia=()=>({matches:true});let now=0,id=0,checks=0;const frames=new Map();
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});globalThis.requestAnimationFrame=f=>{frames.set(++id,f);return id;};globalThis.cancelAnimationFrame=i=>frames.delete(i);
const originalInterval=globalThis.setInterval;globalThis.setInterval=()=>0;
const {GAMES}=await import('../src/zapn/index.js');
const {makeRng}=await import('../src/core/rng.js');
const {renderVisual}=await import('../src/ui/visuals/index.js');
const {orderbookView}=await import('../src/ui/kinds/orderbook.js');
const {PRACTICE_MODULES}=await import('../src/practice/index.js');
const {validateDiagram}=await import('../src/study/diagrams/index.js');
const root=document.getElementById('view'),ok=(v,m)=>{assert.ok(v,m);checks++;};
const button=t=>[...root.querySelectorAll('button')].find(b=>b.textContent===t);
const advance=ms=>{now+=ms;const fs=[...frames.values()];frames.clear();fs.forEach(f=>f(now));};
const summaries=[];let unmount=()=>{};
try{
 for(const game of GAMES){
  let result;unmount=game.view.mount(root,{rng:makeRng(`view-start:${game.id}`),mode:'practice',onFinish:r=>result=r});
  ok(button('Start'),`${game.id} intro`);button('Start').click();advance(1);ok(root.querySelector('.stage'),`${game.id} starts`);
  if(game.id==='codecompare'){
   for(let i=0;i<30;i++){advance(100);const target=root.querySelector('.stage > .num')?.textContent;const option=[...root.querySelectorAll('.option')].find(b=>b.querySelector('.val')?.textContent===target);ok(option,'target has one visible matching code');option.click();advance(1000);}
   ok(result?.value===1,'codecompare complete correct result');ok(root.textContent.includes('CodeCompare: result'),'codecompare result view');
  } else if(game.id==='stockmaster'){
   advance(120000);ok(result?.value===0,'stockmaster no response scores zero');ok(result.detail.misses===result.detail.scheduled,'stockmaster scores every full opportunity');
  } else if(game.id==='balloon'){
   for(let i=0;i<30;i++){now++;[...root.querySelectorAll('button')].find(b=>b.textContent.startsWith('Collect')).click();}
   ok(button('Start round 2'),'balloon round break');button('Start round 2').click();
   for(let i=0;i<20;i++){now++;[...root.querySelectorAll('button')].find(b=>b.textContent.startsWith('Collect')).click();}
   ok(result?.detail.decisions===50,'balloon all decisions recorded');ok(result.detail.decisionLossCents>0,'zero-risk policy has model opportunity cost');ok(root.textContent.includes('bank ratio still depends on luck'),'honest result explanation');
  }
  summaries.push({game:game.id,started:true,completedInView:!!result});unmount();unmount=()=>{};ok(root.childNodes.length===0,`${game.id} cleanup`);ok(frames.size===0,`${game.id} frame cleanup`);
 }
 const hist=PRACTICE_MODULES.ll.families.find(f=>f.id==='histogram-bins').generate(makeRng('dom-density'),{difficulty:4});
 root.append(renderVisual(hist.prompt.visual));ok(root.textContent.includes('Frequency density'),'density axis visible');ok(root.querySelectorAll('svg rect').length>=5,'density bars drawn');root.replaceChildren();
 const weighted=PRACTICE_MODULES.ob.families.find(f=>f.id==='weighted');let item;
 for(let seed=0;seed<100;seed++){const it=weighted.generate(makeRng(`dom-signed:${seed}`),{difficulty:4});if(it.board.instruments.some(i=>i.legs.some(q=>q<0))){item=it;break;}}
 const view=orderbookView(item);root.append(view.el);
 for(const t of item.best.trades){const i=item.board.instruments.findIndex(x=>x.id===t.id);root.querySelectorAll('.ob-table tbody tr')[i].querySelector(`.ob-${t.side}`).click();}
 ok(root.querySelector('.ob-net').textContent.includes('A 0'),'signed basket A flat');ok(view.response().trades.length===item.best.trades.length,'signed basket quantity taps');
 ok(validateDiagram(item.solution.picture.diagram,item.solution.picture.spec).length===0,'signed solution diagram validates');
 const report={assertions:checks,games:summaries,histogram:true,signedWeightedBoard:true,syntheticStateOnly:true};writeFileSync(new URL('../evaluation/battery-dom-flow.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{unmount();globalThis.setInterval=originalInterval;dom.window.close();}
