# Mixed practice update: 1.5.0-kickstarter.1

16 November 2026. Starting point: the delivered 1.4.0-kickstarter.1 archive, SHA-256 e9858874f6e9f8f01b3d615ad72eebee913fd309fd5c97c1fc668320f347d970, recorded implementation 41b529d64fa56cde2182d6e5d89d666811f7f51b. All 690 baseline application files matched that archive before modification. No upstream replacement or public repository mutation was used.

## Investigation and scope decision

The BTO audit inspected all 34 practice families and their 82 authored levels, plus drawing, adaptive weighting, presentation, verification, history, saved sessions, checkpoints, results and Batch checks. It distinguished exact, numerical, surface, structural and conceptual variation.

The existing library already contains strong conditioning and stochastic-process problems. The confirmed weak points concerned small pools, persistent coverage, inadequate structure tags and incomplete result evidence. The focused learning loop, ten-question format and existing checkpoints were retained. No new assessment, game, lesson system or Transfer mode was added.

The eight optional arithmetic families and the 100 reasoning families outside the three expanded BTO generators retain their existing generated input definitions. Two other BTO families receive explanation-only corrections. Shared selection/result changes also benefit mixed practice in other assessment categories.

## Every substantive modification

| Files | Change and purpose |
|---|---|
| src/core/mixed-training.js (new) | Saved per-assessment selection ledger, per-skill recency/difficulty/pace debt, coverage helpers, independent-result summaries, validation and bounded optional detail |
| src/core/draw.js | Alternating coverage and weakness selection in fresh mixed draws; optional branch recency preference; exhausted candidates do not silently repeat |
| src/core/store.js | Records each submitted mixed attempt once; exposes its saved selection ledger; bounds optional mixed-run detail while preserving original results |
| src/core/migrate.js | Optional mixedTraining field with validation/default; schema remains 2 and historical progress is retained |
| src/core/practice.js | Accepts and validates the optional current branch status and new mixed-row metadata; old snapshots remain supported |
| src/sections/bto/families/two-dice-sum.js | Keeps all old inputs, adds nonadjacent sum unions, bounded inclusive intervals and outside events, records event kind, extends independent prompt-parsed verification |
| src/sections/bto/families/card-draws.js | Keeps old cases, adds standard-deck hand groups and all/none/at-least/exact-count events; combinatorial generation checked by a separate ordered-card recurrence; fixes a strict-bound explanation |
| src/sections/bto/families/card-symmetry.js | Adds inspected red/ace discard cases contrasting with the unchanged unseen-discard principle; separately enumerates remaining labelled cards |
| src/practice/finite-variants.js | Complete catalogues include every new configured sum/hand input and still select remaining unseen cases directly |
| src/sections/bto/structures.js (new) | Authored event, overlap, information-condition and operation metadata where generic field scraping was inadequate |
| src/transfer/profile.js | Uses authored keys, retains old coarse-key construction and labels ambiguous legacy exposure unknown |
| src/transfer/draw.js | Records the branch-status partition; unknown older structure cannot be counted as newly encountered |
| src/ui/pages/transfer.js | Persists and displays the unknown structure group in existing Batch results |
| src/ui/runner.js | Passes saved coverage/pace evidence into mixed drawing; captures branch status before remembering exposure; records actual conditions and displays independent evidence |
| src/ui/mixed-evidence.js (new) | Shared compact result view separates independent paced performance from raw accuracy; older missing conditions stay unknown |
| src/ui/pages/progress.js | Displays per-assessment independent evidence in Pace; shows genuine known finite-pool shortages in existing skill records |
| src/practice/availability.js (new) | Computes exact remaining supply only for complete catalogues and compares it with the current checkpoint requirement |
| src/ui/practice-progress.js | Explains persistent coverage, shows true shortage status, removes an obsolete focused-repeat statement; learning/cold sections retain their existing purpose |
| src/ui/practice-actions.js | Small explanation of coverage across blocks and accuracy/pace targeting; no redesign |
| src/sections/bto/families/card-stopping.js | Changes the hindsight bound from strictly below to no greater than; equality is possible |
| src/sections/bto/families/linearity.js | Identifies 1/e as the limiting approximation for no fixed points, not the exact finite probability |
| package.json, sw.js | Release 1.5.0-kickstarter.1 and distinct fallback offline cache marker; deployed builds still use their commit marker |
| README.md, this log, evaluation reports, BUILD_INFO.json, SOURCE_REVISION.txt | Current usage, measured evidence, limits and release provenance; previous reports remain historical |
| docs/README_FOCUSED_LEARNING_1.4.0.md | Archives the previous README without rewriting its release claims |

### Selection mechanics

One attempt advances the mixed ledger once. Opening or resuming a question does not advance it. Duplicate submission of the same saved answer does not award another turn. The runner's original save/answer atomicity and recognition gates remain.

