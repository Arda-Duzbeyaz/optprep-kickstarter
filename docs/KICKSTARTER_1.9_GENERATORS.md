# Generator evaluation

## Repeated timed practice

Fourteen full papers per quantitative section were built from fresh profiles with successive exposure history. The same rehearsal seeds and default settings were used against the original v1.8.0 implementation. The new build generated 1,386 questions across 70 papers with zero repeated visible question fingerprints. A fingerprint ignores answer-option order and, for orderbooks, quote-card order. A new fingerprint can still describe a familiar exercise.

| Section | Questions | New scenario items | Different structure signatures, v1.8 → v1.9 | Concrete change |
| --- | ---: | ---: | --- | --- |
| Beat the Odds | 280 | 98 | 116 → 135 | 31 additional composed items joined a prior event to a second calculation. |
| NumberLogic | 364 | 126 | 55 → 53 | 126 applied questions appeared alongside 238 sequence questions. |
| Likelihood List | 210 | 70 | 124 → 122 | Compare close event rates, conditional reports and independently assembled sets of experiments. |
| Intervals | 252 | 84 | 78 → 80 | Reference-based and simulated samples entered the regular paper. |
| Orderbooks | 280 | 98 | 20 → 32 | 33 of 280 boards required a pass. The original sample contained zero pass boards. |

The older sequence and ranking pools already generated numerous tagged branches. Giving slots to applied arithmetic and cross-experiment rankings reduced their aggregate fingerprint counts slightly in this sample. The broader task coverage is the improvement in those two sections. Across the five sections median paper generation took 7–104 ms on the release-audit machine. Timing varies by device and history size.

## What varies within a question

| Section | Example of a change in reasoning |
| --- | --- |
| Probability | With the same urn, “at least one red” permits one-red and two-red pairs. Revealing a randomly chosen red position weights two-red pairs twice as heavily. The questions therefore have different answers. A separate process asks how quickly two consecutive successes trigger an alarm from a specified starting state. |
| Numerical reasoning | Computing output per worker-hour uses combined outputs and hours. Inferring an unknown shift rate first requires removing the known shift’s production. Reversing consecutive price changes requires dividing by both multipliers. |
| Likelihood | Choosing a factory uniformly weights sites equally. Picking a unit uniformly weights larger factories more. In a separate construction, an item selects three distinct experiments and checks their probabilities for ties before displaying the ranking. |
| Intervals | A train must travel its own length as well as the bridge length before it clears the bridge. In a sampled network, each route’s mean must instead be multiplied by its number of trips. The full simulated total can differ from that sample estimate. |
| Orderbooks | The same bundle can be expensive, cheap or consistent with all underlying quotes. Switching bid and ask can turn an apparent opportunity into a loss. Overlapping bundles can require a hedge involving a third instrument. |

## Diversity of the new model layer

400 seeds at each of three levels gave 1,200 raw draws per section. Raw sampling permits repeats. Normal timed practice resamples against exposure history. The method and signature columns below distinguish model decisions from changes in wording, ordering and numbers.

| Section | Model branches | Structural signatures | Distinct visible questions out of 1,200 draws |
| --- | ---: | ---: | ---: |
| Beat the Odds | 12 | 12 | 597 |
| NumberLogic | 8 | 8 | 1140 |
| Likelihood List | 6 | 25 | 1120 |
| Intervals | 9 | 9 | 902 |
| Orderbooks | 12 | 12 | 1197 |

Introductory model levels use simpler observations, totals and hedges. Advanced levels add hidden states, inverse problems, sample weighting or overlapping instruments. The middle level spans both sets. These levels describe construction complexity. Human completion time and transfer to Optiver have not been empirically calibrated. A four-operation composition layer can extend eligible probability questions from 13 legacy families. It records the base question as seen, including when shown within a new composed question.

## All 40 starting probability families

Thirty seeds per supported level yielded 2,940 family-level draws. Base signatures are branch proxies from the existing mathematical metadata. Composed signatures count distinct pairings of a base signature with a second-stage operation encountered in this sample. Zero indicates that the original family was retained without that extension. The method notes explain where parameter changes are likely to repeat the reasoning.

