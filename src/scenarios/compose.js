import { buildMcq } from '../core/options.js';
import { questionKey } from '../core/questions.js';
import { structureKey } from '../transfer/profile.js';

const eventFamilies=new Set('two-dice-sum die-repeats dice-order-stats three-dice at-least-one conditional-dice card-symmetry card-draws urn-draws coin-sequences race-to-k information-protocols shared-source'.split(' '));
const fmt=x=>String(Number(x.toPrecision(5)));

// Restrict composition to an explicit probability question from a reviewed family.
export function composeEvent(item,rng){
  const p=item.answer?.value;
  if(item.section!=='bto' || !eventFamilies.has(item.family) || !(p>.005 && p<.995) ||
      !/probability|chance/i.test(item.prompt.text) || /expected|variance/i.test(item.prompt.text))return item;
  const n=rng.int(2,4), prize=rng.int(3,9), sensitivity=rng.pick([.7,.8,.9]), falseAlarm=rng.pick([.1,.2,.3]);
  const mode=rng.pick(['signal','posterior','first-hit','net-prize']);
  const evidence=p*sensitivity+(1-p)*falseAlarm;
  const branches={
    signal:['Under the same stated conditions, a sensor reports positive with probability '+sensitivity+' when that event happens and '+falseAlarm+' otherwise. What is the probability of a positive report?',evidence,'Add the true-positive and false-positive paths.'],
    posterior:['Under the same stated conditions, a sensor reports positive with probability '+sensitivity+' when that event happens and '+falseAlarm+' otherwise. Given a positive report, what is the probability the event occurred?',p*sensitivity/evidence,'Divide the probability of a true positive by the probability of any positive report.'],
    'first-hit':['Repeat the entire experiment independently '+n+' times under the same stated conditions. What is the probability the first occurrence is on the final trial?',(1-p)**(n-1)*p,'Require every earlier trial to miss, followed by one hit.'],
    'net-prize':['Repeat the entire experiment independently '+n+' times under the same stated conditions. Entry costs £1 once. You receive £'+prize+' once if the event occurs at least once. What is the expected net gain in pounds?',prize*(1-(1-p)**n)-1,'Use the complement of no hits, multiply by the one-off prize, then subtract the entry fee.'],
  };
  const [question,value,method]=branches[mode];
  const result={...item,composition:{mode,p,n,prize,sensitivity,falseAlarm,baseKey:questionKey(item),baseStructure:structureKey(item)},
    prompt:{...item.prompt,text:'First find the probability requested here. '+item.prompt.text+' '+question+' Pick the closest value.'},
    ...buildMcq(rng,{correct:value,format:fmt,minGap:()=>1e-7,distractors:[
      {value:p,misconception:'Stopped after the first part.'},{value:1-p,misconception:'Returned the complement of the starting event.'},
      {value:p*sensitivity,misconception:'Used only the true-positive path.'},{value:(1-p)**n,misconception:'Calculated the probability of no hits.'}]}),
    answer:{value,exact:fmt(value)},solution:{...item.solution,ask:question,fast:method,rule:method,steps:[...item.solution.steps,
      {say:method,why:'The first answer is the input probability for the second stage.',math:'Starting probability ≈ '+fmt(p)+'; final result ≈ '+fmt(value)}]}};
  result.id='composed:'+questionKey(result);return result;
}
