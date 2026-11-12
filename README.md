# OptPrep — mathematical transfer edition

**Version:** `1.0.3-transfer.3` · **Prepared:** 12 November 2026
**Based on:** the previously fixed `1.0.2-kickstarter.1` release, original revision `6b840e45a3b4145b06f76dec8e216d68799099fc`
**Original project:** [Coflazo/optprep](https://github.com/Coflazo/optprep) · **License:** MIT

This edition improves practice for recognising mathematical methods in unfamiliar mixed problems. It adds four targeted generator families and a separate **Transfer Challenge**, while retaining the ordinary assessment generators and all earlier fixes.

**It is a stronger training resource:** the measured improvements concern structural contrasts, mixed attempts without family cues, exposure tracking and separate transfer results. Actual learning gains and correspondence with Optiver's difficulty have not been experimentally measured.

## Run locally

Extract the ZIP and open a terminal inside `OptPrep_Kickstarter_Transfer`. With **Node.js 20 or newer**, run:

```sh
npm start
```

The launcher normally opens **http://127.0.0.1:8765**. There are no runtime npm dependencies, so normal use does not require `npm install`.

To start without opening the browser automatically:

```sh
node bin/optprep.js --no-open
```

Alternatively, use Python; Python 3.12+ supports the optional backend workflow:

```sh
python serve.py
```

Choose **Career Kickstarter: Trading** for ordinary assessment practice. Open **Transfer Challenge** from Today or the sidebar for additional mixed training. The original [live website](https://coflazo.github.io/optprep/) and upstream `npx optprep` do not contain these modifications; use the downloaded copy.

## Investigation

The audit distinguished four forms of variation:

| Type | Meaning | Example |
|---|---|---|
| Numerical | New values, same procedure | Change a sequence's starting value and common difference |
| Surface | New wording or presentation, same relationship | Rename a bag, group or product |
| Structural | Changed constraints, dependencies, weights or reasoning steps | One hidden source versus a newly selected source per draw |
| Conceptual | An unfamiliar problem requires recognising the principle | Decide whether to count, condition, mix, update or conserve a quantity |

Targeted source review and deterministic sampling covered all **99 existing mathematical families**: 32 BTO, 30 NumberLogic, 15 Likelihood-list, 14 Intervals and eight Orderbooks. Eighty items per family were sampled across its supported levels.

The existing library already has genuine breadth. NumberLogic varies rule classes, interleaving and combinations. Orderbooks varies exposures and replication structures. Probability and ranking families include different events, conditions, graphs and distributions. These strong generators were preserved.

The confirmed gap was that **exact freshness does not establish unfamiliar reasoning**. New numbers can still invite a familiar recipe. Ordinary adaptive practice supplies family context and immediate guidance. Existing full exams hide family names but remain within a single section; study-guide mixed exercises are tied to lessons or chapters.

The detailed findings, including which families mainly train fluency and which already have structural variation, are in [docs/DIVERSITY_AUDIT.md](docs/DIVERSITY_AUDIT.md). The [complete family inventory](evaluation/GENERATOR_INVENTORY.md) and [raw diagnostic data](evaluation/diversity-results.json) are included in the ZIP.

## Implemented improvements

### Four targeted question families

These additions belong only to extra training. Ordinary assessment registries, banks and numbered sets are unchanged.

| Family | Variations | Reasoning benefit |
|---|---|---|
| Information protocols — BTO | First-token report, existence report, random reveal, noisy report; with/without replacement | Similar messages imply different conditioning events and observation likelihoods |
| Shared source — BTO | One hidden bag versus a fresh bag each draw; all/count events, source inference and next-draw prediction | Choose the correct dependence model and update before predicting |
| Selection weights — Likelihood-list | Uniform people, uniform groups, explicit weights, reverse conditioning and shared-group repeated sampling | Derive probabilities from the selection procedure rather than a memorised denominator |
| Rates and weights — Intervals | Equal-time, equal-distance and unequal-distance speeds; mixtures, dilution, reverse percentages, compounding and combined work | Identify the base, conserved quantity or equation before doing arithmetic |

The existing library already taught related principles. These are new combinations and explicit contrasts, not claims that Bayes or conditional probability were previously missing. Numbers remain manageable; harder means a different relationship or additional reasoning step rather than needless arithmetic complexity.

Difficulty progression in the additions changes tasks: source questions move from forward probabilities to count events and posterior prediction; rates progress from direct weighting to inverse and conservation relationships. Levels are authored training choices, not empirical Optiver calibrations.

### Transfer Challenge

The dedicated mode supplies:

- **15 questions:** three from each mathematical section, shuffled across sections.
- **No family, method or difficulty labels during the attempt.** Worked solutions appear after finishing.
- **Timed or untimed practice.** Standard training clocks are 20 minutes overall and 90 seconds per item. Extra-time settings apply to both clocks and are recorded.
- **History-aware selection:** avoid recorded exact questions and prefer less familiar recorded structures. Family repetition within each section's three questions is discouraged.
- **Explicit inclusion of the focused extensions**, alongside strong existing families.
- **Shuffled MCQ positions**, with the answer key correctly remapped, only in this additional mode.
- **Separate results** for unseen questions, new recorded structures, familiar recorded structures and repeated review questions.

The new/familiar structure rows partition the unseen-question row. They are not additional attempts to add together. Non-interval accuracy and interval mean score remain separate; there is no invented combined Optiver pass mark.

Transfer is clearly labelled **additional training**, not an official assessment replica. It does not advance ordinary mastery, revision stats, spaced review, XP or exam target streaks. The existing Kickstarter clocks and preset remain intact.

### Structural exposure tracking

Exact history retains its earlier 8,000-per-section limit. A new history remembers up to 2,000 structural signatures per section, including questions displayed in ordinary practice. Only actually displayed questions are marked as seen.

New-family signatures come from explicit branch definitions. Existing-family signatures use selected discrete parameter tags, query types, operation ordering and pattern shapes. Numbers, wording, difficulty labels and answer positions do not manufacture a new signature.

**A new recorded signature does not prove a new mathematical idea.** This conservative proxy may merge different reasoning paths or separate equivalent calculations. Tracking starts in this edition and cannot reconstruct every earlier question. Finite pools can still require review; repeated questions are labelled and reported separately.

### Progress compatibility

The save schema remains version 2. Missing `recentStructures` and `transferRuns` fields receive empty defaults. Previous fixed-edition settings, scores, runs, answers, lessons, mastery, XP and exact-question history are retained. This release introduces no additional mastery reset.

The most recent 200 transfer sessions are retained separately. Save/reload and backup export/import were tested. Existing browser saves are reused on the same origin; if changing hostname, port, browser or profile, export under Settings in the previous copy and import into this copy. Keep that backup.

All prior repairs remain: the BTO total clock, preset-specific mocks, varied hard Markov questions, corrected fund-return teaching, meaningful interval mastery, exact freshness and honest verification coverage.

## Reliability fixes after deeper testing

The follow-up test pass reproduced defects beyond the first smoke test. This patch:

- Restores the submitted answer in the live session review, locks its controls and reveals ranking probabilities and MCQ grades.
- Removes unsupported ordinary-practice links from the additional families' solutions while retaining valid actions for existing families.
- Enforces both deadlines on submission, skip and keyboard input, including when animation frames are delayed. Late changes cannot replace the last response entered within time.
- Prevents backend startup from replacing transfer-only progress or displayed-question history with an older server snapshot.
- Makes the current Transfer sidebar link return from review to the landing page, and marks a session complete when Finish is pressed on its last question.
- Keeps the battery picker aligned with the active default: a fresh browser now selects Kickstarter instead of silently switching to Everything when Save is pressed.

The full app entry point and router were exercised through a 15-question run in the DOM harness. A subsequent desktop Chrome pass checked an actual timed attempt, a full untimed attempt, all response layouts, review, light/dark themes and history after reload. See [TRANSFER_TEST_REPORT.md](TRANSFER_TEST_REPORT.md) for findings and scope. Mobile and other browsers remain untested.

## Mathematical verification

Independent checks use different formulations where practical:

| Generating calculation | Independent calculation |
|---|---|
| Closed-form conditional probabilities | Enumerate labelled-token pairs and weight each report mechanism |
| Rational mixtures and posterior formulas | Expand source choices and colour outcomes as a probability tree |
| Aggregate table and sampling formulas | Re-read the displayed table and expand individual-person/pair probabilities |
| Rate, weight and percentage formulas | Substitute into conservation/rate equations instead of repeating the generator expression |

A separate Python implementation uses exact fractions to recompute real JavaScript exports. Mutation tests alter both an answer and its keyed option together; independent verification must still reject the result.

Regression tests cover all supported branches, deterministic reproduction, contracts, unique MCQ labels, correct remapping, ranking margins, all six ranking orders, source-history relevance, observation-protocol equivalence and differences, and rate contrasts. Explanation checks keep fraction quotients parenthesised and label rounded displays as approximations.

Existing NumberLogic rival-rule checks and Orderbooks solvers are unchanged. No checks or difficult cases were removed. Sequence uniqueness remains relative to the implemented rule libraries, rather than every possible rule for a finite sequence.

## Results from this recovered build

The saved starting ZIP was verified against SHA-256 `9e30970b01a65ab319928a68cb219a54095194efe393b0207d53e21fff6255dc` before restoration. The changes and validation were rerun in the recovered workspace; earlier claims were not treated as a substitute for testing this build.

| Unit/regression suite | Previous fixed edition | This edition |
|---|---:|---:|
| JavaScript | 747 passed | **777 passed** |
| Python, engine available | 27 passed | **36 passed** |
| C++ | 34 passed | **34 passed** |
| Total | 808 | **847 passed** |

Additional evaluations are case sweeps and integration checks, not extra unit-test counts:

| Evaluation | Result |
|---|---|
| Added-generator sweep | **13,000** deterministic cases; zero independent JS disagreements |
| Independent Python export | **1,300** cases; all numerically checked, zero failures or warnings |
| Transfer sample | Ten sessions, **150 questions, zero exact repeats** |
| Structural exposure in sample | 123 new recorded signatures, 27 familiar signatures |
| Answer positions in sample | All five MCQ positions and all six ranking orders occurred |
| Ordinary mock preservation | **990 item objects identical** to the saved fixed edition |
| Original library pipeline | 3,094 structural checks; zero failures; 11 existing NumberLogic warnings |
| Zap-N pipeline | 607 puzzle/model cases; zero mismatches |
| DOM integration | Both the earlier checks and the new transfer checks passed |
| Follow-up interface regressions | 11/11 passed, covering review, late input, completion and default preset selection |
| Full-app DOM route check | 15-question run, navigation, migration, storage and cleanup passed |
| Desktop Chrome visual pass | Timed expiry, all 15 untimed questions, four response types, review, themes and reload passed at 1348 × 936 |
| Local launcher and HTTP | App started successfully; five app/module URLs returned HTTP 200 |

The new families expose **33 authored branch signatures**: eight observation, ten source, seven selection and eight rate signatures. This is not 33 new concepts. The 123/27 split is a recorded-exposure diagnostic from a particular sampler and initially empty history, not an empirical percentage of conceptually unfamiliar questions.

The original library still has partial independent numerical coverage: **1,438 of 3,094** exported items. Its report retains `complete_numerical_coverage: false`. The separate 1,300-case additional-training export has complete numerical coverage for that export. These are different scopes.

Ordinary mocks retained zero exact repeats in the sampled sets, while branch signatures still recurred. Raw histograms are included; a small sample showing every answer position does not establish perfect statistical uniformity.

DOM integration exercises actual MCQ, rank, interval and orderbook controls, hidden solutions, complete/partial runs, both clocks, extra time, displayed-only history, cleanup, preset preservation and isolated progress. Desktop visual inspection now supplements those checks; it covers one Chrome viewport and does not establish mobile or cross-browser compatibility.

## Reproduce validation

From the project root:

```sh
npm test
```

Build the optional C++ engine with CMake and a C++ toolchain:

```sh
cmake -S engine -B engine/build
cmake --build engine/build
ctest --test-dir engine/build --output-on-failure
```

With Python 3.12+ and `uv`, from `backend`:

```sh
uv run pytest -q
uv run python -m oa_backend.pipeline
```

To export and independently verify the additions, start from the project root:

```sh
node tools/export-transfer.mjs
cd backend
uv run python -m oa_backend.verify --library data/transfer-library --out data/verification/transfer-report.json
```

Generate the inventory and 13,000-case evaluation from the project root:

```sh
node tools/diversity-audit.mjs
```

To include the ordinary-mock comparison, supply the directory of the extracted previous fixed edition:

```sh
node tools/diversity-audit.mjs /path/to/previous-fixed-copy evaluation
```

The optional DOM checks require a temporary development dependency:

```sh
npm install --no-save jsdom
node tools/ui-smoke.mjs
node tools/transfer-smoke.mjs
node tools/transfer-regression.mjs
node tools/transfer-route-smoke.mjs
```

The app and main JavaScript suite do not require `jsdom`. Compiled engine output, installed development dependencies and exported-library intermediates are regenerable and excluded from the release.

## Preparation workflow

| Resource | Purpose |
|---|---|
| Ordinary OptPrep | Focused fluency, revision and section mocks |
| Transfer Challenge | Method selection across mixed problems without family cues |
| ChatGPT after attempting | Concepts, error diagnosis, alternative methods and genuinely different follow-up problems |
| Independent practice | Evidence that the reasoning works on unfamiliar external material |

Use 30–60 minutes of the existing weekly website allocation for transfer attempts and review, replacing routine drilling rather than expanding the eight-hour budget. A timed attempt followed by diagnosis of its most consequential errors is more informative than repeatedly maximising a familiar mock score.

Measure external timed accuracy, speed per correct solution, the ability to explain the relationship, and honest interval scores. Check disputed answers with enumeration, exact calculation or simulation rather than automatically trusting either the app or a tutor response.

Assessment deadline: **6 December 2026, 23:59 CET = 22:59 UK time**. The invitation requires the actual proctored assessments to be completed without unauthorised assistance.

## Remaining limits and verdict

The improvements make the app a stronger question engine for transferable reasoning. That judgment is supported by the new structural contrasts, isolated mixed attempts and independent correctness checks; it is not a measured improvement in actual Optiver scores.

- Exact real-test difficulty distributions, item counts, pass marks and many navigation/scoring details remain unverified.
- The BTO 25-minute total comes from the invitation. Its retained 20-question count and 90-second item limit remain practice assumptions. The new transfer clocks are training choices.
- The preserved ordinary preset still differs from the supplied invitation: Orderbooks is configured for 8 minutes rather than 15; Likelihood List and Intervals use retained per-item clocks without the invitation's explicit 25- and 15-minute total clocks. These are practice settings, not verified replicas. See the test report's timing table. This focused visual patch leaves those clocks intact as requested.
- Existing difficulty labels, uncertainty models and many game parameters are authored choices.
- Templates remain finite. Structural fingerprints cannot certify conceptual novelty.
- The original library's independent numerical coverage remains incomplete.
- Zap-N timing/feedback and Balloon's hazard model remain approximations.
- No controlled learning study, candidate outcome validation or new real-test calibration was performed.

The practical objective is better method selection and adaptation under time pressure. Independent unfamiliar problems remain the strongest way to judge whether that training is transferring.

## Documentation and attribution

- [TRANSFER_CHANGELOG.md](TRANSFER_CHANGELOG.md): every substantive modification and storage behaviour.
- [TRANSFER_TEST_REPORT.md](TRANSFER_TEST_REPORT.md): deeper testing, reproduced defects and fixes.
- [docs/DIVERSITY_AUDIT.md](docs/DIVERSITY_AUDIT.md): source findings, taxonomy and rationale.
- [evaluation/](evaluation/): raw measurements, inventory and validation evidence.
- [KICKSTARTER_FIXES.md](KICKSTARTER_FIXES.md): previous fixes.
- [docs/README_KICKSTARTER_1.md](docs/README_KICKSTARTER_1.md): previous README.
- `BUILD_INFO.json`, `SOURCE_REVISION.txt` and packaged patches: release provenance and changes from the restored base.

OptPrep was created by Coflazo / Cagan Oflazoglu. This is a modified copy. The original [MIT LICENSE](LICENSE), copyright and attribution are retained. Neither the original project nor this edition is affiliated with or endorsed by Optiver. The original developer's public repository and hosted site were not modified.
