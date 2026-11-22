import { btoChoices, bayesWork, q, qpow, exactText } from '../sections/bto/lib.js';
import { questionKey } from '../core/questions.js';
import { structureKey } from '../transfer/profile.js';

const eventFamilies=new Set('two-dice-sum die-repeats dice-order-stats three-dice at-least-one conditional-dice card-symmetry card-draws urn-draws coin-sequences race-to-k information-protocols shared-source'.split(' '));
const fmt=x=>String(Number(x.toPrecision(5)));

// Keep the observation in the setup. A "hit" describes the event within
// that experiment, rather than a second, independent observation.
function eventSetup(text) {
  const cleaned=text.replace(/ Pick the closest value\.$/,'');
  const trailing=cleaned.match(/^(.*\?) (\([^?]+\))$/);
  const stem=(trailing?trailing[1]:cleaned).replace(' Given that sum, what is the probability',' What is the probability');
  const extra=trailing?' '+trailing[2]:'';
  const conditional=stem.match(/^(.*\. )Given that (.+?), what is the (?:probability|chance) that (.+)\?$/);
  if(conditional) {
    const [,setup,condition,event]=conditional;
    return `${setup}Only outcomes where ${condition} count as trials. A trial is a hit if ${event}.${extra}`;
  }
  const statement=stem.match(/^(.*\. )What is the (?:probability|chance) (that|of) (.+)\?$/);
  if(!statement) return null;
  const [,setup,form,event]=statement;
  return setup+(form==='that'?`A trial is a hit if ${event}.`:`A hit means ${event}.`)+extra;
}

