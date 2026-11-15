// Fingerprint visible question content, excluding answers, IDs and solution text.
// Two independent 32-bit hashes keep a bounded history small. Ranking statement
// order is ignored: shuffling an old question does not make it new.
export const QUESTION_HISTORY_LIMIT = 8000;

export function legacyQuestionKey(item) {
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

// The same executable quotes are the same question even when cards move around.
function orderedBoard(item, order) {
  const marker = 'Cards (sell / buy): ', text = item.prompt?.text || '', start = text.indexOf(marker);
  const cards = start < 0 ? null : text.slice(start + marker.length).replace(/\.$/, '').split('; ');
  return { ...item,
    prompt: cards?.length === order.length ? { ...item.prompt, text: text.slice(0, start + marker.length) + order.map((i) => cards[i]).join('; ') + '.' } : item.prompt,
    board: { ...item.board, instruments: order.map((i) => item.board.instruments[i]) },
  };
}

export function questionKey(item) {
  if (item.section !== 'ob' || !Array.isArray(item.board?.instruments)) return legacyQuestionKey(item);
  const order = item.board.instruments.map((_, i) => i).sort((a, b) => {
    const left = JSON.stringify(item.board.instruments[a]), right = JSON.stringify(item.board.instruments[b]);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  return `ob:${legacyQuestionKey(orderedBoard(item, order))}`;
}

// Earlier releases saved an opaque hash of the displayed card order. Check all
// old display permutations when those legacy hashes are present, so upgrading
// does not erase their meaning. New histories use the canonical key directly.
export function questionSeen(history, item) {
  if (history.has(questionKey(item))) return true;
  if (item.section !== 'ob' || !Array.isArray(item.board?.instruments) ||
      ![...history].some((key) => !key.startsWith('ob:'))) return false;
  const order = item.board.instruments.map((_, i) => i);
  function search(at) {
    if (at === order.length) return history.has(legacyQuestionKey(orderedBoard(item, order)));
    for (let i = at; i < order.length; i++) {
      [order[at], order[i]] = [order[i], order[at]];
      const found = search(at + 1);
      [order[at], order[i]] = [order[i], order[at]];
      if (found) return true;
    }
    return false;
  }
  return search(0);
}
