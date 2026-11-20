# OptPrep 2.0.0 | Career Kickstarter Trading
20 November 2026

## What changes in your practice

Start from **Today** as before. The ordinary timed papers and all-skills mixed practice now regularly ask you to choose a mathematical method. Focused learning adds 12 selectable topics, each with hints, worked feedback and its own progress. Existing subjects still matter. Learning to do a familiar calculation quickly and recognising when a different calculation is necessary are both part of the assessment.

Keep the NumberLogic mix at its 35% applied default for a first benchmark. That gives you 17 sequence questions and nine applied questions in a 26-question paper. Compare timed results under the same setting. Use focused practice when you cannot explain an error, then see whether you can solve the same type of problem unaided in mixed practice. When Today recommends a reserved paper, use it as a first-attempt check. A/B/C remain fixed and separate from everyday practice. The release contains their original 75 questions across 15 papers.

## How the questions work

Each new generator constructs a situation, chooses the information available to the learner and computes the answer under the chosen rules. Different sections need different safeguards. A sequence needs an identifiable answer, a ranking needs distinguishable probabilities, and a market with no opportunity needs a reason why every executable flat position fails.

| Assessment | What can change between questions | How to approach it |
| --- | --- | --- |
| Beat the Odds | A hidden source, replacement policy and observation can change which paths count. A stopping process can retain or reset progress, change odds after failure, or ask for a win probability, expected duration or net payoff. Arrangement questions vary the boundary, the disclosed positions and the event being counted. | Write down what you have observed and when the experiment ends. In a conditional problem, explain which outcomes remain possible and whether they have equal weight. |
| NumberLogic | Sequences combine alternating operations or two-term recurrences with missing, mistaken or future terms. Some rules act on consecutive differences. Applied models combine two production lines with schedule constraints and yield, or combine rate bands with fees, discounts and order splitting. | Test a proposed sequence rule against every visible term. In applied questions, write the units and identify which quantity the question asks you to recover. |
| Likelihood List | The same hit/miss table can support sampling a record, choosing a group first, drawing without replacement or updating after a first hit. Weighted spinners combine unequal sector counts, paired outcomes and selective observations. | Identify the random choice behind each statement. A large group counts more if you sample a person uniformly. Giving each group equal probability changes the calculation. |
| Intervals | Hidden finite populations are sampled via tagged animals or stratified meter readings. The requested quantity can involve density, share, a peak or a cap. Planning estimates combine sourced reference quantities with hypothetical schedules and changing capacity. | Separate the quantity you can calculate from the input you still have to estimate. Check the unit, then set bounds that reflect how much that uncertain input could move the answer. |
| Orderbooks | Some contracts contain overlapping or signed exposures. Others require multiple units for cancellation or offer competing hedges. Consistent prices, spreads that absorb a discrepancy, and executable mispricings all occur. | First cancel each exposure, then price every purchase at its ask and every sale at its bid. On a pass board, the explanation supplies component values consistent with every quote. |

**Two examples.** With four fair tosses and a target of two heads, keeping your progress after a tail gives 11 successful paths out of 16. Resetting on a tail means you need consecutive heads and only eight paths succeed. In NumberLogic, suppose an order has 12 units, a £2 fee and a 10% discount. If the first ten units cost £3 each and later units cost £5, the bill is £37.80. If crossing ten makes every unit cost £5, it is £55.80. In each pair the numbers stay fixed and the wording identifies a different mathematical rule.

## What a timed learner actually encounters

The comparison built 24 full papers per assessment in **each** release using the same seeds, default NumberLogic mix and previous-question history. That is 120 papers and 2,376 questions per release. In 2.0, the new generators supplied **1,200 questions (50.5%)**. The remaining 1,176 came through existing content paths. The 2.0 sample contained no repeated visible question under a comparison that ignores choice order. The table measures reasoning separately.

| Assessment | New / total in 2.0 | New reasoning groups sampled | Effective groups after weighting by frequency | All tagged structures, 1.9 → 2.0 |
| --- | ---: | ---: | ---: | ---: |
| Beat the Odds | 240 / 480 | 84 | 75.5 | 186 → 250 |
| NumberLogic | 312 / 624 | 56 | 47.9 | 61 → 115 |
| Likelihood List | 192 / 360 | 134 | 113.5 | 183 → 271 |
| Intervals | 216 / 432 | 22 | 17.9 | 104 → 105 |
| Orderbooks | 240 / 480 | 12 | 11.1 | 32 → 80 |

