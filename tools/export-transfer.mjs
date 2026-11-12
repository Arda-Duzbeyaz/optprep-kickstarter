import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeRng } from '../src/core/rng.js';
import { TRANSFER_FAMILIES } from '../src/transfer/index.js';
const out = process.argv[2] || 'backend/data/transfer-library', seeds = Number(process.argv[3] || 100);
if (!Number.isInteger(seeds) || seeds < 1) throw new Error('positive integer seed count required');
mkdirSync(out, { recursive: true });
for (const [section, families] of Object.entries(TRANSFER_FAMILIES)) {
  if (!families.length) continue;
  const items = families.flatMap((f) => f.levels.flatMap((difficulty) => Array.from({ length: seeds }, (_, s) => f.generate(makeRng(`independent-transfer:${f.id}:${difficulty}:${s}`), { difficulty }))));
  writeFileSync(join(out, `${section}.json`), JSON.stringify({ section, items }));
  console.log(`${section}: ${items.length} additional-training cases`);
}
