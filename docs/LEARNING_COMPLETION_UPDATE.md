# Learning completion and full-app walkthrough

Version **1.2.1-kickstarter.1**, 14 November 2026. Built on 1.2.0-kickstarter.1, commit `040ae56d820fc114820fc37c43b2d82c388b9fdf`.

## Report and root cause

The user completed ten easy Beat the Odds questions in “Two dice: sum events”. XP and habit time increased, but the skill remained suggested, cold counters still read zero and Progress did not clearly show what had been completed.

Tracing the actual implementation confirmed separate mechanisms:

1. Each answer updated statistics, XP, revision data and learning-attempt counts.
2. Learning coverage changed only through a manual checkbox or earlier qualifying history. Completing a block did not tick it.
3. The summary saved a run without explicit family/scope/session identity, and only after Finish.
4. The roadmap selected the first uncovered skill, so ten completed questions could still leave it suggested.
5. Progress primarily displayed aggregate coverage and cold counters, without a visible per-skill learning-block record.

The user's XP and minutes therefore supported that answers were being recorded; they did not establish that a completed-block record existed. No access to the user's actual browser save was available for this update.

## Implemented behaviour

- The tenth submitted answer commits focused learning completion in the same save as the answer and final-feedback snapshot. Finish is no longer required to register learning.
- A complete ten-question block with no skips ticks learning coverage, independently of accuracy or assistance. This is an exposure/coverage milestone, not a proficiency verdict.
- A complete block containing skips is recorded with its skipped count, but cannot automatically tick coverage. Partial blocks retain their answer records without a completion milestone.
- Learning records include completed block count, persistent block identities, completion timestamp and latest block question/correct/skip counts. Reopening feedback or finishing the same block again cannot duplicate the milestone.
- Covered skills stop being suggested as new material. Their roadmap row has a filled learning indicator, completion text and a Revisit action. The Easy/Medium/Hard band count updates through the same coverage model.
- After the first covered skill, the summary's main next action is the next uncovered skill. After at least two covered skills, it offers covered mixed practice prominently.
- Progress lists every started skill by name with its learning status, block count, focused-answer count, last result and mixed evidence. Those records precede a separately collapsed cold-totals section, including on narrow screens.
- Focused learning displays cold counters under “Next stage: cold mixed checks”, with an explanation that zero cold successes do not undo completed learning.
- Manual coverage remains available for prior/external learning. Mark for learning preserves completed blocks while requesting a revisit; a genuinely new full unskipped block can tick it again.
- Each saved run now retains explicit family, scope and block identity. Finishing a run is idempotent for that identity.
- Mixed revision attempts are counted separately and shown in Progress. A previously seen question displays its revision-only eligibility before answering.
- The fallback service-worker cache identifier changes so deployment without SHA substitution can pick up the new client. The existing Pages SHA-based mechanism is retained.

## Data compatibility and recovery

The overall save schema remains version 2. A component migration marker prevents repeated reconstruction. XP, habit time, statistics, SRS, mistakes, lesson progress, old levels, cold proof, settings and saved question content are not reset or awarded again.

Recovery accepts a retained full focused practice run, or a valid final-answer practice snapshot containing all ten submitted answers. Older run summaries omitted family identity: recovery additionally requires a homogeneous ten-question run and at least ten recorded focused-learning attempts on that family, with no explicit mixed scope. Mixed runs, incomplete runs and missing item history are not reclassified. The legacy records do not retain every old skip flag; recovery records the historical block based on the evidence still available and does not assert an unaided result.

A deliberate old `covered: false` choice remains false during recovery. Completed history can still be displayed. New fully worked blocks may tick it again.

If only XP, minutes or aggregate answers survive, completion cannot be reliably reconstructed. Those remain visible activity, not fabricated blocks. Older run details that were already compacted away cannot be recovered; the new dedicated completion ledger survives future compaction.

Export/import and the existing full-state sync preserve the new fields. Updating the same origin/browser retains local progress. Changing a repository URL, browser or device requires exporting from the old origin and importing on the new one. Export before deploying an update.

## Additional limitation found by following the learning-to-mixed route

Fresh checkpoint eligibility is based on first recorded visible-question exposure. The easy repeated-die generator has only **four** visible instances: two or three throws combined with all-same or all-different. After a ten-question learning block those instances may all be in history. Correct subsequent repetitions cannot earn a previously unseen-question checkpoint.

A 300-seed first-supported-difficulty screen also found small samples in other families. Observed counts are lower bounds unless the full finite domain is established from source. For example, the four-instance repeated-die result follows directly from its two two-way choices and is regression tested. The two-dice sum easy domain has 11 exact sums plus 10 adjacent-sum pairs. Neither answer shuffling nor a new session creates a new instance of the same visible question.

