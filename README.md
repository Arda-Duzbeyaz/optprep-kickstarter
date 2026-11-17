# OptPrep — separate learning and mixed-practice saves

**1.7.1-kickstarter.1 · 17 November 2026**

Complete working application based on [Coflazo/optprep](https://github.com/Coflazo/optprep), with the original MIT licence and attribution preserved. This release fixes session saving in the supplied **1.7.0-kickstarter.1** app. The earlier probability and remaining-assessment curriculum improvements are included.

## What is fixed

**Every topic saves its own unfinished ten-question learning block. Mixed practice saves independently.** You can learn another topic without replacing your previous topic or mixed session.

| Your action | Result |
|---|---|
| Open a topic with no unfinished block | Start that topic's ten learning questions |
| Open a topic you paused | Resume that topic's exact question and draft/feedback |
| Choose another topic | Start/resume it immediately; other blocks remain saved |
| Start/resume mixed practice | Open the selected mixed pool, with its own pace display and saved progress |
| Switch between all-skills and covered-skills mixed pools | Each pool retains its own unfinished block |
| Save & exit, then reload | Keep each question, draft, answered count and feedback |
| Finish or end one block | Clear only that block; leave the others saved |

Topic buttons now say **Resume learning** when that topic has an unfinished block. The main **Resume mixed practice** button refers only to its selected mixed pool. Learning does not inherit a mixed session's stopwatch. Summary XP excludes answers completed in other blocks while the session was paused.

Read the [change and verification report](docs/SEPARATE_PRACTICE_SAVES.md) for implementation details, compatibility, tests and remaining limits.

## Run locally

Install Node.js 20+, extract the ZIP, and open a terminal in the application folder containing `package.json` and `index.html`:

```sh
npm start
```

Open the printed localhost URL. Normal practice needs no dependency installation, build, account, Python backend or compiled engine. Serve over HTTP rather than double-clicking `index.html`.

The ZIP contains the entire app, source, tests, documentation, previous curriculum reports and MIT licence. Dependencies, compiled outputs and personal training data are excluded.

## Keep your progress

1. Export **Settings → Backup** before upgrading.
2. Replace the application files at the **same browser address**, accept/reload the update, and continue in the same browser.
3. If moving address, browser or device, import your backup there.

Old one-slot saves are recognised in the correct topic/mixed context and moved safely when next saved. Existing statistics, XP, habits, completed learning, cold checkpoints, lessons, settings, scores and question history remain. No progress reset is required. Previously overwritten sessions cannot be reconstructed if their data was already discarded by an older version.

Learning coverage and cold checks remain distinct: complete all ten learning questions without skips to record coverage; help is allowed. Mixed practice tests independent recognition, and only qualifying fresh, paced, unaided, uninterrupted answers can earn cold checkpoint credit. Pausing mixed practice preserves your place but does not create an uninterrupted attempt.

## GitHub Pages

Extract the ZIP, then commit the contents of the inner application folder to your repository root: `index.html`, `app.js`, `src`, `config`, assets and the other project files. Preserve `.github` and `.nojekyll`. The included Pages workflow serves the static app; no backend hosting is required for ordinary practice.

This deliverable has not been deployed to your live Pages site. Use the same repository URL to retain browser-local progress, or import your backup at a new address.

## Verification for this fix

- **1,190 JavaScript tests passed**, including six new scoped-save regressions.
- **40 Python backend tests passed**, using an existing compiled engine whose source matches this archive. Engine/game/generator/backend source and clocks were unchanged.
- **13 existing DOM integration scripts passed**, including the whole learning walkthrough: 111 skills, 1,120 questions, 728 assertions and zero uncaught app errors.
- **171 new full-router assertions passed** across Beat the Odds, NumberLogic, Likelihood List, Intervals and Orderbooks.
- Store tests preserve **24 simultaneous sessions across six sections** through reload and export/import.
- Chrome verified topic/mixed switching, exact draft restoration after reload and separate resume controls. A 390px responsive iframe had no horizontal overflow. Physical-phone and other-browser visual checks were not performed.

See [validation](evaluation/separate-sessions-validation.json), [new router checks](evaluation/separate-sessions-router.json), [existing flows](evaluation/separate-sessions-flows.json), [preservation checks](evaluation/separate-sessions-preservation.json) and [browser observations](evaluation/separate-sessions-browser.json).

## Previous curriculum work

The [assessment-battery audit](docs/ASSESSMENT_BATTERY_AUDIT.md), [Beat the Odds audit](docs/BTO_CURRICULUM_AUDIT.md) and [1.7.0 README](docs/README_BATTERY_1.7.0.md) remain included. Their test counts and provenance describe those historical releases.

This patch changes saved-session handling and relevant controls, not the question curriculum, clocks, scoring, mastery requirements or assessment calibration. The app's item counts, scoring details and readiness targets remain practice assumptions where not confirmed by your invitation.

## Developer checks

```sh
npm test
# jsdom is required for developer DOM checks only:
node tools/curriculum-dom-regression.mjs evaluation/separate-sessions-flows.json
node tools/separate-sessions-flow.mjs
```

Use `OPTPREP_TEST_JSDOM` for an external jsdom package path. Optional backend tests require Python 3.12+ and pytest: run `python -m pytest -q` from `backend`. `BUILD_INFO.json` and `SOURCE_REVISION.txt` record release provenance.