A reasoning group records decisions that affect the calculation, such as resetting or retaining progress and solving for a chance or a payoff. It ignores numerical values. For rankings it records combinations of procedures that must be compared. Effective groups measure concentration. For example, the 12 sampled Orderbooks groups occurred with the diversity of about 11 equally frequent groups. Tagged structures are a broader diagnostic across both releases. A richer tag can increase that count, and several groups can exercise the same underlying skill. Interpret the figures within each assessment. Intervals had the smallest change in total tags. Its clearest gain is that bounds now cover uncertainty from a small sample, a hidden population, or an uncertain reference input. On Orderbooks, 126 of the 480 sampled boards correctly rewarded passing.

## Zap-N

| Game | Decision and cognitive purpose |
| --- | --- |
| CodeCompare | Later rounds contain more one-edit lookalikes. Speeding up still requires accurate visual discrimination. |
| The Switch | Switch and stay trials each balance the correct response and whether the two tasks suggest conflicting answers. The trial order varies. |
| Shapeshift | Each response shape appears across all four quadrants with varying coordinates. Position is a poor shortcut for the required response. |
| Stock Master | Later gauges can demand an earlier response within the sweep, alongside the existing speed increase. This varies monitoring and timing demands. |
| Figure It Out | The selectable shape, colour and other feature values vary across rounds while the number of possibilities still determines expected guesses. |
| Balloon | Retained hidden burst points and the two payoff regimes. Banking versus pumping already changes with risk and accumulated earnings. |
| Pincode | Retained independent digit strings, forward/reverse/sorted recall and span changes driven by performance. |
| NumberBox | Retained reachable arithmetic targets and the existing progression from many solution paths to fewer. |
| Skyscraper | Retained shortest-path calibration, which makes excess moves interpretable across different puzzles. |

## Independent checks and limits

- **Mathematics.** Independent checking code recomputed 4,320 sampled new questions across the three levels, including 720 sequence questions and 720 Orderbooks boards. It enumerated physical token draws, terminal paths, placements, sector pairs and legal trades, reconstructed numerical inputs, and checked interval truths against the underlying population or reference units. Checks cover the displayed multiple-choice answer, ranking probabilities and ties, executable profit, and example pairs that differ only in a rule. The checking code was written separately from the production calculations.
- **App behaviour.** All 1,241 JavaScript tests, 40 Python backend tests, 34 C++ engine tests and 13 interface regression scripts passed. One walkthrough exercised 128 learning families and submitted 1,290 questions. Other runs submitted all 99 questions across the five full timed sections and 50 mixed answers, with a mid-session export and restore in every section. The planner and reserved-paper walkthrough passed 657 assertions, and 171 checks covered isolation of mixed and topic saves. Seeded game checks cover response and location balance, close code distractors, selectable figure palettes and early-response gauge windows.
- **Assessment relevance.** Your invitation sets the skills and overall section times. Exact difficulty, the NumberLogic topic mix, Zap-N assignments and scoring thresholds are unknown. Sourced quantities are identified in the solutions. The hypothetical work schedules, simulated populations, difficulty levels and practice mixture are trainer choices. The independent calculations validate answers. Actual learner transfer, reaction-time accuracy on your device and equivalence to Optiver difficulty require evidence beyond these tests. This release's interface walkthroughs used a simulated browser DOM. Local Chromium could not launch under the execution environment's socket restrictions. [Optiver programme description](https://www.optiver.com/join-us/jobs/trading/amsterdam/career-kickstarter-trading-2027/) · [Secondary description of assessment formats](https://www.tradermath.org/practice/firms/optiver)
- **Reproduction.** Run `npm test` from the extracted folder. The release includes `tools/compositional-rehearsal.mjs` for rebuilding the paper comparison, the mathematical checks in `tests/sections/compositional-generation.test.js`, and the interface walkthroughs under `tools/`. The full ZIP passed its integrity check. A fresh extraction served all 505 application and offline-manifest URLs with bytes matching the release. The two JSON files beginning with `compositional-` in `evaluation/` contain the measured results.

## Install and keep your progress

Export **Settings → Backup** in the old app. Extract this ZIP and run `npm start` in the folder containing `package.json` with Node.js 20 or newer. Use the same browser profile and address as before. If you change address, import your backup. Open **Today** to continue your plan. This delivery updates the downloadable app. A separately hosted copy needs the new files before it serves 2.0.
