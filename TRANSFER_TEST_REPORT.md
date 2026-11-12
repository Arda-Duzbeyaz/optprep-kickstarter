# OptPrep Transfer Challenge — follow-up test report

Date: 12 November 2026. Tested starting release: `1.0.3-transfer.1`. Current corrected release: **`1.0.3-transfer.3`**; includes the reliability patch and subsequent visual pass.

## Result

The deeper tests found real review, navigation, deadline and progress-retention defects that the original smoke check did not cover. Those defects were reproduced, corrected and checked with regressions. The complete updated unit/regression suites pass: **777 JavaScript, 36 Python and 34 C++ tests — 847 total**.

Desktop Chrome visual testing subsequently succeeded at a **1348 × 936** page viewport. It covered a timed partial attempt, a full 15-question untimed attempt, review, themes, settings and persistence. Mobile and other browsers remain untested.

## Defects reproduced and fixed

| Area | Reproduced behaviour in the first transfer release | Corrected behaviour |
|---|---|---|
| MCQ review | Options were unselected and still editable after grading | Submitted choice is restored, correct/wrong options are marked and controls are locked |
| Ranking review | Submitted order was not restored and probabilities remained hidden | Submitted order and probabilities are displayed with locked controls |
| Interval and orderbook review | Entered bounds and submitted trades were missing from the review controls | Bounds/trades are restored and the reviewed controls cannot be edited |
| Additional-family links | “Try a twin” linked to an ordinary family that did not exist | Unsupported ordinary-practice actions are omitted; valid existing-family actions remain |
| Delayed timer frames | A late click/keyboard change could be accepted before the next timer frame; a late skip could avoid a prior wrong answer | Submission, skip and keyboard handling check both deadlines; grading uses the last response actually entered within time |
| Overall expiry | With timer frames delayed, submission could display another question despite the total clock reaching zero | Overall expiry ends the session before another item is shown or marked seen |
| Backend startup | Transfer-only work or exposure-only history could be considered empty and replaced by an older server snapshot | Transfer sessions and viewed-question/structure history prevent automatic replacement; a genuinely empty browser can still restore server progress |
| Current sidebar link | Clicking Transfer while already on its review route did not return to the landing page | The current link reopens the landing page and cleans up the previous session |
| Final Finish button | Completing the last displayed item with Finish was labelled partial | A run that reaches and records its last question is marked complete |
| Default battery picker | With no saved preset, the app ran Kickstarter but Settings selected Everything; pressing Save would switch batteries | The picker uses the same configured default as the active battery; unchanged Save preserves Kickstarter |

These rows describe related manifestations rather than a count of independent root causes. The battery-picker problem was an existing UI defect discovered during visual testing. No incorrect newly generated mathematical answer was found in this pass.

## Interface and integration coverage

The actual views, event handlers, app entry point and router were executed under a DOM implementation. The focused checks cover:

- Review restoration and locking for MCQ, ranking, interval and orderbook responses.
- Correct/incorrect MCQ highlighting and visible ranking probabilities.
- Unsupported solution-link removal.
- Deliberately delayed animation frames, late selection, late skip and late keyboard input.
- Overall deadline enforcement before showing an additional item.
- Correct completion status on the final question.

The original ten focused interface cases failed against the corresponding earlier behaviours and pass after correction. A new preset regression reproduced the visual finding: **10/11 before its fix, 11/11 after**. These cases are counted separately from the 847 unit/regression tests.

The full-app route check additionally:

1. Loads the actual `index.html` and `app.js` entry point, using an older save without the new transfer fields.
2. Selects untimed practice through the page dropdown and confirms that elapsed simulated time does not expire it.
3. Answers all 15 mixed questions through their actual controls, including keyboard MCQ selection, ranking moves, interval input and orderbook trades.
4. Confirms no solutions appear during the attempt, and verifies 12/12 non-interval answers plus the expected interval scores.
5. Confirms ordinary stats, mastery, spaced review and exam runs are unchanged.
6. Returns using the current Transfer sidebar link and checks saved session history.
7. Recreates the store from browser storage and verifies backup content.
8. Starts another session, navigates away, then checks that abandoned handlers/timers cannot affect the next page or silently complete the run.
9. Confirms the Kickstarter mock still has five mathematical sections and excludes 80-in-8.

The earlier transfer smoke test and previous Kickstarter-fix smoke test also pass. Storage tests cover transfer-only local progress, displayed-only history, valid restore into an empty browser and protection of unknown future-version saves.

## Mathematical and preservation checks

- Full JavaScript suite: **777 passed**, no failures or skips.
- Python suite with the engine available: **36 passed**, no failures or skips.
- C++ suite: **34 passed**.
- Repeated the deterministic diversity/generator evaluation: **13,000** independently checked added-generator cases, zero disagreements.
- Independently verified the separate **1,300-case** additional-training export in Python: full numerical coverage of that export, zero failures.
- Compared **990 ordinary mock item objects** with the saved fixed base: unchanged.
- Compared **176 protected files** with that base, including the ordinary generators, Zap-N engines, scoring, clocks/presets and licence: byte-identical.
- Ten sampled transfer sessions still contain 150 questions with zero exact repeats; the signature diagnostic remains 123 newly recorded and 27 familiar structures.

