# OptPrep — Kickstarter mixed practice

**Version 1.5.0-kickstarter.1 · 16 November 2026**

Complete application based on [Coflazo/optprep](https://github.com/Coflazo/optprep), with its original MIT licence and attribution preserved. This independent preparation tool is not affiliated with or endorsed by Optiver.

This is a focused improvement of the delivered **1.4.0-kickstarter.1**, not a rebuild from upstream. It improves mixed selection across sessions, expands three probability question families, strengthens structural tracking, and separates independent performance from ordinary accuracy. **Existing progress, focused learning and ten-question blocks are preserved.** The previous [1.4 README](docs/README_FOCUSED_LEARNING_1.4.0.md) and earlier modification reports remain historical records of their own releases.

## Start using it

Install **Node.js 20 or later**, extract the ZIP, and open a terminal in the inner folder containing package.json and index.html:

```sh
npm start
```

Open the localhost URL printed by the launcher. Normal practice needs no dependency installation, build, account, Python backend or compiled engine. Serve the application over HTTP; do not double-click index.html.

The ZIP includes the complete application, source, automated tests, optional backend and engine, documentation and licence. It excludes installed dependencies, compiled outputs, credentials and personal progress.

### Upgrade and keep progress

1. Export a backup in **Settings → Backup** before replacing your deployed files.
2. Replace the application files at the **same browser address**. Accept the app's update notice and reload if offered.
3. Your existing local progress remains. If moving to another address, device or browser, import the backup there.

The existing optprep:v2 store and practice snapshot version are retained. Settings, XP, learning coverage, completed blocks, checkpoint passes/proofs, old mastery records, question-exposure history, sets and historical scores are preserved. A saved current question and draft remain as saved. New questions use the improved generators.

New mixed-selection evidence starts with your next mixed answers. Older answers are not retrospectively relabelled as independent or paced. Keep one active training tab: the existing store does not merge simultaneous writes from multiple tabs. Optional gist backup still carries the complete JSON state.

### GitHub Pages

Extract the ZIP and commit the **contents of the inner application folder** at your repository root, including index.html, src/, config/, assets/, .github/, .nojekyll and LICENSE. In **Settings → Pages**, choose **GitHub Actions**, enable Actions and push to **main**, matching .github/workflows/pages.yml. Use the URL GitHub reports after its workflow succeeds.

Uploading the ZIP file itself, or putting the whole application one extra directory below the repository root, does not deploy it. No public repository or live Pages site was changed while producing this update.

## The daily preparation loop

| Activity | What to do | What its progress means |
|---|---|---|
| Learn or repair a skill | Ten focused questions; use hints, worked solutions and ChatGPT as needed | A full block without skips ticks coverage; accuracy/help do not prevent learning completion |
| Mixed practice in one assessment | Ten fresh questions; recognise the method without a topic label | Qualifying independent answers can earn cold checkpoints |
| Review | Explain your mistake, solve it cleanly, then repair that skill if necessary | Understanding and correction, rather than another cold success on a known answer |
| Later Batch check | Choose one assessment; answer before seeing any solutions | Separate check with feedback withheld until the end |
| Timed section or full mock | Use the configured section clocks and no outside help | Full-clock performance, separate from learning coverage |
| Independent unfamiliar questions | Solve problems from outside this generator, under time pressure | Evidence that your reasoning transfers beyond the app |

Start mixing once you have learned at least two skills in that assessment. Covering every topic before your first mixed session is unnecessary. Continue learning new skills while returning to earlier ones through mixed practice.

A practical eight-hour week is **four two-hour sessions**. Start with roughly 45 minutes learning/repair, 45 minutes mixed or timed work, and 30 minutes reviewing errors and solving independent problems. Cover all five reasoning assessments during the week; give measured weaknesses extra time. As coverage improves, shift learning time into timed sections and later checks. Keep Zap-N practice short enough to leave substantial time for quantitative reasoning.

Your configured deadline remains **6 December 2026, 23:59 CET / 22:59 UK**. The plan budget is separate from the daily habit goal and the assessment clocks. Use tutoring during preparation and close outside assistance for independent checks, mocks and the actual proctored assessments.

## What the audit confirmed

The earlier source audit covered all **34 Beat the Odds practice families and 82 supported family/difficulty combinations**. It found strong existing material in conditioning, information protocols, shared hidden sources, recurrences, likelihood ranking and orderbooks. A wholesale rewrite or another practice mode was not justified.

The actionable weaknesses were:

- Some finite pools were too small after focused exposure. Two easy sum-learning blocks consumed 20 of 21 questions, leaving too few fresh instances for three cold successes.
- Skill avoidance restarted at each ten-question boundary. Accuracy weighting could repeatedly favour weak skills while leaving others unseen across many blocks.
- Correct-but-slow performance did not influence the selection weight.
- Generic structure tags merged meaningful distinctions, including HH versus HT waiting and lower versus upper dice-sum thresholds.
- A mixed result could count slow, helped or interrupted answers as correct without recording enough conditions to interpret that accuracy later.
- Two explanations overstated strict inequalities or a finite-probability approximation. Another card explanation also needed an equality case.

See the [substantive modification log](docs/MIXED_PRACTICE_UPDATE.md) for implementation details and evidence boundaries.

## What changed

### Coverage and weaknesses across blocks

Every other submitted mixed attempt uses a coverage selection: the least recently attempted eligible skill. The alternating turns retain accuracy weighting, with additional weight for independently correct answers that exceeded pace and for due checkpoint reviews. The saved ledger continues across blocks, exit/reload and backup import. Focused learning does not advance it.

Within-block family avoidance remains. Fresh-only selection, the minimum two-skill mixed pool and each skill's current checkpoint target remain. Depleted skills are skipped; the app does not silently repeat, change a focused topic or increase its difficulty to fill a block.

For a stable pool of N skills with enough available fresh questions, alternating coverage supplies a bounded revisit policy rather than relying entirely on weighted chance. The deterministic tests exercise rolling windows of 2N attempts. Changing eligibility or exhausting pools limits that bound.

### Larger pools and meaningful contrasts

| Family / authored difficulty | 1.4 → 1.5 | Meaning |
|---|---:|---|
| Two-dice sums / 1 | 21 → **66** | Existing exact/adjacent-union events plus nonadjacent unions; still two standard six-sided dice |
| Two-dice sums / 2 | 21 → **91** | Existing events plus inclusive bounded intervals and outside-interval complements |
| Card hands / 2 | 13 → **57** | All, none and at-least-one events for real standard-deck groups |
| Card hands / 3 | 13 → **49** | Exactly-one/exactly-two hand events, keeping earlier cases |
| Card symmetry / 2 | **105 new configured observed-discard cases** | Seeing the removed cards changes the remaining composition; unseen discards retain their marginal symmetry |

The first four rows are complete configured capacities. The last is the added input set, not a claim that the entire symmetry generator has been enumerated. Across the application, **33 complete catalogues now contain 971 entries**, up from 776. Three of the 103 reasoning generator families gained new question inputs; other working families and categories remain.

Nonadjacent sum unions mainly increase valid instance supply and fluency. Inclusive intervals, complements, exact counts and observed-versus-unseen information create more useful contrasts. These are targeted structural gains, not hundreds of new concepts or a validated increase in Optiver difficulty.

### Clearer independent results

Mixed results and **Progress → Pace** show a second measure beside ordinary accuracy: **independent within training pace**. It requires a successful, fresh, standard-time answer with no hints, recorded outside help or interruption, within its recorded budget. Intervals retain the existing useful-score threshold of 0.70.

The raw score is unchanged. Helped, over-budget and interrupted counts are shown separately and can overlap. Earlier answers without conditions remain in history with an unknown-conditions label and are excluded from the independent rate.

Only the latest **1,000 annotated mixed answer rows across the saved runs** retain the new detailed fields. Older rows keep their original score, time, family and other historical fields. This bounds the added storage cost. Selection recency and pace evidence are stored separately per skill.

### Honest structural evidence and shortages

Authored structure tags distinguish event types, pattern overlap and information conditions while ignoring selected cosmetic relabellings. Mixed practice prefers unrecorded branches and then less recently recorded branches where available. Batch checks use the same improved keys. Older coarse history is labelled **unknown** when it cannot establish whether the new branch was encountered.

A branch label is a software diagnostic, not proof of conceptual novelty. The existing Batch check remains useful because it withholds feedback. Its questions use the shared library; it has no hidden superior syllabus. Cross-assessment mixing stays optional.

For a complete finite catalogue, a skill can display when fewer fresh questions remain than the current cold checkpoint needs. Existing learning and earned passes remain. Unknown or bounded-search domains are not falsely declared mathematically exhausted. Some finite pools can still run out after enough practice; this release does not promise an infinite supply.

## Checkpoints and difficulty

Three consecutive qualifying successes **on the same skill** verify its current supported difficulty. Questions from other skills can appear between those attempts. The target then advances to that skill's next supported difficulty. Hints, help, interruptions, wrong answers or exceeding the training budget prevent the attempt from qualifying under the existing rules.

A skill with levels [2, 3] has two authored checkpoints. It does not need four invented levels. The checkpoint reducer and existing proofs are unchanged. A successful checkpoint demonstrates independent application to fresh instances at those training levels; it does not require a new method, a delayed retest or a written explanation. Use later checks and independent problems to test those stronger claims.

## Verification and measured improvement

| Check | Result |
|---|---|
| Complete JavaScript suite | **1,077 passed**, zero failed/skipped; baseline 1,062 |
| Backend Python suite with compiled engine available | **36 passed**, zero skipped |
| C++ engine suite | **34 passed** |
| Total unit tests | **1,147 passed** |
| DOM integration | **12 scripts passed**, including 143 new mixed-flow assertions |
| Complete learning walkthrough | **103 skills, 1,040 answers, 680 assertions**, zero uncaught errors |
| Shared-history regression | **1,030 learning + 1,000 mixed + 2,970 mock + 500 Batch questions; zero exact repeats** |
| Presentation sweep | **20,992 BTO items at all 82 levels**; distinct labels and unique closest keyed display, zero failures |
| Additional sampled verifier checks | **328 passed** |
| Complete catalogues | **971 entries** checked; each catalogue compared with 4,096 deterministic generator seeds |
| Chrome walkthrough | Old learning/draft retained; ten-question mixed run; 10/10 accuracy separated from 8/10 independent; helped/resumed gates and checkpoint advancement verified |
| Responsive inspection | Dark and light at a 390 px iframe; body/content both 375 px, no horizontal overflow |

The selection comparison used **80 runs per condition**, ten ten-question blocks per run, and fixed prior statistics/initial targets to isolate the algorithm. There were **16,000 questions per release** across equal and mixed-weakness conditions, with no exact repeats in either version.

| Condition: distinct skills among 34 | 1.4 mean [range] | 1.5 mean [range] |
|---|---|---|
| Equal prior performance, first 68 questions | 30.83 [26–34] | **34 [34–34]** |
| Mixed weakness, first 68 questions | 25.94 [21–30] | **34 [34–34]** |
| Mixed weakness, first 100 questions | 29.55 [26–33] | **34 [34–34]** |

Using the same authored classifier on both releases, the 512-seed per-level sample had **254 → 260 branch proxies**. That modest change is evidence of specific added task distinctions. It is not a count of concepts, a human transfer score or a percentile.

Correct displayed answer positions in the 20,992-item sweep were **4,150 / 4,230 / 4,105 / 4,236 / 4,271** across A–E. No fixed-letter shortcut was found. Existing magnitude/distractor cues can remain; uniform answer positions do not eliminate every guessing strategy.

Reports: [validation](evaluation/mixed-improvement-validation.json), [selection and generator comparison](evaluation/mixed-improvement-results.json), [question quality](evaluation/mixed-question-quality.json), [mode regression](evaluation/mixed-improvement-assessments.json), [DOM flows](evaluation/mixed-improvement-flows.json), [browser checks](evaluation/mixed-improvement-browser.json), [preservation hashes](evaluation/mixed-improvement-preservation.json).

![Mixed result distinguishes accuracy from independent performance](docs/media/validation/optprep-mixed-results.jpg)

## Reproduce the checks

```sh
npm test
node tools/mixed-question-quality.mjs
node tools/focused-assessment-regression.mjs evaluation/mixed-improvement-assessments.json
node tools/mixed-improvement-evaluation.mjs /absolute/path/to/extracted-1.4.0
```

Only the final comparison needs a separate, unmodified 1.4.0 source folder. Its delivered ZIP SHA-256 was e9858874f6e9f8f01b3d615ad72eebee913fd309fd5c97c1fc668320f347d970.

DOM checks need development-only jsdom. Set OPTPREP_TEST_JSDOM to its installed module directory and run the twelve scripts named in evaluation/mixed-improvement-flows.json, for example:

```sh
OPTPREP_TEST_JSDOM=/absolute/path/to/node_modules/jsdom node tools/mixed-improvement-flow.mjs
```

Optional engine checks use CMake/CTest in engine/. Run python -m pytest -q in backend/ after building the engine to include its integration cases. Their dependency instructions remain with those components. Normal application use does not need them.

## Invitation fidelity and limits

| Assessment | Supported by the supplied invitation | Trainer assumptions retained |
|---|---|---|
| Beat the Odds | Probability, limited time per question, 25 minutes total | 20 questions, 90-second item budget, exact scoring and difficulty |
| NumberLogic | Numerical reasoning, 25 minutes | 26 questions, sequence syllabus, navigation/scoring |
| Likelihood-list | Rank outcomes, limited time per question, about 25 minutes | 15 questions, 90-second budget, exact-order score |
| Intervals | Numerical estimates and uncertainty bounds, about 15 minutes | 18 questions, truth distribution/scoring; no invented item clock in the preset |
| Orderbooks | Profitable combinations of buying/selling, about 15 minutes | 20 boards, detailed trading rules/scoring/difficulty |
| Zap-N | One or more games, each 2–15 minutes | Selected games and the fidelity of their approximations |

The supplied email does **not** specify 20 BTO questions or a 90-second budget. Those existing trainer settings were preserved. Its approximate overall duration should not be converted into an exact official schedule. Follow your actual portal instructions. Optional arithmetic remains outside the Kickstarter preset.

This is a stronger training resource because it distributes practice more reliably, exposes meaningful contrasts and makes the conditions behind a score visible. **Human transfer gains and actual Optiver difficulty calibration remain unverified.** Repeated structure is still possible, some mathematical principles legitimately have small configured domains, and exact-newness depends on retained history (8,000 fingerprints per assessment, same browser origin). Physical phones, other browser engines and a live Pages deployment were not tested in this update.

SOURCE_REVISION.txt and BUILD_INFO.json identify this locally tested release and retain earlier provenance. See [LICENSE](LICENSE), [LEGAL.md](LEGAL.md), [original Kickstarter fixes](KICKSTARTER_FIXES.md), and the [new modification log](docs/MIXED_PRACTICE_UPDATE.md).
