import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transferItems, TRANSFER_SECTIONS, SECTION_TRANSFER_TIMING, TRANSFER_TIMING } from '../../src/transfer/draw.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { TRANSFER_FAMILIES } from '../../src/transfer/index.js';
import { validateItem } from '../../src/core/contract.js';
for(const section of TRANSFER_SECTIONS)test(`${section}: single-assessment challenge is varied, valid and reproducible`,()=>{
  const args={seed:`single:${section}`,sections:[section],perSection:10},rows=transferItems(SECTION_MODULES,args);
  assert.equal(rows.length,10);assert.ok(rows.every(r=>r.item.section===section));
  assert.deepEqual(transferItems(SECTION_MODULES,args),rows);
  assert.equal(new Set(rows.map(r=>r.key)).size,10);
  assert.ok(new Set(rows.map(r=>r.item.family)).size>=5);
  for(const row of rows){assert.deepEqual(validateItem(row.item),[]);const family=[...SECTION_MODULES[section].families,...(TRANSFER_FAMILIES[section]||[])].find(f=>f.id===row.item.family);const verified=family.verify(row.item);assert.ok(verified===true||verified?.ok===true,`${section}:${row.item.family}`);}
  for(const extra of TRANSFER_FAMILIES[section]||[])assert.ok(rows.some(r=>r.item.family===extra.id));
  const questionHistory={[section]:rows.map(r=>r.key)},next=transferItems(SECTION_MODULES,{...args,questionHistory});
  assert.ok(next.every(r=>!questionHistory[section].includes(r.key)));
});
test('single-section and broader challenge clocks are explicitly separate training choices',()=>{
  assert.deepEqual(SECTION_TRANSFER_TIMING,{count:10,totalSeconds:900,perItemSeconds:90});
  assert.deepEqual(TRANSFER_TIMING,{count:15,totalSeconds:1200,perItemSeconds:90});
  assert.equal(transferItems(SECTION_MODULES,{seed:1}).length,15);
  for(const sections of [[],['bad'],['bto','bto']])assert.throws(()=>transferItems(SECTION_MODULES,{sections}));
});
