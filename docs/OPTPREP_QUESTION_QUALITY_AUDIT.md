# OptPrep question-quality audit

22 November 2026 · OptPrep 2.0.0-kickstarter.2

## Result

The updated app retains all **136 question families, 355 family-and-difficulty combinations, 150 lessons and nine Zap-N games**. It keeps learner progress, the reserved-paper answer keys and the shared 75-second Beat the Odds mastery rule. Changes apply to regular practice, mixed practice, timed sections, and the relevant workshop and reserved-paper screens.

The main defects were unclear experimental rules, answer feedback that inferred a mistake from a generic distractor, and review screens that sometimes rounded away information needed to reproduce the keyed answer. The changes concentrate on those defects and on giving learners a quick mathematical route through a well-defined problem.

## What changed

| Area | Issue | Implemented |
| --- | --- | --- |
| Beat the Odds | Some scenarios implied the reward, the information disclosed by a report, or the independence of trials. Composed questions could contain two separate probability asks. | Defined the prize and stopping rules, separated the sampling mechanism from the observation, and made each composed item ask one final question. Revised wording in card discards, random arrangements, collisions, repeated dice, collection problems, race-to-k and geometry. Added equations and named wrong methods for stopping, conditioning and counting. |
| NumberLogic | Linked-sequence reviews often listed the completed sequence with little explanation. Production and tariff distractors frequently came from generic offsets. | Made the recurrence rule and its inputs explicit. Added checks against the visible terms and worked backwards through the gaps next to an early blank. Production solutions show the good-part rates and the schedule equation. Tariff solutions distinguish marginal from whole-order pricing and apply the fixed fee and discount in order. |
| Likelihood List | Close probabilities could lose important digits on review. Some sampling and density explanations were too broad. | Used enough digits to show distinct ranks and retained the actual probabilities in charts. Added a calculation beside each model-generated statement. Clarified shared versus fresh group selection and what a spinner report discloses. Histogram guidance distinguishes counts from frequency density. |
| Intervals | The coach could display identical rounded bounds that scored zero. Grid-statistics hints could describe percentiles even when the item asked for a mean or threshold count. | Used the grading rule to check the bounds suggested for exact models. Repeating decimals get outward-rounded bounds. Feedback distinguishes a narrow miss, a wide hit and invalid bounds. Grid, dice and survey solutions now use methods specific to the requested quantity. Meter and recapture reviews show how to scale each sample and distinguish its estimate from the full population. |
| Orderbooks | The learner had to infer signed positions, reusable quotes and what a flat result meant. Some pass reviews gave a conclusion with no quote-by-quote check. | Stated the objective in units and cash and explained the effect of each trade. The prompt uses the board's trade limit. A profitable review shows executed prices and cancelled positions. A pass review can show component values between every bid and ask, which proves a flat portfolio cannot earn positive cash. |
| Zap-N | Some instructions gave incomplete controls or treated a trainer-specific rule like an external assessment fact. | Checked all nine instructions against the local engines and controls. Clarified Balloon's second-round bank and pop loss, Skyscraper's reset, Shapeshift's early presses, CodeCompare's edit types, Pincode's repeated digits, NumberBox's once-per-number rule, Figure It Out's per-property feedback, The Switch's timeout and Stock Master's one click per dial. |
| Fixed banks, reserved papers and feedback | A reserved question about red and blue entries used “other” after referring to rejected red entries. Open-answer guidance could leave a learner unsure how to enter a recurring decimal. | Clarified selected fixed stems while retaining their answer keys. Reserved reviews use the same Orderbooks rules as the active question. Answer fields explain when an exact fraction or explicit rounding is appropriate. Named multiple-choice distractors support a possible diagnosis. Generic choices lead to the worked solution without guessing the learner's reasoning. |

## Before and after

### Beat the Odds prize threshold

**Before:** “Stop when the counter first reaches 2 or the attempts run out.” The question then asked when the prize was earned.

