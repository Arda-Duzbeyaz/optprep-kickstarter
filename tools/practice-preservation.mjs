// Compare the actual shipped ordinary papers/config with a previous release.
// Usage: node tools/practice-preservation.mjs /absolute/path/to/previous-release
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const previous = process.argv[2];
if (!previous) throw new Error('Pass a previous-release directory');
const current = fileURLToPath(new URL('../', import.meta.url));
const load = (root, file) => import(pathToFileURL(join(root,file)).href);
const old = { root:resolve(previous) }, next={root:current};
for(const v of [old,next]) {
  v.draw=await load(v.root,'src/core/draw.js');v.sections=(await load(v.root,'src/sections/index.js')).SECTION_MODULES;
  v.config=(await load(v.root,'config/sections.js')).SECTIONS;
  (await load(v.root,'config/presets.js')).activatePreset({id:'kickstarter'});
}
for(const p of ['config/sections.js','LICENSE']) assert.equal(readFileSync(join(current,p),'utf8'),readFileSync(join(old.root,p),'utf8'),p);
// Only the user's explicitly authorised invitation clocks may differ. Keep
// question counts, scoring, navigation, other role presets and targets exact.
const oldPresets=(await load(old.root,'config/presets.js')).PRESETS,newPresets=(await load(current,'config/presets.js')).PRESETS;
for(const id of Object.keys(oldPresets)){
 const a=structuredClone(oldPresets[id]),b=structuredClone(newPresets[id]);
 if(id==='kickstarter'){
  assert.deepEqual(b.timing,{bto:{totalSeconds:1500},nl:{totalSeconds:1500,navigation:'free'},ll:{totalSeconds:1500},iv:{totalSeconds:900,perItemSeconds:null},ob:{totalSeconds:900}});
  for(const x of [a,b]){delete x.timing;delete x.note;}
 }
 assert.deepEqual(b,a,`${id}: non-authorised preset differences`);
}
let sourceFiles=0;
for(const p of readdirSync(join(current,'src/sections'),{recursive:true}).map(String)) {
  if(!p.endsWith('.js'))continue;
  assert.equal(readFileSync(join(current,'src/sections',p),'utf8'),readFileSync(join(old.root,'src/sections',p),'utf8'),p);sourceFiles++;
}
let questions=0,papers=0;
for(const section of ['bto','nl','ll','iv','ob'])for(let i=0;i<10;i++){
  const seed=`practice-preserve:${i}`,a=old.draw.examItems(old.sections[section],old.config[section].exam,seed),b=next.draw.examItems(next.sections[section],next.config[section].exam,seed);
  assert.deepEqual(b,a,`${section}/${seed}`);questions+=b.length;papers++;
}
const snapshotVerifierCases=Object.values(next.sections).reduce((n,s)=>n+s.families.reduce((total,f)=>total+(f.levels?.length||1)*3,0),0);
const result={baselineVersion:JSON.parse(readFileSync(join(old.root,'package.json'),'utf8')).version,unchangedOrdinarySourceFiles:sourceFiles,unchangedBaseSectionConfig:true,otherPresetsAndScoringUnchanged:true,authorisedInvitationClocks:true,licenceUnchanged:true,identicalMockPapers:papers,identicalMockQuestions:questions,snapshotVerifierCases};
writeFileSync(join(current,'evaluation/practice-preservation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
