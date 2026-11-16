// Reproducible before/after evidence: branch labels are proxies, not learning scores.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PRACTICE_MODULES} from '../src/practice/index.js';
import {makeRng} from '../src/core/rng.js';
import {questionKey} from '../src/core/questions.js';
import {structureKey} from '../src/transfer/profile.js';
import {presentation} from '../src/core/presentation.js';
import {validateItem} from '../src/core/contract.js';
const beforePath=resolve(process.argv[2]||'../optprep-curriculum');
const before=(await import(pathToFileURL(`${beforePath}/src/practice/index.js`))).PRACTICE_MODULES;
const report={baseline:JSON.parse(readFileSync(`${beforePath}/package.json`)).version,updated:JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version,samplesPerLevel:128,rows:[],draws:0,verifierChecks:0,mcqPositions:[0,0,0,0,0],rankOrders:{},protectedFiles:[],limits:['A new numerical prompt is not necessarily a new reasoning structure.','Authored branch proxies are descriptive, not independent measures of conceptual transfer.','No human learning trial, actual item-bank access, normed difficulty, Optiver score conversion or pass threshold validation.','Sample uniqueness does not prove infinite capacity or no lifetime repeats.']};
const corpus=[];
for(const section of ['nl','ll','iv','ob']){
 for(const old of before[section].families){const cur=PRACTICE_MODULES[section].families.find(f=>f.id===old.id);assert.ok(cur,`lost ${section}/${old.id}`);assert.ok(old.levels.every(l=>cur.levels.includes(l)));}
 for(const f of PRACTICE_MODULES[section].families)for(const difficulty of f.levels){
  const row={section,family:f.id,difficulty};
  for(const [edition,mod]of [['before',before],['after',PRACTICE_MODULES]]){
   const family=mod[section].families.find(x=>x.id===f.id);if(!family?.levels.includes(difficulty)){row[edition]=null;continue;}
   const prompts=new Set(),branches=new Set(),ranks={},answerValues=new Set();let verified=0;
   for(let seed=0;seed<128;seed++){
    const label=`battery-comparison:${section}:${f.id}:${difficulty}:${seed}`,it=family.generate(makeRng(label),{difficulty});
    assert.deepEqual(validateItem(it),[],label);report.draws++;prompts.add(questionKey(it));branches.add(structureKey(it));
    if(seed<32){assert.ok(family.verify(it,makeRng(`verifier:${label}`)).ok,label);verified++;report.verifierChecks++;}
    const shown=presentation(it,makeRng(`display:${label}`));assert.deepEqual(validateItem(shown),[],label);
    if(edition==='after'&&it.kind==='mcq')report.mcqPositions[shown.answerIndex]++;
    if(it.kind==='rank'){const key=shown.answerOrder.join();ranks[key]=(ranks[key]||0)+1;}
    answerValues.add(JSON.stringify(it.answer?.value??it.truth??it.best?.profit??it.answerOrder));
    if(edition==='after'&&seed<16)corpus.push({seed:label,section,family:f.id,difficulty,params:it.params,truth:it.answer?.value??it.truth,answer:it.answer??null,options:it.options??null,answerIndex:it.answerIndex??null,visual:it.prompt.visual??null,statements:it.statements??null,order:it.answerOrder??null,board:it.board??null,best:it.best??null});
   }
   row[edition]={distinctPrompts:prompts.size,authoredBranchProxies:branches.size,distinctAnswers:answerValues.size,rankOrders:ranks,verified};
  }report.rows.push(row);
 }
}
for(const p of ['LICENSE','config/presets.js','src/core/store.js','src/core/migrate.js','src/core/questions.js','src/core/recognition.js','src/core/learning.js','src/core/mixed-training.js','src/core/check.js','src/ui/runner.js']){
 const a=readFileSync(`${beforePath}/${p}`),b=readFileSync(new URL(`../${p}`,import.meta.url));assert.ok(a.equals(b),p);report.protectedFiles.push({path:p,sha256:createHash('sha256').update(b).digest('hex')});
}
const oldCfg=(await import(pathToFileURL(`${beforePath}/config/sections.js`))).SECTIONS;
const newCfg=(await import('../config/sections.js')).SECTIONS;
for(const s of Object.keys(oldCfg))assert.deepEqual(oldCfg[s].exam,newCfg[s].exam,`${s} clocks/scoring changed`);
report.invitationClockConfigurationPreserved=true;
report.counts=Object.fromEntries(['before','after'].map((k)=>[k,Object.fromEntries(Object.entries(k==='before'?before:PRACTICE_MODULES).map(([id,m])=>[id,{families:m.families.length,levels:m.families.reduce((n,f)=>n+f.levels.length,0)}]))]));
writeFileSync(new URL('../evaluation/battery-comparison.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
writeFileSync(new URL('../evaluation/battery-oracle-cases.json',import.meta.url),JSON.stringify(corpus)+'\n');
console.log(JSON.stringify({draws:report.draws,verifierChecks:report.verifierChecks,pythonCorpus:corpus.length,rows:report.rows.length,counts:report.counts}));