On turn 0, 2, 4 and so on, fresh selection prefers the oldest attempted eligible family. The intervening turns use the original smoothed accuracy weights multiplied by a bounded pace/review factor. Independently correct answers above the actual training budget add one pace-debt unit (maximum four); independent within-budget successes repay one. A changed target difficulty discards obsolete debt when it is no longer relevant. Assistance, hints, interruption, extra time, seen answers and incorrect answers do not manufacture pace evidence.

The existing within-block family cycle remains; strict selection still requires at least two fresh eligible families for a mixed question. Thus a depleted pool cannot become a disguised one-topic checkpoint session. A failed fresh search is explicit and does not change the focused skill/difficulty or silently shorten a full mock.

The rolling-window bound assumes stable eligibility and available fresh candidates. The new policy is a training choice, not an official assessment rule or an experimentally proven optimal spacing schedule.

### Question supply and reasoning

Two-dice-sum capacity rises from 21 to 66 at difficulty 1 and from 21 to 91 at difficulty 2. The die remains the standard six-sided die. The new easy unions use the existing ordered-outcome procedure; the higher inclusive/outside contrasts require careful event translation and complement handling.

Card hands rise from 13 to 57 at difficulty 2 and from 13 to 49 at difficulty 3. Groups have actual standard-deck sizes: aces 4, face cards 12, hearts 13, red cards 26, numbered 2–10 cards 36 and red face cards 6. Impossible all-five-aces cases are excluded. Existing ace/heart/complement and flush/distinct-rank cases remain.

Card symmetry adds 105 feasible inspected-discard inputs for discarding two through ten cards: 63 red-count and 42 ace-count cases. The edge with all four aces already removed is retained and has answer zero. The learner must distinguish an observed composition from an unobserved random discard. This is a useful information contrast; changing the number discarded alone is not a new concept.

There are now 971 entries in the same 33 complete catalogues. Other generators still use bounded searches. Some configured domains remain finite and can still be depleted, including after repeated focused blocks. For example, basic card draws remain at 21 cases. The update addresses the audited two-dice dead end and enlarges the small higher card pools; it does not claim every possible future training history can always support every cold checkpoint.

### Structural evidence

The authored classifier distinguishes lower/upper thresholds, inclusive/outside intervals, pattern self-overlap, canonical competing patterns, observed/unseen card information and selected indicator tasks. It unifies equivalent red/ace unseen symmetry and HH/TT pattern relabellings. Other generators keep their existing stronger tags.

Mixed drawing first prefers a branch absent from recorded keys; when all available branches are recorded, optional recency preference revisits the less recent available branch. Complete catalogues examine the actual remaining instances; generic generators use bounded candidate searches. Neither guarantees a question is psychologically unfamiliar.

Exact question fingerprints are unchanged. A saved old coarse structure key may be insufficient to classify a new authored branch. Its status is legacy-unknown rather than newly encountered. Exact-newness still excludes the earlier question itself. New, familiar and legacy-unknown Batch categories are disjoint.

No arbitrary requirement for three distinct branch tags was added to checkpoints. Some levels legitimately have one central technique. A checkpoint remains three qualifying fresh-instance successes; transfer needs delayed and external evidence.

### Records, migration and storage

Mixed answer rows now optionally retain: evidence version, section, fingerprint, actual difficulty, structure key, operation tags, structure status, freshness, recorded help, interruption, budget and standard-time condition. The original row fields and scoring stay.

Only the latest 1,000 annotated rows across saved runs retain these additional fields. Trimming removes only the new fields from older rows; their original scores, timing and family records remain. Unknown historical conditions are excluded from the independent rate rather than fabricated. The per-skill ledger separately retains recency and bounded pace evidence.

Old v2 saves default the new ledger to empty. Malformed new ledger metadata is rejected before replacing current state. Old snapshots remain valid; new snapshots preserve branch status through feedback/resume. Existing learning coverage, completed-block records, recognition passes/proofs, prior mastery and mixedEvidence fields are not reinterpreted or reset.

## Correctness and regression methods

