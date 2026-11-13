// Reproducible comparison of the new scoped challenge and preserved broader mode.
// node tools/learning-evaluation.mjs /absolute/path/to/1.0.4-release
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { transferItems, TRANSFER_SECTIONS } from '../src/transfer/draw.js';
import { SECTION_MODULES } from '../src/sections/index.js';
import { questionKey } from '../src/core/questions.js';
const baseline=process.argv[2];
if(!baseline)throw Error('Pass the previous-release directory');
const oldDraw=await import(pathToFileURL(resolve(baseline,'src/transfer/draw.js')).href);
const oldModules=(await import(pathToFileURL(resolve(baseline,'src/sections/index.js')).href)).SECTION_MODULES;
for(let seed=0;seed<10;seed++)assert.deepEqual(transferItems(SECTION_MODULES,{seed:`broader-preserve:${seed}`}),oldDraw.transferItems(oldModules,{seed:`broader-preserve:${seed}`}));
const results={baselineBroaderSessionsIdentical:10,baselineBroaderQuestionsIdentical:150,scoped:{},limits:['Structure signatures are proxies, not measured conceptual novelty.','These samples do not calibrate Optiver difficulty or establish learning gains.']};
for(const section of TRANSFER_SECTIONS){
 const exact=new Set(),structures=new Set(),families=new Set(),positions={},orders={};let repeats=0,familiarStructures=0,minFamilies=Infinity;
 for(let seed=0;seed<10;seed++){
  const rows=transferItems(SECTION_MODULES,{seed:`scoped-eval:${seed}`,sections:[section],perSection:10,questionHistory:{[section]:[...exact]},structureHistory:{[section]:[...structures]}});
  assert.equal(rows.length,10);assert.ok(rows.every(r=>r.item.section===section));
  minFamilies=Math.min(minFamilies,new Set(rows.map(r=>r.item.family)).size);
  for(const row of rows){
   const key=questionKey(row.item);repeats+=Number(exact.has(key));familiarStructures+=Number(structures.has(row.structure));
   exact.add(key);structures.add(row.structure);families.add(row.item.family);
   if(row.item.kind==='mcq')positions[row.item.answerIndex]=(positions[row.item.answerIndex]||0)+1;
   if(row.item.kind==='rank'){const order=row.item.answerOrder.join(',');orders[order]=(orders[order]||0)+1;}
  }
 }
 assert.equal(repeats,0,section);assert.ok(minFamilies>=5,section);
 results.scoped[section]={sessions:10,questions:100,exactRepeats:repeats,minimumFamiliesPerSession:minFamilies,familiesSampled:families.size,recordedStructures:structures.size,familiarStructureOccurrences:familiarStructures,mcqAnswerPositions:positions,rankingAnswerOrders:orders};
}
writeFileSync(new URL('../evaluation/learning-evaluation.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
