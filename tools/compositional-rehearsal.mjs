import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {buildPaper} from '../src/scenarios/paper.js';
import {modelCatalog} from '../src/scenarios/composite/catalog.js';
import {SECTIONS} from '../config/sections.js';
import {SECTION_MODULES} from '../src/sections/index.js';
import {questionKey,questionSeen} from '../src/core/questions.js';
import {structureKey} from '../src/transfer/profile.js';
import {activatePreset} from '../config/presets.js';

activatePreset({id:'kickstarter'});
const ids=Object.keys(modelCatalog);
const newFamilies=new Set([...Object.values(modelCatalog).flat().map(f=>f.id),'linked-sequences']);
const round=x=>Math.round(x*100)/100;
function reasoning(q){
  // Count mathematical changes conservatively. Ignore source names, direction of
  // price dislocations and operand values. Equally named symmetric experiments collapse.
  const p=q.params,m=q.transfer.model;
  switch(m){
    case 'box-experiment':return [m,p.replace?'replace':'deplete',p.report,p.target];
    case 'stopped-process':return [m,p.reset?'reset':'retain',p.p===p.afterMiss?'independent':'feedback',p.target];
    case 'restricted-arrangements':return [m,p.circle?'cycle':'line',p.report==='none'?'unconditional':'restricted',p.event,p.askCount?'count':'probability'];
    case 'production-network':return [m,p.hoursB,p.target];
    case 'tariff':return [m,p.policy,p.task];
    case 'sequence-recurrence':return [m,p.gaps?'gaps':'levels',p.law,p.task];
    case 'sequence-machine':return [m,p.path,p.hidden===p.length-1?'extend':'reconstruct'];
    case 'sampling-policies':return [m,...[...p.policies].sort()];
    case 'weighted-experiments':return [m,p.target,...p.selected.map(x=>(x.pair[0]===x.pair[1]?'same':'different')+'-'+x.report).sort()];
    case 'population-survey':return [m,p.design,p.goal];
    case 'planning-estimate':return [m,p.task];
    case 'finite-meter-survey':return [m,p.groups.length,p.rule];
    case 'portfolio-network':return [m,p.form || 'linear-system',p.denominator || 1,q.best?'find-hedge':'certify-pass'];
    default:throw Error('Unknown audit model '+m);
  }
}
function rehearsal(build,registry){
  const sections={};
  for(const id of ids){
    const seen=new Set(),history=[],signatures=new Set(),legacyFamilies=new Set(),families={},reasonCounts=new Map(),latency=[];
    let total=0,v2=0,pass=0;
    for(let i=0;i<24;i++){
      const start=performance.now();
      const paper=build(registry[id],{count:SECTIONS[id].exam.count,ramp:id==='nl',bankRatio:.2,excludeKeys:seen,previousStructures:history},'comparison-v2:'+id+':'+i,'balanced');
      latency.push(performance.now()-start);
      for(const q of paper){
        assert.ok(!questionSeen(seen,q));seen.add(questionKey(q));if(q.composition)seen.add(q.composition.baseKey);
        const key=structureKey(q);signatures.add(key);history.push(key);
        families[q.family]=(families[q.family]||0)+1;total++;pass+=Number(id==='ob'&&!q.best);
        if(!newFamilies.has(q.family)){legacyFamilies.add(q.family);continue;}
        v2++;const sig=reasoning(q).join('/');reasonCounts.set(sig,1+(reasonCounts.get(sig)||0));
      }
    }
    const counts=[...reasonCounts.values()],entropy=counts.reduce((h,n)=>h-n/v2*Math.log(n/v2),0);
    sections[id]={papers:24,total,v2,v2Percent:round(100*v2/total),distinctVisibleRepeats:0,allSignatureCount:signatures.size,legacyFamilies:legacyFamilies.size,
      v2MethodGroups:counts.length,effectiveV2MethodGroups:v2?round(Math.exp(entropy)):0,pass,
      mostFrequentV2Groups:[...reasonCounts].sort((a,b)=>b[1]-a[1]).slice(0,5),families,
      medianBuildMs:round(latency.sort((a,b)=>a-b)[12])};
  }return sections;
}
const data={v2:rehearsal(buildPaper,SECTION_MODULES)};
if(process.argv[2]){
  const base=relative=>pathToFileURL(resolve(process.argv[2],relative)).href;
  const {buildPaper:older}=await import(base('src/scenarios/paper.js'));
  const {SECTION_MODULES:registry}=await import(base('src/sections/index.js'));
  data.v19= rehearsal(older,registry);
}
writeFileSync(new URL('../evaluation/compositional-rehearsal.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
console.log(ids.map(id=>[id,data.v2[id].total,data.v2[id].v2,data.v2[id].v2MethodGroups,data.v2[id].effectiveV2MethodGroups,data.v2[id].allSignatureCount,data.v19?.[id].allSignatureCount,data.v2[id].pass].join(' ')).join('\n'));
