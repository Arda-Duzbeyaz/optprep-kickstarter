// Original curriculum additions. Helpers here build questions, never verify them.
import { Q } from '../../../core/rational.js';
import { nCr } from '../../../core/combinatorics.js';
import { mcqItem, q, qpow, table } from '../lib.js';
export { Q, nCr, q, qpow, table };
export const sum = (xs) => xs.reduce((s,x)=>s.add(x),q(0));
export const choose = (n,k) => new Q(nCr(n,k),1n);
export const binomial = (n,k,p) => k<0||k>n?q(0):choose(n,k).mul(qpow(p,k)).mul(qpow(q(1).sub(p),n-k));
export const hyper = (g,b,n,k) => new Q(nCr(g,k)*nCr(b,n-k),nCr(g+b,n));
export const weightedMean = (values,weights) => q(values.reduce((s,x,i)=>s+x*weights[i],0),weights.reduce((a,b)=>a+b,0));
export const weightedVariance = (values,weights) => weightedMean(values.map(x=>x*x),weights).sub(qpow(weightedMean(values,weights),2));
export const wrong = (value,misconception) => ({value,misconception});
export function question(id,rng,difficulty,o) {
  const c=o.value instanceof Q?o.value.toNumber():o.value;
  // Boundary probabilities (including impossible events) still need five distinct,
  // in-domain choices. Signed payoffs use a numeric pool, even if their mean is 0.
  const fillerValues=o.ev?[c+1,c-1,c+2,c-2,c+3,c-3,2*c,-c,c/2,0,1,-1]:[0,.05,.1,.2,.35,.5,.65,.8,.9,.95,1];
  const fillers=o.fillers||fillerValues.map(value=>wrong(value,'Magnitude guess: use the specified sample space and weights rather than guessing a value.'));
  const item=mcqItem(id,rng,difficulty,{...o,fillers});
  item.transfer={structure:o.structure,operations:o.operations};
  item.curriculum={edition:1,domain:o.domain||(o.ev?'number':'probability')};
  return item;
}
export function task(rng,difficulty,byLevel,variant) {
  const allowed=byLevel[difficulty];
  if(!allowed||variant&&!allowed.includes(variant))throw new Error('Unsupported curriculum task or difficulty');
  return variant||rng.pick(allowed);
}
export const steps = (...pairs) => pairs.map(([say,why])=>({say,why}));
export function simpleLesson(purpose,anchor,rule,ideas,prediction) {
  return {purpose,anchor,rule,steps:ideas.map(([say,why])=>({say,why})),predict:{question:prediction[0],answer:prediction[1]}};
}
