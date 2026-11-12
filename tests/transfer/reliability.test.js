import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const root = process.env.OPTPREP_QA_ROOT || fileURLToPath(new URL('../../', import.meta.url));
const load = (p) => import(pathToFileURL(resolve(root, p)).href);
const { makeStore, memoryBackend, KEY } = await load('src/core/store.js');
const { blankV2 } = await load('src/core/migrate.js');
const { createSync } = await load('src/ui/sync.js');
const { transferSummary } = await load('src/transfer/draw.js');
const fetchServer = (state, calls) => async (url) => {
  calls.push(url);
  return { ok: true, json: async () => url === 'api/health' ? { ok: true } : { state } };
};

test('backend startup never replaces transfer-only local progress with an older server snapshot', async () => {
  const store = makeStore(memoryBackend());
  store.setSetting('preset', { id: 'kickstarter' });
  store.recordTransferRun({ seed: 'local-progress', summary: transferSummary([]), items: [] });
  const server = blankV2(); server.settings.preset = { id: 'trader' };
  const calls = [], sync = createSync(fetchServer(server, calls), 'localhost');
  assert.equal(await sync.start(store), true);
  assert.equal(store.transferRuns().length, 1, 'completed transfer work must survive backend detection');
  assert.equal(store.transferRuns()[0].seed, 'local-progress');
  assert.equal(store.settings().preset.id, 'kickstarter');
  assert.deepEqual(calls, ['api/health'], 'existing progress must not be treated as a new browser');
});

test('a genuinely empty browser can still restore server-side transfer progress', async () => {
  const serverStore = makeStore(memoryBackend());
  serverStore.recordTransferRun({ seed: 'server-progress', summary: transferSummary([]), items: [] });
  const empty = makeStore(memoryBackend()), calls = [];
  const sync = createSync(fetchServer(serverStore.state, calls), 'localhost');
  assert.equal(await sync.start(empty), true);
  assert.equal(empty.transferRuns()[0].seed, 'server-progress');
  assert.deepEqual(calls, ['api/health', 'api/state']);
});

test('attempting transfer practice cannot overwrite a save from an unknown future version', () => {
  const backend = memoryBackend(), future = JSON.stringify({ ...blankV2(), version: 999, futureData: 'keep this' });
  backend.setItem(KEY, future);
  const store = makeStore(backend);
  assert.equal(store.readOnly, true);
  store.recordTransferRun({ summary: transferSummary([]), items: [] });
  assert.equal(backend.getItem(KEY), future);
});