The existing mathematical generators, scoring implementation, assessment configurations and licence remain intact. The additional fix in the shared solution component is optional and retains its ordinary-practice default.

## Desktop browser pass

Earlier browser attempts were blocked. On the requested retry, running the local app beside the provided browser resolved the connection, and real browser interaction and screenshot inspection became available. No browser security warning was bypassed.

The full mixed run used `transfer.2`; `transfer.3` then corrected the picker default without changing Transfer's question/session code. The fixed code was reloaded in the browser, and unchanged Save plus retained session history were verified. All automated suites were rerun on `transfer.3`.

| Area | Observed result |
|---|---|
| Landing and clocks | Training label, timing selector, 20-minute total and 90-second item clock rendered clearly |
| Real-time expiry | Selected 0.429 for the replacement/first-red question; the 90-second clock automatically advanced and retained the correct answer |
| Timed orderbook | Five trades left A/B/C flat and cash +1; Finish produced a partial session with 2/2 correct |
| Complete untimed run | All 15 questions reached review; included three questions from each mathematical section |
| Keyboard | MCQ letter selection and ranking number/arrow movement worked |
| Diagrams | A 200-value grid, mixed-shape grid, scatter plot and solution graphics rendered; a long grid required ordinary vertical scrolling |
| Orderbook editing | Buying, selling, removing a trade and clearing the position worked |
| MCQ review | Submitted wrong choice was red, correct choice green, and all options disabled |
| Ranking review | Submitted order retained; exact probabilities 4/9, 5/12 and 1/4 revealed; move controls disabled |
| Interval review | Submitted bounds 79 and 81 retained and disabled; truth 80 and score 0.975 displayed |
| Navigation/persistence | Current Transfer link returned to the landing page; both session records survived reload |
| Isolation | Deliberate Transfer mistakes did not appear in the ordinary wrong-answer log |
| Theme | Light question/review screens and the dark landing/history screen were readable; original theme restored afterwards |
| Preset correction | After the code fix and reload, Kickstarter was selected; clicking unchanged Save retained it and both Transfer records |

The complete run intentionally included an incorrect orderbook, an incorrect probability choice and a skipped question to exercise feedback. Its **9/12 non-interval correct** and interval mean **0.806** were the expected UI-test outcome, not evidence of learning effectiveness or real-test calibration. All nine other non-interval answers were correct; interval inputs were [45, 55], [25, 40] and [79, 81].

No layout overlap or horizontal clipping was found in the inspected desktop views. Width measurements on the landing and long-grid pages showed no document-level horizontal overflow. This was one Chrome viewport: no phone/touch, Safari, Firefox, alternative display scaling or accessibility certification is claimed. The real 20-minute total timeout was not waited out; total-deadline edge cases remain covered by the deterministic DOM regressions.

Browser-control timeouts occurred around a confirmation dialog and a full-page screenshot. The dialog was handled through its visible confirmation, and viewport screenshots were used for the successful checks. Those control failures are separate from the observed application results.

## Preserved timing discrepancies

The visual pass also confirmed that preserving a preset is different from validating it against the invitation. The supplied invitation is the evidence for the total times below; counts and per-item limits in the app remain authored/reported practice settings.

| Section | Supplied invitation | Preserved app setting |
|---|---|---|
| Beat the Odds | 25 minutes total, limited time per question | 25 minutes total; 20 questions, 90 seconds each |
| NumberLogic | 25 minutes total | 25 minutes total; 26 questions |
| Likelihood-list | About 25 minutes total, limited time per question | 15 questions at 90 seconds each; no separate 25-minute total cap |
| Intervals | About 15 minutes total | 18 questions at 45 seconds each; no separate 15-minute total cap |
| Orderbooks | About 15 minutes total | 20 questions with an 8-minute total cap |

The new visual patch changes the incorrect picker default, not these clocks. The earlier instruction explicitly requested preservation of the Kickstarter preset and its configured clocks. Ordinary mocks must therefore still be treated as practice formats, with the invitation controlling the actual assessment schedule. This is a confirmed configuration limitation, not an unknown about what the invitation says.

## Reproduce

From the application folder:

```sh
npm test
npm install --no-save jsdom
node tools/ui-smoke.mjs
node tools/transfer-smoke.mjs
node tools/transfer-regression.mjs
node tools/transfer-route-smoke.mjs
```

Optional engine/backend checks, with their development tools installed:

```sh
cmake -S engine -B engine/build
cmake --build engine/build
ctest --test-dir engine/build --output-on-failure
cd backend
uv run pytest -q
```

The complete source, new checks and test logs are included in the updated ZIP. The log index distinguishes current passing results from intentionally retained failures against the earlier build. Existing saves remain compatible; keep a Settings backup when moving to a different browser origin or folder/port configuration.
