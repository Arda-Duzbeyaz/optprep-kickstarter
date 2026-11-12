import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSync, isLocalHost } from '../../src/ui/sync.js';
import { makeStore, memoryBackend } from '../../src/core/store.js';

test('only this machine counts as a backend host', () => {
  for (const h of ['127.0.0.1', 'localhost', 'LOCALHOST', '[::1]', '::1']) assert.equal(isLocalHost(h), true, h);
  for (const h of ['coflazo.github.io', '127.0.0.2', 'localhost.evil.example', '', undefined, null]) assert.equal(isLocalHost(h), false, String(h));
});

test('a hosted copy never probes for the backend', async () => {
  const calls = [];
  const sync = createSync(async (url) => { calls.push(url); return { ok: true, json: async () => ({ ok: true }) }; }, 'coflazo.github.io');
  assert.equal(await sync.start({ state: { runs: [] }, stats: () => ({}) }), false);
  assert.deepEqual(calls, []);
});

test('a local copy probes with relative URLs', async () => {
  const calls = [];
  const fetchImpl = async (url) => { calls.push(url); return { ok: true, json: async () => ({ ok: true, state: null }) }; };
  const sync = createSync(fetchImpl, '127.0.0.1');
  assert.equal(await sync.start({ state: { runs: [1] }, stats: () => ({}) }), true);
  assert.deepEqual(calls, ['api/health']);
  assert.equal(sync.online, true);
});

test('backend startup cannot replace transfer-only local progress', async () => {
  const calls=[];
  const local=makeStore(memoryBackend());
  local.recordTransferRun({timed:false,summary:{all:{}},items:[]});
  const remote=makeStore(memoryBackend()).state;
  const sync=createSync(async(url)=>{calls.push(url);return {ok:true,json:async()=>url==='api/health'?{ok:true}:{state:remote}};},'localhost');
  await sync.start(local);
  assert.equal(local.transferRuns().length,1);
  assert.deepEqual(calls,['api/health']);
});

test('backend startup cannot erase displayed-only freshness history', async () => {
  const local=makeStore(memoryBackend());
  local.rememberQuestion({section:'bto',family:'example',prompt:{text:'Seen before any answer'}});
  const sync=createSync(async(url)=>({ok:true,json:async()=>url==='api/health'?{ok:true}:{state:makeStore(memoryBackend()).state}}),'localhost');
  await sync.start(local);
  assert.equal(local.recentQuestionKeys('bto').size,1);
});
