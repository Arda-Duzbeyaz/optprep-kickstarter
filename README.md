# OptPrep — assessment battery curriculum edition

**1.7.0-kickstarter.1 · 16 November 2026**

Complete application based on [Coflazo/optprep](https://github.com/Coflazo/optprep). The original **MIT licence and attribution are preserved**. This independent preparation tool is not affiliated with or endorsed by Optiver.

This edition builds on the delivered **1.6.0-kickstarter.1** probability curriculum release. It audits and improves **NumberLogic, Likelihood List, Intervals, Orderbooks and Zap-N**, preserving Beat the Odds, existing progress, focused learning and ten-question blocks.

Read the [comprehensive research, curriculum and verification report](docs/ASSESSMENT_BATTERY_AUDIT.md) for every family/game reviewed, evidence quality, mathematical checks, exact changes, measured comparison and limitations. The [Beat the Odds report](docs/BTO_CURRICULUM_AUDIT.md) and [previous README](docs/README_PROBABILITY_CURRICULUM_1.6.0.md) remain available as historical records.

## Run locally

Install **Node.js 20 or later**, extract the ZIP, and open a terminal in the folder containing `package.json` and `index.html`:

```sh
npm start
```

Open the localhost URL printed by the launcher. Normal practice needs **no dependency installation, build, account, Python backend or compiled engine**. Serve over HTTP; do not double-click `index.html`.

The ZIP contains the working application, all relevant source, automated tests, optional backend/engine, research report, evaluation evidence and licence. Installed dependencies, compiled outputs, credentials and personal training data are excluded.

## Upgrade while keeping progress

1. Export **Settings → Backup** before replacing your app files.
2. Replace the files at the **same browser address**. Accept the update notice and reload when offered.
3. Continue in the same browser. If changing address, repository URL, browser or device, import the backup there.

The `optprep:v2` store, migration, saved-question format, learning rules, cold checkpoints, scoring and runner are unchanged. Coverage, XP, habits, scores, pace records, proofs, history, settings and saved drafts are preserved.

Two new skills start unattempted. The skill total rises **109 → 111**, and Histograms has one additional difficulty checkpoint. An increased denominator is new content, not deleted progress. Existing proofs are retained even where a family gained additional variants.

## Use your own GitHub Pages repository

Extract the ZIP first. Put the **contents of the inner application folder** at the repository root, with `index.html`, `package.json`, `src`, `config` and assets beside one another. Preserve `.github` and `.nojekyll`. Do not upload the ZIP as a single file or leave the application inside an unnecessary extra folder.

Commit the full source. The included workflow supports Pages; choose the appropriate Pages source for your repository. This is a static application and needs no backend hosting for ordinary practice. The optional backend source is included for developers, not required for Pages.

This release does **not** publish your site, alter the upstream repository or transfer browser-local progress to another origin automatically.

## What changed and why

| Assessment | Improvement | Benefit |
|---|---|---|
| NumberLogic | Hard interleaved answers now require quadratic/Fibonacci-like strands with enough shown terms; combined rules add square/geometric residuals | Hardness lies in the reasoning needed for the answer, rather than an irrelevant strand or larger numbers |
| Likelihood List | New **Conditional rates and changing group mix** skill; unequal-width density Histograms; clearer scatter and sequential explanations | Practise changing sample spaces, weighted averages, reverse conditioning and area-versus-height distinctions |
| Intervals | New **Uncertainty: bounds, sensitivity and shared errors** skill, with nine structures | Distinguish extrema, monotonicity, dependence and standard deviation |
| Intervals feedback | Width models explicitly labelled illustrative; corrected bound/percentile advice and optional backend partial-coupon verification | Avoid learning invented personal calibration or incorrect model interpretations |
| Orderbooks | Signed weighted baskets such as `2A−B` and `2A+B−C`; accurate “any profitable flat combination” instruction | Combine quantity, trade direction and executable sides; remove an unbounded “most cash” claim |
| Zap-N | Fixed CodeCompare unseen-stimulus input, complete StockMaster opportunities, Balloon expected decision-cost feedback, Figure It Out coaching | More accurate mechanics and feedback; separate decisions from luck |
| Phone feedback | Readable ranking statements after answering | Disabled controls no longer compress text into a narrow column |

The new skills are integrated into the existing learning books, mixed practice and relevant assessment question pools. There are **150 lessons**, **111 ordinary skills** across the five question-based assessments and the existing **nine games**. The optional eight arithmetic families remain separate. No new game or redundant practice mode was added.

## What is confirmed about your assessment

Your invitation is authoritative for these durations:

| Module | Invitation duration | Retained assumptions in the trainer |
|---|---|---|
| Beat the Odds | 25 minutes, limited time per question | 20 items, 90 seconds each, +1/−1 |
| NumberLogic | 25 minutes | 26 sequence questions, free navigation, +1/−1 |
| Likelihood-list | About 25 minutes, limited time per question | 15 three-statement rankings, 90 seconds each, exact-order credit |
| Intervals | About 15 minutes | 18 items, ratio score; overall clock without an invented item deadline |
| Orderbooks | About 15 minutes | 20 static boards, five-second wrong-submit penalty |
| Zap-N | One or more games, each 2–15 minutes | These nine games, parameters and trainer targets |

The **Career Kickstarter preset and clocks are preserved**. Item counts, proprietary score formulas, precise game selection and pass thresholds are not independently confirmed. The configured Likelihood List item limits may bind before the nominal section clock. Follow the instructions in your actual portal.

The official [2027 programme listing](https://www.optiver.com/join-us/jobs/trading/amsterdam/career-kickstarter-trading-2027/?gh_jid=8859789002) confirms the assessment deadline: **6 December 2026, 23:59 CET / 22:59 UK**. Recent candidate accounts and commercial sources were researched, but conflicting format claims were not treated as calibration. The detailed report separates official information, personal invitation evidence, candidate reports and broader mathematical preparation.

## A clear daily workflow

| Activity | What to do | Meaning of its record |
|---|---|---|
| Learn or repair | Ten focused questions; use ChatGPT, hints and solutions | All ten answered without skips records learning coverage; help/accuracy do not prevent coverage |
| Mixed practice within one assessment | Ten fresh questions, independently, without the topic cue | Three qualifying cold, paced successes at a supported difficulty earn its checkpoint |
| Review | Diagnose wrong or slow reasoning; solve cleanly later | Repair and revision, not fresh cold credit for a remembered answer |
| Batch check | Select one assessment; receive feedback at the end | Separate check; cross-assessment mixing is optional |
| Timed section/mock | Follow configured clocks with no outside help | Sustained accuracy and pacing, separate from learning coverage |
| Independent unfamiliar problems | Another source, no topic label, a time budget | Evidence that the method transfers beyond this generator |

Learn a few skills, then start mixing; do not wait until covering the entire catalogue. Use ChatGPT during learning to explain **why a method applies, why an alternative fails and what changes when an assumption changes**. Take cold checks and simulations independently.

Across an eight-hour week, start with **3h BTO, 1h15 NumberLogic, 1h15 Likelihood List, 1h Orderbooks, 45m Intervals, 15m Zap-N and 30m general error review**. Include timed sections and external unfamiliar questions inside those hours. Shift time towards measured weaknesses. Keep Zap-N practice focused on familiarity and accurate controls.

## Verification results

| Check | Result |
|---|---|
| Complete JavaScript / Python / C++ suites | **1,184 / 40 / 34 passed — 1,258 unit tests**, no JS failures or skips |
| Before/after seeded generation | **43,648 draws, 10,912 family-verifier checks**, 174 current family-level rows |
| Separate Python mathematical oracle | **2,176 cases checked** out of a 2,784-case exported corpus; 608 explicitly delegated to existing JS verifiers |
| Optional backend generated corpus | **192 cases passed** |
| Existing DOM integration | **13 scripts passed** |
| Whole learning walkthrough | **111 skills, 1,120 questions, 728 assertions**, zero uncaught app errors |
| New battery DOM checks | **79 assertions**; all nine game views start/clean up; three changed games completed through controls |
| Focused/mixed/mock/Batch regression | **5,580 questions, zero exact repeats**, including 150 mock papers |
| Visual QA | Desktop Chrome, actual new skill feedback/resume, production-generated examples and a 390px responsive iframe |

The Python oracle imports no application JS math code. It reconstructs exact sequence terms, supported probability/interval models, table/chart counts and signed cash/exposure. New regression tests independently enumerate endpoints, error signs, labelled records and Balloon action outcomes. The checks distinguish assumptions from consequences.

See [validation](evaluation/battery-validation.json), [before/after comparison](evaluation/battery-comparison.json), [Python oracle](evaluation/battery-python-oracle.json), [backend corpus](evaluation/battery-backend-corpus.json), [existing DOM flows](evaluation/battery-flows.json), [new DOM checks](evaluation/battery-dom-flow.json), [practice regression](evaluation/battery-assessment-regression.json) and [browser observations](evaluation/battery-browser.json). `battery-*` reports describe this release; older reports remain historical.

## What remains unverified

**Mathematical correctness is stronger than external difficulty calibration.** The added models are independently checked, but the actual Optiver bank and score distribution are unavailable. Authored level labels and readiness bars are training goals.

Finite numerical sequences have many conceivable continuations; the application checks its intended models and a bounded rival-rule library. Intervals' suggested error widths remain assumed models rather than measured personal uncertainty. Orderbooks uses static simplified quotes; its reference search is constrained to primitive packages, while any profitable flat package is accepted. Game familiarity is useful, but broad cognitive transfer has not been demonstrated for this app.

New numerical variants are not automatically new concepts. Finite families can eventually exhaust their variants; the session history avoids repeats while fresh items can be found. **Zero repeats in the tested runs is not a lifetime guarantee.** Mastery checkpoints should be reinforced with later unaided performance on unfamiliar external questions.

Use this as your main daily drill platform, combined with conceptual tutoring and held-out practice. That workflow targets mathematical understanding and accurate execution rather than memorising the generator.

## Developer checks

```sh
npm test

# Requires jsdom in the developer environment; not needed for normal app use.
node tools/curriculum-dom-regression.mjs evaluation/battery-flows.json
node tools/battery-dom-flow.mjs
node tools/focused-assessment-regression.mjs evaluation/battery-assessment-regression.json

# Supply an unchanged 1.6.0 checkout for before/after comparisons.
node tools/battery-evaluation.mjs /path/to/baseline
python tools/battery-oracle.py
python tools/battery-backend-corpus.py
```

For isolated QA dependencies, set `OPTPREP_TEST_JSDOM` to an external jsdom package path. Optional backend tests require Python 3.12+ and pytest (`cd backend`, then `python -m pytest -q`). Optional engine tests need CMake 3.20+, C++20 and GoogleTest; build with `cmake -S engine -B engine/build`, `cmake --build engine/build`, then `ctest --test-dir engine/build --output-on-failure`.

`BUILD_INFO.json` and `SOURCE_REVISION.txt` record release provenance. Previous release reports and source attribution remain included.
