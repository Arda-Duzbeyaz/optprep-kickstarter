# Reasoning diversity and fresh sessions — 1.3.0-kickstarter.1

This is a focused continuation of 1.2.2-kickstarter.1 (`d72f034086496d0e6c09dcb364ee2fa1ea40c6b1`), not an upstream rebuild. The current [README](../README.md) is the complete usage/audit document. The previous [README](README_REPEAT_AVOIDANCE_1.2.2.md) is retained as release history.

## Confirmed weaknesses

- Four easy repeated-die instances and three easy at-least-one instances gave insufficient room for a ten-question first pass followed by fresh retrieval.
- Conditional-dice difficulty 2 repeatedly used five basic prompts although its existing higher level contained useful reversible-conditioning cases.
- Counting-multiplier and prime sequences always asked for a next term despite the existing factory supporting internal gaps and ambiguity filters.
- Uniform Intervals coupon collection always started from zero. Pattern waiting omitted some short patterns and useful die self-overlap structures.
- Mixed selection could return a depleted family's repeat without checking the rest of the selected pool.
- Timed mocks could return a repeat after 60 failed draws. The sampled baseline mocks did not exercise this fallback; synthetic exhaustion tests do.
- Raw MCQs were sorted by value. Some generator branches therefore had a fixed correct letter. Mixed/Batch presentation already shuffled options; generated mocks now also do so.
- An identical Orderbooks board with reordered cards had a different old fingerprint, including reordered cards in its textual prompt.

## Modification ledger

| File | Substantive change |
|---|---|
| `src/sections/bto/families/die-repeats.js` | Shared explicit input list; 18 easy/60 higher-level instances; specified-face, adjacent-match and distinct-prefix/return constraints; outcome-enumeration verifier extended; explanations/pictures/distractors for new cases; example faces and anchors valid for every supported die. Existing zero-probability edge retained. |
| `src/sections/bto/families/at-least-one.js` | Ten easy die-event definitions with 2–4 trials; identify success faces before complement; actual-roll enumeration checks this branch. Existing harder branches retained. |
| `src/sections/bto/families/conditional-dice.js` | Existing sum-given-face and face-given-sum branches made available at difficulty 2; exact 36-outcome verification retained. |
| `src/sections/nl/families/multiply-index.js`, `primes.js` | Enable existing internal missing-term support at both supported levels. Existing factory rejection/alternative-rule checks remain. |
| `src/sections/iv/families/coupon.js` | Uniform starting count 0…n−1; expected additional time from the remaining types; explicit remaining-stage explanation/hints; Markov verifier starts at the actual collected count. Weighted cases remain. |
| `src/sections/iv/families/waiting-time.js` | Enumerate short binary strings and canonical length-3/4 die equality patterns; retain original hard prompts including the original 1,2,3,4 wording. No longer patterns or larger sides. Automaton verifier remains independent. |
| `src/practice/finite-variants.js` | Catalogue follows the repeated-die input list instead of an obsolete 4/36 scripted domain. The unchanged two-dice domain remains fully enumerated. |
| `src/core/draw.js` | Explicit fresh-search failure type; fresh-only pool search with optional minimum number of fresh skills; full-paper mock preflight; bank deduplication; no repeat/short-paper fallback; seeded mock MCQ presentation shuffle. Focused learning retains finite-domain/LRU revision. |
| `src/core/questions.js` | Canonical Orderbooks card ordering, including the prompt's card list. Old opaque display-order hashes are recognised by checking old permutations. Other assessment fingerprints remain unchanged. |
| `src/ui/runner.js` | Mixed practice requires at least two skills with fresh candidates at current checkpoint targets; search failure ends and saves submitted attempts. Mock preflight failure renders an explanation before creating a clock or score. Resumed current questions remain intact. |
| `src/transfer/draw.js`, `src/ui/pages/transfer.js` | Batch checks skip repeats, fall back to eligible fresh families and handle full-batch unavailability before starting a clock. Existing isolated statistics/timing remain. |
| `src/ui/pages/mock.js` | Describe full-paper fresh policy and pre-start failure accurately. |
| `sw.js`, `package.json` | Local cache fallback and edition updated; the Pages commit-SHA cache workflow remains intact. |
| `tests/core/unseen-sessions.test.js` | Eight regressions: alternate eligible skills, two-skill requirement, no silent difficulty/pool escape, exhausted mocks, duplicate banks, full-count fallback, shuffled keyed options, reordered legacy boards/progress. |
| `tests/sections/reasoning-diversity.test.js` | Eleven tests: exhaustive repeated-die outcomes; 3,000 seeded checks across six expanded families; independently implemented arithmetic/prime-list checks; all 75 coupon states; explicit overlap benchmarks. |
| Existing completion/freshness tests and two flow scripts | Finite capacity now 18/60; preserve exhaustive reachability/no-premature-repeat/LRU edge checks; full learning-to-mixed walkthrough now expects fresh mixed draws rather than repeats. No mathematical checks removed. |
| `tools/unseen-session-flow.mjs` | Real UI exhaustion/preflight regression: no question, clock, XP, history mutation or score when no fresh session can start; submitted progress and all-skills fallback retained. |
| `tools/reasoning-diversity-evaluation.mjs` | Reproducible all-family baseline/current audit and history-sharing mixed/mock stress test; separate raw sorted option positions from presented positions; Batch-check no-repeat sweep. |
| README, evaluation reports/inventory, build metadata and proof images | Full documentation, raw measurements, limitations, complete release provenance and desktop/390px visual evidence. |

