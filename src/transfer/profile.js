// Conservative generator-branch proxies, not a measure of conceptual novelty.
const FIELDS = new Set(['kind', 'mode', 'variant', 'scenario', 'structure', 'v', 'k', 'op', 'type', 't', 'key', 'task', 'protocol', 'replacement', 'shared', 'atLeast', 'minOf', 'negative', 'reroll', 'children', 'older']);
export const STRUCTURE_HISTORY_LIMIT = 2000;
export function structureKey(item) {
  if (item.transfer?.structure) return `${item.section}/${item.family}/${item.transfer.structure}`;
  const tags = [];
  function visit(value, path = '', depth = 0) {
    if (!value || typeof value !== 'object' || depth > 4) return;
    if (Array.isArray(value)) { for (const entry of value) visit(entry, `${path}[]`, depth + 1); return; }
    for (const [key, v] of Object.entries(value)) {
      if (FIELDS.has(key) && (typeof v === 'boolean' || typeof v === 'string')) tags.push(`${path}${key}=${v}`);
      else if (v && typeof v === 'object') visit(v, `${path}${key}.`, depth + 1);
    }
  }
  visit(item.params);
  const p = item.params || {};
  for (const key of ['cond', 'event']) if (Array.isArray(p[key]) && typeof p[key][0] === 'string') tags.push(`${key}=${p[key][0]}`);
  if (Array.isArray(p.statements) && p.statements.every((s) => typeof s === 'string')) tags.push(`queries=${[...p.statements].sort().join(',')}`);
  if (Array.isArray(p.coeffs?.ops)) tags.push(`operations=${p.coeffs.ops.map((op) => op[0]).join('>')}`);
  if (Array.isArray(p.coeffs?.strands)) tags.push(`strands=${p.coeffs.strands.map((s) => s.k).join('>')}`);
  if (typeof p.pattern === 'string') { const alphabet = [...new Set(p.pattern)]; tags.push(`pattern-shape=${[...p.pattern].map((s) => alphabet.indexOf(s)).join('')}`); }
  if (item.section === 'nl') tags.push(item.prompt?.sequence?.at(-1) === '?' ? 'next-term' : 'missing-term');
  return `${item.section}/${item.family}/${[...new Set(tags)].sort().join('|') || 'base'}`;
}
