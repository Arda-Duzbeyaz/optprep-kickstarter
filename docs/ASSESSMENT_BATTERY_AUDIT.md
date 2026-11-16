# OptPrep: remaining assessment battery audit and improvements

**16 November 2026 · 1.7.0-kickstarter.1 · NumberLogic, Likelihood List, Intervals, Orderbooks and Zap-N**

## Finding and decision

OptPrep is now a stronger preparation question bank, with useful mathematical breadth and substantially checked answers. Its strongest use is learning a method, recognising it in a mixed section, and practising accurate execution under a clock. It is not independently calibrated to Optiver's proprietary items, scores or selection thresholds.

The baseline already had considerable coverage: **30 NumberLogic families, 16 Likelihood List families, 15 Intervals families, eight Orderbooks families and nine games**. Replacing those with a much larger collection of arbitrary puzzles would have been counterproductive. The justified changes address specific missing relationships, misleading explanations and actual engine/verifier defects:

- NumberLogic: make the answer-producing strand genuinely harder at the hard interleaved levels; extend residual-rule combinations.
- Likelihood List: add stratified/pooled/reverse-conditioned rates and equal-group sampling; add unequal-width density histograms; separate overlapping scatter dots and correct misleading interpretation advice.
- Intervals: add bounds, sensitivity and shared-error reasoning; distinguish illustrative error models from measured calibration; fix an independent backend coupon-collector verification error.
- Orderbooks: extend weighted baskets to negative as well as positive weights; state the actual acceptance rule correctly.
- Zap-N: fix an unseen-stimulus input transition and incomplete scoring opportunities; separate Balloon decision quality from luck; correct Figure It Out coaching.

The existing guided learning, ten-question blocks, within-assessment mixed practice, saved questions, progress store and Career Kickstarter clocks remain. **No new practice mode or extra game was needed.** Beat the Odds and its earlier curriculum expansion are retained.

## 1. Starting point and investigation method

The starting point was the delivered **1.6.0-kickstarter.1** application, not upstream OptPrep. The current input archive was materialised and all **745 tracked files** matched the retained baseline checkout before editing.