**After:** “Reaching 2 wins the prize and ends play. If your attempts run out first, you win nothing.” With three attempts, a starting counter of 1, a reset to zero on failure and an independent success chance of 0.25, the only way to win on the final attempt is failure, success, success. Its probability is `0.75 × 0.25 × 0.25 = 0.046875`. The review separates the chance of reaching an attempt from the chance of winning on it.

### NumberLogic tariff

**Before:** The review gave the pre-discount total and a general instruction to apply the band, fee and discount.

**After:** For the first eight units at £5, later units at £7, a £3 charge and a 20% discount on the whole bill, the ten-unit solution shows `(8 × £5 + 2 × £7 + £3) × 0.80 = £45.60`. The £43.20 distractor represents omitting the charge. The £58.40 distractor represents applying the higher rate to all ten units.

### Likelihood List histogram

**Before:** General guidance to add bars could be read as adding their heights.

**After:** With frequencies on the vertical axis, add counts. With frequency densities, multiply each height by its bin width first. A bin with width 3 and density 10 contains 30 observations. One with width 4 and density 8 contains 32. The second is more likely even though its bar is shorter.

### Intervals exact calculation

**Before:** The coach could show `[41.67, 41.67]` for the probability, in percent, that two fair dice sum to at least eight. The reference is `100 × 15/36 = 41.666…`, so those bounds scored zero.

**After:** The coach recommends `[41.66, 41.67]`. Those bounds contain the exact answer and score about 0.9998 under the trainer's lower-divided-by-upper rule. The explanation, feedback and diagram use the same bounds.

## Assessment fidelity and difficulty

| Evidence | What it supports | Design decision |
| --- | --- | --- |
| **Official Optiver information.** The 2027 Career Kickstarter listing confirms the online assessment and subsequent technical interview. Optiver's market education explains executable bid and ask prices. The recruitment pages describe the selection process. | The assessment is a distinct screen, and the Orderbooks mechanics should use executable quotes. The public pages offer limited detail on individual questions. | Keep original problems and use the assessment format as the target for pacing and presentation. [Career Kickstarter 2027](https://www.optiver.com/join-us/jobs/trading/amsterdam/career-kickstarter-trading-2027/) · [Europe recruitment FAQ](https://www.optiver.com/join-us/stories/optiver-europe-recruitment-faq/) · [Optiver order-book explainer](https://prod-www.optiver.com/insights/explainers/orders-and-the-order-book/) |
| **Invitation details and candidate reports.** The timing recorded for this Kickstarter invitation is about 25 minutes each for Beat the Odds, NumberLogic and Likelihood List, and 15 minutes each for Intervals and Orderbooks. A public post quotes comparable instructions and includes reports of tight per-question limits and numerical sequences. Reports from other roles give different timings. | Use the role-specific overall clocks. Treat candidate recollections about counts, per-question caps, topic distribution and games as evidence with varying confidence. | Retain the Kickstarter preset, the sequence-heavy default for NumberLogic, and the existing question-mix setting. Separate OptPrep's own mastery criteria and panel scores from the portal instructions. [Candidate-quoted instructions and discussion](https://www.reddit.com/r/quantfinance/comments/1vfc77q/optiver_oa/) · [Different reported timing for a research internship](https://www.reddit.com/r/quantfinance/comments/1urevoj/optiver_qr_intern_oa_preparation/) |
| **Independent preparation resources.** Demonstrations show common formats such as short probability questions, sequence puzzles, rankings based on supplied data, bounding an unknown value and cancelling market exposure. | Useful examples of reading load and interaction. A preparation site's own item mix or scoring is evidence about that site. | Use short asks and data tables where they help, with precise options and a quick solution path. Keep the more involved models available for learning and transfer. [Trader Maths](https://www.tradermaths.com/trading-firms-prep/optiver) · [TraderMath](https://www.tradermath.org/practice/firms/optiver) · [Likelihood List demonstrations](https://quantvault.org/optiver-likelihood-list.html) · [Intervals demonstrations](https://quantvault.org/optiver-intervals.html) |

