import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_MODULES } from '../../src/practice/index.js';
import { PRACTICE_FAMILIES, practiceFamilyTitle } from '../../src/practice/catalog.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { EXTRA_FAMILIES, TRANSFER_FAMILIES } from '../../src/transfer/index.js';
import { practiceItem } from '../../src/core/draw.js';
import { makeRng } from '../../src/core/rng.js';
import { questionKey } from '../../src/core/questions.js';
import { structureKey } from '../../src/transfer/profile.js';
import { presentation } from '../../src/core/presentation.js';
import { validateItem } from '../../src/core/contract.js';

test('practice includes all extended families without mutating timed-section registries',()=>{
 const counts={bto:34,nl:30,ll:16,iv:15,ob:8,mm:8};
 for(const [section,count] of Object.entries(counts)){
  const module=PRACTICE_MODULES[section];assert.equal(module.families.length,count,section);
  assert.equal(new Set(module.families.map(f=>f.id)).size,count);
  assert.equal(PRACTICE_FAMILIES[section].length,count);
  assert.deepEqual(module.families.map(({id,title,skill,levels})=>({id,title,skill,levels})),PRACTICE_FAMILIES[section]);
  for(const extra of TRANSFER_FAMILIES[section]||[]){assert.ok(module.families.includes(extra));assert.ok(!SECTION_MODULES[section].families.includes(extra));}
 }
});
for(const family of EXTRA_FAMILIES)test(`${family.id}: all supported difficulties work in ordinary practice with valid remapped answers`,()=>{
 for(const difficulty of family.levels)for(let seed=0;seed<12;seed++){
  const item=practiceItem(PRACTICE_MODULES[family.section],makeRng(`shared:${seed}`),{}, {family:family.id,difficulty,preferStructures:[],shuffleOptions:true});
  assert.equal(item.family,family.id);assert.equal(item.difficulty,difficulty);assert.deepEqual(validateItem(item),[]);
  const verified=family.verify(item,makeRng(`oracle:${seed}`));assert.ok(verified===true||verified?.ok===true);
  assert.equal(practiceFamilyTitle(item.section,item.family),family.title);assert.doesNotThrow(()=>JSON.stringify(item));
 }
});
test('structure preference searches within the chosen family and retains difficulty',()=>{
 const toy={id:'bto',families:[{id:'toy',levels:[1],generate:rng=>({section:'bto',family:'toy',difficulty:1,prompt:{text:`Question ${rng.int(0,1e7)}`},transfer:{structure:rng.pick(['one','two','three'])}})}]};
 for(let seed=0;seed<40;seed++){
  const ordinary=practiceItem(toy,makeRng(seed),{}, {family:'toy',difficulty:1,preferStructures:[]});
  const preferred=practiceItem(toy,makeRng(seed),{}, {family:'toy',difficulty:1,preferStructures:[structureKey(ordinary)]});
  assert.notEqual(structureKey(preferred),structureKey(ordinary));assert.equal(preferred.family,'toy');assert.equal(preferred.difficulty,1);
 }
});
test('exact freshness takes priority over an unfamiliar recorded branch',()=>{
 const choices=[{section:'bto',family:'toy',difficulty:1,prompt:{text:'seen exact'},transfer:{structure:'new'}},{section:'bto',family:'toy',difficulty:1,prompt:{text:'fresh exact'},transfer:{structure:'old'}}];
 let cursor=0;const toy={id:'bto',families:[{id:'toy',levels:[1],generate:()=>choices[cursor++%2]}]};
 const item=practiceItem(toy,makeRng(1),{}, {family:'toy',excludeKeys:[questionKey(choices[0])],preferStructures:[structureKey(choices[1])]});
 assert.equal(item.prompt.text,'fresh exact');
});
test('shuffled MCQs preserve content identity, unique alternatives and the independently marked correct option',()=>{
 const family=PRACTICE_MODULES.bto.families[0],positions=new Set();
 for(let seed=0;seed<100;seed++){
  const item=family.generate(makeRng(`original:${seed}`),{difficulty:1}),key=questionKey(item),copy=presentation(item,makeRng(`presentation:${seed}`));
  assert.equal(questionKey(copy),key);assert.equal(copy.options[copy.answerIndex].misconception,null);
  assert.equal(copy.options[copy.answerIndex].value,item.options.find(o=>o.misconception===null).value);
  assert.deepEqual([...copy.options].sort((a,b)=>a.value-b.value),item.options);
  positions.add(copy.answerIndex);
 }
 assert.equal(positions.size,5);
});
