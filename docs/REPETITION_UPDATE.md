# Repeat avoidance and unobtrusive revision notes

Version **1.2.2-kickstarter.1**, 14 November 2026. Starting point: **1.2.1-kickstarter.1**, revision `9bdc61e8f11f0d4e3f91b078e23c0af03d35eb7b`.

## Request and confirmed cause

The user reported exact repeated questions during a ten-question skill-learning block and asked the app to avoid previously seen questions where variation permits. They explicitly requested that any revision label be small and out of the way.

The existing exposure fingerprints already excluded IDs, explanations and MCQ answer order, and normal practice already remembered displayed questions across blocks. The defect was in selection: the structure-aware path sampled only **16** candidates, then returned the best of those candidates. If those 16 were all seen, it returned a repeat even when an unseen instance remained elsewhere in the domain. A returned repeat also favoured the first sampled candidate rather than the least recently shown one.

Separately, the generators genuinely have finite domains at some difficulties. Easy repeated-die questions have only four existing visible variants, so ten unique questions cannot be produced from that domain. Easy two-dice sum questions have 21 variants and can support two full unique blocks before the remaining single fresh instance.

No claim is made about the exact state of the user's browser history or which app version was deployed on their device. The implementation defect and finite-pool behaviour were reproduced from the delivered source.

## Changes

### Exhaustive selection for two small dice families

`src/practice/finite-variants.js` enumerates the actual discrete generator inputs for:

| Family | Difficulty | Distinct visible prompts |
|---|---:|---:|
| Two-dice sum events | 1 | 21 |
| Two-dice sum events | 2 | 21 |
| Repeated die | 1 | 4 |
| Repeated die | 2 | 36 |

The catalogue calls the existing generator with controlled choices for its existing branches and input ranges. It does not reimplement probabilities, change formulas, add hypothetical contexts, or edit the original generator files. Unconsumed or out-of-range input choices fail explicitly. A frozen, history-independent cache holds the catalogue; each selected question is cloned before presentation so view code cannot mutate later questions.

Normal learning and mixed practice first consider every unseen entry at the selected difficulty, with existing structural preference within those entries. Once all visible variants have been exposed, they select the least recently shown one. Where a prompt occurs at more than one difficulty, the shared exposure fingerprint still recognises it.

### Stronger procedural search elsewhere

Other families retain their generators and use up to **256** candidate draws to find an unseen instance. Structural preference retains its short 16-candidate window once a fresh candidate exists; a familiar structure cannot force selection of an exact repeat when a fresh candidate was already found.

If no fresh instance is found within that bounded search, the oldest exposed candidate is selected. This is the oldest candidate found, not a claim to have enumerated an arbitrary procedural domain. The selected family and difficulty remain fixed during the search. Original weakness weighting and family breadth still choose which family is attempted; an exhausted skill is not silently replaced by another skill or higher difficulty.

The legacy `practiceItem` path without structural preferences retains its earlier behaviour. The shipped generated learning/mixed runner always supplies structural preferences and uses the improved path. Fixed lessons/sets, deliberate mistake review, Batch check sampling and timed mocks keep their existing selection rules.

### Small revision note

The runner shows **“Previously seen · revision”** as one small muted line below the block counter. It replaces the prominent mixed-repeat banner and removes the duplicate review wording in the heading. It has:

- 11px type and approximately 15.4px line height;
- transparent background and no border;
- no popup or alert role;
- a tooltip explaining saved exposure history and cold eligibility.

The ordinary answer-feedback explanation remains. Repeated questions can contribute to a completed learning block, XP and revision statistics, but cannot earn previously unseen cold-checkpoint evidence. This release changes no checkpoint thresholds, scoring or clocks.

## Validation and measured improvement

**930 tests passed: 860 JavaScript, 36 Python and 34 C++.** The new JavaScript file adds 16 regression tests.

The 82 catalogue entries pass full item-contract validation and the existing independent verifiers: prompt-parsed enumeration over 36 ordered dice outcomes, or enumeration of repeated-throw sequences. An additional **16,384** seeded original-generator draws establish catalogue membership and observed reachability. They are not presented as 16,384 independent probability proofs.

| Reproducible comparison | Earlier release | Updated release |
|---|---:|---:|
| Repeats despite a known remaining unseen easy sum-event prompt, 630 hold-out cases | 293 | 0 |
| Repeats while a witnessed reference alternative remained unseen, 2,060 draws across 103 skills | 15 | 0 |
| All repeats in the deliberately history-heavy 2,060-draw sweep | 640 | 638 |