This release makes revision eligibility and recorded attempts explicit. **It does not expand these mathematical generators, relax freshness or manufacture completed cold checkpoints.** Filling every checkpoint is therefore not a valid completion target for the whole application. Work on independent unfamiliar problems and timed sections alongside these practice families. A broader question-bank redesign would need separately verified mathematics and remains outside this completion fix.

## File-level changes

| File | Substantive change |
|---|---|
| `src/core/learning.js` | Pure block-evidence validation, idempotent completion reducer, snapshot conversion and conservative legacy recovery |
| `src/core/store.js` | Atomic completion on final answer, idempotent finished history, manual coverage source and mixed/revision attempt ledger |
| `src/core/migrate.js` | Completion migration and validation of new record shapes |
| `src/core/recognition.js` | Read-only learning metadata and eligible-attempt count for display; qualifying cold rules unchanged |
| `src/core/practice.js` | Validation of optional skip flags in saved answer logs |
| `src/core/path.js` | Learning metadata carried into roadmap rows; started work has learning state |
| `src/ui/runner.js` | Skip flags, explicit run identity, final-answer acknowledgement, learning summary/next actions and pre-answer revision notice |
| `src/ui/practice-progress.js` | Learning labels/evidence, filled learning marker, secondary explanatory cold stage and finite-pool guidance |
| `src/ui/pages/section.js` | Completed rows, Revisit action, next-stage wording and automatic-completion instructions |
| `src/ui/pages/progress.js` | Named skill records, latest learning result and separate cold totals/revision evidence |
| `src/ui/pages/path.js` | Today instructions match automatic learning completion |
| `src/ui/styles.css` | Completion/revision notices and responsive skill records |
| `sw.js`, `package.json` | Cache fallback and release version |
| `tests/core/learning-completion.test.js` | 18 regression tests for completion, recovery, storage, skips, manual overrides, revision honesty and history compaction |
| `tools/learning-completion-flow.mjs` | Full shipped-router walkthrough through all 103 learning families and related application routes |
| Existing practice/learning smoke scripts | Replace their old expectation of prominently empty cold counters with the intentional next-stage message; all earlier functional checks retained |
| README, release metadata, evaluation report | Current behaviour, reproduction commands, evidence, provenance and limitations |

## Verification

- **844 JavaScript tests**, **36 Python tests**, **34 C++ tests**: **914 passed**, no failures or skips.
- **684 full-entry-point walkthrough assertions**, all **103** learning families, **1,040** learning answers, all five main assessments, five single-assessment Batch checks and five timed-section start/review flows. No uncaught application errors.
- The walkthrough reproduces an 8/10 dice learning block, navigates away before Finish, finds persistent completion in Progress and the roadmap, resumes final feedback without duplicate activity, and verifies the next learning/mixed actions.
- The walkthrough also verifies repeated easy-die questions as revision-only. It does not assume that every covered topic still has three unseen easy instances available.
- Existing **104** practice-flow, **100** learning-route and **71** shared-practice assertions pass. The original UI/batch integration scripts, broader full-router flow and **11/11** focused interface regressions pass.
- Preservation comparison: **133 generator files unchanged**, **50 mock papers / 990 complete questions identical** to the preserved 1.0.4 comparison. Base configuration, other presets, answer scoring and MIT licence preserved. The unchanged broader Batch sampler and earlier mathematical-audit evidence remain in their original reports.
- Chrome reproduced ten dice answers using only rendered prompts and controls; the first two answers were intentionally wrong. Progress showed the completed learning and **8/10** before Finish, then survived feedback resume, Finish and reload. The roadmap showed the completed skill and suggested the next one.
- Desktop and **390px iframe** inspection: readable learning record, separate cold totals and filled roadmap learning indicator. Phone content width and scroll width were both **375px**, with no horizontal overflow. Dark desktop and phone layouts were checked after the final ordering adjustment; light desktop was inspected earlier in the same task. This was responsive browser QA, not a physical-phone or cross-browser test.

Synthetic correct answers exercise workflows using known generated keys; they do not independently prove every formula. The source mathematical generators and grading formulas were not changed in this release. Automated UI integration and rendered Chrome checks complement one another; neither demonstrates actual candidate learning gains or official Optiver difficulty equivalence.

## Running and deployment

Extract the full ZIP and run `npm start` with Node.js 20+ from the folder containing `package.json`. No frontend build or dependency installation is required for normal use. The README contains Pages instructions and the existing optional backend/engine setup.

This is a complete source archive with tests, documentation, deployment workflow, original licence and attribution. It has not been pushed to the user's repository or deployed. The original developer's repository is untouched.
