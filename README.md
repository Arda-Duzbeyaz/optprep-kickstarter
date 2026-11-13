# OptPrep — Kickstarter learning and mixed checks

**Version 1.1.0-kickstarter.1 · 13 November 2026**

Complete preparation application based on [Coflazo/optprep](https://github.com/Coflazo/optprep), with the original MIT licence and attribution preserved. Not affiliated with or endorsed by Optiver.

Starting point: the previously modified **1.0.4-practice.1**, revision `25021dc4f828f22d80147dafaba6118e27af6421`. This release preserves the earlier mathematical fixes, question-history protection, additional question families, scoring and resumable practice. It does not rebuild from upstream. The [previous complete README](docs/README_PRACTICE_1.0.4.md) is retained as historical documentation; the progress rules and clocks below supersede it.

## How to use it every day

The route is **learn → mixed check → repair → timed section**.

1. Open **Today**. Resume a saved block or use the suggested assessment.
2. Choose **Learn** on a skill. Use hints, explanations or ChatGPT. Mark it **Covered** once you understand the method and can explain a simple example.
3. After covering two or three skills in that assessment, start **Mixed check · covered skills**. Attempt without help. Each block has ten questions from that assessment, with skill names and difficulties hidden before submission.
4. Review mistakes with ChatGPT, repair one weakness in focused learning, then return to fresh mixed questions. Recheck on a later day too.
5. Use **Timed section** regularly for the overall clock and decisions about time. Try the unfamiliar challenge after learning the basics.

Do not wait to finish all 32 Beat the Odds skills before mixing. A short first pass followed by independent diagnosis is more useful than an exhaustive assisted pass without checks. Cover the other assessments too. Filling every bubble is not a prerequisite for taking your actual assessments.

## What progress means

| Indicator | What earns it | Meaning |
|---|---|---|
| Covered | Your learning check; earlier Level 3+ records also count as previously practised coverage | Learning checklist, not an unaided pass |
| 0/3, 1/3, 2/3 cold successes | Eligible fresh mixed attempts on one skill at its current difficulty | That skill's current consecutive-success counter |
| Filled difficulty bubble | Three qualifying successes at that supported difficulty | A training checkpoint on generated instances |
| All supported difficulties verified | Every supported difficulty passed, with no recheck due | Current generator-based training goal |
| Practice target met | Existing qualifying timed-section rules | This trainer's target, not an Optiver cutoff |
| Transfer results | Separate unfamiliar-question session | Additional benchmark evidence |

**Consecutive means consecutive attempts on the same skill.** Other skills can appear between them. A ten-question mixed batch is not ten repetitions of a selected topic. It samples the covered pool, spreads questions across families before repeating, and still weights weaker performance. A new block starts a new breadth round; there is no guarantee that every family appears across a particular number of blocks.

### Cold mixed-check rules

A qualifying answer must be:

- From mixed ordinary practice or an unlabelled timed drill with at least two eligible families.
- A distinct question instance not recorded as previously displayed, with standard-time settings.
- Correct without hints or outside help, uninterrupted before submission.
- Within the displayed **training** pace budget. Intervals additionally needs a score of at least 0.70, the existing training threshold.

Three successes verify the current supported generator difficulty. The next draw of that skill targets the next supported difficulty. A skill supporting `[1, 2]` has two checkpoints; one supporting `[3, 5]` advances directly from 3 to 5. There are no invented intermediate levels.

An eligible miss, hint, outside-help marker, interruption or over-budget answer resets that skill's current streak. A later failure at a passed difficulty requests a recheck while preserving the historical proof. Three new qualifying successes clear the recheck. Other skills' questions do not reset this skill.

Focused learning, lessons, fixed sets, previously seen questions, extra-time practice, mocks and Transfer Challenge cannot create these checkpoints. Learning still updates ordinary activity, answer statistics and revision data. Use **Used outside help** if a mixed attempt becomes a learning attempt. Help is self-reported; visibility interruptions are recorded, but the app cannot independently certify an unaided attempt.

Budgets retain the configured item allowance, or use overall time divided by the practice question count: BTO 90 s, NumberLogic about 57.69 s, Likelihood-list 90 s, Intervals 50 s and Orderbooks 45 s in this preset. They depend on unverified counts/item allowances. BTO's 25-minute mock also requires an average of 75 s across 20 questions, so a mixed checkpoint does not by itself establish full-section pace.

**Three fresh instances do not establish three unfamiliar structures or concepts.** The three-success rule is a training choice, not a research-established mastery threshold. Higher generator labels are authored difficulties, without empirical Optiver calibration or a guarantee that every individual higher-level question is harder.

### Earlier levels and Quant Sprint

The earlier five counters mostly counted repeated correct answers; only the final level required pace. They were not five mathematical difficulty levels. This release stops increasing them and retains them under **Previous practice record**. Coverage and mixed performance are now the primary measures.

The supplied Quant Sprint app informed the separation of assisted learning and cold mixed checks. Its rule also requires at least two schemas. OptPrep's generic branch signatures are not reliable enough to use as a universal schema criterion, so this release does **not** claim to reproduce that requirement. Unfamiliar challenges and independent problems remain necessary to test transfer.

## Deadline and assessment clocks

Your supplied invitation is authoritative for these known overall durations:

| Assessment | Invitation | Kickstarter preset | Still assumed |
|---|---|---|---|
| Beat the Odds | 25 min overall; limited time per question | 25 min overall | 20 questions, 90 s/item, format and scoring |
| NumberLogic | 25 min | 25 min | 26 questions, exact numerical format and scoring |
| Likelihood-list | About 25 min; limited time per question | 25 min overall | 15 questions, 90 s/item, format and scoring |
| Intervals | 15 min overall | 15 min overall; no item deadline | 18 questions, distribution and score model |
| Orderbooks | 15 min overall | 15 min overall | 20 boards, mechanics and score model |
| Zap-N | One or more games, each 2–15 min | Existing games retained | Which games appear and exact mechanics |

This corrects the previous 8-minute Orderbooks setting, adds the Likelihood-list and Intervals overall clocks, and removes the previously assumed 45-second Intervals item limit from this preset. Other role presets, counts and scoring formulas remain unchanged.

The email's approximate 1 h 44 min total does not exactly reconcile with its listed section estimates. The app uses separate section clocks and breaks, without inventing an exact combined limit. Follow more specific instructions in the real portal.

The preparation deadline is **6 December 2026, 23:59 CET = 22:59 UK**, stored as `2026-12-06T22:59:00.000Z`. Today shows days remaining, your weekly budget and a phase:

| Remaining time | Guidance |
|---|---|
| More than 14 days | Build coverage; start mixed checks after a few skills |
| 5–14 days | Timed sections and targeted repair |
| Final 4 days | Consolidate and complete assessments with a buffer |
| Deadline reached | Show the status without locking practice |

Settings allows a deadline date at 23:59 CET and preparation hours/week, default **8**. Remaining hours are simple calendar arithmetic, not a forecast of actual availability. The daily habit goal is separate and preserves its previous value.

### An eight-hour week

Use six one-hour sessions and one two-hour session. Today suggests BTO, NumberLogic, Likelihood-list, Intervals and Orderbooks on weekdays, then catch-up and a weekly benchmark. Weekend selection prioritises incomplete coverage/checkpoints, not a calibrated ranking of ability. You can choose any other task.

A one-hour session: **25 min** cold mixed practice or a timed section; **15 min** review with ChatGPT; **15 min** focused repair or a new skill; **5 min** error notes and planning. Use the longer session for timed sections plus review. Include short Zap-N familiarisation within the budget. Replace some website batches with unfamiliar independent problems under time pressure.

Explain the model before calculating, contrast similar-looking problems with different assumptions, and revisit repaired skills after a delay. During preparation use ChatGPT to teach and diagnose. Complete the actual proctored assessments under your invitation's no-assistance rules.

## Single-assessment Transfer Challenge

The default now selects **one assessment**. Assessment pages open the corresponding selection; an all-five mix remains optional.

| Mode | Questions | Training clocks when timed |
|---|---:|---|
| Single assessment | 10 | 15 min overall; 90 s/item |
| Optional broader mix | 15, three per section | Preserved 20 min overall; 90 s/item |

Untimed remains available. Extra-time settings apply to both clocks and are recorded. Methods stay hidden until end-of-session review. Exact-question history, less familiar branch preferences, family variety and shuffled MCQ positions are retained. New results record scope and clock metadata; older results remain readable.

These are **additional training clocks**, not official assessment clocks. Cross-assessment mixing is optional broader practice, not a requirement for an exam taken section by section. Results stay separate from ordinary statistics, SRS, XP, mixed checkpoints and assessment targets. Interval scores and other accuracy are not combined into an invented pass mark; empty result groups avoid meaningless 0/0 rates.

The earlier additional families remain: information protocols, shared sources, selection weights and rates/weights. Their formulas and verification systems are preserved.

## Confirmed problems and implemented fixes

| Confirmed problem | Modification | Purpose |
|---|---|---|
| Five counters could be mistaken for mathematical levels | Actual supported difficulty checkpoints; legacy history preserved | Make progression correspond to demonstrated generator difficulty |
| Assisted topic practice could advance primary counters | Explicit coverage plus mixed-only verification | Separate learning from independent recognition |
| Mixing the full syllabus could overwhelm early practice | Covered-skills pool plus all-skills diagnostic | Begin mixing after a few topics |
| Familiar families could recur inside a batch | Breadth round plus weakness weights and exact-history exclusion | Increase exposure while keeping targeted practice |
| Transfer required crossing assessment categories | Single-assessment default, broader mix optional | Match section-by-section preparation |
| No preparation deadline in Today | Deadline, budget, phases and suggested daily focus | Make daily action straightforward |
| Supporting features competed with the main route | Clear Learn/Mixed/Timed actions and collapsed details | Preserve useful tools with less clutter |
| Probability-tree rendering mutated saved question data with BigInt fractions | Clone diagram input before layout; frozen-input and resume regressions | Display solutions without breaking JSON saves |
| Invalid new backup fields could break the UI | Validate new progress containers and preserve current data on rejection | Fail explicitly without silently overwriting usable progress |

Ten-question blocks, autosave, identical-question/draft/feedback resume, one saved block per assessment, atomic answer commits and finish screens remain. Changing skill or mixed scope offers an explicit choice before replacing a saved block. Resumed unanswered questions are learning-only; pausing on feedback keeps the next newly drawn question eligible.

All 99 ordinary mathematical families, banks, fixed libraries, answer acceptance, scoring and Zap-N game logic are preserved. No mathematical templates or games were added in this release. A [file-level change record](docs/LEARNING_UPDATE.md) accompanies the source.

## Verification and measured results

| Suite | Previous 1.0.4 | This release |
|---|---:|---:|
| JavaScript | 791 | **818 passed** |
| Python, engine available | 36 | **36 passed** |
| C++ | 34 | **34 passed** |
| Total unit/regression tests | 861 | **888 passed** |

Separate integration and sampling results:

- **104 practice-flow assertions** covering four answer types, drafts, feedback/RNG resume, completion, visibility, saved-scope choices, recovery, storage failure and full ten-question drills.
- **95 full-app learning-route assertions** covering coverage, hidden mixed labels, three cold successes, next supported difficulty, help, interrupted resume, deadline/settings, isolated scoped Transfer and frozen tree rendering.
- Original UI smoke, Transfer smoke, **11 focused interface regressions** and the complete broader Transfer route pass.
- **133 ordinary generator source files unchanged; 50 mock papers / 990 complete question objects identical** to 1.0.4 for comparison seeds. Base section config, other presets, scoring and MIT licence preserved.
- **10 broader Transfer sessions / 150 question objects identical** to the previous release for fixed seeds.
- **50 scoped sessions / 500 questions**, carrying exposure between sessions: **zero exact repeats** in this sample. Each session used ten families except Orderbooks, which used all eight of its families.
- All five MCQ positions occurred in the BTO and NumberLogic samples; all six ranking permutations occurred in Likelihood-list. This is not proof of perfect randomness or absence of all answer cues.
- Chrome desktop and a 390px responsive iframe were inspected in light/dark themes: Today, skill map, learning/feedback, settings, progress and scoped challenge. A ten-question Intervals challenge was completed with skips to inspect review. This is UI evidence, not a candidate performance result. Physical phones and other browsers were not tested.

**Structural repetition remains.** Familiar signature occurrences in 100 scoped questions per section were BTO **3**, NumberLogic **55**, Likelihood-list **3**, Intervals **35**, Orderbooks **90**. Signatures are a conservative branch proxy, not a complete taxonomy of reasoning. Exact freshness does not establish conceptual novelty. Orderbooks continues to rehearse a small set of replication identities.

See [learning-results.json](evaluation/learning-results.json), [learning-evaluation.json](evaluation/learning-evaluation.json) and [practice-preservation.json](evaluation/practice-preservation.json). The [earlier diversity audit](docs/DIVERSITY_AUDIT.md), 13,000-case JS sweep and 1,300-case independent Python checks are retained as historical evidence for unchanged formulas, not newly repeated learning-outcome experiments.

### Verdicts

| Area | Assessment | Confidence |
|---|---|---|
| Mathematical correctness | Preserved independently checked formulas and full regression suites; no new formulas here | High for tested cases; not a formal proof over every seed |
| Realism | Better invitation clock alignment and section-specific training; other mechanics still assumed | High on supplied durations; limited on unprovided details |
| Difficulty calibration | Real generator levels now drive progression, without independent Optiver calibration | High on mechanics; low on real-test equivalence |
| Educational quality | Clearer learning, unaided recognition, repair and timed execution | Moderate: justified design, no controlled outcome trial |
| Overall usefulness | Stronger daily practice engine alongside tutoring and independent problems | Moderate to high for that role; no measured link to hiring outcomes |

Use this as your main **practice engine**, alongside unfamiliar independent questions and timed-section checks. Do not optimise for XP, coverage clicks or exhausting the generators. This release improves the workflow; it does not establish unlimited conceptual novelty or that finishing its checkpoints demonstrates exceptional real-assessment performance.

## Run locally

Extract the ZIP and open a terminal in the folder containing `package.json` and `index.html`. With **Node.js 20+** installed:

```sh
npm start
```

No dependency installation or frontend build is required for normal use. The launcher normally serves `http://127.0.0.1:8765/` and opens the browser; use its printed URL if the port is occupied. Do not double-click `index.html` using `file://`; ES modules require a web server. The optional Python/SQLite backend and C++ engine source remain included; static hosting does not require them.

## GitHub Pages: upload the application, not the ZIP

1. Extract the archive and open the inner `OptPrep_Kickstarter_Transfer` folder.
2. Commit **its contents** at your repository root, including deployment configuration. `index.html`, `app.js`, `src`, `config`, `assets`, `package.json` and `LICENSE` must not be nested an extra level down.
3. In **Settings → Pages**, select **GitHub Actions**. The included Pages workflow deploys updates on `main` and fills the offline cache manifest/build identifier.
4. Confirm the workflow succeeds, then open the Pages URL GitHub provides.

The full archive includes source, tests, backend, engine source, documentation, assets and deployment configuration. Build outputs, dependencies, caches and account data are excluded. Uploading a ZIP file by itself will not unpack or deploy it.

**This release has not been pushed to your repository or deployed to your Pages site.** Connected GitHub access exposed no repository installations at packaging time. The original developer's repository was not modified.

## Progress compatibility

The schema stays at version 2. Existing 1.0.4 runs, settings, lessons, mistakes, histories, XP, activity, saved practice and legacy counters are retained. Missing `learningCoverage` and `recognition` maps default safely. Old progress is not relabelled as new cold evidence. New fields use the existing full-state backup/sync path.

Updating the same browser site preserves its storage. A different origin or browser requires **Settings → Export backup**, then **Import backup** on the destination. Export before replacing your deployment. The app does not upload your invitation or contact external accounts automatically.

## Reproduce validation

```sh
npm test
```

For DOM integration, install the optional test dependency:

```sh
npm install --no-save jsdom
node tools/ui-smoke.mjs
node tools/practice-flow-smoke.mjs
node tools/learning-route-smoke.mjs
node tools/transfer-smoke.mjs
node tools/transfer-regression.mjs
node tools/transfer-route-smoke.mjs
```

For deterministic comparison, pass an extracted 1.0.4 directory:

```sh
node tools/practice-preservation.mjs /path/to/previous-release
node tools/learning-evaluation.mjs /path/to/previous-release
```

Optional engine/backend checks:

```sh
cmake -S engine -B engine/build
cmake --build engine/build
ctest --test-dir engine/build --output-on-failure
cd backend
uv run pytest -q
```

`SOURCE_REVISION.txt` identifies the local implementation commit; a later commit can record release metadata. `BUILD_INFO.json` records measured results and deployment status. Retain the original [LICENSE](LICENSE) and attribution when publishing or forking.
