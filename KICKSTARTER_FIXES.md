# Kickstarter fixes edition

Version: 1.0.2-kickstarter.1  
Prepared: 12 November 2026  
Upstream: [Coflazo/optprep](https://github.com/Coflazo/optprep)  
Base commit: a68720e74e7e1b5a82526b02db539d943f0f1364  
License: MIT; upstream attribution and license retained.

This is a modified preparation copy. It repairs reproducible code and learning defects found in the audit. It does not establish equivalence with Optiver's unpublished question difficulty or scoring.

## Run it

Extract the ZIP. Open a terminal in the extracted project folder and run:

```sh
npm start
```

Node.js 20 or newer is required. The app has no runtime npm dependencies, so no installation step is needed. The launcher normally opens http://127.0.0.1:8765. Alternatively, run `python serve.py` with Python 3.10 or newer.

Choose **Career Kickstarter: Trading**. This copy defaults to that preset when no valid preset is supplied. Saved preset selections remain under your control.

To move progress from the original site, export a backup under its Settings and import it under this copy's Settings. They use different browser origins, so progress does not transfer automatically.

## Changes

### Both Beat the Odds clocks apply

The Kickstarter preset now applies a **25-minute overall limit**, following the 2027 invitation, alongside the existing **90-second practice item limit**. Both clocks are visible. Expiring an item advances to the next question; expiring the total ends the section, even when the item still has time remaining.

The count of 20 questions and 90-second item limit remain reported practice assumptions. They were not inferred from the invitation. Other presets keep their own configuration.

Format summaries show both clocks. Old 30-minute or unstamped runs cannot count as evidence under the new 25-minute cap.

### Mocks follow the selected battery

The full mock previously used every section in the global section list. It now follows the active preset. A Kickstarter mock contains BTO, NumberLogic, Likelihood List, Intervals and Orderbooks, with Zap-N still available separately. The standalone 80-in-8 remains available through other presets.

### Hard Markov questions no longer reveal a fixed answer

Difficulty-5 questions now mix general stationary-distribution problems with the incoming-arrow counterexample. Statement order is shuffled. Neither reversing the displayed order nor automatically inverting the incoming-arrow counts solves every hard problem.

The verifier independently recalculates stationary probabilities without requiring a fixed answer order. The fixed curated example remains available as an example and is subject to repeat tracking.

### Fund-return explanations use the observed data

Generated explanations no longer assert that a steady fund must be positive more often or that volatility universally wins extreme-return comparisons. The associated lesson and family catalog were updated too.

The audited counterexample still correctly calculates 75% positive years for one fund and 87.5% for the other, and now explains that ranking from the observations.

### Intervals separates coverage, score and mastery

Containing the true value still earns the configured lower/upper score. For learning progress, an interval must also score **at least 0.70**. This is an authored practice goal, not an Optiver cutoff.

Low-scoring wide intervals no longer advance mastery, count as adaptive success or postpone spaced review as successful answers. Progress → Pace shows coverage and mean score separately.

The original exploit—15 fresh answers using [1, 1000]—still earns 0.001 per answer, but earns no mastery progress. Covering the truth remains visible as coverage rather than being mistaken for a useful score.

Existing answers, exams, lesson progress and XP are preserved. Previously imported Intervals skill levels are reassessed because their old rule did not require a useful score.

### Recent questions are tracked across sessions

Visible question content is fingerprinted without solution data. Ranking statement order is ignored so merely shuffling an old question does not make it fresh. History stores up to 8,000 recent fingerprints per section and is included in backups.

Fresh exam and adaptive selection avoid that history. Only questions actually displayed enter the history. If a finite template cannot produce an unseen item within bounded retries, the question is labelled as review practice. A repeated-question exam keeps its score but does not count toward the fresh-exam practice target.

Tracking starts when using this edition; past exposure cannot be reliably reconstructed from old summary-only saves. Fingerprints use two compact hashes, so deduplication is a practical safeguard rather than a proof of conceptual novelty.

In ten separately seeded mocks per section, this edition produced:

| Section | Items | Exact repeats after first occurrence |
|---|---:|---:|
| Beat the Odds | 200 | 0 |
| NumberLogic | 260 | 0 |
| Likelihood List | 150 | 0 |

This checks exact visible repetition in a sample. New parameter values within familiar templates still require genuinely unfamiliar practice elsewhere to assess transfer.

### Verification coverage is explicit

The second-language pipeline now distinguishes structural checks, independent numerical checks, skipped sequence queries, unsupported-rule warnings and failures. An empty library cannot report success. A successful run explicitly reports whether numerical coverage is complete.

New independent Python calculations cover supported fund-return, score-table, conjunction and Markov ranking scenarios, including curated statement reordering. These calculations read the table, bar or graph data rather than trusting supplied probabilities.

The re-run exported library produced:

| Section | Structural checks | Independent numerical checks in the Python/C++ pipeline |
|---|---:|---:|
| Beat the Odds | 500 | 184 |
| Intervals | 504 | 165 |
| Likelihood List | 510 | 94 |
| 80-in-8 | 560 | 0 |
| NumberLogic | 520 | 495 |
| Orderbooks | 500 | 500 |

There were zero failed checks. NumberLogic retains 11 explicit unsupported-rule warnings and 14 skipped missing-term queries. All sections also have JavaScript tests. The zero for 80-in-8 describes this second-language pipeline, not an absence of arithmetic checks in JavaScript.

The report correctly states **complete_numerical_coverage: false**. It does not claim that every exported answer has been independently rederived outside JavaScript.

### Progress claims describe practice performance

The UI uses “Practice target met” and excludes stale-clock, repeated-question and older runs without freshness evidence from the current fresh-exam target. It no longer tells the learner that a real assessment is “safe to open” based on this trainer's target.

## Validation

| Check | Result |
|---|---:|
| JavaScript suite | 747 passed |
| Python suite, with C++ engine available | 27 passed, none skipped |
| Unchanged C++ engine suite | 34 passed |
| Total unit/regression tests | 808 passed |
| DOM integration smoke checks | Passed |
| Exported library pipeline | 3,094 structural checks; zero failures; explicit coverage gaps and 11 warnings |
| Patch whitespace validation | Passed |

DOM integration executes the actual views and event handlers. It verifies item expiry with an overall clock active, total expiry while an item still has time, Kickstarter mock contents, Intervals coverage versus mastery, and repeated-exam exclusion. Full browser visual testing was unavailable in the execution environment; this is not a claim of pixel-level browser QA.

Run JavaScript tests:

```sh
npm test
```

Build the optional engine and run its tests:

```sh
cmake -S engine -B engine/build
cmake --build engine/build
ctest --test-dir engine/build --output-on-failure
```

Run the optional Python tests and library verification, with the backend's development environment installed:

```sh
cd backend
uv run pytest -q
uv run python -m oa_backend.pipeline
```

For the optional DOM smoke check, install jsdom as a temporary development dependency and run `node tools/ui-smoke.mjs`. It is not required to use the application or run the main JavaScript suite.

## Remaining limits

- Real Optiver question difficulty, pass thresholds, exact item counts and several scoring rules remain unvalidated. The 25-minute BTO cap is supported by the invitation; the other detailed format settings are practice assumptions.
- Zap-N reaction windows, feedback choices and the Balloon hazard model remain explicitly described approximations. Changing them arbitrarily would not establish higher fidelity.
- Independent numerical coverage is partial. Its remaining gaps are now reported accurately.
- Recent-question tracking reduces exact repeats; it cannot turn a finite template library into an independently calibrated assessment.

For preparation, use these fixes to support unaided timed attempts, then review the reasoning with ChatGPT. Judge transfer using unfamiliar problems and the actual assessment instructions.
