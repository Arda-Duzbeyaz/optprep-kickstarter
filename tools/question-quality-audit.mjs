import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { PRACTICE_MODULES } from '../src/practice/index.js';
import { finiteVariants } from '../src/practice/finite-variants.js';
import { SECTION_MODULES } from '../src/sections/index.js';
import { ALL_LESSONS } from '../src/study/content/index.js';
import { GAMES } from '../src/zapn/index.js';
import { makeRng } from '../src/core/rng.js';
import { validateItem } from '../src/core/contract.js';
import { structureKey } from '../src/transfer/profile.js';
import { questionKey } from '../src/core/questions.js';
import { checkItem } from '../src/core/check.js';
import * as formatting from '../src/core/format.js';
import { validateDiagram } from '../src/study/diagrams/index.js';
import { PAPERS } from '../src/checks/papers.js';
import { independent } from '../src/checks/independent.js';
import { drillItem } from '../src/checks/drills.js';
import { grade } from '../src/checks/material.js';
import { buildPaper } from '../src/scenarios/paper.js';
import { SECTIONS } from '../config/sections.js';

const output=process.argv[2];
if (!output) throw Error('Usage: node tools/question-quality-audit.mjs <output-prefix>');
const summaries={}, found=[], samples=[], families=[];
let items=0, verified=0, bank=0, finite=0, generic=0, options=0, diagrams=0, rankReviews=0;
let reserved=0,workshop=0,timedPapers=0,timedItems=0,composed=0;
const numeric = val => {
  const s=String(val).replaceAll('−','-').replaceAll(',','').replace(/^≈\s*/, '');
  if (/^-?\d+\/\d+$/.test(s)){const [a,b]=s.split('/').map(Number);return a/b;}
  return Number(s);
};
const diagnose=(issue,item,note='')=> {
  if(found.filter(row=>row.issue===issue&&row.section===item.section&&row.family===item.family).length>=4)return;
  found.push({issue,section:item.section,family:item.family,difficulty:item.difficulty,params:item.params,text:item.prompt?.text,note,answer:item.answer?.value});
};
function inspect(item){
  const {section,family,difficulty,kind}=item, text=item.prompt?.text || '';
  const row=summaries[section]??={items:0,words:0,maximumWords:0,options:0,generic:0};
  items++;row.items++;
  const words=text.match(/\S+/g)?.length || 0;
  row.words+=words;row.maximumWords=Math.max(row.maximumWords,words);
  if(words>=85)diagnose('long prompt',item,String(words));
  for(const e of validateItem(item))diagnose('item contract',item,e);
  if (item.solution.picture) {
    const {diagram,spec}=item.solution.picture;
    diagrams++;
    for(const error of validateDiagram(diagram,spec))diagnose('solution diagram',item,error);
  }
  if(/\bundefined\b|\bNaN\b|\[object Object\]|\b(?:a|an) (?:a|an)\b|\bthe the\b/.test(text))diagnose('surface defect',item);
  if(kind==='mcq'){
    const answer=item.options[item.answerIndex].value;
    const wrong=item.options.filter((_,i)=>i!==item.answerIndex);
    const generated=wrong.filter(o=>o.generic || /Magnitude guess|correct method|Recheck the (?:selected rule|scale)|Rebuild the equation/i.test(o.misconception || '')).length;
    generic+=generated;options+=wrong.length;row.generic+=generated;row.options+=wrong.length;
    if(wrong.length===generated)diagnose('all distractors generic',item,wrong.map(o=>o.misconception).join(' / '));
    const values=item.options.map(o=>numeric(o.label));
    if(values.every(Number.isFinite)){
      const ds=values.map(v=>Math.abs(v-answer));
      if(ds.some((x,i)=>i!==item.answerIndex&&x<=ds[item.answerIndex]))diagnose('keyed choice not uniquely closest',item,values.join(', '));
    }
  }
  if(kind==='rank'){
    const [a,b,c]=item.answerOrder.map(i=>item.statements[i].p);
    if(!(a>b&&b>c))diagnose('rank tie',item);
    const labels=formatting.rankDecimals?.(item.statements) ?? item.statements.map(s=>s.exact || s.p.toFixed(3));
    rankReviews++;
    if(new Set(labels).size!==labels.length)diagnose('printed rank tie',item,labels.join(' / '));
    if(item.statements.some(s=>s.text.length>150))diagnose('long ranking statement',item);
  }
  if(kind==='interval'){
    const step=item.solution?.steps?.at(-1)?.say || '';
    const bracket=/\[(-?[\deE.+-]+),\s*(-?[\deE.+-]+)\]/.exec(step);
    if(bracket && item.coach?.exact&&!checkItem(item,{lower:Number(bracket[1]),upper:Number(bracket[2])}).correct)diagnose('recommended bounds score zero',item,`${step}; truth=${item.truth}`);
    if(item.coach?.belief?.kind==='point'){
      const oldPoint=numeric(formatting.fmtNum(item.truth));
      const bounds=formatting.intervalNumber && bracket ? [Number(bracket[1]),Number(bracket[2])] : [oldPoint,oldPoint];
      if(!checkItem(item,{lower:bounds[0],upper:bounds[1]}).correct)diagnose('point coach bounds score zero',item,`${bounds}, truth ${item.truth}`);
    }
  }
}
for(const mod of Object.values(PRACTICE_MODULES)){
  for(const f of mod.families)for(const d of f.levels){
    const distinct=new Set(), branches=new Set();
    for(let seed=0;seed<96;seed++){
      try {
        const q=f.generate(makeRng('question-audit:'+f.id+':'+d+':'+seed),{difficulty:d});
        inspect(q);
        const shape=structureKey(q);
        if(!branches.has(shape)){
          samples.push({section:q.section,family:q.family,difficulty:d,structure:shape,params:q.params,text:q.prompt.text,visual:q.prompt.visual,options:q.options,statements:q.statements,answer:q.answer??q.truth??q.best??null,solution:q.solution,hints:q.hints});
        }
        if(f.verify&&(!branches.has(shape)||seed===95)){
          verified++;
          try{const result=f.verify(q,makeRng('oracle:'+seed));if(!result.ok)diagnose('independent verifier disagreement',q,result.detail);}
          catch(error){diagnose('independent verifier threw',q,error.message);}
        }
        branches.add(shape);distinct.add(questionKey(q));
      } catch(error){diagnose('generator threw',{section:mod.id,family:f.id,difficulty:d},String(error));}
    }
    const pool=finiteVariants(f,d);
    for(const item of pool??[]){
    inspect(item);finite++;
    if(f.verify){
      verified++;
      const result=f.verify(item,makeRng('finite-oracle:'+questionKey(item)));
      if(!result.ok)diagnose('independent verifier disagreement',item,result.detail);
    }
  }
    families.push({section:mod.id,family:f.id,difficulty:d,unique:distinct.size,branches:branches.size,finite:pool?.length || 0});
  }
}
for(const mod of Object.values(SECTION_MODULES))for(const item of mod.bank??[]){
  inspect(item);bank++;
  samples.push({section:item.section,family:item.family,difficulty:item.difficulty,structure:'bank:'+item.id,params:item.params,text:item.prompt.text,visual:item.prompt.visual,options:item.options,statements:item.statements,answer:item.answer??item.truth??item.best??null,solution:item.solution,hints:item.hints});
}
// Check every fixed reserve, a seeded workshop sample, and the actual paper builder.
function correctResponse(item) {
  if(item.kind==='rank')return {order:item.answerOrder};
  if(item.kind==='interval')return {lower:item.truth,upper:item.truth};
  if(item.kind==='orderbook')return item.best?{trades:item.best.trades}:{pass:true};
  return {value:item.answer.toFixed(8)};
}
for(const [section,forms] of Object.entries(PAPERS)){
  for(const items of [...Object.values(forms),independent[section]]) for(const item of items){
    assert.equal(grade(item,correctResponse(item)).score,1,item.text);
    reserved++;
  }
  for(let seed=0;seed<128;seed++)for(let index=0;index<5;index++){
    const item=drillItem(section,seed,index);
    assert.equal(grade(item,correctResponse(item)).score,1,item.text);
    workshop++;
  }
  const history=new Set();
  for(let seed=0;seed<14;seed++){
    const items=buildPaper(SECTION_MODULES[section],{
      count:SECTIONS[section].exam.count,ramp:section==='nl',bankRatio:.2,excludeKeys:history,
    },'audit-timed:'+seed,'balanced');
    assert.equal(items.length,SECTIONS[section].exam.count,section);
    timedPapers++;
    for(const item of items){
      const key=questionKey(item);
      assert.ok(!history.has(key),`Repeated timed item ${section} ${seed} ${key}`);
      history.add(key);
      if(item.composition){
        history.add(item.composition.baseKey);
        composed++;
      }
      inspect(item);
      timedItems++;
    }
  }
}

const report={items,verified,bank,finite,generic,options,diagrams,rankReviews,reserved,workshop,timedPapers,timedItems,composed,
  registeredFamilies:Object.values(PRACTICE_MODULES).reduce((n,m)=>n+m.families.length,0),levels:families.length,
  structures:samples.length-bank,lessons:ALL_LESSONS.length,games:GAMES.length,summaries,families,issues:found};
writeFileSync(output+'.json',JSON.stringify(report,null,2)+'\n');
writeFileSync(output+'.jsonl',samples.map(s=>JSON.stringify(s)).join('\n')+'\n');
const {summaries:sections,families:inventory,issues,...counts}=report;
console.log(JSON.stringify({...counts,issues:issues.reduce((a,x)=>(a[x.issue]=(a[x.issue]||0)+1,a),{})},null,2));
const errors=new Set(['item contract','solution diagram','keyed choice not uniquely closest','rank tie','printed rank tie',
  'recommended bounds score zero','point coach bounds score zero','independent verifier disagreement','independent verifier threw','generator threw','surface defect']);
if(issues.some(({issue})=>errors.has(issue))) process.exitCode=1;
