# OptPrep — Kickstarter reasoning practice

**Version 1.3.0-kickstarter.1 · 14 November 2026**

Complete application based on [Coflazo/optprep](https://github.com/Coflazo/optprep). The original MIT licence and attribution are preserved. This is an independent preparation tool, not affiliated with or endorsed by Optiver.

This release starts from the previously modified **1.2.2-kickstarter.1**, revision `d72f034086496d0e6c09dcb364ee2fa1ea40c6b1`. It preserves learning completion, cold checkpoints, resumable blocks, prior mathematical fixes, invitation-aligned section clocks, settings and progress. The [previous full README](docs/README_REPEAT_AVOIDANCE_1.2.2.md) remains available as historical documentation.

## What changed and why

An audit of all **103 practice families**, at every supported difficulty, found two different problems:

1. Some small generators offered too few useful formulations. In particular, easy repeated-die questions had four visible instances, and easy “at least one” had three.
2. Mixed practice could recycle a question from a depleted skill even when other eligible skills had unseen questions. Mock generation also had a silent repeat fallback after 60 attempts.

Seven families were expanded. The remaining **96 families were preserved**. Fresh mixed batches, generated timed sections/full mocks and Batch checks now refuse to substitute a seen question when the fresh search fails. Focused learning can still use deliberate revision after a finite pool is exhausted.

These changes make the application a stronger question source. They do not establish that its difficulty matches Optiver, or demonstrate an improvement in candidates' real assessment scores.

## Run locally

Install Node.js 20 or later, extract the ZIP, and open a terminal **inside the folder containing `package.json` and `index.html`**:

```sh
npm start
```

Open the localhost URL printed by the command. The static application needs no npm dependencies, build step, account, Python backend or C++ engine. Serve it over HTTP; do not double-click `index.html` as a local file.

Alternatively, use a static HTTP server in that folder. The optional `backend/` and `engine/` directories are included for their original development uses; GitHub Pages does not run them.

## Put it in your own GitHub repository

Extract the ZIP first. Upload or commit **the contents of its inner application folder** at the repository root, including `index.html`, `src/`, `config/`, `assets/`, `.github/`, `.nojekyll`, `package.json`, the licence and documentation. Uploading the ZIP itself does not deploy the application. Do not nest the entire app one directory below the repository root.

The included `.github/workflows/pages.yml` can deploy the static client. In the repository's **Settings → Pages**, select **GitHub Actions** as the source, enable Actions if necessary, and push to the workflow's configured deployment branch. The workflow fills the service-worker asset list and commit cache marker. Preserve the attribution and MIT licence.

This archive is complete source, tests and documentation. It contains no personal progress, credentials, installed dependencies or compiled engine build. Creating this archive does **not** update an existing Pages site. This session's GitHub connection exposed no accessible installations, so no remote repository was modified.

## Variability: what was actually assessed

| Kind | Meaning | How it is treated here |
|---|---|---|
| Numerical | Different values, same method | Useful for fluency; not counted as a new concept |
| Surface | Different words, labels or ordering | Not sufficient evidence of mathematical novelty |
| Structural | Changed constraints, conditioning, starting state or missing position | Targeted where it fits an existing skill |
| Conceptual | Recognise and apply a principle in an unfamiliar formulation | A design judgment; cannot be established by counting templates |

The reproducible audit draws **512 deterministic samples per family per supported difficulty**, records visible fingerprints, generator-branch proxies and answer positions. It inspects source branches as well as sample counts. A branch signature is a conservative diagnostic, not a measurement of reasoning ability. A finite sample count is not a proof of a family's full capacity.

The [complete family inventory](evaluation/VARIABILITY_INVENTORY.md) lists every skill and level. Full machine-readable results: [reasoning-diversity-results.json](evaluation/reasoning-diversity-results.json).

## The seven focused generator changes

| Family | Change | Reasoning value |
|---|---|---|
| BTO: one die, repeated throws | Easy includes a specified face versus any common face, on fair 4/6/8-sided dice. Higher level adds a neighbouring match and a distinct prefix followed by a return to the first face. | Decide whether the first throw is free; distinguish global repeats from adjacent repeats; combine a distinct prefix with a final matching constraint. |
| BTO: at least one | Easy includes named faces, a roll other than a named face, thresholds and parity. | Identify the single-trial success event before choosing the correct complement. Changing a face label alone is surface variation. |
| BTO: conditional dice | Existing opposite conditioning directions also appear at difficulty 2. | Distinguish “given a face, find a sum” from “given a sum, find a face”; the denominators differ. Higher-level branches remain intact. |
| NumberLogic: multiply by counting numbers | Internal missing terms as well as forward continuation, using the existing ambiguity filters. | Check the rule on both sides of a gap, rather than always extending the last term. |
| NumberLogic: primes | Internal missing primes/transformed primes as well as continuation. | Recognise and apply the same underlying list with different information available. |
| Intervals: coupon collection | Uniform cases may start with some faces already collected; ask for additional rolls. | Use the remaining stages, giving n·H(n − collected), rather than mechanically applying n·H(n). Weighted cases are retained. |
| Intervals: pattern waiting | Complete short binary patterns and canonical die equality patterns, including ABAB and ABCA. | Recognise different self-overlap structures. Relabelled patterns are not claimed as different concepts. Maximum pattern length remains four. |

No extra assessment categories, arbitrary large numbers, new scoring formulas or new difficulty levels were added. These families feed their existing learning, mixed, mock and batch paths.

### Measured visible variety

The following are distinct visible questions in **512 seed draws at each stated level**, before → after. Exact finite-domain sizes are identified separately.

| Family / difficulty | Before | After |
|---|---:|---:|
| Repeated die / 1 | 4 | 18 |
| Repeated die / 2 | 36 | 60 |
| At least one / 1 | 3 | 30 |
| Conditional dice / 2 | 5 | 66 |
| Counting multipliers / 2 | 8 | 24 |
| Counting multipliers / 3 | 39 | 112 |
| Primes / 2 | 7 | 18 |
| Primes / 3 | 85 | 118 |
| Coupon collection / 3 | 10 | 74 |
| Pattern waiting / 2 | 7 | 12 |
| Pattern waiting / 3 | 33 | 68 |
| Pattern waiting / 4 | 4 | 23 |

The exact enumerated repeated-die domains are **18 and 60**. Uniform coupon inputs cover **75** starting states, independently tested in full; the random sample reached 74. These numbers measure question availability, not 18/60/75 different mathematical techniques.

### Topics intentionally left scoped

Standard fair six-sided two-dice sum events already enumerate **21 questions per supported level**. Making a die arbitrarily large would add arithmetic, not improve the target skill. The canonical three-door Monty Hall stay/switch case is similarly small; its existing higher level generalises the setup.

Other low-count introductory levels, such as basic card draws and some three-dice events, remain fundamental exercises with richer later levels. Likelihood-list already combines several probability/ranking families; Orderbooks already varies replication identities, executable bid/ask sides and hedge structures across eight families. Their repeated underlying principles are part of what must be learned. This release does not invent extra fees, trading rules or assessment formats just to create more templates. Zap-N games remain unchanged: repeated stimuli in reaction/memory tasks have a different purpose from repeated quantitative questions.

## Repeat rules in each mode

| Mode | Freshness behaviour |
|---|---|
| Learn one skill | Enumerates both small dice domains; elsewhere searches up to 256 candidates. If no fresh item is found, revises an older seen item. A tiny muted “Previously seen · revision” line appears. |
| Mixed practice | Uses the selected all-skills or covered-skills pool, weakness weights, breadth preference and each skill's current checkpoint difficulty. Searches other eligible skills when one is depleted. Never returns a recorded-seen question. Requires fresh candidates from at least two skills; otherwise ends clearly and saves submitted answers. |
| Generated timed section / full mock | Builds the complete configured question count before the section starts. Checks prior learning/mixed/mock exposure and within-paper duplicates. Tries other families and fresh bank items. If it cannot build a full fresh paper, no section clock or score starts. |
| Batch check | Same shared practice library, feedback at the end. Unseen questions only; if a preferred family is depleted, searches other families. If no complete fresh batch can be built, it stops before starting. Results remain separate from ordinary cold checkpoints. |
| Fixed lessons, numbered fixed sets, mistake review | Retain intentional reuse. A fixed set is not a fresh generated mock. |

Shuffling multiple-choice answers, ranking statements or Orderbooks cards does **not** make a question new. Generated mock MCQ options are reshuffled with the seeded RNG while retaining the correct answer. The audit reports raw sorted generator positions separately from presented positions; some distractor magnitudes can still cue answers in familiar templates. Orderbooks fingerprints now canonicalise card order and check permutations against the opaque hashes saved by earlier releases.

History is local to this browser/origin and retains up to **8,000 fingerprints per assessment**. Do not clear history or change site address to manufacture fresh scores. Use Settings → Backup before moving sites/devices. The app cannot recognise something seen outside its retained history. Different numerical instances of the same mathematical structure remain allowed and necessary for fluency; this is not a promise that each question requires a new method.

Except for the explicitly enumerated dice domains, the search is bounded. Failure means “the search found no fresh candidate”, not a mathematical proof that no unseen question exists anywhere in that generator.

## Learning, levels and progress

**Learning coverage and independent performance are separate.**

- A focused block of 10 answered questions without skips automatically marks a skill covered. Accuracy and tutoring do not block the learning tick. The final answer saves completion before Finish, so leaving on feedback does not lose it.
- “Mark covered” is an optional manual exposure tick, useful after learning outside the app. It does not award a cold checkpoint or prove proficiency.
- Mixed practice checks method recognition without naming the skill before the question. Three distinct fresh, unaided, uninterrupted, correct successes within the standard training pace verify the current authored generator difficulty. Other skills can occur between those three attempts.
- Wrong, assisted, interrupted or slow eligible attempts reset the current streak. A seen revision question cannot earn fresh credit. A later miss can request a recheck of a previously verified level without deleting its historical evidence.
- Levels are the actual levels supported by that family, not a universal ladder from 1 to 4. After three successes, the next supported level becomes the target. Completing all levels is a trainer milestone, not proof of exceptional mathematical ability.
- A saved question, response draft, feedback, hints, RNG cursor and elapsed time survive navigation/reload. An old in-progress question is preserved as-is on upgrade, including a previously seen current question; the fresh-only policy applies to subsequent new mixed/mock draws. An unanswered question resumed after a break is learning/revision evidence, not an uninterrupted cold attempt.
- XP and habit minutes record activity. They do not imply learning completion or cold competence.

A narrow covered pool can run out of fresh instances. Learn another relevant skill or use the all-skills diagnostic; do not raise a checkpoint level automatically or reset history to fill the counters.

## Invitation alignment and remaining assumptions

The supplied Career Kickstarter – Trading 2027 invitation is the authority for section totals and deadline:

| Assessment | Invitation | Trainer's additional assumptions |
|---|---|---|
| Beat the Odds | 25 minutes overall; limited time per item | 20 items and 90 seconds per item are trainer assumptions, not stated in this email |
| NumberLogic | 25 minutes | 26 items; generated sequence/rule distribution is unvalidated |
| Likelihood-list | About 25 minutes; limited per item | 15 items and 90 seconds per item are assumptions |
| Intervals | About 15 minutes | 18 items; 50-second pace for training checks, no enforced per-item mock limit |
| Orderbooks | About 15 minutes | 20 items; 45-second training pace and the trainer's board mechanics |
| Zap-N | One or more games, 2–15 minutes each | Exact battery, order and difficulty are unknown |

The Kickstarter preset retains these separate clocks and breaks. The invitation's approximate 1 h 44 min total does not reconcile exactly with its section estimates; no invented combined timer is added. Deadline: **6 December 2026, 23:59 CET / 22:59 UK**.

Real question counts, per-item limits, item distributions, difficulty, scoring weights, pass thresholds and exact Zap-N battery remain unverified. Training targets and “verified” labels are not independently calibrated Optiver pass predictions. Follow the real portal's more specific instructions when available.

## Use it every day

Keep most quantitative practice within the assessment you are training. Mixing skills within Beat the Odds develops method selection; mixing all five assessments is optional additional training, not required to simulate their separate tests.

A useful session is: learn or repair one topic with explanations, complete a mixed batch of covered skills unaided, diagnose the mistakes, then solve a fresh question without help. Start mixing after covering a few topics; do not wait to finish all 34 BTO skills before testing yourself. Move toward timed sections as coverage improves. Use a laptop/desktop and mouse for some timed practice.

For approximately **eight hours per week**:

| Activity | Weekly time |
|---|---:|
| Learn/repair concepts with ChatGPT or worked solutions | 2 hours |
| Unassisted mixed practice within individual assessments | 2.5 hours |
| Timed sections or a mock, including review | 1.5 hours |
| Independent unfamiliar problems and explanation from first principles | 1.5 hours |
| Brief Zap-N familiarisation | 0.5 hours |

Shift time toward the weakest assessment using actual mistakes and pace, not just XP. For unfamiliar work, use reputable probability/interview problem collections, sequence reasoning and estimation exercises outside this generator. Explain why your method applies and why a tempting alternative fails. Near the deadline, prioritise timed performance, repair and adequate rest over adding features or grinding memorised questions. Complete the actual assessments with a buffer. The real assessment must be taken without AI, online resources or outside help, as the invitation requires.

## Mathematical verification

The new answers are checked using methods distinct from their generation formulas:

- **Repeated die:** every one of the 78 expanded inputs is checked by direct counting of all k^n outcomes. Includes zero-probability all-distinct cases when n > k. The complete four dice catalogues contain 120 verified questions in total, including unchanged two-dice sums.
- **At least one:** die-event answers are checked by enumerating actual roll sequences, using success faces rather than trusting the supplied probability. Existing trade cases enumerate outcomes and repeated-trial cases use a binomial sum.
- **Conditional dice:** enumerate the 36 ordered die pairs and count the conditioning event and intersection.
- **NumberLogic:** existing rule/alternative checks plus a separate integer recurrence and independent trial-division prime list for the new missing/forward cases. Finite sequences cannot be uniquely determined among every imaginable mathematical rule; checks concern the supported plausible rule set.
- **Coupon collection:** generator uses exact rational inclusion-exclusion; verifier solves an absorbing Markov chain from the stated collected count. An additional recurrence checks all 75 uniform starting states. With one face missing, the answer must still be n rolls, not one roll.
- **Pattern waiting:** generator uses the prefix/suffix overlap formula; verifier solves a pattern-matching automaton's absorbing Markov chain. Explicit benchmarks include ABAB = 1,332, ABCA = 1,302, AAAA = 1,554 and ABCD = 1,296 for a fair six-sided die.

Seeded sweeps also check contracts, uniquely keyed numerical options and every supported difficulty. Source review checks the changed explanations against their inputs. They do not prove every generated sentence is perfectly worded or every possible sequence interpretation is unambiguous.

## Validation results

**879 JavaScript + 36 Python + 34 C++ tests = 949 passed.** There are 19 added regression tests, alongside updated finite-domain expectations. No independent correctness check or hard edge case was removed to obtain these results.

The before/after stress test uses the preceding modified release, not upstream. It first exposes 1,030 guided questions across all 103 families, then shares that history with 1,500 mixed questions and 150 full generated section papers:

| Check | Before | After |
|---|---:|---:|
| Repeats in 1,500 mixed questions | 63 | 0 |
| Repeats in 2,970 mock questions | 0 | 0 |
| Duplicate questions within mock papers | 0 | 0 |
| Complete mock papers produced | 150 | 150 |
| Fresh-search stops in this workload | 0 | 0 |

An additional **1,000 Batch-check questions** had zero repeats. No claim is made that the old mocks repeated in this sample; their confirmed weakness was the silent fallback, now covered by exhaustion regressions.

Other integration checks include **680 full-entry-point assertions** over all 103 learning families and 1,040 submitted learning answers, five Batch checks and five timed-section start/review flows; **151 freshness-flow assertions**; **24 explicit exhausted-session UI assertions**; the existing practice, route, shared-library, timing and progress checks; and the 11 focused interface regressions. All passed. These synthetic correct-answer walkthroughs test application behaviour, not human learning.

Browser checks cover [desktop](docs/media/validation/optprep-diversity-desktop.jpg) and [390px responsive](docs/media/validation/optprep-diversity-phone.jpg) layouts, a saved old question after upgrade, a newly generated specified-face question and its exact solution, and the small revision note. Physical phones and other browser engines were not tested in this session.

Read [the detailed change record](docs/REASONING_DIVERSITY_UPDATE.md), [current validation metadata](evaluation/reasoning-diversity-validation.json), and [the full comparison data](evaluation/reasoning-diversity-results.json). Earlier reports are historical evidence for their named releases, not current test counts.

### Reproduce

```sh
npm test
node tools/reasoning-diversity-evaluation.mjs /path/to/previous-1.2.2-checkout
```

For DOM integration checks, install JSDOM into a separate development directory and set `OPTPREP_TEST_JSDOM` to its installed package path, then run the scripts under `tools/`: `practice-flow-smoke.mjs`, `learning-route-smoke.mjs`, `shared-practice-flow.mjs`, `learning-completion-flow.mjs`, `practice-freshness-flow.mjs`, `unseen-session-flow.mjs`, `ui-smoke.mjs`, `transfer-smoke.mjs`, `transfer-regression.mjs`, and `transfer-route-smoke.mjs`. The app itself has no JSDOM runtime dependency.

Optional backend/engine checks:

```sh
cd backend
python -m pytest -q
```

```sh
cmake -S engine -B engine/build
cmake --build engine/build
ctest --test-dir engine/build --output-on-failure
```

## Verdicts and limits

| Area | Verdict | Confidence |
|---|---|---|
| Mathematical correctness | Strong evidence for the changed logic and tested existing families, with independent checks and difficult boundaries retained | High for tested inputs; automated tests are not a proof of all prose or every possible output |
| Assessment realism | Relevant probability, numerical reasoning, ranking, uncertainty and executable-arbitrage practice; exact real item distribution remains unknown | Moderate for broad skills; low for exact replica claims |
| Difficulty calibration | Authored levels and timing assumptions, not calibrated candidate-performance bands | Low for Optiver equivalence |
| Educational quality | Clearer separation of exposure, unaided retrieval and timed performance; selected structural gaps are improved | Moderate to high as a design assessment; no learning-outcome experiment |
| Overall usefulness | Stronger daily question/mock source, best paired with tutoring and unfamiliar independent questions | High for observed software improvements; moderate for inferred preparation transfer |

Conceptual diversity improved in the seven stated families because constraints, conditioning, starting states and required directions of inference changed. The numerical gains also include ordinary arithmetic and surface variation. Existing template familiarity remains useful for speed but cannot substitute for reasoning on unfamiliar problems. The platform is suitable as a main practice interface; it should not be the sole source used to judge readiness.

## Progress, provenance and licence

The existing `optprep:v2` storage format and origin are retained. No progress reset, new account or destructive migration is required. All existing settings, XP, learning records, cold evidence and numbered-set records remain. Use one active training tab at a time; the existing local snapshot store does not merge simultaneous writes from multiple tabs. Old Orderbooks hashes are recognised alongside new canonical hashes. Replacing deployed files at the same Pages address preserves local browser progress. Export a backup before changing the deployment address or device.

Original copyright and MIT licence: [LICENSE](LICENSE). Original author: Cagan Oflazoglu / Coflazo. The package author and upstream repository attribution remain intact. `SOURCE_REVISION.txt` and `BUILD_INFO.json` identify this local modified edition; no change to the original public repository was made.

Previous investigations and implementations remain in [KICKSTARTER_FIXES.md](KICKSTARTER_FIXES.md), [the first diversity audit](docs/DIVERSITY_AUDIT.md), [shared practice changes](docs/SHARED_PRACTICE_UPDATE.md), [learning completion changes](docs/LEARNING_COMPLETION_UPDATE.md) and [repeat avoidance changes](docs/REPETITION_UPDATE.md). Read them as versioned history where their behaviour differs from this README.
