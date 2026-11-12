// Fingerprint visible question content, excluding answers, IDs and solution text.
// Two independent 32-bit hashes keep a bounded history small. Ranking statement
// order is ignored: shuffling an old question does not make it new.
export const QUESTION_HISTORY_LIMIT = 8000;

export function questionKey(item) {
  const content = JSON.stringify([item.section, item.prompt,
    item.statements?.map((s) => s.text).sort(), item.board]);
  let a = 2166136261, b = 5381;
  for (let i = 0; i < content.length; i++) {
    const c = content.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b, 33) ^ c;
  }
  return `${(a >>> 0).toString(16)}:${(b >>> 0).toString(16)}`;
}
