# Beat the Odds: independent curriculum audit and update

**16 November 2026 · OptPrep 1.6.0-kickstarter.1**

## Outcome and verdicts

Beat the Odds is now a stronger, more balanced probability training resource. The main improvement is practice **choosing mathematical models from assumptions**, rather than simply more arithmetic or more dice templates.

The delivered 1.5.0 version already had substantial conditioning, indicators, pattern, stopping and random-walk work. Several general concepts also existed in its separate Probability foundations book. Its ordinary Beat the Odds practice was less balanced: advanced processes were developed more thoroughly than general success counts, weighted payoffs, restricted counting, variance and nonuniform sums.

This update adds **six main question families, 16 supported family/difficulty combinations, 42 selectable task branches and six linked Study lessons**. It extends first-success waiting, corrects explanations and retains the existing practice systems. Branch counts describe implementation coverage, not independently novel mathematical concepts.

| Dimension | Verdict | Confidence |
|---|---|---|
| Mathematical correctness | Strong for the implemented models | High for the additions: exact rational generation, separate outcome-enumeration checks and 1,519 Python Fraction cases. Existing families also passed the full suite and combined before/after sampling. Not a formal proof of every possible instance. |
| Assessment realism | Useful probability preparation; no verified replica claim | Moderate for broad relevance, low for exact fidelity. Public sources do not publish a full current item taxonomy or difficulty distribution. |
| Difficulty calibration | Defensible internal progression; externally uncalibrated | Moderate for prerequisites and structural demand, low for matching actual Optiver difficulty. No representative actual-test item sample or norming data was available. |
| Educational quality | Materially stronger model-recognition and contrast practice | Moderately high by mathematical/pedagogical review. Learning research supports spacing/mixing; this release has not had a human learning trial. |
| Overall usefulness | Suitable as the primary question-practice application, alongside tutoring and independent unfamiliar problems | Moderately high. Use it for fluency and diagnosis; judge transfer with problems outside the generator. |

## 1. Independent research

Research was conducted on 16 November 2026. The independent standard came from your role-specific invitation, official recruitment information, primary mathematical curricula, a trading firm's own interview guide and cautiously interpreted recent candidate discussion. The existing OptPrep catalogue was not used as the definition of sufficient coverage.

