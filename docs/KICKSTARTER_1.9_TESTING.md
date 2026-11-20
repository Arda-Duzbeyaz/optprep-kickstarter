# Release verification

The starting archive was OptPrep 1.8.0. The release keeps its browser storage key, earlier records, backup format, workshop history and saved fixed papers. The two original reserved paper definitions were compared byte-for-byte with the input archive. All writes during testing used synthetic local profiles.

| Check | Result | What it exercises |
| --- | --- | --- |
| JavaScript suite | 1,219 passed, zero failures | Mathematical models, scoring, timers, save compatibility, interface contracts, planning, existing game engines and new offline inventory checks. The starting release recorded 1,202 tests. |
| Independent checks on the new scenarios | 2,400 generated items across five sections and three levels | Each section used 160 deterministic seeds at each of three levels. Every multiple-choice question had five distinguishable displayed choices. Every ranking had a strict correct order. |
| Probability composition | 200 base draws fed through the composition check | Compared returned second-stage answers with explicit signal paths or enumerated sequences of independent trials. Checked that displaying a composite records the original prompt as seen. |
| Full-paper rehearsal | 70 full papers in this build and 70 comparison papers from v1.8 | 1,386 questions in the new build, zero repeated visible fingerprints across successive papers within a section. A separate test builds 18 full NumberLogic papers across the three mixture settings. |
| Assessment-plan controls | 657 assertions, 100 submissions | Completed a workshop and Papers A, B and C in each quantitative section. Checked input controls, clocks, feedback and stored results. |
| Ordinary timed controls | 64 submissions | Completed entire 26-question NumberLogic, 18-question Intervals and 20-board Orderbooks sections. An intentional wrong pass ended its board and scored zero. Two correct passes earned points. Interval tests checked stored width and miss direction. |
| Existing interface flows | 13 scripts passed | Includes a complete walkthrough covering all 116 quantitative learning families and 1,170 learning questions, together with mixed practice, finite-pool exhaustion and timed review. |
| Separate unfinished sessions | 171 assertions passed | Resumed focused drafts and feedback, mixed drafts and covered pools across five sections. Finishing one did not erase another. |
| Offline inventory | 484 app assets, modules and styles | Both archive-hosted and Pages-built service-worker install lists were exercised using an isolated service-worker test harness. |
| Distribution | Fresh extraction checked | Verified ZIP integrity, preservation of the starting file tree, and local HTTP delivery of the application shell and its offline inventory. |

## Independent mathematics

- **Beat the Odds.** Enumerated labelled urn draws, reveal positions and hidden-device outcomes. Counted small arrangements with bit masks. Checked stopped-process probabilities by enumerating paths and expected waiting times by summing survival probabilities. The checker for capped prize games recurses over success and failure, independently of the generator’s expectation formula.
- **NumberLogic.** Substituted answers back into the given totals and rate equations. Reproduced displayed post-discount prices, conserved solute in mixture problems and recovered combined worker output from the proposed average.
- **Likelihood List.** Rebuilt probabilities from reported counts or histogram widths, enumerated relevant events, and checked the ordered probabilities and absence of ties. Shuffling visible statements preserves their identities.
- **Intervals.** Summed every hidden observation in simulated populations. Reversed the scale and unit conversions on published-reference items to recover the underlying source value. The generated ground truth is intentionally allowed to differ from an estimate made with a small sample.
- **Orderbooks.** Compared a search over signed instrument positions with a separate exhaustive enumeration of buy/sell trade multisets. All 480 sampled new boards passed. Newly generated scenario boards also run the independent profit check at generation time. A consistent-price board must admit no positive flat trade within the exercise limit, and a profitable certificate must execute at the shown quotes.
- **Reserved Paper C.** Checked the quantitative answer keys, strict rankings, full synthetic interval logs and optimal trades in the five original boards. Rechecked the original A/B first-attempt workflow and stored reviews.

## How to reproduce the main checks

Run from the project folder. The first command needs only Node.js. The interface scripts use jsdom installed in the developer environment, or a path supplied in `OPTPREP_TEST_JSDOM».

```sh
npm test
node tools/assessment-plan-flow.mjs
node tools/kickstarter-timed-controls.mjs
node tools/separate-sessions-flow.mjs
node tools/curriculum-dom-regression.mjs /tmp/optprep-ui-results.json
node tools/kickstarter-generator-audit.mjs /path/to/extracted-v1.8-project
```

The generator audit writes the JSON report in `evaluation». Starting an ordinary practice session requires none of the testing dependencies.

## Limits of this verification

The interaction checks used a simulated browser DOM. This environment blocked Chromium startup, so rendered layout, touch behaviour and installation in a physical browser were not verified for this release. HTTP and service-worker harness tests give separate coverage of file delivery and cache membership.

The procedural models have finite structures and factual anchors. A different question can still reward a method you have seen. The reserved forms contain five questions per section each, so one mistake moves the score substantially. Use their first-attempt results alongside mixed accuracy and timed results across separate days. The reported difficulty and pacing are engineering choices. No study here measures pass rates or establishes equivalence with Optiver’s live assessments.
