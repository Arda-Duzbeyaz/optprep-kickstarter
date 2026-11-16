import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeRng} from '../../src/core/rng.js';
import {createEngine as balloon,decisionValues,optimalTarget} from '../../src/zapn/balloon/engine.js';
import {createEngine as codecompare} from '../../src/zapn/codecompare/engine.js';
import {createEngine as stockmaster,schedule} from '../../src/zapn/stockmaster/engine.js';
import {optimum,createEngine as figure} from '../../src/zapn/figureitout/engine.js';

test('battery/codecompare: a gap-ending key cannot answer a stimulus not drawn yet',()=>{
 const e=codecompare(makeRng('transition'),{rounds:2,gapMs:100});e.act({type:'start'},0);
 e.act({type:'choose',index:e.state.rounds[0].answer},250);
 assert.equal(e.state.responses.length,1);
 e.act({type:'choose',index:e.state.rounds[1].answer},400);
 assert.equal(e.state.phase,'show');assert.equal(e.state.responses.length,1);
 e.act({type:'choose',index:e.state.rounds[1].answer},650);
 assert.equal(e.state.responses.length,2);assert.equal(e.state.responses[1].rt,250);
});
test('battery/stockmaster: every scheduled gauge gets a full opportunity and a scored outcome',()=>{
 for(let seed=0;seed<100;seed++){
  const e=stockmaster(makeRng(`full-opportunity:${seed}`));
  assert.ok(e.state.gauges.every(g=>g.end<=120000));
  e.act({type:'start'},100);e.act({type:'tick'},120100);
  assert.equal(e.state.outcome.size,e.state.gauges.length);assert.equal(e.result().detail.misses,e.state.gauges.length);assert.equal(e.result().value,0);
  const gs=schedule(makeRng(`full-opportunity:${seed}`));assert.deepEqual(gs,e.state.gauges);
 }
});
// Independently recurse over pump outcomes, including state-dependent continuation.
function reference(round,N,left,bank,pumps=0){
 if(left===0)return bank;
 const cash=reference(round,N,left-1,bank+pumps*round.centsPerPump);
 const pop=reference(round,N,left-1,bank-Math.floor(bank*round.bankPenalty));
 const pump=(pop+(N-pumps-1)*(pumps<N-1?reference(round,N,left,bank,pumps+1):0))/(N-pumps);
 return Math.max(cash,pump);
}
test('battery/balloon: conditional cash/pump values match independent recursive expectimax',()=>{
 for(const bankPenalty of [0,.5]){
  const round={balloons:3,centsPerPump:2,bankPenalty},N=4;
  for(let i=0;i<3;i++)for(let bank=0;bank<=i*(N-1)*2;bank++)for(let pumps=0;pumps<N;pumps++){
   const v=decisionValues(round,i,bank,pumps,N),cash=reference(round,N,2-i,bank+2*pumps),pop=reference(round,N,2-i,bank-Math.floor(bank*bankPenalty));
   const pump=(pop+(N-pumps-1)*(pumps<N-1?reference(round,N,3-i,bank,pumps+1):0))/(N-pumps);
   assert.ok(Math.abs(v.cash-cash)<1e-9);assert.ok(Math.abs(v.pump-pump)<1e-9,`i=${i},bank=${bank},pumps=${pumps}`);
  }
 }
});
test('battery/balloon: optimal actions have zero decision cost even when realised bank varies',()=>{
 const round={balloons:8,centsPerPump:10,bankPenalty:.5},banks=new Set();
 for(let seed=0;seed<100;seed++){
  const e=balloon(makeRng(`policy:${seed}`),{rounds:[round],maxPumps:6});let t=0;e.act({type:'start'},t++);
  while(!e.isOver()){
   const s=e.state,target=optimalTarget(round,s.balloon,s.banks[0],6);
   while(e.state.phase==='play'&&e.state.pumps<target){const r=e.act({type:'pump'},t++);if(r.outcome==='pop')break;}
   if(!e.isOver()&&e.state.pumps===target)e.act({type:'cash'},t++);
  }
  assert.ok(e.result().detail.decisionLossCents<1e-8);banks.add(e.result().detail.bankCents);
 }
 assert.ok(banks.size>5);
});
test('battery/balloon: cashing immediately sacrifices expected value despite avoiding all pops',()=>{
 const e=balloon(makeRng('timid'),{maxPumps:6,rounds:[{balloons:2,centsPerPump:10,bankPenalty:0}]});
 e.act({type:'start'},0);e.act({type:'cash'},1);e.act({type:'cash'},2);
 assert.ok(Math.abs(e.result().detail.decisionLossCents-30)<1e-9);
});
test('battery/figure: efficient searches can exceed their mean and a smaller property can finish last',()=>{
 const e=figure({int:(_,hi)=>hi},{rounds:[[4,4,3]]});e.act({type:'start'},0);
 for(let i=0;i<4;i++)e.act({type:'guess',code:[i,i,Math.min(i,2)]},i+1);
 assert.equal(e.state.results[0].guesses,4);assert.ok(e.result().value>0);
 assert.equal(e.state.results[0].optimal,optimum([4,4,3]).expected);
 const choices=[0,2],f=figure({int:()=>choices.shift()},{rounds:[[5,3]]});f.act({type:'start'},0);
 for(let i=0;i<3;i++)f.act({type:'guess',code:[0,i]},i+1);
 assert.equal(f.state.results[0].guesses,3);assert.ok(f.state.guesses[0].marks[0]);assert.ok(!f.state.guesses[0].marks[1]);
});
