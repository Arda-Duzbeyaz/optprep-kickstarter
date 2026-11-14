// Presentation changes must retain the exact correct option and visible content.
export function presentation(item, rng) {
  if (item.kind !== 'mcq') return item;
  const options = rng.shuffle(item.options);
  return { ...item, options, answerIndex: options.indexOf(item.options[item.answerIndex]) };
}
