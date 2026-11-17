# Separate topic learning and mixed-practice saves

**1.7.1-kickstarter.1 · 17 November 2026**

## What was wrong

The old application saved only one unfinished practice block per assessment. Starting a different topic or mixed practice collided with that slot. A replacement/resume prompt could therefore take you back to an unrelated mixed block, including its pace display, when you intended to learn a particular topic.

This was a session-storage and routing defect. It did not mean that you had selected the wrong learning method.

## Corrected behaviour

Each assessment now has independent saves for:

- Every named topic's learning block.
- Mixed practice with all skills.
- Mixed practice with covered skills.

You can pause topic A, work on topic B, do mixed practice, and return to any of them. Opening a topic automatically restores that topic's own unfinished block. Another saved block never forces a replacement prompt.

Each block retains its exact current question, selected/typed draft, submitted answers, feedback, hints, elapsed active time, fixed learning difficulty and random-generator position. Completing or ending one block clears only that block. Save & exit retains it.

Learning stays in the existing ten-question format without the mixed checkpoint stopwatch. Mixed practice keeps its own training pace display. A paused/resumed unanswered mixed attempt remains ineligible for cold checkpoint credit under the existing rules; pausing does not manufacture an uninterrupted timed success.

## Clearer controls

- Topic rows with an unfinished block say **Resume learning** and show their own answered count.
- Saved learning cards identify their topics.
- The main **Resume mixed practice** action refers only to the selected mixed question pool.
- Today identifies saved learning and mixed practice separately.
- The learning description explains that every topic saves its own block.
- An unreadable save can still be replaced explicitly, but that recovery affects only its own slot.

## Existing progress and backups

The `optprep:v2` storage key and snapshot version remain supported. Old saves with a single `activePractice[assessment]` snapshot are read in their actual topic/mixed context. When that block is next saved, it moves into its new scoped slot. Starting another topic does not erase the legacy block. Export/import round trips preserve all the independent saves.

Statistics, XP, completed learning, recognition/checkpoints, habits, lessons, historical scores, question history and settings are retained. No reset is required. Existing unsupported data is not silently presented as a valid unrelated session.

The new keys inside `activePractice` identify assessment and context, for example `bto:learn:two-dice-sum`, `bto:mixed:all` and `bto:mixed:covered`. This is an additive layout inside the existing save object. Do not downgrade to an older app expecting one slot per assessment if you want it to display these new saved sessions.

Before upgrading, export Settings → Backup. Replace files at the same browser address and reload the update. Moving address, browser or device requires importing your backup.

A prior version could already have replaced older unfinished sessions. This update preserves the existing save that remains; it cannot recover questions no longer present in your data.

## Additional correctness fixes required by concurrent saves

- Answer deduplication looks up the correct scoped block, so returning to feedback cannot award XP or record an answer twice after another topic was used.- Finish checks the block identity before deleting a save, so a stale finish cannot delete a newer same-topic block.
- New block seeds include the topic/pool and a per-page counter, avoiding same-millisecond collisions across contexts.
- Summary XP is calculated from that block's answer records. XP earned in other sessions while a block was paused is not attributed to the resumed block.
- Existing numeric legacy seeds remain finishable.

## Implementation files

| Area | Changes |
|---|---|
| `src/core/practice.js` | Scoped slot identity, context matching and optional recorded answer-XP validation |
| `src/core/store.js` | Independent save/read/finish/clear operations; legacy fallback; scoped answer deduplication |
| `src/ui/runner.js` | Resume only the selected topic/pool; context-only recovery; collision-resistant seeds and block-only XP summary |
| `src/ui/practice-actions.js` | Mixed action looks up its selected mixed pool |
| `src/ui/practice-progress.js` | Separate named learning/mixed resume labels |
| `src/ui/pages/section.js` | Per-topic resume state and saved answered counts |
| New core tests and `tools/separate-sessions-flow.mjs` | Concurrent saves, migration, drafts, feedback, clocks, completion and progress checks |
| Four existing DOM scripts | Updated their old one-slot assumptions and labels; existing learning/cold/clock assertions retained |
| Package, service worker, README and release metadata | Version/update identity and documentation |

Generators, lessons, game engines, assessment configuration and clocks were not changed. Their earlier mathematical audit reports remain in the archive.

## Verification

- **1,190 JavaScript tests passed**, including six new scoped-save regressions.
- **40 optional backend tests passed**, using the existing compiled engine after checking its source matches this archive. No backend or C++ source changed.
- **13 existing DOM integration scripts passed**, including the complete 111-skill / 1,120-question learning walkthrough and its 728 assertions.
- **171 new real-router assertions passed** across Beat the Odds, NumberLogic, Likelihood List, Intervals and Orderbooks. They check multiple saved topics, both mixed pools, exact drafts/feedback, no mixed stopwatch in learning, isolated finish, no duplicate answer credit and correct block-only XP.
- Store regressions hold **24 simultaneous sessions across six sections**, then reload and export/import them. Legacy focused/all-mixed/covered-mixed contexts, stale finish, numeric seeds and unreadable/miskeyed saves are covered.
- Chrome visual checks: two saved NumberLogic topics coexist with mixed practice; original learning draft and its absent stopwatch survive switching and reload; mixed restores its own different draft and pace display.
- A 390px responsive iframe had client/scroll widths **375/375**, with readable independent controls. Physical phones and other browsers were not visually tested.

The first new router-test attempt exposed an asynchronous test-navigation race, not an application save failure. The test now waits for the actual new page and selected context before reading its controls; all final assertions pass. The previous conflict-dialog regression was changed to assert the newly requested independent-block behaviour. No generator checks, timing rules or cold-evidence requirements were weakened.

Evidence: `evaluation/separate-sessions-validation.json`, `separate-sessions-router.json`, `separate-sessions-flows.json`, `separate-sessions-preservation.json` and `separate-sessions-browser.json`.

## Run and test

Normal app: Node.js 20+, then `npm start` in the extracted folder containing `package.json`. No dependency install/build is needed for ordinary practice. The full source remains suitable for your own GitHub Pages repository; upload the extracted application contents, not the ZIP itself.

Developer checks:

```sh
npm test
# jsdom needed for these developer checks only:
node tools/curriculum-dom-regression.mjs evaluation/separate-sessions-flows.json
node tools/separate-sessions-flow.mjs
# Python 3.12+, pytest; optional compiled engine via OA_ENGINE:
cd backend
python -m pytest -q
```

No public repository or live GitHub Pages deployment was changed by preparing this ZIP.
