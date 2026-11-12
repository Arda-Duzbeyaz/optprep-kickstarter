# Transfer edition changes

## Visual follow-up — 1.0.3-transfer.3

- Completed desktop Chrome interaction and screenshot inspection at 1348 × 936: timed expiry, a complete 15-question untimed session, all four response kinds, review, keyboard/ranking/trade controls, light/dark theme, sidebar navigation and history after reload.
- `src/ui/pages/path.js`: the battery picker now uses `DEFAULT_PRESET` when a save has no preset. Previously it selected Everything while the application was running Kickstarter; unchanged Save could silently switch the battery.
- `tools/transfer-regression.mjs`: added a default-picker/unchanged-Save regression. It failed before the one-line correction and passes afterwards. Focused interface checks are now 11/11.
- Full JavaScript/Python/C++ suites rerun: 777 + 36 + 34 = 847 passed; full-router DOM integration passed again.
- Updated README, test report, release metadata and evidence. Documented retained invitation/preset timing discrepancies explicitly. Assessment clocks, mathematical generators, scoring and save format were not changed.
- `package.json`, `sw.js`: version/cache tag advanced to release 3.

Mobile and other browsers remain untested. Browser observations are functional/visual evidence, not Optiver difficulty calibration.

## Follow-up reliability patch — 1.0.3-transfer.2

- `src/ui/pages/transfer.js`: restore, lock and grade submitted responses in review; show ranking probabilities; enforce both clocks before input/submission; preserve the last in-time response; count finishing on the final question as complete; hide unsupported solution actions.
- `src/ui/solution.js`: optional action rendering, retaining the existing default for ordinary practice.
- `src/core/store.js`, `src/ui/sync.js`: backend adoption uses the full emptiness check, including transfer sessions and displayed-question/structure history.
- `app.js`: clicking the current Transfer sidebar link reopens its landing page and cleans up the current run.
- `tests/ui/sync.test.js`, `tests/transfer/reliability.test.js`: regressions for local transfer/exposure preservation, valid server restore and future-save protection.
- `tools/transfer-regression.mjs`, `tools/transfer-route-smoke.mjs`: additional interface cases and actual-router integration.
- `README.md`, `TRANSFER_TEST_REPORT.md`, `BUILD_INFO.json`, `evaluation/`: updated evidence and provenance. `package.json` and `sw.js`: patch version/cache update.

The mathematical generators, assessment clocks, scoring and Kickstarter preset were unchanged. Full suite: 777 JavaScript + 36 Python + 34 C++ = 847 passed. The focused DOM regressions and full-router check passed separately. Visual browser QA was attempted but blocked; no browser visual pass is claimed.

## Initial transfer edition — 1.0.3-transfer.1

Version `1.0.3-transfer.1`, 12 November 2026. Based on the previously delivered `1.0.2-kickstarter.1` ZIP; all previous fixes remain. See [KICKSTARTER_FIXES.md](KICKSTARTER_FIXES.md).

| Area/files | Substantive modification |
|---|---|
| `src/transfer/families/information-protocols.js` | Explicit reporting mechanisms and replacement; independent labelled-outcome verifier |
| `src/transfer/families/shared-source.js` | Shared/fresh sources, event counts, posteriors and prediction; independent probability-tree verifier |
| `src/transfer/families/selection-weights.js` | Person/group weighting, conditioning and repeated sampling; independent per-person/pair verifier |
| `src/transfer/families/rates-weights.js` | Eight rate/weight/base relationships; conservation/rate-equation checks |
| `src/transfer/index.js` | Separate additional-training registry; ordinary question registries unchanged |
| `src/transfer/profile.js` | Conservative branch signatures; numbers and wording do not manufacture novelty |
| `src/transfer/draw.js` | Balanced mixed selection, history preferences, training-only MCQ shuffling and separated metrics |
| `src/core/migrate.js`, `src/core/store.js` | Add structural history and isolated transfer sessions with safe defaults and backup compatibility |
| `src/ui/pages/transfer.js` | Timed/untimed page, hidden methods, end review and separate results |
| `app.js`, `src/ui/pages/path.js` | Lazy route, sidebar/Today links and activity recognition |
| `backend/oa_backend/transfer_verify.py`, `rank_verify.py`, `verify.py` | Independent exact Python recomputation and coverage accounting |
| `tests/transfer/generators.test.js`, `session.test.js` | Branch, correctness, mutation, semantic contrast, ordering, history and progress-isolation regressions |
| `backend/tests/test_transfer_verify.py` | Verify real JS exports and reject internally consistent wrong keys |
| `tools/transfer-smoke.mjs` | Actual DOM interactions for all response kinds, clocks, extra time, cleanup and isolation |
| `tools/diversity-audit.mjs`, `tools/export-transfer.mjs` | Reproducible diversity inventory, generator sweep, repeat/ordering diagnostics and baseline comparison |
| `evaluation/`, `backend/data/verification/transfer-report.json` | Generated evidence and reports |
| `package.json`, `sw.js`, `.gitignore` | Version/cache tag; ignore regenerable exports |
| `README.md`, `docs/DIVERSITY_AUDIT.md`, this changelog | Investigation, rationale, correctness, measurements, use and remaining limits |
| `docs/README_KICKSTARTER_1.md` | Retain the previous README |
| `backend/data/verification/report.json` | Regenerated ordinary-library report; coverage remains partial |
| `BUILD_INFO.json`, packaged transfer patch | Updated release provenance and reproducible changes from the restored base |

Storage remains schema version 2. New `recentStructures` and `transferRuns` fields receive empty defaults when absent. Existing settings, scores, runs, lessons, mastery, XP and exact history are retained. Structural history is bounded to 2,000 signatures per section; exact history retains 8,000 per section. The newest 200 transfer sessions are retained.

Transfer results do not update ordinary stats, mastery, SRS, XP or exam readiness and are not sent as an invented assessment section through the normal backend run hook. Normal question display now also remembers branch signatures. The new history starts in this edition.

Verification caught and corrected a missing-prompt edge case in structural fingerprinting. Additional explanation checks preserve parentheses when dividing two fractions and mark rounded numeric displays as approximations.

All earlier fixes, ordinary generators, question banks, assessment scoring, configured clocks, preset definitions, C++ engine, Zap-N engines and study lessons are retained. No public repository or hosted site was modified.
