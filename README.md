# OptPrep — Kickstarter focused practice

**Version 1.4.0-kickstarter.1 · 15 November 2026**

Complete application based on [Coflazo/optprep](https://github.com/Coflazo/optprep), with the original MIT licence and attribution preserved. This independent preparation tool is not affiliated with or endorsed by Optiver.

This release starts from the delivered **1.3.0-kickstarter.1** archive. It fixes repetition in focused learning, expands small pools, and keeps the skill and difficulty fixed throughout a block and its resume. Previous scoring, timing, learning-completion and cold-check improvements are retained. The [1.3.0 README](docs/README_REASONING_DIVERSITY_1.3.0.md) remains as historical documentation.

## The confirmed problem and the fix

Easy **“Two dice: max, min, doubles, differences”** contained only **seven distinct questions**. A ten-question block therefore had to repeat. Other small pools included four basic card questions, four basic three-dice questions and two introductory Monty Hall questions. The previous focused-learning path allowed recycling after its fresh search failed.

New focused-learning questions now **must be unseen** in the retained history. Changing the answer order does not make a question new. The skill and difficulty stay fixed for the entire block, including Save & exit, resume and reload. Small pools have more valid inputs and appropriate event formulations. The two-dice example now has **26 easy and 36 higher-level questions**, still using two standard six-sided dice.

Completely enumerated pools select directly from their unseen instances, including the last remaining question. If no unseen question can be supplied, the session **stops and saves submitted answers**. It does not repeat, change topic, raise difficulty or award completion for unattempted questions. Known exhaustion reports the configured capacity; a bounded-search failure says more variants may exist.

An old saved current question remains exactly as saved on upgrade, including an old revision question. Subsequent draws use the new rule. Mistake review, fixed numbered sets and lessons remain deliberate review and may reuse material.

“Unseen” is relative to the existing **8,000 fingerprints per assessment**, on the same browser origin. Clearing storage, changing device or eventually evicting old history changes that memory. This is not an infinite supply or cross-device history.

## Run locally

Install **Node.js 20 or later**, extract the ZIP, and open a terminal inside the folder containing package.json and index.html:

~~~sh
npm start
~~~

Open the localhost URL printed by the launcher. No dependency installation, build step, account, Python backend or compiled engine is needed for normal practice. Serve over HTTP; do not double-click index.html as a local file.

Full source, automated tests, optional backend/engine and documentation are included. Installed dependencies, compiled outputs, credentials and personal progress are not included.

## Deploy to your own GitHub Pages repository

1. Extract the ZIP.
2. Commit the **contents of its inner application folder** at the repository root, including index.html, src/, config/, assets/, .github/, .nojekyll, the licence and other project files.
3. In **Settings → Pages**, select **GitHub Actions**. Enable Actions and push to **main**, as configured in .github/workflows/pages.yml.
4. Wait for the Pages workflow to finish and use the URL GitHub reports.

Uploading the ZIP alone does not deploy it. Do not nest the app an extra directory below the repository root. Preserve the MIT licence and attribution. The workflow builds the static file list and updates the offline cache marker.

**No remote repository or live Pages site was updated in this session**; the GitHub connection exposed no accessible installations. Replacing deployed files at the same address retains that browser's progress. Export a Settings backup before moving to another address or device.

## Use the app as a learning loop

| Mode | Purpose | Progress meaning |
|---|---|---|
| Learn a skill | Ten focused questions; hints, explanations and tutoring allowed | A full block without skips automatically ticks learning coverage |
| Mixed practice within an assessment | Recognise methods among that assessment's skills | Fresh, unaided, uninterrupted, standard-time answers can earn cold checks |
| Timed section / full mock | Apply configured clocks and response formats | Mock performance and trainer readiness |
| Batch check / former Transfer Challenge | Additional unfamiliar-instance testing, with section scope and timing choices | Separate session record; additional training, not an official replica |
| Mistake review | Diagnose a known error | Deliberate revision, where repetition is useful |

Learning completion means **you worked through the material**. Accuracy and help do not prevent that tick. It does not certify independent performance. Three qualifying cold successes at the current authored difficulty verify a checkpoint; the next supported difficulty becomes the target. A skill with levels [2, 3] has two checkpoints, not four invented levels. A failed, assisted, interrupted or slow attempt does not qualify. These rules are unchanged.

Use **learn → mixed practice in that assessment → explain and repair errors → return later for fresh mixed practice**. Start mixed work once at least two skills are covered; finishing all 103 skills first is unnecessary. Use ChatGPT during learning and review, and close outside help for independent checks and mocks.

For eight hours weekly, four two-hour sessions suit deeper work. A useful starting split per session is 45 minutes learning/repair, 45 minutes mixed practice or a timed section, and 30 minutes explaining errors and solving unfamiliar independent questions. Shift more time into timed work as coverage improves. Include all five reasoning assessments during the week and give measured weaknesses extra time. Keep Zap-N brief enough that it does not displace quantitative work. The app deadline is **6 December 2026, 23:59 CET / 22:59 UK time**.

## Audit scope and modifications

The audit covers **111 skills at 273 supported skill/difficulty combinations**: 103 Kickstarter reasoning skills and eight optional arithmetic skills. Source input definitions and hashes are in the machine-readable audit.

**Nineteen existing families were expanded**: 15 Beat the Odds, two NumberLogic and two Intervals. The other **84 Kickstarter families**, all eight optional arithmetic families, Likelihood List, Orderbooks and Zap-N were preserved. There are no new assessment categories or invented difficulty levels.

| Family / difficulty | Before → after | Measurement |
|---|---:|---|
| Two-dice max/min/doubles/differences / 1 | 7 → 26 | Exact configured pool |
| Two-dice max/min/doubles/differences / 2 | 19 → 36 | Exact configured pool |
| Repeated die / 1 | 18 → 48 | Exact configured pool |
| Three dice / 2 | 4 → 17 | Exact configured pool |
| Card draws / 1 | 4 → 21 | Exact configured pool |
| Monty Hall / 2 | 2 → 20 | Exact configured pool |
| Best-of series / 2 | 3 → 15 | Exact configured pool |
| Coupon collection / 2 | 3 → 19 | Exact configured pool |
| Expected extremes / 2 | 6 → 20 | Exact configured pool |
| Reroll expected value / 3 and 4 | 5 → 25; 3 → 15 | Exact configured pools |
| Triangular sequences / 1 | 11 → 21 | 512-seed sample |
| Fraction sequences / 5 | 8 → 35 | 512-seed sample |
| Interval pattern waiting / 2 | 12 → 28 | Exact configured pool |
| Interval expected dice / 3 | 11 → 15 | Exact configured pool |

The [complete inventory](evaluation/FOCUSED_VARIABILITY_INVENTORY.md) lists every supported level. The [full modification log](docs/FOCUSED_LEARNING_UPDATE.md) explains all 19 family changes and selection/verification changes. Standard two-dice sums remain at **21 questions per level**; arbitrarily increasing the die sizes would change that topic.

There are **33 completely enumerated skill/difficulty pools with 776 entries in total**. Other generators use bounded fresh searches. These are configured capacities, not every mathematical problem that could ever be written.

## Reasoning value

Different numbers build fluency but do not create a new concept. Changing a target face is mainly relabelling. A reroll payout multiplier changes the value while preserving the policy; it adds a units check, not a new optimal-stopping technique.

Some additions change event reasoning: exact versus bounded extrema, equal versus unequal faces, signed versus absolute differences, first-only versus both versus neither card events, and fair-coin versus die first-success formulations. Pattern waiting includes all binary overlap structures through length four at the relevant level. Strong existing conditioning, information-protocol, shared-source, recurrence, likelihood-ranking and orderbook families are retained.

Finite selection prefers a new branch before another instance of an encountered branch. It chooses a branch and then a question so a large numerical pool does not crowd out other methods. A branch key is a generator diagnostic, not a measure of conceptual unfamiliarity.

Four existing wrong-choice/explanation details were corrected: the mean of extreme die products is 18.5; the two-outcome coupon expectation is exactly 3; an ordered/unordered minimum distractor needs the actual ordered numerator; and a uniform-product explanation must distinguish a square-root cutoff from a joint probability. Their existing correct answers were already correct.

## Verification

| Check | Result |
|---|---|
| Complete JavaScript suite | **1,062 passed**, zero failed/skipped |
| Python suite with compiled engine available | **36 passed**, zero skipped |
| C++ engine suite | **34 passed** |
| Total unit tests | **1,132 passed** |
| First block: 20 seeds × 273 skill/level combinations | **54,600 questions per release; 1,160 repeated draws before → 0 after** |
| Up to 40 successive questions per skill/level | **9,764 supplied, zero repeats; 64 pools stopped** |
| Complete finite catalogues | All **776 entries** verified; membership/reachability tested with 2,048 seeds per pool |
| Shared-history mode regression | **1,030 learning + 1,000 mixed + 2,970 mock + 500 Batch questions; zero repeats** |
| DOM integration | All **11 scripts** passed, including 76 focused-learning and 108 freshness assertions |
| Full learning walkthrough | **103 skills, 1,040 answers, 680 assertions, zero uncaught errors** |
| Real Chrome walkthrough | Old saved block retained; ten distinct easy two-dice questions finished; save/resume/reload preserved the current question; learning completion visible |
| Responsive visual check | Desktop and 390 px iframe; content/scroll width both 375 px, no horizontal overflow |

The first-block comparison starts each seed with empty history. It establishes a fresh first block, not an unlimited succession of ten-question blocks after prior exposure. The successive-question test stops when fresh questions cannot be supplied; it does not pad with repeats. Synthetic correct answers in the shared-history regression exercise progression, not human learning.

Independent checks enumerate 36 two-dice outcomes, 216 three-dice outcomes and 2,652 distinct-card ordered draws; weighted series outcomes; waiting-time Markov states; and keep/reroll policies. New continuous-product thresholds receive independent numerical integration. Distinct-face expectations receive exact state counts and a separately implemented recurrence, retaining full enumeration for the old small cases. Existing ambiguity, equivalent-answer, presentation, scoring and timing checks remain.

Reports: [validation](evaluation/focused-learning-validation.json), [comparison](evaluation/focused-variation-results.json), [mode regression](evaluation/focused-assessment-regression.json), [DOM flows](evaluation/focused-learning-flows.json), [visible browser checks](evaluation/focused-browser-results.json). Earlier reports remain as records of their own versions.

![Completed ten-question focused block](docs/media/validation/optprep-focused-complete.jpg)

## Reproduce checks

~~~sh
npm test
node tools/focused-assessment-regression.mjs
node tools/focused-variation-evaluation.mjs /absolute/path/to/extracted-1.3.0
~~~

The comparison needs the previous extracted release; it cannot reconstruct that baseline from this ZIP alone. Standalone tests and the mode regression do not require it.

DOM scripts need development-only jsdom. Set OPTPREP_TEST_JSDOM to its installed module path, then run the scripts named in evaluation/focused-learning-flows.json. For example:

~~~sh
OPTPREP_TEST_JSDOM=/absolute/path/to/node_modules/jsdom node tools/focused-learning-flow.mjs
~~~

Optional native checks use python -m pytest -q in backend/, and CMake/CTest for engine/. Their development dependencies are described with those components.

## Invitation fidelity

| Assessment | Supported by the supplied invitation | Still trainer assumptions |
|---|---|---|
| Beat the Odds | Probability; limited time per question; 25 minutes total | 20 questions, 90 seconds per item, exact scoring/difficulty |
| NumberLogic | Numerical reasoning; 25 minutes | 26 questions, sequence coverage, navigation/scoring |
| Likelihood-list | Rank outcomes; limited time per question; about 25 minutes | 15 questions, 90-second budget, exact-order score |
| Intervals | Numerical estimates and uncertainty bounds; about 15 minutes | 18 questions, truth distribution/scoring; no invented item deadline in the preset |
| Orderbooks | Profitable buying/selling combinations; about 15 minutes | 20 boards, trading rules, penalties/difficulty |
| Zap-N | One or more games, each 2–15 minutes | Which games and fidelity of these approximations |

The email does **not** specify 90 seconds or 20 questions. Its approximate total and component durations should not be converted into a more precise official schedule. Follow the actual portal instructions. Optional arithmetic is not added to the Kickstarter preset.

The app is now a stronger question source. It does not independently calibrate Optiver difficulty, prove that new-looking questions are conceptually unfamiliar, or measure a human training benefit. Independent unseen questions remain necessary to assess transfer. Physical phones and other browsers were not tested in this session.

## Progress and provenance

The existing optprep:v2 store is retained without reset or destructive migration. Settings, XP, coverage, cold evidence, numbered sets and question fingerprints remain. Saved focused blocks gain an optional difficulty field; old snapshots are supported. Keep one active training tab because the existing snapshot store does not merge simultaneous writes.

SOURCE_REVISION.txt identifies the tested local implementation. BUILD_INFO.json retains release provenance and previous validation. The original public repository was not modified. See [LICENSE](LICENSE), [LEGAL.md](LEGAL.md), and the historical [Kickstarter fixes](KICKSTARTER_FIXES.md).