export function composeEvent(item,rng){
  const p=item.answer?.value;
  if(item.section!=='bto' || !eventFamilies.has(item.family) || !(p>.005 && p<.995)) return item;
  const setup=eventSetup(item.prompt.text);
  if(!setup) return item;
  const n=rng.int(2,4), prize=rng.int(3,9), sensitivity=rng.pick([.7,.8,.9]), falseAlarm=rng.pick([.1,.2,.3]);
  const mode=rng.pick(['signal','posterior','first-hit','net-prize']);
  const exactBase=/^(\d+)(?:\/(\d+))?$/.exec(item.answer.exact);
  const fraction=exactBase ? q(exactBase[1],exactBase[2] ?? 1) : null;
  const hit=fraction && Math.abs(fraction.toNumber()-p)<1e-12 ? fraction : null;
  const miss=hit ? q(1).sub(hit) : null;
  const rates=[q(Math.round(sensitivity*10),10), q(Math.round(falseAlarm*10),10)];
  const positiveHit=`${hit ?? 'p'} × ${rates[0]}`, positiveMiss=`${miss ?? '(1 − p)'} × ${rates[1]}`;
  const posteriorWork=hit && bayesWork(hit,...rates);
  const exact=hit && {
    signal:hit.mul(rates[0]).add(miss.mul(rates[1])),
    posterior:posteriorWork.correct,
    'first-hit':qpow(miss,n-1).mul(hit),
    'net-prize':q(1).sub(qpow(miss,n)).mul(prize).sub(1),
  }[mode];
  const truePositive=p*sensitivity, falsePositive=(1-p)*falseAlarm;
  const evidence=truePositive+falsePositive, noHit=(1-p)**n;
  const signal=`A signal is positive with probability ${sensitivity} on a hit and ${falseAlarm} on a miss.`;
  const repeats=`Run ${n} independent trials under the stated conditions.`;
  const branches={
    signal:{
      question:signal+' What is the probability of a positive signal?',
      value:evidence,
      method:'A positive signal can come from either a hit or a miss. Add those two disjoint paths.',
      math:`P(positive) = ${positiveHit} + ${positiveMiss}`,
      wrong:[[truePositive,'Counted only positive signals on hits.'],[falsePositive,'Counted only positive signals on misses.'],[sensitivity,'Used the positive rate on a hit for every trial.'],[falseAlarm,'Used the positive rate on a miss for every trial.'],[p,'Calculated the chance of a hit, regardless of the signal.']],
    },
    posterior:{
      question:signal+' Given a positive signal, what is the probability the trial was a hit?',
      value:truePositive/evidence,
      method:'Restrict the denominator to positive signals. Among them, keep the ones that came from a hit.',
      math:`P(hit | positive) = (${positiveHit}) / (${positiveHit} + ${positiveMiss})`,
      wrong:[[truePositive,'Found the joint probability of a hit and a positive signal.'],[p,'Used the hit rate before the signal.'],[sensitivity,'Found the positive rate given a hit, reversing the condition.'],[falsePositive/evidence,'Found the share of positive signals that came from misses.']],
    },
    'first-hit':{
      question:repeats+` What is the probability the first hit is on trial ${n}?`,
      value:(1-p)**(n-1)*p,
      method:'Multiply the probabilities of a miss on each earlier trial and a hit on the final trial.',
      math:`P(first hit in trial ${n}) = (${miss ?? '1 − p'})^${n-1} × ${hit ?? 'p'}`,
      wrong:[[p,'Allowed hits before the final trial.'],[1-noHit,'Counted a hit on any trial.'],[noHit,'Counted a miss on every trial.'],[n*(1-p)**(n-1)*p,'Allowed the only hit to fall at any of the trial positions.']],
    },
    'net-prize':{
      question:repeats+` Entry costs £1. One or more hits earn a single £${prize} prize. What is the expected net gain in pounds?`,
      value:prize*(1-noHit)-1,
      method:'Use the complement of no hits, multiply by the one-off prize, then subtract the entry fee.',
      math:`Expected net gain = £${prize} × (1 − (${miss ?? '1 − p'})^${n}) − £1`,
      wrong:[[prize*(1-noHit),'Left out the entry fee.'],[prize*n*p-1,'Paid the prize for every hit instead of once.'],[prize*p-1,'Used the chance of a hit on just one trial.'],[prize*(1-noHit)-n,'Charged the entry fee on every trial.']],
    },
  };
  const {question,value,method,math,wrong}=branches[mode];
  const [min,max]=mode==='net-prize'?[-1,prize-1]:[0,1];
  const cancellation=mode==='posterior' && posteriorWork ? {
    say:`Scale both products to denominator ${posteriorWork.denominator} and cancel it.`,
    why:'The share of positives from hits is unchanged by multiplying both weights by the same value.',
    math:posteriorWork.reduced,
  } : null;
  const shown=exact ? exactText(exact) : '≈ '+fmt(value);
  const result={...item,composition:{mode,p,n,prize,sensitivity,falseAlarm,baseKey:questionKey(item),baseStructure:structureKey(item)},
    prompt:{...item.prompt,text:setup+' '+question+' Pick the closest value.'},
    ...btoChoices(rng,{correct:value,prob:mode!=='net-prize',
      distractors:wrong.filter(([v])=>v>=min && v<=max).map(([v,misconception])=>({value:v,misconception})),
      fillers:[value/2,value*.75,value*1.35,...Array.from({length:11},(_,i)=>min+(max-min)*i/10)]
        .filter(v=>v>=min && v<=max).map(value=>({value}))}),
    answer:{value,exact:shown},solution:{...item.solution,ask:question,fast:method,rule:method,steps:[...item.solution.steps,
      {say:method,why:hit ? `The hit probability for one trial is ${hit}.` : 'Use p for the single-trial hit probability calculated above.',
        math:cancellation ? math : `${math}${shown.startsWith('≈')?' ':' = '}${shown}`},
      ...(cancellation?[cancellation]:[])]}};
  const prior={
    signal:`Under the same stated conditions, a sensor reports positive with probability ${sensitivity} when that event happens and ${falseAlarm} otherwise. What is the probability of a positive report?`,
    posterior:`Under the same stated conditions, a sensor reports positive with probability ${sensitivity} when that event happens and ${falseAlarm} otherwise. Given a positive report, what is the probability the event occurred?`,
    'first-hit':`Repeat the entire experiment independently ${n} times under the same stated conditions. What is the probability the first occurrence is on the final trial?`,
    'net-prize':`Repeat the entire experiment independently ${n} times under the same stated conditions. Entry costs £1 once. You receive £${prize} once if the event occurs at least once. What is the expected net gain in pounds?`,
  }[mode];
  result.meta={...result.meta,previousPromptKey:questionKey({...item,prompt:{...item.prompt,
    text:'First find the probability requested here. '+item.prompt.text+' '+prior+' Pick the closest value.'}})};
  result.id='composed:'+questionKey(result);return result;
}
