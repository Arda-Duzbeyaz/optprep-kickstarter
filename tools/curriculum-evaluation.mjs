// Reproducible before/after catalogue evidence. Branch labels are authored proxies,
// not proof of conceptual novelty, human learning, or Optiver difficulty alignment.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PRACTICE_MODULES} from '../src/practice/index.js';
import {families as main} from '../src/sections/bto/index.js';
import {makeRng} from '../src/core/rng.js';
import {questionKey} from '../src/core/questions.js';
import {structureKey,structureOperations} from '../src/transfer/profile.js';
import {finiteVariants} from '../src/practice/finite-variants.js';
import {presentation} from '../src/core/presentation.js';
import {validateItem} from '../src/core/contract.js';
import {COUNT_TASKS} from '../src/sections/bto/families/success-counts.js';
import {EVENT_TASKS} from '../src/sections/bto/families/event-algebra.js';
import {PAYOUT_TASKS} from '../src/sections/bto/families/payout-models.js';
import {COUNTING_TASKS} from '../src/sections/bto/families/restricted-counting.js';
import {VARIANCE_TASKS} from '../src/sections/bto/families/variance-dependence.js';
import {SUM_TASKS} from '../src/sections/bto/families/discrete-sums.js';
const root=resolve(new URL('..',import.meta.url).pathname),beforePath=resolve(process.argv[2]||'../optprep-mixed-improvements');
const before=(await import(pathToFileURL(`${beforePath}/src/practice/index.js`))).PRACTICE_MODULES;
const oldFinite=await import(pathToFileURL(`${beforePath}/src/practice/finite-variants.js`));
const report={baseline:JSON.parse(readFileSync(`${beforePath}/package.json`)).version,updated:JSON.parse(readFileSync(`${root}/package.json`)).version,
  samplesPerLevel:256,rows:[],itemsVerified:0,optionPositions:[0,0,0,0,0],preservedFiles:[],
  limits:['Sampled distinct prompts measure visible variation, not conceptual transfer.','Authored branches and operation tags are review aids, not independent measures of reasoning.','No human trial, actual Optiver item-bank access, score calibration or pass-rate validation.','Finite domains remain finite; bounded novelty searches do not prove infinite capacity.']};
for(const f of before.bto.families){const current=PRACTICE_MODULES.bto.families.find(g=>g.id===f.id);assert.ok(current,`lost ${f.id}`);assert.deepEqual(current.levels,f.levels);}
for(const family of PRACTICE_MODULES.bto.families)for(const difficulty of family.levels){
  const old=before.bto.families.find(f=>f.id===family.id),row={family:family.id,difficulty};
  for(const [edition,f]of [['before',old],['after',family]]){
    if(!f){row[edition]=null;continue;}
    const prompts=new Set(),structures=new Set(),answers=new Set(),operations=new Set();let zero=0,one=0;
    for(let seed=0;seed<report.samplesPerLevel;seed++){
      const label=`curriculum-comparison:${family.id}:${difficulty}:${seed}`,item=f.generate(makeRng(label),{difficulty});
      assert.deepEqual(validateItem(item),[],label);assert.ok(f.verify(item,makeRng(`oracle:${label}`)).ok,label);report.itemsVerified++;
      prompts.add(questionKey(item));structures.add(structureKey(item));answers.add(item.answer.value);structureOperations(item).forEach(o=>operations.add(o));
      zero+=Number(item.answer.value===0);one+=Number(item.answer.value===1);
      if(edition==='after')report.optionPositions[presentation(item,makeRng(`positions:${label}`)).answerIndex]++;
    }
    row[edition]={distinctPrompts:prompts.size,authoredBranchProxies:structures.size,distinctAnswers:answers.size,zeroAnswers:zero,oneAnswers:one,operationTags:[...operations].sort(),completeCatalogue:(edition==='after'?finiteVariants:oldFinite.finiteVariants)(f,difficulty)?.length??null};
  }report.rows.push(row);
}
report.before={btoPracticeFamilies:before.bto.families.length,btoFamilyLevels:before.bto.families.reduce((n,f)=>n+f.levels.length,0)};
report.after={btoMainFamilies:main.length,btoPracticeFamilies:PRACTICE_MODULES.bto.families.length,btoFamilyLevels:PRACTICE_MODULES.bto.families.reduce((n,f)=>n+f.levels.length,0)};
for(const path of ['LICENSE','config/presets.js','config/sections.js','src/core/store.js','src/core/migrate.js','src/core/questions.js','src/core/recognition.js','src/core/learning.js','src/core/mixed-training.js','src/core/check.js','src/ui/runner.js']){
  const original=readFileSync(`${beforePath}/${path}`),current=readFileSync(`${root}/${path}`);assert.ok(original.equals(current),path);report.preservedFiles.push({path,sha256:createHash('sha256').update(current).digest('hex'),unchanged:true});
}
for(const f of before.bto.families)for(const difficulty of f.levels){const pool=oldFinite.finiteVariants(f,difficulty);if(!pool)continue;
  const updated=finiteVariants(PRACTICE_MODULES.bto.families.find(g=>g.id===f.id),difficulty),keys=new Set(updated.map(questionKey));for(const item of pool)assert.ok(keys.has(questionKey(item)),`${f.id}: old exposure identity lost`);
}
// Portable, compact corpus for the independently written Python Fraction checker.
const tasks={'event-algebra':EVENT_TASKS,'success-counts':COUNT_TASKS,'payout-models':PAYOUT_TASKS,'restricted-counting':COUNTING_TASKS,'variance-dependence':VARIANCE_TASKS,'discrete-sums':SUM_TASKS},corpus=[];
for(const [id,levels]of Object.entries(tasks))for(const [level,kinds]of Object.entries(levels))for(const variant of kinds)for(let seed=0;seed<32;seed++){
  const label=`python-curriculum:${id}:${level}:${variant}:${seed}`,f=PRACTICE_MODULES.bto.families.find(f=>f.id===id),it=f.generate(makeRng(label),{difficulty:+level,variant});corpus.push({seed:label,family:id,difficulty:+level,params:it.params,answer:it.answer.value});
}
for(const it of finiteVariants(PRACTICE_MODULES.bto.families.find(f=>f.id==='first-success'),2).filter(i=>['memoryless','rth'].includes(i.params.variant)))corpus.push({seed:'exhaustive finite input',family:it.family,difficulty:2,params:it.params,answer:it.answer.value});
writeFileSync(`${root}/evaluation/curriculum-oracle-cases.json`,JSON.stringify(corpus)+'\n');
writeFileSync(`${root}/evaluation/curriculum-comparison.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({before:report.before,after:report.after,itemsVerified:report.itemsVerified,pythonCases:corpus.length,positions:report.optionPositions,preservedFiles:report.preservedFiles.length}));
