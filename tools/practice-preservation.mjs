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
for(const p of ['config/sections.js','config/presets.js','LICENSE']) assert.equal(readFileSync(join(current,p),'utf8'),readFileSync(join(old.root,p),'utf8'),p);
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
const result={baselineVersion:JSON.parse(readFileSync(join(old.root,'package.json'),'utf8')).version,unchangedOrdinarySourceFiles:sourceFiles,unchangedConfigFiles:2,licenceUnchanged:true,identicalMockPapers:papers,identicalMockQuestions:questions,snapshotVerifierCases};
writeFileSync(join(current,'evaluation/practice-preservation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