| Evidence | What it supports | What it does not establish |
|---|---|---|
| Your pasted Career Kickstarter Trading 2027 invitation | BTO applies probability theory, has 25 minutes overall and limited time per question; the six assessment names and stated component durations | An official 20-question count, 90-second item allowance, negative marking, cutoff, detailed syllabus or topic frequencies |
| [Official 2027 programme listing](https://www.optiver.com/join-us/jobs/trading/amsterdam/career-kickstarter-trading-2027/?gh_jid=8859789002) | Assessment deadline 6 December 2026, 23:59 CET; numerical/analytical problem solving and decisions under pressure; no prior finance experience required | An online probability blueprint. Content taught during the programme is not automatically assessed on entry. |
| [Optiver Europe recruitment FAQ](https://www.optiver.com/join-us/stories/optiver-europe-recruitment-faq/) | Recruitment context, including result reuse | A complete BTO syllabus |
| [Jane Street Probability & Markets](https://www.janestreet.com/probability-markets/) and its [primary guide](https://www.janestreet.com/static/pdfs/trading-interview.pdf) | Broader trading interview foundations: counting, probabilities, independence, random variables, expectation, conditioning and reasoning | Optiver-specific OA calibration or proof that every advanced interview topic belongs here |
| [MIT 6.041 calendar](https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-spring-2006/pages/calendar/) and [MIT 18.05 syllabus](https://live.ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/pages/syllabus/) | An independent foundation for events, counting, conditioning, distributions, expectation, variance and dependence | A requirement to finish an entire university probability/statistics course before this assessment |
| [July 2026 Kickstarter discussion](https://www.reddit.com/r/quantfinance/comments/1uv3jhp/optiver_assessment/) | A self-reported invitation with the same six modules and a subsequent account of the experience | Verified question distributions, scores or cutoffs. A promotional AI-copilot reply was excluded as evidence. |
| [August 2026 trader-intern discussion](https://www.reddit.com/r/quantfinance/comments/1vzmayu/optiver_trader_intern_oa_beat_the_odds/) | Anecdotal concern about probability speed/preparation performance | Evidence that a practice-site score is an actual Optiver threshold |
| [July 2026 QR discussion](https://www.reddit.com/r/quantfinance/comments/1urevoj/optiver_qr_intern_oa_preparation/) | A different reported BTO duration, illustrating role/cycle variation | A reason to override your own invitation's 25-minute clock |

Commercial preparation sites were leads, not independent authorities for their own replica claims. Historical 30-question/90-second reports were not promoted to confirmed requirements for your invitation. No private portal, restricted question bank or live assessment was accessed.

The invitation's approximate whole-battery duration does not fully reconcile with adding its listed component durations before Zap-N. Component clocks were preserved; no new total was invented to reconcile that discrepancy.

[Rohrer and Taylor (2007)](https://digitalcommons.usf.edu/psy_facpub/1767/), DOI [10.1007/s11251-007-9015-8](https://doi.org/10.1007/s11251-007-9015-8), experimentally compared spaced/massed practice and mixed/blocked mathematics problems. Delayed performance favoured spacing and mixing in those experiments. This supports combining initial focused learning with later mixed practice. It does not measure OptPrep's effect, establish an optimal ten-question block, or validate three cold successes as mastery of a mathematical field.

The design inference is to practise choosing a method as well as executing it. Mixing **within BTO** already creates that demand. Unrelated assessment categories do not need to be mixed to teach probability recognition. No new mode was introduced; the existing optional Batch check remains a separate check with delayed feedback.

## 2. Independent curriculum standard

This is a preparation standard based on mathematical prerequisites and plausible timed structures, not a forecast of exact test content.

| Area | Required capability | Priority |
|---|---|---|
| Sample spaces/event algebra | Identify elementary outcomes and weights; translate inclusive or, exactly one, complements and intersections | Essential |
| Counting | Distinguish ordered assignments, subsets and repeated copies; enforce restrictions and detect impossibility | Essential |
| Conditioning | Restrict and renormalise; use the chain rule; distinguish P(A\|B) from P(B\|A); model how evidence was obtained | Essential |
| Independence/dependence | Justify products; distinguish disjointness and conditional independence; recognise shared causes and depletion | Essential |
| Bayes/total probability | Weight hypotheses by priors and likelihoods, including repeated observations/prediction; avoid base-rate errors | Essential |
| Success counts | Recognise binomial assumptions across contexts; handle exact/tail/band events, no replacement, unequal probabilities and given totals | Essential |
| Expectation | Weight actual net payoffs, transform before averaging, use indicators and linearity without requiring independence | Essential |
| Sequential reasoning | First-step equations, retained/lost progress, first/later success, restart arguments and stopping boundaries | Essential, with deeper examples as stretch |
| Symmetry/exchangeability | Use symmetry only when justified; distinguish unseen removal from observed information; handle ties | Essential |
| Variance/covariance | Separate mean/second moment/spread; square scaling; retain covariance; understand total variance | Strong preparation; conditional mixtures are stretch |
| Combining quantities | Weighted joint outcomes, sums and strict comparisons; observed totals and random horizons | Strong preparation |
| Extremes/occupancy/collisions | Complements, indicators, tail sums, repeated categories, birthdays and collection stages | Strong preparation |
| Continuous uniform geometry | Convert probability to length/area under an explicit sampling model | Useful breadth |
| Approximation | Bounds and size checks; normal approximations with their assumptions | Useful breadth |
| Deeper processes | Pattern overlap, competing patterns, finite walks and optimal stopping | Stretch; actual OA frequency unverified |

Fluent arithmetic, cancellation, diagrams and magnitude checks support every area. Larger integers alone do not justify a higher difficulty. Model recognition, dependencies, constraints and multi-stage reasoning do.

## 3. Whole original curriculum audit

The baseline had **32 main families plus two extended families in ordinary practice: 34 families and 82 family/level combinations**. The separate foundations book already introduced event algebra, counting, distributions, expectation and some Poisson/normal material. “Missing” below generally means missing or thin in sustained BTO practice, not absent from every page of the app.

Every original generator, supported level, answer model, solution logic and verifier was inspected. Static Study content was checked through validators/live examples and reviewed for foundational coverage and the identified explanation issues. Prose schema validation does not independently prove every sentence or its teaching effectiveness.

| Original family | Levels | Coverage and judgement |
|---|---|---|
| `two-dice-sum` | 1,2 | Ordered pairs, exact/threshold/set/band/parity/divisibility events. Sound counting; changing bounds is mainly numerical variation. Retained. |
| `die-repeats` | 1,2 | Same/different/specified faces, adjacent and global repeat structures. Important distinctions within a finite sample space. Retained. |
| `dice-order-stats` | 1,2 | Max/min, doubles, signed/absolute differences and thresholds; CDF differences versus direct counts. Retained. |
| `three-dice` | 2,3 | Three-outcome counting and sum/event conditions. A genuine extra counting dimension, with recognisable branches. Retained. |
| `at-least-one` | 1,2,3 | Strong reusable complement reasoning. Not a substitute for general counts. Removed an unsupported frequency claim. |
| `first-success` | 1,2 | First-hit mass/tail and alternating races. Memorylessness and later-success waiting were missing from generated practice; added. |
| `conditional-dice` | 2,3 | Conditional spaces, reversed conditions and event contrasts. Good denominator recognition. Retained. |
| `card-symmetry` | 1,2 | Fixed positions, unseen/seen discards and relative order. Strong structural variation. Retained. |
| `card-draws` | 1,2,3 | No-replacement products, hand events, suits/ranks, thresholds and distinct-rank restrictions. Comparatively rich; retained. |
| `urn-draws` | 2,3 | Correct two-colour hypergeometric exact/tail counts. Feedback falsely implied no-replacement answers always differ from binomial answers; corrected. |
| `coin-sequences` | 1,2,3 | Fair-coin counts, symmetry, runs and neighbour constraints. Does not fully train biased or unequal-trial counts; complemented. |
| `race-to-k` | 2,3 | Biased series/races and stopping-length events. Useful binomial/stopped-series connection, but not a general count introduction. Retained. |
| `pattern-waiting` | 3,4 | Self-overlap, retained prefixes and competing patterns. Strong advanced material: HH versus HT changes the recurrence. Retained. |
| `bayes-test` | 2,3,4 | Base rates, positive/negative evidence and repeated signals with conditional assumptions. Retained. |
| `bayes-boxes` | 2,3 | Hidden objects, visible faces, repeated flips and likelihood ratios. Good cross-context reasoning. Retained. |
| `monty-hall` | 2,3 | Knowing/blind hosts and partial opening. Strategy answers were sound; labelled-door posterior claims needed host-policy qualification. Corrected. |
| `pigeonhole` | 1,2 | Certainty bounds contrasted with occupancy probabilities and small enumerations. Valuable “must” versus “probably” distinction. Retained. |
| `birthday` | 2,3 | Collision complements under uniform-category assumptions. Unequal-category cases are not systematic. Retained. |
| `derangements` | 2,3 | No matches and fixed-point combinatorics. Useful but can become a remembered recurrence; complemented by restricted counting. |
| `expected-waiting` | 1,2,3 | First events, collection stages, adjacent repeats and runs, with Markov checks. Corrected independence, frequency and discrete-median wording. |
| `coupon-collector` | 2,3 | Equal-type and partial collection/stage waits. Strong stage sums; nonuniform collection remains an extension. Retained. |
| `linearity` | 2,3,4 | Indicators for matches, runs, patterns, records, occupied/empty types and other counts. Especially strong method transfer. Retained. |
| `expected-extremes` | 2,3,4 | Max/min and tail-sum expectations. Good representation practice; complemented by general discrete sums. |
| `dice-duel` | 2,3 | Different dice, comparisons, ties and repeated/nontransitive-style contexts. Generation and some checks share enumeration. Retained. |
| `dice-games-ev` | 2,3,4 | Nonlinear die payoffs and reroll value. Strong game work, thinner general weighted payoff work. Corrected universal E[f(X)] inequality. |
| `card-stopping` | 4,5 | Stop/continue DP on a changing deck. Substantial advanced work; checking with the same state recurrence is less independent than a different proof. Retained. |
| `running-sum` | 3,4 | Threshold crossing and stopped accumulation through states. Useful stretch; difficulty not externally normed. Retained. |
| `random-walk-line` | 3,4 | Path probabilities, parity and hitting/reflection reasoning. Valuable if derived rather than memorised. Retained. |
| `polygon-walk` | 3,4,5 | Return/hitting times, visit order and relative motion. Meeting configurations restrict parity; general reachability is incomplete. Softened overbroad claims. |
| `gamblers-ruin` | 2,3,4 | Fair/biased absorption probabilities and durations. Corrected bounded-stopping-time justification. Retained. |
| `clt-estimates` | 3,4 | Standardisation/normal approximation from supplied moments. Does not teach general variance calculation by itself. Retained. |
| `uniform-geometry` | 2,3,4 | Continuous area/length, meetings and stick-type events. Sampling protocols matter; a Monte Carlo verifier is evidence, not proof. Retained. |
| `information-protocols` | 2,3,4 | Different mechanisms for obtaining similar verbal evidence. Strong existing conceptual contrasts. Retained in ordinary practice. |
| `shared-source` | 2,3,4,5 | One hidden source versus fresh choices, posterior prediction and dependence. Strong; now connected to expectation and variance. Retained. |

### What diversity means

- **Numerical:** changing counts, bounds, probabilities or rewards while retaining the procedure. Useful for fluency, insufficient alone.
- **Surface:** retelling the same equal-p experiment through coins or returned cards. Useful recognition practice, not a new mathematical concept.
- **Structural:** changing replacement, conditioning, constraints, shared sources or reuse. The model/calculation changes.
- **Conceptual:** recognising the applicable principle without a family label and explaining why it applies. The questions create opportunities for this; code metrics cannot establish that the learner acquired it.

The app remains an authored generator collection. A high score on one recurring branch is weaker evidence than solving a changed-assumption problem from a new source.

## 4. Implemented mathematical additions

Numeric levels retain the existing meaning. The roadmap groups a skill by its lowest supported level: 1 gives Easy, 2 Medium, 3+ Hard. An Easy-listed skill can have later harder levels. No mastery scheme was replaced.

| Family | Levels | Branches and purpose |
|---|---|---|
| `event-algebra` | 1,2 | Union, exactly one, neither; conditional event, recover overlap, independent union and three-event inclusion-exclusion. Select the event before calculating; separate disjointness from independence. |
| `success-counts` | 1,2,3 | Exact count; tail, band and replacement contrast; conditional count, split across blocks given a total, and unequal independent trial probabilities. Contexts include coins, dice, cards and urns. |
| `payout-models` | 1,2,3 | Weighted mean/net profit; break-even probability, cap and bonus; conditional mean, source mixture and signal-conditioned expectation. Separate weighting, transformation, cost and evidence. |
| `restricted-counting` | 2,3 | Labelled roles, multicolour samples, adjacency; gaps, repeated-copy strings and conditioned samples. Count consistent objects and retain impossible zero-probability cases. |
| `variance-dependence` | 2,3,4 | Weighted variance/scaling; independent sums, reused X, covariance, finite-population sampling; shared/fresh source count variance and signal-conditioned variance. Includes cancellation, negative covariance and full-deck zero variance. |
| `discrete-sums` | 2,3,4 | Exact sum; tails, strict comparison, random horizon; conditioning on a sum and independent-versus-reused draws. Generalise dice grids to nonuniform distributions. |

First-success level 2 additionally covers:

1. Memorylessness: P(T>u+v | T>u)=(1−p)^v for independent constant-p trials. Explanations state when this fails.
2. Later-success waiting: P(T_r=k)=C(k−1,r−1)p^r(1−p)^(k−r). The terminal success must be fixed; this differs from an unrestricted count in k trials.

Its complete level-2 catalogue grows from **22 to 197 prompts**: 120 memorylessness inputs and 55 later-success inputs. Old variants, ID and levels remain. The Study lesson derives E[T_r]=r/p by adding stage waits; successes need not be consecutive.

Every new family has per-question worked reasoning, assumptions, misconception alternatives, family guidance and a full linked Study lesson. The new Study chapter has worked/faded examples, predictions, error diagnosis, contrasts and live practice. Catalogues and the recognition tree were updated. No interface redesign or extra mode was added.

### Quant Sprint comparison

The attached `Quant-Sprint-main (1).zip` was inspected, especially `probability-breadth.js` and sampling, restricted-selection, conditioned-count, first-success and payout-moment builders.

| Useful idea | Independently implemented destination |
|---|---|
| Multicolour sampling/restricted selections | Restricted-counting family with labelled-subset checks |
| Conditioned trials | Success counts and cancellation of common p after conditioning on a total |
| Payout moments/mixtures | Weighted payoffs and variance/dependence |
| Later successes | Existing first-success family extension |
| Inverse-variance portfolio weighting | Not made core BTO; broader interview material with weaker current-OA justification |

No licence file was found in the attachment. Mathematical ideas were implemented independently; its source, UI, progress system and calibration claims were not copied wholesale. It was a mathematical comparison source, not evidence of Optiver's syllabus.

## 5. Explanation corrections

These are corrections of mathematical reasoning/presentation, not discoveries of failed keyed baseline answers:

- **Urns:** replacement and no-replacement models can give the same answer for a particular event. Equal red/blue populations and an odd three-draw majority give 1/2 under both. Identify the model from assumptions. Multiplying red/blue subset counts is a counting product, not independent draws.
- **Expected waiting:** adding integrable stage means needs no independence. A discrete median reaches at least 50%, not necessarily exactly 50%. Removed an unsupported claim about test frequency.
- **Gambler's ruin:** absorption time has no fixed upper bound. Bounded stopped wealth and almost-sure absorption, or a finite first-step proof, justify this result.
- **Nonlinear EV:** E[f(X)] need not equal f(E[X]); a universal “not equal” statement was too strong.
- **Monty Hall:** a uniform random switching strategy can be priced without identical labelled-door posteriors under an unspecified host policy. The solution now conditions on the initial pick. Named-reveal calculations in Study explicitly assume uniform legal reveals. A biased-host regression checks the distinction.
- **Claims:** softened unsupported “half of all questions”, “most common harder items” and “almost every variant” language. The book no longer implies an official exhaustive taxonomy.

Old visible question prompts remain unchanged for feedback-only fixes, preserving exposure fingerprints.

## 6. Difficulty and transfer judgement

Progression starts with disjoint cells, a weighted mean, an equal-p count and small uniform-support sums. It adds transformations, restrictions, replacement choices and tails, then conditioned totals, unequal probabilities, mixtures and shared randomness. Harder work combines posterior updating with variance or a random horizon with a distributional event.

This is a prerequisite judgement, not a timed norm. Individual seeds can admit shortcuts or extreme answers; difficulty is not strictly monotone for every question. Longer fractions are not themselves mathematical difficulty. Source-conditioned variance and complex stopping remain stretch work, not claims of routine Kickstarter content.

The strongest change is contrasting assumptions. “Use binomial” is insufficient unless the trials are independent, fixed in number and equal-p. “Add variances” is insufficient if the terms reuse a draw or share a source. These decisions survive changes of story.

## 7. Verification and measured results

Current results are in [curriculum-validation.json](../evaluation/curriculum-validation.json). Reports without the `curriculum-` prefix remain historical; their numbers must not be represented as this release's results.

| Check | Result |
|---|---|
| Complete JavaScript suite | **1,157 passed, zero failed/skipped** |
| Complete Python backend suite | **36 passed** |
| Complete C++ suite | **34 passed** |
| Total unit tests | **1,227**; the generated-case counts below are additional checks, not more unit tests |
| Explicit added branch checks | **42 × 128 seeds = 5,376**, including reproducibility, mathematical/choice contracts and wrong-answer mutation checks |
| Separate Python Fraction oracle | **1,519 cases**, including every one of the 175 new waiting inputs |
| Combined before/after mathematical sample | **46,080 items verified** across supported old/new BTO levels |
| Display/choice sample | **25,088 items**, all keyed choices uniquely closest after rounding |
| Complete finite catalogues | **33 pools, 1,146 entries**, unique, individually verified and reachable |
| DOM integration | **13 scripts passed**; new-family script has 200 assertions |
| Whole learning walkthrough | **109 skills, 1,100 questions, 716 assertions**, five reasoning sections, no uncaught app errors |
| Cross-mode regression | **5,560 questions, zero exact repeats**: 1,090 focused, 1,000 mixed, 2,970 questions across 150 mocks, 500 Batch questions |
| Static Pages assembly | 455 JavaScript files parsed, 1,232 relative module references resolved, 467 cache files; all new modules included |
| Visual QA | Desktop Chrome and a 390px responsive iframe; saved draft/resume, completion, Study entry, variance answer/table and retained earlier synthetic progress |

### Independence of mathematical checks

Generation uses exact `Q` rational arithmetic. The new JavaScript oracle imports no generation helpers:

- Weighted binary paths check binomial, depleted sampling, conditioned blocks and unequal-p counts.
- Joint source/signal/payoff atoms check conditional and mixture expectations.
- Centred squared deviations over explicit outcomes check variance; labelled subsets check depleted totals. Fresh-source paths are expanded rather than verified through the generator's total-variance identity.
- Cartesian products/tuples check sums and random horizons without reusing convolution.
- Ordered roles/positions, labelled subsets and direct unique-string construction check restricted counts instead of repeating factorial formulas.
- A separately written Python standard-library oracle imports no app code and uses Fraction arithmetic, outcome paths, combinations/permutations and centred deviations.

Both implementations still depend on the intended model, so wording/assumptions also received review. Contracts cover plain-JSON inputs, domains, integer count choices, distinct alternatives, boundaries, reproducibility and absence of NaN/undefined explanations. Existing Monte Carlo checks remain stochastic and some baseline verifiers use similar recurrences to generation; they were not relabelled as independent formal proofs.

### Before/after comparison

The [full comparison](../evaluation/curriculum-comparison.json) includes each family/level row and null baseline entries for new families.

| Measure | 1.5.0 | 1.6.0 | Meaning |
|---|---:|---:|---|
| Main BTO families | 32 | 38 | Six additions, none removed |
| Ordinary BTO practice families | 34 | 40 | Same two extended families retained |
| BTO family/level combinations | 82 | 98 | Sixteen additions |
| First-success level-2 complete pool | 22 | 197 | More models and numerical inputs, not 175 new concepts |
| First-success level-2 unique prompts in 256 raw draws | 21 | 89 | Measured visible variation |
| Sum of distinct sampled prompts per family/level | 5,283 | 8,733 | Updated curriculum has more sampling opportunities; not a normalised learning-effect metric |
| Session-regression exact repeats | 0/5,500 | 0/5,560 | Preserved an existing property |

Displayed correct-position counts were **4,964 / 5,059 / 4,927 / 5,041 / 5,097**. This removes a fixed correct-letter rule. Numerical-magnitude cues remain possible: ascending-value correct-rank counts were **1,699 / 5,332 / 9,079 / 5,725 / 3,253**. No complete answer-pattern immunity is claimed.

Restricted-counting level 3 produced 64 distinct prompts in 256 raw draws. That is variation within a few methods, not limitless conceptual novelty. Actual practice applies the existing exposure ledger and freshness selection instead of accepting raw generator repetition.

### Development failures and repairs

Initial tests caught insufficient alternatives for some boundary probabilities, overly close fillers for large repeated-letter counts, and sum explanations without an explicit equation. These were fixed without removing zero/impossible cases. Lesson checks caught verbal length cues and teaching units lacking a check; the material was repaired.

The expanded waiting catalogue's rarest input was initially missed by the old random membership seed budget. Coverage was increased with catalogue size, keeping exact generated-domain equality and last-unseen/exhaustion checks. Count assertions were updated to current/derived family counts; ten-question and timing assertions remain.

## 8. Preservation and provenance

The starting point was delivered **1.5.0-kickstarter.1**, implementation `8c4690dc869af573fbc309d9c692e89b4cfbcb7d`, provenance `7d710342fe5cd114a2d1223442f3cc80303ab3e0`. Its ZIP SHA-256 was `73e7490dd91cf517c22131061f888938baf9a719e64e1c11a918945895c79e1b`; all 713 tracked baseline files were byte-compared before editing.

Eleven protected files were byte-compared with the baseline: licence, preset, section configuration, store, migration, fingerprints, recognition, learning, mixed-selection rules, scoring/checking and runner. Existing family IDs and levels remain, as do all previously enumerated BTO prompt identities.

The `optprep:v2` store and practice snapshot schema remain unchanged. XP, coverage, old mastery, proofs, pace evidence, history, settings and saved question/draft are not reset. New skills start unlearned; denominators can grow without erasing completed work. A saved question remains the saved object; new draws use the expanded library.

The new families participate in learning, mixed, Batch and mock training. This broadens mock **content** without changing configured counts, clocks or scoring, and does not imply a new official Optiver topic distribution. The development cache marker was advanced; the unchanged Pages workflow uses commit-specific deployment caches and discovers all modules for offline installation. MIT attribution remains. No public repository, live Pages deployment or production progress was modified.

## 9. Remaining gaps and separate study

| Not systematically developed in BTO practice | Recommendation before 6 December |
|---|---|
| Poisson counts/exponential waiting | Basic material exists in foundations, but not a comprehensive BTO family. Learn assumptions/basic examples briefly after essentials; avoid turning this into a whole stochastic-process course. |
| General rth marked-card waiting without replacement | Worth a short independent exercise set. Condition on the last draw and count earlier successes; geometric memorylessness does not apply to a depleted deck. |
| Unequal-category birthdays/coupon collection | Useful advanced extension once the uniform cases are understood. |
| Pairwise versus mutual independence; uncorrelated but dependent variables | Learn and explain a counterexample. The distinction is stated, but no exhaustive counterexample curriculum is implemented. |
| General densities, Jacobians, arbitrary order statistics | Broader probability/interview work; basic uniform geometry has higher immediate priority. |
| General Markov reachability and all two-walker parity configurations | Useful stretch. Existing polygon meeting configurations restrict cases and do not test every impossibility. |
| Jensen/Markov/Chebyshev inequalities, generating functions and full CLT/LLN proofs | Later breadth; no independent evidence makes them current Kickstarter necessities. Start with simple bounds/intuitions. |
| Kelly betting, portfolio weighting and options pricing | Broader trading/interview material, not mandatory OA probability simply because the employer is a trading firm. |
| Statistical inference, regression, stochastic calculus, measure theory | Outside this focused assessment curriculum. |

The most valuable unverified property is **human transfer**, not another template count. The software cannot tell whether a learner selected the right model for the right reason. Solve external problems without labels, state assumptions before calculating, change one assumption and explain the effect, and revisit errors after a delay.

## 10. Preparation use

Start with event algebra, success counts and weighted payoffs alongside dice/cards/conditioning/expectation. Add restricted counting, sums and variance as prerequisites become comfortable. Source-conditioned variance and difficult stopping are stretch work.

1. Learn/repair one skill through ten focused questions. Ask ChatGPT about the sample space, assumptions, alternative methods and errors. A learning tick records coverage.
2. Mix learned skills **within BTO**. Identify the quantities, event and assumptions before calculating. Close outside help for an independent attempt; mark help honestly when used.
3. Review misses and slow correct answers. Separate model-selection, counting, conditioning, arithmetic and time-allocation errors. Repeating a known answer is not new cold evidence.
4. Attempt an external unfamiliar problem without a topic label. Change an assumption and explain how the method changes.
5. Use timed sections for sustained pace under the invitation-aligned overall clock; keep stretch training separate from full-clock performance.

An eight-hour week across the whole battery can start with **3h BTO, 1h15 NumberLogic, 1h15 Likelihood-list, 1h Orderbooks, 45m Intervals, 15m Zap-N and 30m general error review**. Include external problems and a timed probability section within BTO's time. Shift time toward measured weaknesses. A full-battery rehearsal replaces that week's subject blocks rather than adding extra time.

Use [MIT course problems](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/) and Jane Street's guide as independent sources, choosing introductory counting/probability/expectation first. They provide unfamiliar work without pretending to be the same assessment. Begin mixing after a few skills; do not postpone all mixed practice until finishing every topic.

## 11. Running and reproducing

Normal app use needs Node.js 20+ only: extract the ZIP, open the folder containing package.json, run `npm start` and open the printed URL. Do not double-click index.html.

Development checks from the application root:

```sh
npm test
node tools/build-catalog.mjs
node tools/mixed-question-quality.mjs evaluation/curriculum-question-quality.json
node tools/focused-assessment-regression.mjs evaluation/curriculum-assessments.json
node tools/curriculum-evaluation.mjs /absolute/path/to/the-preserved-1.5.0-checkout
python tools/curriculum-oracle.py
npm install --no-save --package-lock=false jsdom
node tools/curriculum-dom-regression.mjs
cmake -S engine -B engine/build -DCMAKE_BUILD_TYPE=Release
cmake --build engine/build
ctest --test-dir engine/build --output-on-failure
python -m pip install -e ./backend pytest
python -m pytest -q backend/tests
```

The comparison tool needs the separate original 1.5.0 source, not duplicated inside the updated ZIP. Its exported corpus/report are included, so the Python oracle runs without that checkout. If jsdom is elsewhere, set `OPTPREP_TEST_JSDOM` to its module path. The optional backend requires Python 3.12+; native checks require CMake 3.20+ and a C++20 compiler, with GoogleTest available locally or downloadable. These dependencies are optional for using the app.

Visual evidence is in `docs/media/validation/optprep-curriculum-*.jpg`, showing synthetic QA activity. Narrow-screen testing used an iframe in Chrome, not a physical Android device or a complete cross-browser matrix. Queried console errors were extension metadata errors; no claim is made that the entire browser console was empty.