| Test or tool | What it establishes |
|---|---|
| tests/sections/mixed-reasoning.test.js | Every configured sum event parsed independently and counted over 36 ordered outcomes; every new card-hand event checked by weighted binary draw-order enumeration; observed-discard inputs, zero-ace edge, legacy structure uncertainty and real supply shortages |
| tests/core/mixed-training.test.js | Rolling coverage with extreme accuracy weights, block reload, depleted pools, pace targeting/repayment, assistance gates, deduplication, bounded detail, old-save preservation and invalid-import rejection |
| tests/transfer/session.test.js | Unknown coarse evidence belongs to its own group and cannot become new-structure evidence |
| Updated freshness regression | Capacity assertions now match the expanded configured domains; last-unseen and legacy fallback edge cases remain tested |
| tools/mixed-improvement-flow.mjs | 143 assertions through actual DOM controls: ten-question scoring, help, slow answer, interrupted reload, hints, extra time, progress, legacy records, two focused blocks followed by a real fresh checkpoint, and honest shortage display |
| tools/mixed-improvement-evaluation.mjs | Source-pinned before/after sampling with identical branch classifier and saved ledger across ten-question blocks |
| tools/mixed-question-quality.mjs | 20,992 presentation/closest-label checks, 328 sampled verifier checks, 971 catalogue-entry checks and 4,096 reachability seeds per complete pool |
| Updated tools/focused-assessment-regression.mjs | Exercises the real new selection arguments and saved ledger in the existing shared-history five-assessment regression; accepts an output path to preserve historical reports |
| Updated tools/practice-freshness-flow.mjs | Draws all 66 easy sum variants across ten-question blocks and reloads, then checks honest depletion |
| Updated tools/focused-learning-flow.mjs | Capacity-aware depletion fixture still tests the last three unseen cases and distinguishes known exhaustion from unknown search failure |

The card generator uses binomial coefficients for unordered hands. Its family verifier uses integer counts of ordered labelled draws by hit count; the additional regression enumerates every good/bad order and multiplies changing conditional probabilities. These are separately implemented checks rather than a single repeated formula. The regression asserts that **all 80 new hand inputs actually reach its independent checker**; a naming mismatch caught during final review was corrected before delivery.

Sum verification parses visible event wording independently of the generator's hit predicate. Inspected-discard verification constructs the 52 labelled cards, removes a representative feasible inspected set and counts qualifying remaining cards. The new zero-probability edge and mutation rejection checks remain. Existing ambiguity, scoring, equivalent-orderbook-solution, snapshot and timing tests were not removed or weakened.

## Results and interpretation

The complete unit suites pass: 1,077 JavaScript, 36 Python and 34 C++, with no failed or skipped tests. All twelve DOM scripts pass, including the 103-skill/1,040-answer learning walkthrough. The shared-history regression supplies 5,500 questions, including 150 generated mock papers, with zero exact repeats.

At 68 attempts the equal-prior comparison improves mean skill coverage from 30.83 to 34 of 34, and mixed-weakness coverage from 25.94 to 34. All 80 runs in both new conditions cover all 34. Neither comparison version repeated an exact question. Initial difficulty targets and historical accuracy are held fixed so this isolates selection; simulated success is not a human learning experiment.

The same authored classifier applied to 512 raw seeds at every level records 254 baseline versus 260 updated branch proxies. This modest increase supports the specific structural additions, not a broad claim about concept counts. The new recorder fixes previously missing distinctions without relabelling older ambiguous history as new.

A Chrome walkthrough retained the old learning record and saved selected answer. A ten-question mixed block scored 10/10, with 8/10 independent, one explicitly helped answer and one resumed answer. Qualifying skills advanced their checkpoint; those two excluded attempts did not. Progress displayed the same independent evidence separately from legacy learning. Dark desktop and dark/light 390 px iframe layouts were inspected; the responsive body and content were both 375 px. Physical phones and other browser engines were not tested. Console output included unrelated browser-extension metadata errors, so the report does not claim a completely empty browser console.

The original preset, clocks, scoring, learning reducer, checkpoint reducer, exact fingerprints and MIT licence were compared byte-for-byte with 1.4 and match. Generated BTO papers can contain new variants because those generators expanded; existing saved current items remain as saved. Preserving timing is not a promise of byte-identical regenerated paper content.

## Remaining limits

- Actual Optiver question counts, exact scoring and difficulty are not established by the invitation. The BTO 20-question/90-second trainer assumptions remain labelled; its 25-minute total is invitation-supported.
- Independent paced accuracy is stronger evidence than raw accuracy but still comes from this generator. It does not measure delayed retention, written reasoning or external transfer.
- Correct-letter presentation is spread across A–E, but some existing distractor sets retain answer-magnitude cues. No complete distractor redesign is claimed.
- The configured pools and retained exact/structure histories are finite. Search failure in an unknown domain is not mathematical exhaustion. After an honest shortage, other skills and independent problems remain appropriate.
- Accuracy weighting still uses existing aggregated statistics. The added current-difficulty pace debt improves one blind spot; it is not a fitted learner model.
- No human training-outcome study, applicant percentile, pass probability or independent Optiver calibration was performed.
- This is a complete local/source delivery. No public repository or live Pages site was modified.

The app is a stronger daily practice system because its selection covers skills, its questions include useful contrasts and its scores retain the conditions needed for interpretation. Continue using ChatGPT for learning/review and external unfamiliar problems for the strongest transfer check.