The original licence, author attribution, 96 other practice families, assessment configuration, scoring, readiness thresholds, cold checkpoint rules, save schema, learning ledger, settings, optional backend/engine and Zap-N games were preserved.

## What the measurements support

After 1,030 guided exposures, baseline mixed practice repeated 63 of 1,500 questions; this version repeated zero. Both versions produced 150 complete mock papers (2,970 questions) without observed repeats. The mock code change protects the failure case the sample did not trigger. An additional 1,000 Batch-check questions had no repeats.

Among the sampled mock answers, BTO's five positions changed from **33/109/226/147/85** to **125/112/131/106/126** across 600 questions; NumberLogic changed from **30/149/287/243/71** to **168/150/155/168/139** across 780 questions. This supports removal of the sorted-letter bias in this workload. Numerical distractor relationships can still provide clues in particular templates; shuffling labels alone does not establish distractor realism.

Visible variety increased in the targeted levels, but some gains are numerical/surface variation. The new constraints and conditioning/start-state changes are meaningful structural changes within existing topics. They are not measured human-transfer improvements or an Optiver difficulty calibration. The [full inventory](../evaluation/VARIABILITY_INVENTORY.md) covers every family, including unchanged small domains.

The sampled maximum Orderbooks board had six cards. Twenty worst-case legacy-negative permutation lookups took approximately 104 ms in this environment. This compatibility work is bounded by the actual board size; new canonical-only histories use a direct key lookup.

## Preserved finite-domain and progress behaviour

- New fresh-only draws never recycle retained fingerprints. A current saved item from an older release is preserved as-is, even if already seen; the new policy applies to subsequent new draws.
- Learning can deliberately reuse a finite pool. The revision note remains muted, borderless, 11px and outside the main question flow.
- Exhausted fresh mixed pools do not manufacture cold passes by silently raising difficulty or turning a single available skill into “mixed” evidence.
- History remains local and capped at 8,000 keys per assessment. Unseen within retained app history does not mean structurally novel or unseen outside the app.
- Most searches are bounded. A failure is a search outcome, not a proof that the entire mathematical domain is empty.
- Use one active training tab. Existing whole-state local snapshots do not merge simultaneous multi-tab writes; this release does not redesign storage synchronisation.
- Same-origin upgrades preserve progress. Export a backup before changing the host/path origin or moving device. No migration resets evidence.

## Verification and residual uncertainty

Current results: **879 JavaScript, 36 Python, 34 C++ tests passed (949 total)**, plus all DOM flow scripts. See [validation metadata](../evaluation/reasoning-diversity-validation.json) and [flow outputs](../evaluation/reasoning-diversity-flows.json). Source configuration/scoring/persistence invariants are checked in the metadata; historical evaluation files remain labelled by their earlier release.

Browser QA confirms a previous saved question is retained, the specified-face question keys 1/216 correctly and explains why the first throw is constrained, a later 8-sided variant appears, Save & exit resumes it at 6/10 answered, and the responsive body's scroll width equals its 375px content width in a 390px iframe. Desktop and narrow-layout proof images are included. The temporary preview was stopped after QA. This is not a physical-phone or cross-browser test.

The invitation verifies section totals/deadline, not generated item types/counts, exact per-item budgets or scoring. In particular, 90 seconds and 20 BTO questions remain trainer assumptions. No claim is made that these changes independently validate Optiver realism, establish complete mastery, or replace independent unfamiliar problems.
