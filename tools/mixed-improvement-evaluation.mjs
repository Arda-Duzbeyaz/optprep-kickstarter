// Compare source-pinned releases. Sampling results are not learner outcomes.
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { PRACTICE_MODULES } from '../src/practice/index.js';
import { practiceItem } from '../src/core/draw.js';
import { recordMixedAttempt } from '../src/core/mixed-training.js';
import { makeRng } from '../src/core/rng.js';
import { questionKey } from '../src/core/questions.js';
import { structureKey } from '../src/transfer/profile.js';
import { finiteVariants } from '../src/practice/finite-variants.js';
const baseline = resolve(process.argv[2]), root = fileURLToPath(new URL('..', import.meta.url));
const beforeModules = await import(pathToFileURL(`${baseline}/src/practice/index.js`));
const beforeDraw = await import(pathToFileURL(`${baseline}/src/core/draw.js`));
const beforeFinite = await import(pathToFileURL(`${baseline}/src/practice/finite-variants.js`));
const current = PRACTICE_MODULES.bto, old = beforeModules.PRACTICE_MODULES.bto;
const report = { baselineEdition: JSON.parse(readFileSync(`${baseline}/package.json`)).version,
  currentEdition: JSON.parse(readFileSync(`${root}/package.json`)).version, blockSize: 10, simulationsPerCondition: 80,
  rawSamplesPerLevel: 512, rows: [], distributions: [], repeats: 0,
  limits: ['Prior stats and initial difficulty targets are held fixed to isolate selection.', 'The same authored structure classifier is used for both releases; signatures are not conceptual-novelty measures.',
    'Coverage bounds assume stable eligible pools and sufficiently available fresh questions.', 'No human learning, Optiver difficulty or pass-probability calibration.'] };
const statsSummary = (xs) => ({ mean: xs.reduce((a,b)=>a+b,0)/xs.length, min: Math.min(...xs), max: Math.max(...xs) });
for (const family of current.families) for (const difficulty of family.levels) {
  const original = old.families.find((f) => f.id === family.id), counts = [];
  for (const f of [original,family]) {
    const keys = new Set(), branches = new Set(), values = new Set();
    for (let seed=0;seed<512;seed++) { const item=f.generate(makeRng(`mixed-input:${family.id}:${difficulty}:${seed}`),{difficulty});keys.add(questionKey(item));branches.add(structureKey(item));values.add(item.answer.value); }
    counts.push({ sampledQuestions: keys.size, authoredBranchProxies: branches.size, answerValues: values.size });
  }
  report.rows.push({family:family.id,difficulty,before:counts[0],after:counts[1],
    configuredCapacityBefore:beforeFinite.finiteVariants(original,difficulty)?.length??null,configuredCapacityAfter:finiteVariants(family,difficulty)?.length??null});
}
for (const scenario of ['equal','mixed-weakness']) for (const edition of ['before','after']) {
  const section=edition==='before'?old:current, draw=edition==='before'?beforeDraw.practiceItem:practiceItem;
  const ids=section.families.map((f)=>f.id), targets=Object.fromEntries(section.families.map((f)=>[f.id,f.levels[0]]));
  const stats=Object.fromEntries(ids.map((id,i)=>[`bto:${id}`,{n:40,correct:scenario==='equal'?30:i<12?10:39}]));
  const prefix={20:[],40:[],68:[],100:[]}, familyCounts=Object.fromEntries(ids.map((id)=>[id,[]]));
  for(let seed=0;seed<80;seed++){
    let ledger={turn:0,families:{}};const history=new Set(),structures=new Set(),counts={},seen=new Set();let index=0;
    for(let block=0;block<10;block++){
      const rng=makeRng(`mixed-compare:${scenario}:${seed}:${block}`),log=[];
      for(let i=0;i<10;i++){
        const round=new Set();for(const row of log){if(round.size===ids.length)round.clear();round.add(row.family);}
        const item=draw(section,rng,stats,{familyPool:ids,targets,excludeKeys:history,preferStructures:structures,avoidFamilies:[...round],
          requireFresh:true,minFreshFamilies:2,shuffleOptions:true,...(edition==='after'?{mixedTraining:ledger,spreadStructures:true}: {})});
        assert.equal(item.difficulty,targets[item.family]);assert.equal(history.has(questionKey(item)),false);
        history.add(questionKey(item));structures.delete(structureKey(item));structures.add(structureKey(item));log.push(item);seen.add(item.family);counts[item.family]=(counts[item.family]||0)+1;
        ledger=recordMixedAttempt(ledger,item.family,{key:questionKey(item),difficulty:item.difficulty,correct:true,fresh:true,standardTime:true,hints:0,aided:false,uninterrupted:true,ms:1000,budgetMs:90000});
        if(prefix[++index])prefix[index].push(seen.size);
      }
      assert.equal(new Set(log.map((i)=>i.family)).size,10);
    }
    if(edition==='after')assert.equal(prefix[68].at(-1),34);
    for(const id of ids)familyCounts[id].push(counts[id]||0);
  }
  report.distributions.push({scenario,edition,questions:8000,coverage:Object.fromEntries(Object.entries(prefix).map(([n,xs])=>[n,statsSummary(xs)])),
    byFamily:Object.fromEntries(Object.entries(familyCounts).map(([id,xs])=>[id,statsSummary(xs)]))});
}
const pools=Object.values(PRACTICE_MODULES).flatMap((s)=>s.families.flatMap((f)=>f.levels.map((d)=>finiteVariants(f,d)).filter(Boolean)));
report.completeCataloguePools=pools.length;report.completeCatalogueEntries=pools.reduce((n,p)=>n+p.length,0);
writeFileSync(`${root}/evaluation/mixed-improvement-results.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({distributions:report.distributions.map(({scenario,edition,coverage})=>({scenario,edition,coverage})),completeCataloguePools:report.completeCataloguePools,completeCatalogueEntries:report.completeCatalogueEntries,repeats:0},null,2));
