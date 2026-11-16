// Authored task distinctions for the families where generic parameter tags were
// too coarse. Numbers, target-face labels and card-group sizes are not concepts.
const description = (id, ...operations) => ({ id, operations });
export function btoStructure(item) {
  if (item.section !== 'bto') return null;
  const p = item.params || {}, text = item.prompt?.text || '';
  if (item.family === 'two-dice-sum') {
    const kind = p.eventKind || (/between .* inclusive/.test(text) ? 'between' : /less than .* or greater/.test(text) ? 'outside'
      : /at least/.test(text) ? 'atLeast' : /at most/.test(text) ? 'atMost' : /odd|even/.test(text) ? 'parity'
        : /divisible/.test(text) ? 'divisible' : /exactly/.test(text) ? 'eq' : /sum is \d+ or \d+/.test(text) ? 'set' : null);
    if (!kind) return null;
    return description(`sum:${kind}`, 'ordered-outcome-counting', ...(['set','between'].includes(kind) ? ['disjoint-union'] : kind === 'outside' ? ['complement'] : []));
  }
  if (item.family === 'pattern-waiting' && p.A) {
    if (p.mode === 'wait') {
      const overlaps = Array.from({ length: p.A.length }, (_, i) => i + 1).filter((k) => p.A.slice(-k) === p.A.slice(0, k));
      return description(`wait:overlaps=${overlaps.join(',')}`, 'state-dependent-waiting', 'self-overlap');
    }
    if (p.mode === 'race' && p.B) {
      const symbols = [...new Set(p.A + p.B)], canonical = (s) => [...s].map((c) => symbols.indexOf(c)).join('');
      return description(`race:${canonical(p.A)}>${canonical(p.B)}`, 'competing-patterns', 'cross-overlap');
    }
  }
  if (item.family === 'card-symmetry') {
    if (['discardRed','discardAce'].includes(p.kind)) return description('unseen-marginal', 'exchangeability');
    if (['seenRed','seenAce'].includes(p.kind)) return description('observed-discards', 'conditioning', 'exchangeability');
    if (['sameSuit','heartBottom'].includes(p.kind)) return description('conditioned-position', 'conditioning', 'without-replacement');
    if (p.kind === 'aceBeforeKing') return description('first-relevant-group', 'relative-order-symmetry');
    if (p.kind === 'aceFirstOfSuit') return description('first-specific-card', 'relative-order-symmetry');
  }
  if (item.family === 'card-draws') {
    if (p.kind === 'group') return description(`ordered-group:${p.mode}`, 'conditional-chain', 'without-replacement');
    if (p.kind === 'handGroup') return description(`hand:${p.mode}`, 'without-replacement', p.mode === 'atLeast' ? 'complement' : 'combinatorial-counting');
    if (['atLeastAce','atLeastHeart'].includes(p.kind)) return description('hand:atLeast', 'without-replacement', 'complement');
    if (p.kind === 'allRed') return description('hand:all', 'conditional-chain', 'without-replacement');
    if (p.kind === 'allDiffRanks') return description('distinct-ranks', 'conditional-chain', 'exclusion');
    if (p.kind === 'flush') return description('first-card-fixes-target', 'conditional-chain', 'without-replacement');
  }
  if (item.family === 'linearity' && p.kind) {
    const extra = ['distinct','empty'].includes(p.kind) ? 'complement' : ['hh','runs'].includes(p.kind) ? 'overlapping-indicators' : 'symmetry';
    return description(`indicators:${p.kind}`, 'linearity-of-expectation', extra);
  }
  return null;
}