| Provenance | Value |
|---|---|
| Input archive | `OptPrep_Kickstarter_Transfer.zip`, version 11 |
| Input SHA-256 | `6263ab0230026e93d4f141f59aaa1d738cdd8fddf8d58c50b1a9ef9e623962d4` |
| Baseline archive/provenance revision | `0bbeb34dd570e8cf936abac79614cc93431df7bd` |
| Baseline implementation revision | `ff7770b6dc2785358cdd827730cc04a6efcc0cf4` |
| Upstream attribution | [Coflazo/optprep](https://github.com/Coflazo/optprep), original MIT licence retained byte for byte |

The process combined independent research, inspection of every remaining registered question family and level, inspection of the nine game engines and their views/coaching, lesson/catalogue review, seeded generation, independent mathematical recomputation, full tests, DOM integration and a live browser check. Registry and contract coverage is exhaustive for the application; numerical samples are not exhaustive over every possible random seed. Lesson schemas, diagrams and checks were tested throughout the library. Targeted mathematical prose was reviewed and corrected; automated schema checks do not prove every prose statement.

The family-by-family inventory below is deliberately broader than a list of changed files: a retained family was assessed rather than assumed correct because it already existed.

## 2. What the evidence establishes

### Evidence hierarchy

1. **Your invitation** is the primary source for your six module names, descriptions and section durations.
2. **Official Optiver material** establishes the programme, deadline, general skills and recruitment policies. It does not publish an item bank, exact syllabus, scoring formula or difficulty distribution for these modules.
3. **Recent first-person candidate accounts** help identify plausible formats. Their identities, scores and outcomes are not independently authenticated, and roles/cycles differ.
4. **Commercial preparation descriptions** are useful leads but cannot validate their own replicas. Counts and timing claims conflict across providers.
5. **Primary mathematical and learning research** supports what a sound exercise should teach. It does not establish that Optiver asks that exercise.

Research was checked on **16 November 2026**. No future 2027 candidate experience is treated as evidence already available. No live/proctored assessment was accessed or answered.

### Confirmed invitation information versus retained trainer assumptions

| Module | Confirmed by your invitation | Preserved application assumptions |
|---|---|---|
| NumberLogic | Numerical reasoning, 25 minutes | 26 sequence items, five choices, free navigation, +1/−1 scoring, trainer readiness target |
| Likelihood-list | Rank outcomes by likelihood, limited time per item, about 25 minutes overall | Three statements, 15 items, 90 seconds per item, exact-order credit |
| Intervals | Estimate quantities and set lower/upper bounds, about 15 minutes | 18 items and the `lower/upper` score when the truth is included; no invented per-item deadline in the Kickstarter preset |
| Orderbooks | Profit from buying/selling combinations, about 15 minutes | 20 static boards, unlimited repeat taps on quoted units, flat-position acceptance, five-second wrong-submit penalty |
| Zap-N | One or more short neuro games, each 2–15 minutes | These nine named games, their parameters, outcome metrics and readiness targets |
| Beat the Odds, preserved | Probability, limited time per question, 25 minutes overall | 20 items, 90-second item budget and +1/−1 scoring |

The section configuration and the Kickstarter preset were preserved. An assumed item clock and assumed item count can bind before the overall section clock: for example, 15 × 90 seconds is 22.5 minutes for Likelihood List. That is a limitation of the retained simulation, not evidence that your invitation's 25 minutes is wrong. The approximate email total also does not justify changing individual stated durations.

The official [2027 role listing][S1] corroborates the deadline, emphasises numerical reasoning and decisions under pressure, and says prior finance experience is unnecessary. The [June 2026 Europe FAQ][S2] confirms the eight-month assessment reuse/reset policy. Neither supplies the missing scoring and item-level details.

### Candidate and commercial evidence

| Source | What it contributes | Reliability/use here |
|---|---|---|
| [August 2026 OA discussion][C1] | Recent six-module invitation text consistent with your battery | Corroboration of module identity, not calibrated difficulty |
| [July 2026 Kickstarter discussion][C2] | Candidate reports Likelihood List felt hard/fast and Orderbooks relatively straightforward | An individual's experience; reported item timing is not your official instruction |
| [July 2026 internship discussion][C3] | Similar six-module battery; comments on bounds and arbitrage | Different application; qualitative only |
| [August 2026 research-intern discussion][C4] | Questions about width penalties in Intervals | Useful evidence of candidate uncertainty, not proof of a score formula |
| [TraderMaths][C5], [Quantt][C6], [Outcry][C7], [QuantVault][C8] | Sequences, chart/table rankings, interval estimates, combinations and game descriptions | Commercial claims; conflicting counts/times prevent treating them as independent validation |
| [2023 SWE repository][C9] | Older named game descriptions | Different role and year; cannot establish your 2027 game selection |

Promotional comments advertising assistance during assessments were excluded. No pass threshold, claimed admission rate or provider's “exact replica” wording was accepted as a validated norm.

## 3. Independent curriculum standard

This standard was established from the invitation's abilities, public format evidence and mathematical requirements, rather than from OptPrep's current family names.

| Assessment | Essential skills | Useful stretch | Low priority for this assessment deadline |
|---|---|---|---|
| NumberLogic | Differences/ratios, index relationships, recurrence, alternating/interleaved structure, fractions/decimals, checking the entire prefix, efficient hypothesis rejection | Decomposing two rules; higher-order differences | Memorising exotic digit tricks or very large recurrences; treating every sequence label as a distinct concept |
| Likelihood List | Translate the sampling procedure, count/normalise, conditioning, subsets/complements, tables and charts, compare without overcalculating, uncertainty about missing assumptions | Changing group weights, reversal, area/density, dependence, simple sequential distributions | Advanced stochastic-process theory; treating correlation as a conditional-frequency guarantee |
| Intervals | Accurate central estimates, units/scales, approximate arithmetic, bounds, plausible model assumptions, distinguish spread from guaranteed bounds, review misses versus excessive width | Error propagation, shared sources, sensitivity, statistical sample-versus-population distinctions | Calculus-heavy estimation theory; choosing a universal confidence percentage without knowing the score rule |
| Orderbooks | Executable bid/ask sides, signed quantities, exact exposure cancellation, basket comparisons, spread costs, find a valid profit quickly | Weighted signed baskets and multi-basket dependencies | Options pricing, live market microstructure, queue modelling and execution risk unless your portal actually introduces them |
| Zap-N | Understand each instruction, accurate controls, sustained attention, response inhibition, task switching, working-memory/planning strategies | Task-specific familiarity and objective feedback | Expanding the game collection or claiming that hours of brain games create general quantitative intelligence |

Broader numerical reasoning includes percentages, rates, weighted averages, tables and graphs. [SHL's own assessment description][M6] is a useful independent example of those abilities, **not evidence Optiver uses SHL**. OptPrep distributes these across Likelihood List and Intervals, whereas its NumberLogic module specifically trains sequences. Consequently, NumberLogic alone should not be treated as a complete general numerical-reasoning course.

### What meaningful variation means

- **Numerical:** different coefficients/counts within the same procedure. Necessary for fluency; limited evidence of transfer.
- **Surface:** different names or chart context without a changed relationship. Helpful for interpretation, not a new concept.
- **Structural:** different conditioning, sign, dependence, weighting, position or operation sequence. This is the main target of the improvements.
- **Conceptual:** recognising the governing principle in an unfamiliar situation without a topic cue. The application can offer opportunities for this; actual transfer must be demonstrated on held-out material.

Difficulty is an authored training judgement, not a measured Optiver percentile. The roadmap groups families by their first supported level: levels 1, 2 and 3+ begin in Easy, Medium and Hard respectively. These band labels are not synonymous with every numeric level used inside a family. Later checkpoints use that family's supported levels. Existing progression semantics were not changed.

## 4. NumberLogic audit and changes

### Verdict

Coverage is already broad for reported sequence questions. Many of the 30 labels share underlying mathematics: arithmetic increments, triangular numbers and quadratic terms overlap; geometric terms, affine recurrences and geometric differences are related. The main gap was not a missing catalogue of famous sequences. It was a hard interleaved generator whose required answer could still use an easy arithmetic/geometric strand, plus limited combined-rule residuals.

| Family ID | Levels | Audit finding and disposition |
|---|---|---|
| `arithmetic` | 1 | Constant differences; appropriate foundation, retained. Numerical variation dominates. |
| `geometric` | 1–2 | Integer/fraction ratios; retained. Check ratios rather than apparent absolute gaps. |
| `second-diff` | 1–2 | Constant second differences; retained. Conceptually overlaps quadratic families. |
| `add-index` | 1–2 | Increasing index-dependent increments; retained, related to triangular/quadratic structure. |
| `squares-plus` | 1–2 | Scaled/shifted squares; retained. Recognition can become templated in focused practice. |
| `triangular` | 1–2 | Triangular transforms; retained as an accessible accumulation model. |
| `diff-geometric` | 2–3 | Geometrically growing gaps; retained; useful difference-versus-ratio distinction. |
| `affine-recurrence` | 2–3 | Multiply then offset; retained, useful bridge to combined rules. |
| `fibonacci-like` | 2–3 | Sum two previous terms; retained with varied initial conditions. |
| `multiply-index` | 2–3 | Position-dependent multiplier; retained; genuine operation-sequence change. |
| `interleaved` | 2–5 | **Changed:** hard answer strand is quadratic at 4 and Fibonacci-like at 5; 8/9 visible terms supply four observations per strand. Levels 2/3 retained. |
| `alternating-ops` | 2–3 | Alternating transformations on neighbours; retained; distinguish from independent strands. |
| `cubes-plus` | 2–3 | Cubic/linear transforms; retained as polynomial stretch. |
| `pronic` | 2 | Products of nearby integers; retained, overlaps quadratic reasoning. |
| `primes` | 2–3 | Prime transforms; retained. Replaced the overstrong “no formula” claim with a statement about simple polynomial gaps. |
| `powers-offset` | 2–3 | Shifted exponentials; retained. |
| `decimals` | 2–3 | Exact rational decimal patterns; retained. Removed an unconfirmed claim about actual calculator availability. |
| `alternating-signs` | 2–3 | Sign and magnitude separation/negative multiplier; retained. |
| `third-diff` | 3–4 | Cubic finite differences; retained as harder polynomial reasoning. |
| `tribonacci` | 3–4 | Three-term addition; retained; greater working-memory load, not a wholly different principle. |
| `weighted-two-term` | 3–5 | Weighted recurrences; retained; useful coefficient/sign variation. |
| `product-recurrence` | 3–4 | Product of preceding terms; retained as stretch. Large arithmetic need not mean better transfer. |
| `prime-gaps` | 3–4 | Prime increments; retained; corrected the same overstrong prime explanation. |
| `sum-previous` | 3–4 | Rolling sums plus offset; retained, overlaps recurrence reasoning. |
| `digit-sum` | 3–4 | Digit sum/product process; retained but lower priority than core algebraic patterns. |
| `fractions` | 3–5 | Numerator/denominator relationships and Fibonacci ratios; retained; exact equivalent values checked. |
| `fibonacci-squares` | 4 | Familiar recurrence hidden by powers/products; retained as optional stretch. |
| `reverse-digits` | 4–5 | Reversal addition; retained but not established as central OA material. |
| `square-minus` | 4–5 | Squaring plus adjustment; retained as stretch, not a calibration claim. |
| `mixed-combo` | 5 | **Expanded:** four retained variants plus square and geometric residual sequences after removing the multiplier. |

The shared sanity check previously inferred future monotonicity from the shown terms. It now asks the learner to validate the proposed continuation against the rule; a finite observed trend does not establish the next direction.

### Mathematical checking and limitations

The shared generator uses rational arithmetic and a bounded catalogue of competing patterns to reject identified conflicting next answers. The Python oracle separately reconstructs **all 30 models**, every displayed term and the answer, using `Fraction` and independent recurrence/formula code.

This proves consistency with the authored model on the checked cases. **No finite prefix uniquely determines its next term among every conceivable mathematical rule.** A bounded ambiguity screen is useful but cannot prove universal uniqueness. The task is selecting the simplest supported intended rule, not discovering a logically forced infinite sequence.

Hard interleaving now requires a harder operation on the strand that matters. This is a more appropriate progression even though the sampled branch-proxy count falls from two to one at each hard level. That reduction demonstrates why simply maximising a template-count metric would be misleading.

## 5. Likelihood List audit and changes

### Verdict

The existing curriculum already combined chart interpretation, elementary event reasoning and several dependence/sequential models. The important missing structures were **unequal group weighting** and **unequal-width histogram density**. Both can defeat a superficially plausible shortcut while requiring modest arithmetic.

| Family ID | Levels after change | Audit finding and disposition |
|---|---|---|
| `conjunction` | 1–3 | Two-way counts, subsets and conditional denominators; retained. Good foundation for chart/table transfers. |
| `conditional-rates` | 2–4 | **New:** within-group, pooled, equal-group and reverse-conditioned sampling; both aggregation reversal and agreement. |
| `score-table` | 2–4 | Finite score distributions/conditions; retained; recounted probabilities. |
| `football` | 2–3 | Discrete result events and combinations; retained; sports context is surface variation on event algebra. |
| `survey-bar` | 2–4 | Group counts and conditional scopes; retained. |
| `fund-returns` | 2–4 | Empirical return-history comparisons; retained; histories are not a guarantee of future returns. |
| `histogram-bins` | 2–4 | Levels 2/3 retained; **new level 4** uses unequal-width frequency-density bars and area-based counts. |
| `scatter-regions` | 2–4 | Exact point-region counts; **changed** minimum dot separation and wording about trend versus conditional frequency. |
| `density-curves` | 2–4 | Areas under piecewise densities, complements and conditional areas; retained. Point height is not event probability. |
| `markov-graph` | 3–5 | Sequential/long-run distributions; retained; corrected time-average versus fixed-time convergence for periodic chains. Stretch, not a confirmed OA requirement. |
| `dice-events` | 1–3 | Exact finite outcomes and event comparisons; retained. |
| `card-events` | 2–3 | Finite sampling/card events; retained. |
| `coin-patterns` | 2–4 | Runs/overlapping patterns; retained; corrected an explanation about overlap/dependence. |
| `collisions` | 2–3 | Collision probabilities and sample-space growth; retained. |
| `large-numbers` | 2–4 | Absolute versus relative count behaviour/sample sizes; retained; avoid a blanket “larger sample makes any event likelier” shortcut. |
| `impossible-bounds` | 2–3 | Certain/impossible events and logical constraints; retained. |
| `selection-weights` | 2–4 | Existing repeated/weighted selection and model distinctions; retained. This was already meaningful structural variety. |

### New conditional-rate structure

Complete tables state how many records and successes exist for two methods in two groups. Each statement specifies what is sampled uniformly. Learners must distinguish:

\[
P(S\mid A)=\frac{\text{A successes}}{\text{A records}},\qquad
P(A\mid S)=\frac{\text{A successes}}{\text{all successes}},
\]

and equal-group selection, which averages group-specific rates rather than weighting by observed group sizes.

The generator includes both directions of within-group advantage, pooled reversals and pooled agreements. Therefore “always reverse the ranking” is not a valid shortcut. No causal superiority is implied by these observational counts. A separate verifier expands the table into individually labelled records and recounts each sampling experiment.

### New histogram structure

At the new hard level, width and density vary independently and **count = frequency density × width**. Equal-height bars can contain different counts; taller bars can contain fewer observations. This follows the histogram area principle described by [Stata's author-written FAQ][M1]. The renderer now uses the correct physical widths, density heights, axis labels and accessibility description.

All event boundaries coincide with bin edges and observations are explicitly inside bins. No unmentioned uniform distribution within a bin is assumed. The learner must recover areas before comparing unconditional or conditional fractions. A new regression uses a concrete counterexample where height order and count order differ.

### Explanation and display repairs

Scatter circles are separated in displayed coordinates so learners need not count hidden overlapping dots. A positive overall association does not, by itself, imply every threshold-conditioned inequality; the solution now asks for the actual subgroup count. Long-run Markov time fractions are distinguished from convergence of the distribution at a fixed time. On small screens, disabled rank-movement controls no longer squeeze feedback text into a narrow column; a 390px responsive iframe showed 285px statement widths after the fix.

Rank choices are shuffled and close/tied triples rejected under the existing separation rule. Every one of the six answer orders occurs in the seeded sample for each new conditional-rate level and the density-histogram level. This is a position-bias check, not a statistical proof of unbiased human difficulty.

## 6. Intervals audit and changes

### Verdict

The baseline offered many quantities to estimate, but quantity variety alone does not teach **how uncertainty behaves**. The largest educational weakness was presenting invented per-family error sizes as if they described a prepared candidate. The application cannot infer your true confidence from a single hidden numerical truth or from an arbitrary normal/lognormal spread.

| Family ID | Levels | Audit finding and disposition |
|---|---|---|
| `prob-exact` | 1–3 | Exact event probabilities; retained. Tight intervals follow exact calculation under the trainer score. |
| `prob-estimate` | 2–4 | Birthday/binomial/dice/derangement approximations; retained; actual target checked separately from approximation advice. |
| `expected-dice` | 1–3 | Means, extrema, distinct counts and decisions; retained. |
| `coupon` | 3–5 | Uniform, partial and weighted collection; generator retained; **backend verifier fixed** for already-collected coupons. |
| `waiting-time` | 2–4 | Overlapping pattern waiting times; retained; independent Python linear equations check the state process. |
| `dots-count` | 1–3 | Visual count estimates; retained. Corrected lesson score/model language; no evidence that fixed error size fits a user. |
| `dice-grid` | 2–3 | Face counts and pip totals; retained; removed an unmeasured claim that a scan strategy halves uncertainty. |
| `path-length` | 2–4 | Polyline/scale estimates; retained; corrected a guaranteed ±8% example and separated it from a standard deviation. |
| `percentile` | 3–4 | Mean, median, counts and nearest-rank quantiles in a displayed finite grid; retained; sampled fractions no longer presented as a population guarantee. |
| `series` | 3–5 | Linear, exponential and seasonal extrapolation with noise; retained; model-fitting uncertainty remains illustrative. |
| `mental-product` | 1–3 | Products/quotients and rounding; retained as highly useful timed fluency. |
| `powers-roots` | 2–4 | Roots, powers, logs and compound growth; retained; harder transcendentals are stretch. |
| `combinatorics` | 2–4 | Arrangements, combinations and repeated-symbol counts; retained. |
| `fermi` | 2–3 | Dimensional calculations from supplied inputs; retained. These are not full open-world Fermi estimates with unknown inputs. |
| `uncertainty-models` | 2–4 | **New:** nine mathematical tasks covering bounds, sensitivity, shared sources and finite-model SDs. |
| `rates-weights` | 2–4 | Existing rates, changing bases and weighted quantities; retained; residual-equation verifier preserved. |

### New uncertainty progression

| Level | Structures | Why it develops reasoning |
|---|---|---|
| 2 | Sum bound, positive-product bound; upper/lower requests | Recognise monotonicity and an extremum rather than enlarge a point estimate arbitrarily. |
| 3 | Positive-ratio bound, difference bound, positive-square bound, shared-offset cancellation | A denominator/subtracted input reverses the endpoint choice; shared inputs cannot be independently assigned incompatible endpoints. |
| 4 | Independent-sum SD, common-sign-sum SD, common-sign-difference SD | Same marginal SDs can produce different combined uncertainty because dependence changes variance. |

Examples: independent zero-mean errors of SDs 3 and 4 have sum SD 5; errors `3E` and `4E` with the same equally likely sign have sum SD 7 and difference SD 1. For independent signs, the largest absolute sum is 7 even though SD is 5. For the shared-sign sum the magnitude is exactly 7. Explanations now explicitly distinguish these cases.

The elementary covariance distinction is consistent with [NIST's uncertainty propagation guidance][M2]. The implemented questions use exact finite sign models and monotone endpoint reasoning, not an unjustified first-order approximation. A verifier independently enumerates joint sign outcomes or permitted endpoint pairs; Python checks the same targets with separate code.

These questions ask for an interval containing a **specified numerical bound or SD**. They do not claim that a future unknown outcome has a unique objectively correct personal confidence interval. Positive ranges and unequal SD coefficients keep the target positive, as required by the retained `lower/upper` scoring contract. Negative-input extrema, zero targets and general covariance matrices are outside this new family's stated domain, not silently approximated.

### Calibration and score interpretation

The existing score is retained: if the positive truth is inside `[L,U]`, score `L/U`; otherwise zero. Its preferred width depends on your predictive/error distribution. It does not specify a universal 90% or 95% coverage target. The [proper-scoring literature][M3] is useful for understanding why an interval score needs explicit objectives; the trainer's ratio score is not presented as the standard proper interval score from that literature.

Central feedback and lesson pages now label suggested widths as **illustrative, assumed models**. They explicitly say that error sizes have not been measured for you or Optiver candidates. Optimisation tests establish that a proposed interval is sensible under its supplied model; they do not validate the model. You should record your own estimates and misses on unfamiliar questions to assess whether your intervals are too narrow or too wide.

### Confirmed backend error

The optional backend previously recomputed a partial coupon problem as though all coupons still needed collecting. It must sum over the **missing** coupon set while retaining original draw probabilities: draws of already collected coupons still waste time. With six equiprobable faces and four already collected, the expected additional wait is `6/2 + 6/1 = 9`, not the full collection time. Both a direct regression and the generated backend corpus now cover this. The browser generator's answers did not need changing for this defect.

## 7. Orderbooks audit and changes

### Verdict

Eight existing families already provide strong coverage for the abstract, static arbitrage task described in your invitation. The useful missing combination was a weighted basket with a negative leg. Adding live exchange machinery would make the trainer more elaborate without established assessment benefit.

| Family ID | Levels | Audit finding and disposition |
|---|---|---|
| `crossed` | 1–2 | Buy at the lower ask/sell at the higher bid; retained. |
| `bundle-rich` | 1–3 | Sell overpriced sum/buy its parts; retained. |
| `bundle-cheap` | 1–3 | Buy underpriced sum/sell its parts; retained. |
| `weighted` | 2–4 | **Expanded** from positive baskets to signed weighted baskets at 3/4, while preserving positive structures. |
| `spread` | 2–4 | Existing differences between products; retained. New weighted signs combine this principle with non-unit quantities. |
| `chain` | 3–5 | Hedge through multiple relationships; retained. |
| `decoy` | 3–5 | Apparent midpoint profits erased by crossing spreads; retained. |
| `hidden` | 4–5 | Dependencies between quoted baskets; retained; solve cash and all product exposures. |

New structures include `2A−B`, `A−2B`, `3A−B`, `A−3B` and `2A+B−C`. For example, buying `2A−B` requires selling two A and buying one B to flatten. Negative legs change both trade direction and the executable side used to value the basket. Both rich and cheap opportunities occur. Quotes and execution remain the existing simplified model.

Using bids for sales and asks for purchases is an actual execution principle, also described in [CME's market-liquidity material][M4]. That source does not validate Optiver's game rules, and depth, fees or queue risks were not arbitrarily introduced here.

### Solver and wording limitation repaired

The application accepts **any profitable flat combination**. Its displayed reference package is verified by an independent multiset search over primitive packages with at most six trades. It is not a proof of a global maximum over unlimited trade quantities: repeat a profitable package and its cash scales without a finite bound in this model.

The old solution instruction asking for the “most cash” and label “Best position” overclaimed that optimisation task. They now say any profitable flat combination is accepted and label the reference **Verified package**. Scoring was not changed.

The Python oracle independently checks each submitted reference package's signed exposure and executable cash. The JavaScript solver/verifier additionally checks the constrained best primitive package. Generated targets remain satisfiable; tests cover both opportunity directions, several signed shapes and the real tap controls.

## 8. Zap-N audit and changes

### Verdict

Keep all nine existing games for instruction/control familiarity; do not expand the collection. Public material does not establish your exact games, latency, randomisation, norms or cutoffs. Their readiness thresholds are authored training goals. [Simons and colleagues' review][M5] finds much stronger evidence for improvement on trained tasks than broad transfer to unrelated cognition. That supports spending limited time on familiarity rather than grinding these scores as a route to general mathematical ability.

| Game | Actual implementation reviewed | Finding/action |
|---|---|---|
| Balloon | Uniform hidden pop threshold; two rounds; state-dependent bank-penalty policy via dynamic programming | **Changed coaching and diagnostic.** Paired pop thresholds do not remove luck from the bank ratio. Add expected-value decision cost under the stated model. |
| Skyscraper | Ten tower-rearrangement levels; legal top-block moves/capacities; BFS shortest solution | Retained. Solvability/optimal move checks are strong for this puzzle. No verified official time norm. |
| ShapeShift | 60 trials; flashed matching/inhibition task; misses and early responses recorded | Retained. Accuracy and response timing are task-specific. |
| CodeCompare | 30 rounds; one exact code among four; deadline ramps 5 to 3 seconds | **Fixed** a key that ended the gap and also answered a stimulus before it was drawn; ignore repeated keydown input in the view. |
| Pincode | Forward/reverse/sorted codes, adaptive lengths, two successes/failures at a length | Retained. Digit span is a game result, not a general memory diagnosis. |
| NumberBox | Ten targets using four given digits and arithmetic; exhaustive rational solver and separate expression parser | Retained. Alternative exact expressions are accepted, division by zero/incorrect digit use rejected. |
| Figure It Out | Five rounds; property-wise feedback; exact expected optimum and small-state exhaustive checks | **Corrected coaching.** A property with fewer values can finish last; an optimal policy can realise more guesses than its mean. |
| The Switch | 35 task-switching rounds; four-second deadline; accuracy, reaction time and switch cost | Retained. Equal-weight composite is authored, not Optiver's validated psychometric score. |
| StockMaster | Four concurrent slots, two-minute schedule, zone-hitting needle events | **Fixed** late-starting gauges whose end lay beyond the session; all scheduled opportunities now complete and receive an outcome. |

### Balloon: decision quality versus realised luck

An optimal policy can have different final banks under different pop draws. Sharing a draw sequence with a reference does not make their ratio a pure policy-efficiency score when actions and bank states differ. Observed pop values are also censored by decisions to cash early; blindly halving their mean is not a justified estimator of the original threshold range.

The old ratio metric remains for compatibility, now labelled as luck-dependent. An additional result diagnostic sums the expected final-bank value sacrificed by the chosen actions relative to the model-optimal action at each observed state. Conditional cash/pump values use the **known uniform model and current state**, never the hidden next pop threshold. An independently written recursive expectimax checks those values. Optimal actions have zero diagnostic cost across seeds even when realised banks differ.

This diagnostic is model-dependent expected-value feedback. It is not a measured Optiver score and would need a different model if actual instructions specified a different process.

### Figure It Out: mean versus path

If each property has an independent uniform hidden value and eliminated wrong values are never repeated, its discovery position is uniform over that property's options. Completion takes the maximum of those discovery positions. Its expectation is a policy mean, not a per-round guaranteed bound. Existing correct engine mathematics was retained; incorrect deterministic interpretations were removed from coaching and lessons. Counterexamples run through the actual game engine.

## 9. Integration, progress and usability

- Existing family IDs are retained. Two IDs are added: `ll:conditional-rates` and `iv:uncertainty-models`.
- The ordinary five-section skill count rises **109 → 111**; the optional arithmetic set remains eight families. Beat the Odds remains 40.
- A new histogram level adds an additional available checkpoint; the two new skills start unattempted. A changed completion denominator does not mean earlier progress was deleted.
- `optprep:v2`, migration, learning completion, recognition/cold gates, mixed-training logic, stored question identities and the runner remain byte-identical to baseline.
- Existing learning coverage, cold successes, XP, habits, historical scores, settings, question history and saved practice drafts are retained. No history-reset or schema migration is introduced.
- Existing proofs are not retroactively discarded because weighted/interleaved families gained new structures. New practice is still advisable for those additions.
- New lessons are reachable through the existing books/skills. There are **150 lessons** after catalogue regeneration.
- Learning still uses ten-question blocks. Answering all ten without skips records coverage even with help; cold timed mixed success remains a separate record.
- No new Transfer Challenge UI duplicates within-assessment mixed practice. Existing Batch/Transfer functions remain available, including single-section use.

Export Settings → Backup before upgrading. Browser-local progress belongs to an origin: keeping the same address/browser retains it; moving to another repository URL, browser or device requires importing the backup. A service worker update should be accepted/reloaded. This work does not publish to your GitHub Pages site or modify the original developer's repository.

## 10. Measured validation

### Full suites and integration

| Check | Result | What it establishes |
|---|---|---|
| Baseline JavaScript suite | 1,157 passed before edits | Working starting point |
| Final complete JavaScript suite | **1,184 passed; 0 failed/skipped** | Existing and new model/contract/runner/study/game regressions |
| Optional Python backend suite | **40 passed** | Existing backend coverage plus four targeted regression tests |
| Fresh C++ engine build/tests | **34/34 passed** | Optional engine remains compatible; existing pedantic `__int128` warnings do not prevent the build |
| Existing DOM integration collection | **13 scripts passed** | All existing practice/learning/mixed/mock/Batch routes tested |
| Whole-app learning completion | **111 families, 1,120 questions, 728 assertions, zero uncaught app errors** | Every ordinary skill reaches existing completion/progress behaviour; all five assessment answer/review flows |
| New battery DOM checks | **79 assertions** | All nine game views start and clean up; Balloon/CodeCompare/StockMaster finish through controls; density render and signed basket taps |
| Focused/mixed/mock/Batch regression | **5,580 questions; zero exact repeats** | 1,110 focused + 1,000 mixed + 2,970 questions in 150 mock papers + 500 Batch questions with accumulated history |
| Live Chrome visual check | New family answered correctly, feedback/resume; five generated examples; 390px responsive frame | Readability and real app interaction for changed material; not physical-phone/cross-browser certification |

The unit-test total is **1,258** (1,184 + 40 + 34). Assertion counts, generated cases and mock questions are additional checks, not inflated additions to that unit-test count. Of the 27 additional JS tests, 17 are explicit audit regressions and ten arise from the new families entering existing parameterised suites.

The study suites are included in the complete JavaScript run. The 13 DOM scripts include the earlier Beat the Odds curriculum flow, preserving its improvements. The new game DOM check finishes three changed games, not nine complete game sessions; all nine have engine tests and start/cleanup checks.

### Independent mathematics and before/after comparison

| Evaluation | Result and interpretation |
|---|---|
| Seeded before/after sample | **43,648 draws**, 128 per supported level/edition; **10,912** independently organised family-verifier checks across 174 current family-level rows |
| Exported Python corpus | 2,784 current items, 16 per level; seeds are retained |
| Separate Python oracle | **2,176 checked:** 960 NumberLogic, 240 ranking, 624 interval, 352 orderbook cases |
| Explicit oracle exclusions | 608 items delegated to existing JS enumeration/recount/DP/equation verifiers; not counted as independently checked Python cases |
| Optional backend corpus | **192 passed**, covering new conditional rates/uncertainty, histogram interpretation and partial coupons |
| New conditional-rate orders | All six order permutations occur at every supported level |
| New histogram hard orders | All six permutations occur |
| MCQ presented answer positions | 1,484 / 1,537 / 1,540 / 1,507 / 1,612 across five positions in the current comparison sample; no fixed answer slot |
| Protected configuration/data code | Byte comparisons and deep equality confirm unchanged licence, preset, store/migration/learning/cold/runner logic and all section exam objects |

The Python oracle imports no application JavaScript math code. It reconstructs sequence rules with exact fractions, solves pattern waiting-time equations, enumerates error signs/endpoints, recounts supported charts/tables and recomputes signed cash/exposure. It does not independently re-prove every existing LL/IV branch; the exclusions are enumerated in its output.

### Did diversity genuinely improve?

| Change | Measured fact | Reasoned judgement and limit |
|---|---|---|
| NumberLogic interleaving | Hard answer strands changed to quadratic/Fibonacci-like and have four visible terms each | Removes an easy-answer loophole; not a measured gain in candidate accuracy |
| NumberLogic combined residuals | Four retained authored variants → six, all reached in seeded tests | Adds square/geometric residual recognition, rather than just larger coefficients |
| Likelihood group mixing | Three levels support within/pooled/standardised/reverse experiments and both reversal/agreement | Requires changing sample spaces and weights; genuine structural distinction |
| Histogram density | New hard level uses unequal widths; independent count/rank checks pass | Defeats height-only shortcut; mathematically different from relabelling bars |
| Intervals | Nine new uncertainty tasks reached, endpoints/sign dependence checked | Adds sensitivity/dependence concepts missing from mere quantity estimation |
| Weighted Orderbooks | Signed shapes and both opportunity directions reached | Requires applying sign and quantity together, beyond a positive-basket template |
| Games | Identified transition/scoring defects removed; feedback statements checked with counterexamples | Improves feedback validity and fairness; no demonstrated broad cognitive transfer |

The raw-generator comparison is intentionally honest about finite capacity: at the new hard SD level, 128 independent draws yield **55 distinct prompts and 18 distinct numerical targets**. Those simple coefficient models are finite. They are still useful distinct dependency cases, but not an inexhaustible problem bank. Raw generators are sampled without session history; production learning/mixed/mocks use the existing unseen-question ledger. The 5,580-question mode regression demonstrates no exact repeats in that sample, **not no lifetime repeats under every history**. Authored branch proxies in the comparison are descriptions, not validated measures of conceptual novelty.

No controlled human learning trial, held-out Optiver outcome study or item-response calibration was performed. The stronger mathematical content and repaired feedback justify the release; a numerical “transfer improvement percentage” would be invented.

## 11. Remaining gaps and preparation priorities

| Area | Remaining limitation | Best preparation response |
|---|---|---|
| Actual format | Proprietary counts, scoring, clocks and game selection remain unverified | Treat your portal's instructions as authoritative; use the preserved preset for disciplined practice |
| NumberLogic breadth | Sequence-focused; rare digit tricks may be overrepresented relative to the real paper | Prioritise differences/ratios/recurrences/interleaving; occasionally do unfamiliar general numerical reasoning |
| Likelihood List | Finite authored scenarios; some levels reuse similar structures; strict separation removes near ties | Practise unfamiliar charts and translate every denominator; do some close comparisons externally |
| Intervals | Heuristic error spreads, supplied-input Fermi questions, no learned personal uncertainty model | Keep an external estimate/interval/outcome log; practise genuine unknown-input estimates and evaluate misses/width |
| Orderbooks | Static, finite simple baskets; no depth, fees, asynchronous execution or funding limits | Master cancellation/spread/sign arithmetic first; add such constraints only if instructions introduce them |
| Zap-N | Unknown actual games/norms; some planning games are untimed here | Learn controls, practise accuracy briefly, then allocate time to mathematical weaknesses |
| Mastery records | Three paced cold successes establish a local checkpoint, not universal mastery | Require later unaided success on another source and on mixed timed sections |

Advanced continuous distributions, general Markov-chain theory, stochastic calculus, derivatives pricing and sophisticated portfolio optimisation are not justified additions for these five modules before this deadline. Existing stretch models need not all be mastered before strengthening core timed performance.

### How to use this release until 6 December

Your intended division is sensible: **OptPrep supplies practice, ChatGPT supplies explanations, and independent problems test transfer**. During learning, ask why the sample space/rule/model applies and which assumption would make a different method necessary. During cold practice and simulations, answer independently.

1. Learn or repair a small set of skills through the existing ten-question blocks; use help freely there.
2. Each study day, complete a ten-question **mixed block within the assessment being trained**, without help. You do not need cross-assessment mixing to imitate the real battery.
3. Diagnose wrong/slow answers by cause: model/denominator, rule recognition, arithmetic, units, execution sign, input or pacing. Repair the cause, not only the remembered item.
4. Revisit the skill on another day and include unfamiliar external material. Re-solving an exposed question is revision, not a cold test.
5. Use one or two timed sections per week, replacing part of normal practice time. A full battery rehearsal should also replace normal training time.

An eight-hour starting allocation across all six modules remains **3h BTO, 1h15 NumberLogic, 1h15 Likelihood List, 1h Orderbooks, 45m Intervals, 15m Zap-N and 30m general error review**. Move time toward the assessment whose unaided accuracy/pacing is weakest. This allocation is a practical judgement, not an experimentally optimised schedule. Complete the assessment comfortably before **6 December 2026, 23:59 CET (22:59 UK)**; the deadline is not a recommended start time.

## 12. Separate verdicts

| Dimension | Verdict | Confidence and reason |
|---|---|---|
| Mathematical correctness | **Strong for the tested authored models; materially improved explanations/verifiers** | High for added/changed finite models due independent recount/enumeration/Fraction/expectimax checks. Lower for untested seeds and all prose; no claim of formal proof of the whole app. |
| Realism | **Relevant abilities and section durations; partial simulation** | Moderate for general constructs/your clocks; low for exact item bank, counts, scoring details, games and cutoffs. |
| Difficulty calibration | **Better internal progression; external calibration unverified** | High confidence the hard-strand loophole is removed; low confidence any level corresponds to an Optiver percentile or pass standard. |
| Educational quality | **Good question-and-feedback resource, now stronger on transferable relationships** | Moderate/high design confidence. Some families remain templated and interval model widths remain illustrative; learning gains have not been measured in a trial. |
| Overall usefulness | **Use as your main daily drill platform, with held-out practice and conceptual tutoring** | Moderate/high confidence for the combined workflow. App scores alone are insufficient evidence of assessment readiness. |

## 13. Source map and reproduction

### Substantive implementation map

| Files/area | Modification |
|---|---|
| `src/sections/nl/families/interleaved.js`, `mixed-combo.js` | Hard target strands and added residual models; explanation wording |
| `src/sections/nl/lib.js`, `decimals.js`, `primes.js`, `prime-gaps.js` | Remove overstrong monotonicity, calculator and prime claims |
| `src/sections/ll/families/conditional-rates.js`, LL registry | New ranked sampling/weighting family |
| `src/sections/ll/families/histogram-bins.js`, `src/ui/visuals/histogram.js` | Density level, correct rendering, interpretation/explanations |
| LL `scatter-regions.js`, `markov-graph.js`, `coin-patterns.js` | Dot separation and corrected dependence/sequential explanations |
| `src/sections/iv/families/uncertainty-models.js`, IV registry | Nine explicit uncertainty structures and independent checks |
| IV `lib.js`, `optimal.js`, visual/statistics family comments and `src/study/pages.js` | Illustrative model labels, bound/percentile/scan wording fixes |
| OB `weighted.js`, `lib.js`, `src/ui/solution.js` | Signed baskets; honest verified-package and interval feedback labels |
| `src/study/content/battery-lessons.js`, affected LL/IV/OB/Zap lesson files | Two full new lessons, linked books, density/sign and game explanation corrections |
| `src/zapn/balloon/*` | Conditional action-value diagnostic and luck/censoring coaching |
| CodeCompare engine/view; StockMaster engine; Figure coach | Transition/key repeat, complete scoring opportunities, stochastic mean interpretation |
| `src/ui/pages/zapn.js`, `config/sections.js` | Unverified-game/norm labels and clearer trainer target wording; numeric configurations unchanged |
| `src/ui/styles.css` | Readable ranking feedback on narrow screens |
| `backend/oa_backend/{verify,rank_verify}.py` | New family recomputation, histogram checking and partial-coupon fix |
| New JS/backend tests and `tools/battery-*` | Regression tests, reproducible sampling, independent Python oracle and DOM checks |
| `tools/curriculum-dom-regression.mjs` | Optional output path, preserving historical report files when rerunning |
| Generated catalogues, package, service worker, README, BUILD_INFO, source revision and evaluation evidence | New reachable content, release/update identity and documented validation |

No licence replacement, original repository write, progress reset, scoring change or new runtime dependency is part of this release.

### Run the normal app

With Node.js 20+ installed, extract the complete archive and run `npm start` in the folder containing `package.json`. Open the printed HTTP URL. No dependency install, build, optional backend or engine is needed for normal use. GitHub Pages can serve the root files; preserve `.github`, `src`, `config`, assets, `index.html`, `app.js` and `sw.js` rather than uploading the ZIP as one file.

### Reproduce checks

```sh
npm test

# Browser-like integration (jsdom required for these developer checks only).
# Install jsdom in a separate QA directory and set OPTPREP_TEST_JSDOM to its package path,
# or make jsdom resolvable by Node in your developer environment.
node tools/curriculum-dom-regression.mjs evaluation/battery-flows.json
node tools/battery-dom-flow.mjs
node tools/focused-assessment-regression.mjs evaluation/battery-assessment-regression.json

# Default baseline path is ../optprep-curriculum; supply another baseline directory if needed.
node tools/battery-evaluation.mjs /path/to/unchanged/1.6.0-baseline
python tools/battery-oracle.py
python tools/battery-backend-corpus.py

# Optional backend checks: Python 3.12+ and pytest.
cd backend
python -m pytest -q
```

The optional engine can be built with CMake 3.20+, C++20 and GoogleTest, followed by `ctest --test-dir engine/build --output-on-failure`. GoogleTest may be fetched if not installed. The shipped archive excludes compiled outputs and installed QA dependencies. Historical evaluation reports remain historical; `battery-*` reports describe this release.

### Research references

These are source links for the specific uses stated above, not endorsements of commercial banks or a claim of validated Optiver difficulty.

[S1]: https://www.optiver.com/join-us/jobs/trading/amsterdam/career-kickstarter-trading-2027/?gh_jid=8859789002
[S2]: https://www.optiver.com/join-us/stories/optiver-europe-recruitment-faq/
[C1]: https://www.reddit.com/r/quantfinance/comments/1vfc77q/optiver_oa/
[C2]: https://www.reddit.com/r/quantfinance/comments/1uv3jhp/optiver_assessment/
[C3]: https://www.reddit.com/r/csMajors/comments/1uohtxx/optiver_quantitative_intern_assessment/
[C4]: https://www.reddit.com/r/quantfinance/comments/1vh1zwf/optiver_quant_research_intern_oa/
[C5]: https://www.tradermaths.com/trading-firms-prep/optiver
[C6]: https://www.quantt.co.uk/resources/optiver-interview
[C7]: https://outcryarcade.com/guide/optiver-trading-assessment
[C8]: https://quantvault.org/optiver-online-assessment.html
[C9]: https://github.com/vijaySadhuram/Optiver-Recruitment-Grad-SWE
[M1]: https://www.stata.com/support/faqs/graphics/histograms-with-varying-bin-widths/
[M2]: https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-appendix-law-propagation-uncertainty
[M3]: https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf
[M4]: https://www.cmegroup.com/education/articles-and-reports/understanding-the-cme-liquidity-tool-methodology
[M5]: https://journals.sagepub.com/doi/abs/10.1177/1529100616661983
[M6]: https://www.shl.com/assets/documents/product-factsheet-verify-g-plus.pdf
