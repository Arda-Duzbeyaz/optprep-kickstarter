# Resumable practice and explicit skill progress

Version `1.0.4-practice.1`, 12 November 2026. Starting point: the user's deployed `1.0.3-transfer.3` (`f926761ff1319627f495c29b05e3591839ba4662`). The upstream developer's public repository was not changed. MIT licence and original attribution are retained.

## Confirmed problems

The original ordinary practice runner created a timestamp-seeded random stream on every entry, used an unlimited question count, and kept its unfinished question and session log only in a page closure. Navigation saved submitted-answer statistics but discarded the question, selection and session position. The rail on that page inherited the daily-minute goal rather than question completion. Five skill bubbles lacked a visible explanation of levels or the current three-answer counter. The roadmap's “You are here” was a suggested unfinished task, not a bookmark.

The ten-question drill checkpoint checked only the score ratio. A single correct answer followed by End session therefore passed it. This was reproduced before the change.

The supplied Quant Sprint source had a better model for this use: finite practice, per-category snapshots, explicit resume cards, restored RNG position and feedback, and separate recognition checkpoints. Its 433 simulated flow assertions passed during the comparison. Its Maven/CTC question banks were not copied into OptPrep.

## Implemented changes

1. Ordinary practice defaults to ten questions and ends with a summary. Early finish is labelled as such. Completed and partial practice runs are recorded with planned count and completion status; an empty exit adds no fake run.
2. A snapshot stores the current original item, question index, draft response, hints, completed-answer log, feedback phase, exact RNG cursor, current-question elapsed time and level/XP baselines. One block per task is retained. A different family requires an explicit resume/start-new choice.
3. Navigation cleanup, pagehide, answer changes and hints save practice. Hidden or paused time is excluded. An answered snapshot, ordinary answer evidence and SRS update commit together. Replayed answer commits are rejected, and rendering restored feedback does not call answer recording.
4. All four answer kinds restore: MCQ choice, ranking permutation, partial interval bounds and orderbook trades. Corrupt or incompatible snapshots display a recovery choice without erasing existing skill results. Storage failure/read-only mode displays an honest autosave status.
5. Practice now has a labelled submitted-question bar and a matching rail. The bar updates on each answer; partial completion remains distinct from a completed block.
6. Practice levels have names, visible numeric levels, current streaks and exact next requirements. Focused questions show a compact counter above the prompt. Detailed feedback explains level gains or why an answer did not qualify. Roadmap rows display levels and counters; “Suggested next step” replaces “You are here.” Level 3 allows moving on; Level 5 retains the existing pace requirement.
7. A new mixed-practice counter records fresh, unhinted successes with the family label hidden, within the existing pace budget. Named-family practice and fixed sets do not contribute. Three qualifying instances meet the check. A later eligible mistake, hint or slow answer resets it. Existing earned practice levels remain unchanged.
8. Progress → Skills separates started skills and submitted answers from Level 3+, at-pace and mixed-check totals. Level 5 plus a current mixed check is explicitly labelled an app training goal. Transfer Challenge remains a separate measure.
9. A drill checkpoint requires all ten answers and the unchanged score target. Legacy runs with ten retained answers still qualify. One-question/partial runs stay in history but cannot pass the ten-question checkpoint.
10. The local service-worker fallback cache name and package version identify this update. The existing Pages workflow still stamps deployed caches with each commit. Assessment presets, clocks, scoring formulas, generators, difficulty rules, question banks and Transfer Challenge selection are unchanged.
11. Paused/reloaded/hidden unanswered practice questions retain learning value but cannot establish uninterrupted pace or a mixed-check pass. This prevents excluding away-time from making a speed claim misleading. Pause between answered questions when benchmarking the next attempt. Existing earned levels are not reduced.
12. Mock answers no longer reset ordinary practice counters. Previously even a correct mock answer reset the counter because it was ineligible to award levels. Assessment statistics, scores, clocks and targets still use their existing implementations; old earned levels and counters are not recomputed.

