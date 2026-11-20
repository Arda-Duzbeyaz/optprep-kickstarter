import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { PRACTICE_MODULES } from '../src/practice/index.js';
import { SECTION_MODULES } from '../src/sections/index.js';
import { makeRng } from '../src/core/rng.js';
import { questionKey, questionSeen } from '../src/core/questions.js';
import { structureKey } from '../src/transfer/profile.js';
import { composeEvent } from '../src/scenarios/compose.js';
import { scenarioItem,scenarioFamilies } from '../src/scenarios/index.js';
import { buildPaper } from '../src/scenarios/paper.js';
import { SECTIONS } from '../config/sections.js';
import { activatePreset } from '../config/presets.js';

activatePreset({id:'kickstarter'});
const baselineDir=process.argv[2];
const base=baselineDir?await import(pathToFileURL(resolve(baselineDir,'src/core/draw.js')).href):null;
const baseSections=baselineDir?await import(pathToFileURL(resolve(baselineDir,'src/sections/index.js')).href):null;
const perFamily=PRACTICE_MODULES.bto.families.filter(f=>f.id!==scenarioFamilies.bto.id).map(f=>{
  const branches=new Set(), composed=new Set(), visible=new Set();
  for(const level of f.levels)for(let index=0;index<30;index++){
    const rng=makeRng('inventory:'+f.id+':'+level+':'+index);
    const item=f.generate(rng,{difficulty:level});
    branches.add(structureKey(item));visible.add(questionKey(item));
    if(level>=2){
      const next=composeEvent(item,rng.fork('second-stage'));
      if(next.composition)composed.add(structureKey(next));
    }
  }
  return {family:f.id,title:f.title,levels:f.levels,sample:30*f.levels.length,distinctPrompts:visible.size,
    branchCount:branches.size,secondStageSignatures:composed.size,branches:[...branches].sort(),skill:f.skill||null};
});
assert.equal(perFamily.length,40);
const sections={};
for(const id of Object.keys(scenarioFamilies)){
  const structures=new Set(),modes=new Set(), rawPrompts=new Set(), byLevel={}, allMethods=new Set(), oldMethods=new Set();
  for(const level of [1,2,3]){
    const levelModes=new Set();
    for(let j=0;j<400;j++){
      const q=scenarioItem(id,makeRng('model:'+id+':'+level+':'+j),level);
      rawPrompts.add(questionKey(q));modes.add(q.transfer.model);structures.add(q.transfer.structure);levelModes.add(q.transfer.model);
    }
    byLevel[level]=[...levelModes].sort();
  }
  const history=new Set(),previous=[],oldHistory=new Set(),runtimes=[];
  let questions=0,scenarios=0,compositions=0,noOpportunity=0,oldNegative=0,oldQuestions=0;
  for(let j=0;j<14;j++){
    const cfg={count:SECTIONS[id].exam.count,ramp:id==='nl',bankRatio:.2};
    if(base){
      const old=base.examItems(baseSections.SECTION_MODULES[id],{...cfg,excludeKeys:oldHistory},'rehearsal:'+j);
      old.forEach(q=>{oldMethods.add(structureKey(q));oldHistory.add(questionKey(q));oldQuestions++;oldNegative+=Number(q.kind==='orderbook'&&!q.best);});
    }
    const start=performance.now();
    const paper=buildPaper(SECTION_MODULES[id],{...cfg,excludeKeys:history,previousStructures:previous},'rehearsal:'+j,'balanced');
    runtimes.push(performance.now()-start);
    for(const q of paper){
      assert.ok(!questionSeen(history,q),'Repeated question: '+id);
      history.add(questionKey(q));
      if(q.composition){history.add(q.composition.baseKey);compositions++;}
      previous.push(structureKey(q));allMethods.add(structureKey(q));
      questions++;scenarios+=Number(q.family===scenarioFamilies[id].id);
      noOpportunity+=Number(q.kind==='orderbook'&&!q.best);
    }
  }
  runtimes.sort((a,b)=>a-b);
  sections[id]={rawSamples:1200,distinctVisible:rawPrompts.size,modelModes:[...modes].sort(),structureSignatures:[...structures].sort(),byLevel,
    rehearsal:{papers:14,questions,scenarios,compositions,noOpportunity,visibleRepeats:0,observedStructures:allMethods.size,
    medianBuildMs:Math.round(runtimes[7]),maxBuildMs:Math.round(runtimes.at(-1))},
    ...(base?{v18:{questions:oldQuestions,observedStructures:oldMethods.size,noOpportunity:oldNegative}}:{})};
}
const report={sampling:'30 seeds per supported level in each original BTO family; 400 per level per new model; 14 complete history-aware timed papers per quantitative assessment per version. Same rehearsal seeds, default mix. Branch fingerprints describe generator decisions and can group or subdivide reasoning methods.',perFamily,sections};
writeFileSync(new URL('../evaluation/kickstarter-1.9-generators.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(sections).map(([id,s])=>[id,{branches:s.modelModes.length,visible:s.distinctVisible,...s.rehearsal,baseline:s.v18?.observedStructures}]))));
