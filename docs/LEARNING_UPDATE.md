# Learning, mixed checks and deadline update

Version `1.1.0-kickstarter.1`, prepared 13 November 2026 from `1.0.4-practice.1` (`25021dc4f828f22d80147dafaba6118e27af6421`). The current [README](../README.md) is the user guide; earlier release reports are historical evidence.

## Investigation

Reviewed the existing practice lifecycle, stored mastery/mixed counters, adaptive draws, family catalog levels, roadmap, lesson routes, section clocks, Transfer selection, backup migration and the supplied Quant Sprint source. Compared the user's desired assisted-learning/cold-testing workflow with the implementation, using the supplied invitation for known durations and deadline.

Confirmed that old Levels 1–4 counted repetitions rather than mathematical difficulty; the next generated difficulty was not the same thing as the progress counter. Focused practice could build these counters, making the progress display unsuitable as the user's desired unaided recognition measure. Transfer always mixed assessment categories, even though the user's real assessments are separate. Today had no preparation deadline.

The existing mathematical breadth was already audited and expanded in previous releases. This update preserves those generators. It changes how learning, question selection and independent practice are organised; it does not claim new mathematical concepts merely because it introduces new counters or scopes.

## Substantive file changes

| Files | Change |
|---|---|
| `src/core/recognition.js` | Pure supported-level progression, three distinct cold successes, deduplication, per-skill reset/recheck, proof history and coverage fallback |
| `src/core/preparation.js` | Invitation deadline in UTC, UK/Central Europe labels, weekly budget, remaining hours and preparation phases |
| `src/core/store.js` | Separate coverage/recognition maps; assisted learning no longer updates old mastery; mixed eligibility; manual coverage; emptiness and full-state persistence |
| `src/core/migrate.js` | Safe defaults and validation for new fields without changing schema version or fabricating evidence |
| `src/core/practice.js` | Covered/all saved scope, frozen family pool, outside-help marker, pool consistency and resume link |
| `src/core/draw.js` | Optional skill pool, breadth round and supported target difficulty; old behaviour retained when new options are absent |
| `src/core/path.js` | Coverage/checkpoint-aware roadmap; optional foundation lessons no longer displace the main learning route; legacy pure-call behaviour retained |
| `config/presets.js` | Only authorised Kickstarter overall-clock alignment and removal of the unconfirmed Intervals item limit; source/assumption note revised |
| `src/ui/runner.js` | Learning versus mixed labels, saved scope/help, hidden pre-answer difficulty, actual target progression, training pace, feedback/checkpoints, coverage controls and mixed drill interruption guards |
| `src/ui/practice-progress.js` | Coverage and supported-difficulty displays, per-skill counter explanation, previous-record disclosure and scoped resume labels |
| `src/ui/pages/section-map.js`, `section.js` | New progress model, Learn/Mixed/Timed actions, matching challenge link, assumptions disclosure and optional foundations; no automatic scroll past the primary actions |
| `src/ui/pages/path.js` | Compact deadline card, saved-block priority, daily assessment focus, optional daily routine and supporting tools |
| `src/ui/pages/progress.js` | Coverage, verified difficulties, complete skills and recheck counts; old weak-pattern/mistake/pace views retained |
| `src/ui/pages/settings.js` | Deadline/budget controls; habit goal kept separate; optional 60-minute habit; accurate keyboard and standard-time descriptions |
| `src/transfer/draw.js` | Validated section subset and ten-question section challenge; original default broader draws preserved |
| `src/ui/pages/transfer.js` | Section selector/default, separate training clocks, saved scope/timing, readable single-type/empty result lines and old history support |
| `app.js` | Covered/all mixed routes and scoped challenge routes |
| `src/study/diagrams/tree.js` | Clone input before layout; prevent renderer-only BigInt fractions entering resumable question snapshots |
| `src/ui/styles.css` | Readable mobile skill rows, full-width primary actions, compact planning fields and wrapped task summaries |
| `sw.js` | New fallback cache identifier for local/static copies; existing Pages commit-based mechanism preserved |
| `tests/core/recognition.test.js`, `preparation.test.js`, `transfer-scope.test.js` | New progression, contamination, time, migration, covered-pool, single-scope correctness and deterministic selection regressions |
| Existing core tests | Expectations updated only for the intentionally changed mastery policy and invitation clocks; legacy pure progression, snapshot, interval scoring and drill edge cases retained |
| `tools/learning-route-smoke.mjs` | Full shipped-router learning-to-mixed journey, difficulty advancement, help/resume, settings, Transfer isolation and pure tree regression |
| Existing smoke scripts | New UI selectors/labels and policy expectations; original controls, deadline, idempotency and restoration checks preserved |
| `tools/practice-preservation.mjs` | Explicitly allow only authorised clock differences; assert other presets, source, counts, scoring and mock objects remain unchanged |
| `tools/learning-evaluation.mjs` | Reproducible broader-mode comparison and history-aware scoped sampling |
| README, build information and evaluation JSON | Current workflow, actual measurements, assumptions, provenance, limitations and deployment instructions |