The difficulty review considered the number of reasoning decisions, how much arithmetic is required after the setup, and whether an efficient method is available. For example, recognising a shared source and weighting separate cases is harder than a direct fraction. Inferring an alternating rule and reconstructing missing gaps is harder than extending a visible trend. In an Orderbooks problem with signed legs, the hard step is cancelling several exposures before comparing cash. Larger numbers alone are a poor reason to move a question up a tier.

Timed Beat the Odds keeps its emphasis on counting, complements, conditioning and expected value, with occasional harder work. Composed problems preserve substantive reasoning while defining the base event in one place. For the fixed-seed audit sample, the longest Beat the Odds stem shrank from 103 to 79 words. Readability and solution structure are measurable here. Real candidate solve times for those prompts would require separate timing data.

Published estimation references were also checked where the wording depends on the measured object or units. Examples include the full Forth railway bridge, England and Wales' census population, the Earth and Mars dimensions, and Itaipu's installed power. [Transport Scotland](https://www.transport.gov.scot/news/135-years-of-the-forth-bridge/) · [ONS census estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/populationandhouseholdestimatesenglandandwales/census2021unroundeddata) · [NASA Earth facts](https://science.nasa.gov/earth/facts/) · [NASA Mars facts](https://science.nasa.gov/mars/facts/) · [Itaipu in Numbers](https://www.itaipu.gov.br/wp-content/uploads/2025/11/brochure-itaipu-in-numbers-2023-2025.pdf)

## Validation

- Audited **36,975** items using 96 fixed seeds per registered family and difficulty, all **1,257** entries in the finite generators, all **252** regular fixed questions and **1,386** questions from **70** timed papers. Kept representative prompts, parameters, visuals, solutions and hints across **2,029** observed structures for review. Separately submitted the keyed answers for all **75** reserved questions and **3,200** seeded workshop questions.
- Used **2,717** independent family verification calls, plus separate model oracles in the regression suite for stopping paths, urn reports, sequence laws, tariffs, weighted samples and executable portfolios. Checked **31,991** solution diagram specifications, ranking precision and the uniquely closest displayed multiple-choice answer. The optional backend verification interface passed 192 cases.
- In the matched audit sample, generic or fallback distractors dropped from **13,246 to 5,848** out of 87,724 wrong choices. Where a useful misconception gives the same number as the correct method, the app uses a different choice and describes it without attributing a reasoning error.
- Ran **1,261 JavaScript regression tests**, including ten new tests for the issues in this audit. Exercised the actual app controls for 50 mixed-practice submissions, 99 timed submissions and 100 reserved-paper or workshop submissions. Tested saved progress and resume, including the previous exposure key for the clarified prize question. Opened all nine Zap-N games and completed three through their rendered controls. The game-engine tests cover all nine games.
- Rendered 848 prompt visuals, 1,493 solution diagrams and 469 lesson diagrams in the app's DOM. A separate presentation test checked 30,208 Beat the Odds draws, including the keyed answer after shuffling. It also checked that each of the 37 finite practice pools remains reachable from normal generation.
- Reproduce the generator audit with `node tools/question-quality-audit.mjs /path/to/audit-output` and the regression suite with `npm test`. The seeded audit writes a summary and a separate sample for each observed structure.

## Limits

Public evidence supports the broad formats. Live Optiver questions, precise topic weights, scoring thresholds and exact Zap-N configurations are private or unverified. The examples and timing profiles in OptPrep are original practice material. Some statistical and multi-stage questions have greater depth for practice than the public examples justify assuming in a timed assessment.

The numerical domains that the app declares finite were checked exhaustively. The larger random generators were checked by seeded structural sampling, code review and independent tests. Rendering was checked in the app's DOM, since Chromium could not start in this environment. The optional Python pytest bundle was unavailable, so the backend check used its existing standalone verification interface.