The sweep samples 512 independent reference prompts per family at its first supported difficulty, begins with up to 20 of those prompts already recorded, then draws 20 questions per family. A repeat is labelled *witnessed avoidable* only when a concrete same-family/same-difficulty reference alternative remains unseen. Many small domains are already exhausted in this setup, explaining why total repeats remain high even after avoidable repeats fall to zero.

On this host the sweep took approximately **3.5 seconds before / 18.4 seconds after**, across all 2,060 draws. More thorough search has a computation cost; these figures are not a phone performance benchmark. Fully enumerated dice domains avoid repeated rejection searches entirely.

Additional checks:

- **147 new DOM flow assertions:** all 21 easy sum variants before revision across three blocks, saved-question/freshness resume, quiet-note semantics, four-variant cycling, preserved learning completion and no fabricated cold passes.
- Existing **104** practice-flow, **100** learning-route, **71** shared-practice and **684** full-app completion-walkthrough assertions pass. The full walkthrough covers all 103 learning families and 1,040 learning answers, plus five Batch checks and five timed-section start/review flows.
- Original UI/batch smoke scripts, broader router and **11/11** focused interface regressions pass.
- **133 original generator files** and assessment configuration remain byte-identical. **50 mock papers / 990 complete question objects** match the prior release exactly for comparison seeds, after exercising the new sampler. The MIT licence is unchanged.
- Chrome answered all four easy repeated-die variants through real UI controls using rendered prompts. Question five was the first repeated prompt and matched the least recently shown variant. Desktop and a 390px responsive iframe confirmed the small 11px note. The phone content and scroll widths were both 375px; the saved fifth question resumed correctly. This visual check used the dark theme, not physical-phone or cross-browser testing.

Full measured output is in `evaluation/repetition-results.json`; suite and UI validation are in `evaluation/repetition-validation.json`.

## What this does not establish

- Only the explicitly enumerated dice domains have a complete-domain no-premature-repeat guarantee. A 256-candidate search can still miss a rare alternative in another procedural family.
- Zero witnessed avoidable repeats in the reference sweep does not prove zero avoidable repeats over all seeds.
- Exposure history remains the existing bounded 8,000 fingerprints per assessment in the current browser/save. An exported/imported backup carries it; a separate device without that data does not.
- Existing visible variation is not conceptual novelty. This patch does not expand the mathematical question bank or establish actual Optiver question counts, per-item limits, scoring or difficulty calibration.
- Small pools can still prevent fresh cold checkpoints after guided learning. Repetition is labelled honestly; no evidence is fabricated to fill counters.

## Files changed

| File | Change |
|---|---|
| `src/practice/finite-variants.js` | Complete input catalogues for the existing dice generators, strict input bounds, immutable cache |
| `src/core/draw.js` | Finite-domain selection, 256-candidate generic freshness search and least-recent fallback |
| `src/ui/runner.js` | One quiet repeat note instead of the duplicate heading text and prominent mixed banner |
| `src/ui/styles.css` | Muted, borderless 11px note |
| `tests/core/practice-freshness.test.js` | 16 correctness, coverage, exhaustion, determinism and compatibility regressions |
| `tools/practice-freshness-flow.mjs` | 147 real-control assertions for multi-block learning and revision |
| `tools/practice-freshness-evaluation.mjs` | Independent reference sampling, hold-out comparison and mock/source preservation |
| `tools/learning-completion-flow.mjs` | Existing repeat-eligibility assertion follows the intentionally quieter note |
| Package/cache marker, README, evaluation and provenance files | Current release, complete results and preserved historical documentation |

## Reproduce and run

Run the app with Node.js 20+ using `npm start`; normal use needs no dependency install or frontend build. Run `npm test` for JavaScript tests. With the optional `jsdom` test dependency installed, run `node tools/practice-freshness-flow.mjs` and the existing flow scripts listed in the README.

To repeat the before/after experiment, extract the retained previous release into a separate directory and run:

```sh
node tools/practice-freshness-evaluation.mjs /absolute/path/to/previous-release
```

The full ZIP includes the working client, source, tests, optional backend/engine, deployment workflow, documentation, licence and attribution. Existing progress requires no new migration; current saved questions remain intact. Export a backup before updating or moving origin. This release has not been pushed to the user's GitHub repository or deployed to Pages; the upstream developer's repository is untouched.