| Family | Draws | Base signatures | Composed signatures | Method review |
| --- | ---: | ---: | ---: | --- |
| Events: overlap, complements and independence | 60 | 7 | 0 | Translate unions, intersections and complements. Moving an event boundary can change the count while retaining the same rule. |
| Two dice: sum events | 60 | 7 | 18 | Target changes often reuse the same 36-cell grid. Intervals, unions and complements change which outcomes survive. |
| One die, repeated throws | 60 | 7 | 17 | Distinguish any repeat, adjacent repeats and a particular face. Relabelling a face leaves the reasoning intact. |
| Two dice: max, min, doubles, differences | 60 | 12 | 18 | Compare thresholds for maxima/minima and direct counts of differences. Changing a threshold alone repeats the method. |
| Three dice | 60 | 9 | 20 | Multiple dice add a counting dimension. The conditional event determines which slice of outcomes to enumerate. |
| At least one: the complement trick | 90 | 5 | 15 | Most variants reuse a complement product. A second stage can convert that probability into a signal, payoff or waiting event. |
| Waiting for the first success | 60 | 8 | 0 | Differentiate first-hit mass, tail probability and alternating attempts. Once the race rule is familiar, further draws mainly train speed. |
| Success counts: recognise the sampling model | 90 | 8 | 0 | Identical and unequal independent trials require different counting methods. Check whether a binomial coefficient applies. |
| Conditional probability with dice | 60 | 8 | 26 | Changing the observed event changes the denominator. Useful for comparing a named result with a randomly revealed die. |
| Cards: symmetry and unseen discards | 60 | 5 | 13 | Seen and unseen discards, exchangeable positions and first-relevant-card events rely on different arguments. |
| Cards without replacement | 90 | 12 | 18 | Ordered draws and unordered hands call for different counts. A new target rank alone gives a numerical variant. |
| Urns: drawing without replacement | 60 | 2 | 8 | Exact and tail counts commonly reuse hypergeometric reasoning. Sample size and composition alone rarely require a new method. |
| Restricted counting: roles, groups and arrangements | 60 | 6 | 0 | Case splits and restricted arrangements change which choices remain legal. New counter arrangements complement this work. |
| Coin sequences | 90 | 5 | 16 | Many variants share binary enumeration. Adjacency and prefix restrictions change the allowed sequences. |
| First to k wins | 60 | 2 | 8 | Two main tagged structures appeared. Score changes alone retain a stopped-series setup. |
| Waiting for coin patterns | 60 | 18 | 0 | Self-overlap and competing patterns genuinely change the state recursion. Some labelled patterns yield equivalent states. |
| Bayes: reading a positive signal | 90 | 3 | 0 | A new prevalence or test accuracy often leaves the same likelihood calculation. Repeated or negative evidence changes the update. |
| Bayes: coins, boxes and cards | 60 | 3 | 0 | A hidden source couples observations. Compare inferring its type with predicting a future observation. |
| Monty Hall and the host's knowledge | 60 | 3 | 0 | The host’s information and opening policy determine the likelihood. Changing only the door count repeats a familiar setup. |
| Pigeonhole: when it is certain | 60 | 6 | 0 | A guarantee has different quantifiers from an occupancy probability. Distinguish proof by capacity from counting. |
| Birthday collisions | 60 | 2 | 0 | Changing the group size repeats a collision complement. Check whether the question asks about any pair or a specific person. |
| Derangements: nobody gets their own | 60 | 4 | 0 | No fixed points and an exact fixed-point count require different decompositions. The recurrence itself is reusable. |
| Expected waiting times | 90 | 6 | 0 | Waiting for one success, collecting stages and waiting for a run require different states. The new alarm model retains the previous test result. |
| Coupon collector | 60 | 1 | 0 | The fingerprint grouped the sampled items together. Different collection targets can still change the sum of remaining stage waits. |
| Linearity of expectation | 90 | 7 | 0 | Indicator variables apply across runs, occupancy and matches. Choose the indicator before taking its expectation. |
| Weighted payoffs and conditional expectation | 90 | 8 | 0 | Piecewise rewards and entry charges change the payoff map. Distinguish expected cash from the chance of a win. |
| Variance, covariance and shared risk | 90 | 9 | 0 | Shared sources and mixed terms affect the covariance correction. Substituting new marginal rates can leave that reasoning unchanged. |
| Combining discrete random quantities | 90 | 7 | 0 | Construct a support and combine compatible pairs. A new scale may preserve the entire convolution method. |
| Expected maximum and minimum | 90 | 3 | 0 | Tail sums and distribution differences give different routes to maximum/minimum questions. Adjacent thresholds remain close variants. |
| Dice duels | 60 | 5 | 0 | Ties, unequal dice and repeat rules change the outcome space. Replacing face values alone often preserves enumeration. |
| Dice games: expected value and when to reroll | 90 | 6 | 0 | A nonlinear payoff or option to reroll changes the value calculation. Compare the current reward with the continuation value. |
| Optimal stopping with a deck of cards | 60 | 1 | 0 | The fingerprint grouped these complex decision trees together. A different remaining deck changes the optimum within the same recurrence. |
| Running totals | 60 | 2 | 0 | Threshold changes can preserve the same state transitions. Boundary behaviour determines the recurrence. |
| Random walk on a line | 60 | 6 | 0 | Endpoint counts, parity and hitting events require different reasoning even when step distributions match. |
| Random walks on polygons | 90 | 4 | 0 | Return, hitting and meeting events constrain different states. Check reachability before using symmetry. |
| Gambler's ruin | 90 | 3 | 0 | Fair and biased walks, absorption probability and expected duration use different boundary equations. |
| Normal approximation (CLT) | 60 | 3 | 0 | Standardising another mean or sum often repeats the same workflow. Read the supplied variance and aggregation assumptions. |
| Uniform geometry: sticks, meetings, areas | 90 | 7 | 0 | The sampling rule determines the underlying area or length measure. A new scale alone may cancel from the probability. |
| How was the information obtained? | 90 | 8 | 28 | The disclosure rule changes the likelihood of observing the same phrase. Included in ordinary timed selection. |
| One hidden source or a new source each time? | 120 | 10 | 34 | Conditioning on a common hidden source changes dependence across trials. Included in ordinary timed selection. |

The raw branch names, per-level observations, prompt counts and rehearsal timings are in [the machine-readable audit](../evaluation/kickstarter-1.9-generators.json).