## Where the levels appear

- During focused practice: above the prompt, for example “Level 1/5 · Learning — 2/3 towards Level 2.”
- After answering: a detailed skill panel, with an updated streak and explanation.
- On each task roadmap: beside every skill, plus a collapsed level guide.
- Under Progress → Skills: category totals and links to the individual skill rows.

The first four levels each require three fresh, correct, unhinted answers in a row. Level 5 needs another three inside the existing practice pace budget. A failed qualifying answer resets the counter, not earned levels. Difficulty numbers and practice levels are distinct.

## Verification

The shipped regression tests exercise actual practice controls and storage using deterministic time and seeds. They cover all five mathematical tasks, all answer kinds, identical current and subsequent questions after reload, partial drafts, hint restoration, feedback without double counting, saved-last-question completion, early exits, separate categories, family-switch choices, hidden-time pause, unsupported snapshots, level gains, dashboards and the partial-drill exploit.

Core tests cover save migration, invalid snapshots, atomic/idempotent answer commits, RNG continuation, mixed-check eligibility/reset rules, checkpoint completion and generator JSON serialization. Serialization is checked across every ordinary family and supported difficulty with multiple seeds, running the existing mathematical verifiers on deserialized items. Verification RNGs use separate deterministic seeds where required.

See `evaluation/practice-results.json` and `evaluation/logs/practice-*.log` for the final measured results and the source comparison. The existing complete JavaScript suite, optional backend tests, C++ engine tests and Transfer Challenge integration/regression checks are retained.

Browser inspection used Chrome at desktop size and a 390-pixel iframe with a 375-pixel content area and desktop scrollbar. It verified selection resume, a real 1/3 → 2/3 → level-up sequence, feedback reload, save-and-exit cards, the roadmap, the level guide, the skills dashboard and light/dark practice. This is responsive-layout testing, not a physical Android/iOS or cross-browser test. A preview server interruption was recovered by restarting it; the practice answer and earned level survived reload.

## Deliberate limits

- The mixed check counts unseen instances; it does not prove different reasoning structures. The original structure-signature proxy is not promoted into a mastery metric.
- Level 5 plus a mixed check is a transparent training milestone, not an independently validated Optiver readiness threshold. The update does not establish that Optiver uses these question counts, scoring rules or per-item clocks.
- Timed mocks and drills do not acquire a pause/resume feature. The user's Career Kickstarter preset and timing assumptions remain as documented in the main README.
- Existing mastery is retained without retroactively claiming that older answers were uncued. New mixed evidence starts empty.
- An unfinished question from the old version cannot be recovered retroactively. New snapshots work from this version onward.
- Browser storage is local to an origin. Moving from GitHub Pages to localhost or another address needs export/import or the existing optional sync. Use one active training tab; concurrent-tab state merging is not implemented.
- Restored feedback preserves the answer, hints and correctness but reopens solution steps from their normal initial display; it does not bookmark which explanation step was expanded.
- There are no claimed experimental learning gains. The measured improvement is dependable practice continuity and clearer separation of practice progress, pace and uncued instance performance.

## Run and publish

Use Node 20+ and `npm start` from the extracted application root; no runtime npm installation is required. Update the contents of the existing repository root, retaining hidden project files and the licence. The included GitHub Actions Pages workflow deploys the client. Do not upload a ZIP as a single file or place the entire application one folder below the repository root.

For checks: `npm test`; with jsdom available, run `tools/practice-flow-smoke.mjs`, `tools/ui-smoke.mjs`, `tools/transfer-smoke.mjs`, `tools/transfer-regression.mjs` and `tools/transfer-route-smoke.mjs`. Set `OPTPREP_TEST_JSDOM` to jsdom's installation path when it is installed outside the checkout. Optional Python/C++ validation follows the main README.
