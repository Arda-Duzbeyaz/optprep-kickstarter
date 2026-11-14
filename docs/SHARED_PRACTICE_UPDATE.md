# Shared practice and clearer daily actions

Release `1.2.0-kickstarter.1`, 13 November 2026. Based on the completed 1.1.0 release. The user correctly identified that the ten-question mixed practice action was buried and that a second ten-question mode appeared to contain better maths which should also be available during normal learning.

## Confirmed distinction before this update

Ordinary mixed practice used the original section families, adapted difficulty to cold checkpoints, and gave immediate feedback. Transfer Challenge mostly reused those families but added four families, preferred recorded branches and shuffled MCQ options. It selected across training difficulties and delayed feedback until the end. It did not establish genuinely unfamiliar concepts or an independently validated difficulty standard.

## Changes

- Introduced a shared practice registry and metadata catalog: 34 BTO, 30 NumberLogic, 16 Likelihood-list, 15 Intervals and 8 Orderbooks families. The eight mental-maths families remain available in other presets. Original exam registries are not mutated.
- Made all four existing additional families available in ordinary learning, the skill map, progress, revision, worked examples and mixed practice. They use their actual supported difficulties and the existing cold-checkpoint rules.
- Added bounded preference for less recently recorded branches **within the chosen family**, preserving weakness weighting, breadth and target difficulty. Exact freshness takes priority over branch unfamiliarity. Signatures remain proxies, not claims of conceptual novelty.
- Shared MCQ presentation logic between ordinary practice and batch checks. Option positions are shuffled and correct answers remapped; mathematical values and visible question fingerprints are unchanged.
- Replaced the small all-skills text link with a prominent **Mixed practice** card, visible **All skills / Covered skills** selector and **Start mixed practice · 10 questions** button on section pages and Today. Scope preferences persist per assessment. An existing mixed block is offered directly through the same button, with its answered count.
- Added clear **Learn or repair** and **Timed section** cards. Supporting checks, sets and lessons remain under an optional-tools disclosure. Focused saved blocks have compact resume controls; a mixed block does not need a duplicate resume card on its assessment page.
- Renamed the user-facing Transfer Challenge to **Batch check** and explained its purpose: the same question families, broader training difficulty selection, feedback at the end, separate results. Timed enforces training clocks; untimed removes them. Old routes, stored results and implementation APIs remain compatible.
- Added explicit next-step guidance to practice summaries and a return-to-mixed action after a section batch check.

## Files

`src/practice/index.js` and `catalog.js` define the shared library without changing original registries. `src/core/presentation.js` centralises option shuffling. `src/core/draw.js` adds optional bounded branch preference; calls without new options retain previous draw behaviour. `src/transfer/draw.js` re-exports the shared presentation function without changing its default output.

`src/ui/practice-actions.js` centralises the visible pool selector and start/resume action. Section, Today, progress, learn, runner and practice-progress views use the appropriate shared library or controls. `src/ui/pages/transfer.js` explains the optional check and supplies working repair links for additional families. `app.js`, styles, README and service-worker fallback identifier reflect the new interface. The original exam runner continues using `SECTION_MODULES` and its invitation-aligned clocks.

New core tests cover library membership, duplicate IDs, metadata, all additional-family difficulties, independent existing verifiers, exact freshness taking priority, branch preference, answer remapping and stable question identity. The new shared-practice DOM flow covers the five section actions, persisted pool choice, all four additional families, saved feedback without duplicate stats/XP/SRS, and cold BTO progression through formerly exclusive families. Existing UI regressions retain their edge cases; labels and the now-valid additional-family repair link are updated intentionally.

## Preservation and limits

The save schema and previous progress rules are unchanged. New family entries start unverified; earlier counters are not reset. Existing saved questions/drafts/feedback and frozen skill pools are retained. New blocks can use the expanded library. No mathematical formulas, original assessment categories, original question banks, fixed libraries, scoring rules, preset clocks or Zap-N mechanics are changed.

Verification results are in [shared-practice-results.json](../evaluation/shared-practice-results.json). Original mock preservation remains 50 papers / 990 identical question objects, and the previous broader batch sampler remains reproducible. Passing tests establish implementation behaviour, not real Optiver difficulty calibration or exceptional candidate performance. Independent unfamiliar problems and timed full-section checks remain part of the preparation plan.

No upstream repository was modified. This packaged release has not been deployed to the user's Pages site.
