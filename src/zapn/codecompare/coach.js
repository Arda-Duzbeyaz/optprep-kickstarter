export default {
  purpose: 'Measures visual precision under time pressure: whether you can verify a string character by character fast enough, instead of trusting its overall shape.',
  howItWorks: [
    'A target code appears with four candidates below it. Exactly one candidate is identical.',
    'The others have one or two edits. An edit can replace a character (often with a look-alike) or swap two neighbouring characters.',
    'Press 1 to 4, or click. 30 rounds; the time limit falls from 5 s to 3 s and codes grow from 7 to 10 characters. No answer in time counts as wrong.',
  ],
  scoring: 'Accuracy over 30 rounds, timeouts counted as wrong. Target: 90% or better.',
  strategy: [
    { say: 'Anchor: this is proofreading a phone number, not reading a word. Your eye reads words by shape; codes must be read by character.', why: 'Word reading fills in expected letters, which is exactly the O-for-0 error the distractors are built from.' },
    { say: 'Split the target into chunks of 3 or 4 and hold one chunk at a time.', why: 'Three or four characters fit in working memory at once, so each comparison is a single glance instead of a re-read.' },
    { say: 'Eliminate, do not confirm. Compare one chunk across all four candidates and drop every candidate that fails.', why: 'Three candidates are wrong, so each chunk usually removes one or two of them. When one candidate is left you are done, without checking the rest of it.' },
    { say: 'Check one chunk at a time in a consistent order.', why: 'A difference can appear anywhere in the string. A consistent scan helps avoid checking the same chunk twice.' },
    { say: 'Watch for look-alike characters such as O and 0, and swaps such as 47 versus 74.', why: 'A small edit can leave the overall shape of the code almost unchanged.' },
    { say: 'If two candidates survive, find one position where they differ and check that position in the target.', why: 'Exactly one candidate matches the target, so that position can separate the last two.' },
  ],
  rule: 'Scan in short chunks. If two choices remain, check a position where they differ.',
  drills: [
    'Run a practice game saying each chunk silently ("K-5-O") before comparing it.',
    'Write down every error with the pair you confused. After three runs your personal look-alike list is the one to drill.',
  ],
};