## Correctness and preservation

No question formula, answer checker, score formula, ordinary bank, fixed library or Zap-N game was changed. A deterministic comparison retained 133 ordinary generator files byte-for-byte and 990 ordinary mock question objects exactly. The original broader Transfer sampler generated 150 objects identical to the baseline.

New core regressions check duplicate keys, three distinct instances, sparse supported levels, help/hints, wrong/slow/zero/infinite times, invalid budgets, interruptions, other-skill streak continuity, rechecks, manual coverage, migration, malformed imports and frozen pools. New single-section draws are reproducible and pass the existing item contract and family verifiers. Full existing JS, independent/backend Python and native C++ suites also pass.

An actual integration failure exposed the probability-tree mutation bug. Raw generated items were JSON-safe, so a generation-only serialization sweep did not reveal it. Rendering inserted exact `Q` products containing BigInts into the original solution tree; a later save on exit then failed. Rendering now works on a copy. A deeply frozen input renders twice without changing its original JSON, and complete practice feedback/resume flows pass.

## Measured differences

| Property | Before | After |
|---|---|---|
| Assisted named-topic answers advance primary levels | Yes | No; coverage is separate |
| Counters advance actual generator difficulty | Not the same progression system | Yes, to the next supported level after three qualifying mixed successes |
| Covered-skills mixed scope | Absent | Present, minimum two families, saved pool |
| Section-specific unfamiliar challenge | Absent | Ten questions from the selected assessment |
| Deadline planning | Absent | Exact invitation deadline, budget and phases |
| Ordinary mock question objects | Baseline | 990/990 identical in sample |
| Broader Transfer question objects | Baseline | 150/150 identical in sample |
| Unit/regression tests | 861 | 888 passing |

The scoped sampling contains 50 sessions / 500 questions with no exact repeats. It does not establish an infinite question pool. Recorded structure repetition remains substantial in NumberLogic and Orderbooks, and branch signatures do not measure conceptual novelty. See the raw [evaluation](../evaluation/learning-evaluation.json) for seeds/policy and answer-position histograms.

## What remains unverified

- Real Optiver question counts, exact item limits, scoring/cutoffs, difficulty distribution and current Zap-N selection.
- Whether every higher generator difficulty is harder for a particular learner.
- Whether a new recorded instance or branch signature requires a new reasoning method.
- Whether a learner truly attempted unaided; help controls and interruption tracking cannot certify integrity.
- Whether three successes are sufficient evidence of durable or transferable mastery. They are a practical training criterion requested by the user.
- Learning gains or real assessment outcomes: no controlled trial was performed.
- Physical mobile behaviour, other browser engines, long-running cross-device sync and deployed service-worker upgrades in the user's live Pages environment.

Quant Sprint's two-schema requirement was not silently replaced with a claim of equivalent rigour. This app verifies fresh instances at supported difficulties; independent unfamiliar questions remain an essential separate check. No public upstream repository was changed, and this release has not been deployed to the user's Pages site.
