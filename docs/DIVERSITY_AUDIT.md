# Mathematical diversity audit

Prepared 12 November 2026. Starting point: the saved `1.0.2-kickstarter.1` application, originally revision `6b840e45a3b4145b06f76dec8e216d68799099fc`. The working copy was restored from that ZIP after an execution-environment interruption; the archive SHA-256 was verified before use.

## Definitions

| Variation | What changes | Example |
|---|---|---|
| Numerical | Inputs, with the same procedure | Different start and gap in an arithmetic sequence |
| Surface | Wording or display, with the same relationship | Rename boxes, groups or products |
| Structural | Constraints, dependencies, weights or reasoning steps | With/without replacement; one source versus a new source every draw |
| Conceptual | An unfamiliar problem requires recognising the principle | Decide whether to count, condition, mix, update or conserve a quantity |

Structural variation supports conceptual practice, but does not prove conceptual novelty. New numbers do not establish a new mathematical idea, and even a good structural contrast becomes familiar after repeated exposure.

The investigation combined targeted source review with deterministic sampling of all **99 existing mathematical families**: 32 Beat the Odds, 30 NumberLogic, 15 Likelihood-list, 14 Intervals and eight Orderbooks. The full inventory and branch histograms are in [GENERATOR_INVENTORY.md](../evaluation/GENERATOR_INVENTORY.md) and [diversity-results.json](../evaluation/diversity-results.json). Each existing family was sampled on 80 deterministic seeds across its supported levels.

## Findings

### Beat the Odds

The existing library is broad: counting, conditional probability, Bayes, expectation, waiting times, stopping, walks, geometry and approximation. Several families materially change events or constraints. Linearity counts distinct objects; conditional-dice changes conditioning events; walks and pattern questions vary transitions or overlaps. This is stronger than numerical reskinning.

Within a recognised branch, however, a learner can retrieve a familiar formula. Two-dice sums, standard test-result Bayes calculations, coupon collection and familiar waiting patterns are examples. This is useful fluency, but selecting a labelled family removes method recognition. Existing exams hide labels, but remain within one section.

The existing conditional-dice generator already includes older-child versus at-least-one-child information. The new observation family extends this to explicit reporting protocols, random reveals, replacement and noisy reports. The source family combines event counts, dependence, posterior inference and prediction within similar-looking experiments. These are additional contrasts and combinations; they do not imply Bayes or conditioning were absent previously.

### Likelihood-list

Tables, charts, graphs, densities and event pools already provide substantial variety. Source inspection confirms variable table predicates and denominators, as well as mixed event types. A survey label change is surface variation; changing the event or denominator can require different reasoning.

Some useful structures are intentionally recognisable. Impossible-bounds supplies impossible, certain and intermediate statements. Elementary conjunction triples can be ordered by containment. These are valid mathematical shortcuts, unlike an answer that is always the displayed order reversed. The earlier Markov reversal fix is retained.

The new selection family changes the sampling experiment: uniform people, uniform groups, explicit group weights or a shared group across repeated draws. Its repeated branch varies the third comparator, which can rank above, between or below the independent/shared pair. Learning one fixed named-query order cannot solve every triple.

The existing 0.02 probability-margin requirement remains. Very close comparisons are therefore still underrepresented relative to any real test that uses smaller gaps.

### NumberLogic

There are already 30 rule classes: differences, ratios, higher differences, alternating operations, interleaving, recurrences, digit operations and combinations. Interleaving varies strand rules; mixed-combo varies operation patterns. Arithmetic and geometric families repeat a basic procedure by design, which is appropriate for foundational speed.

Existing checks compare rival rules and reject supported ambiguities. Their uniqueness is relative to the implemented rule library. Any finite sequence admits other mathematical continuations if arbitrary rules are allowed. Adding obscure rules would require extending independent solvers and ambiguity checks, with limited preparation value near the deadline.

No NumberLogic family was replaced or added. Transfer Challenge reuses them without family names or a predictable difficulty ramp. Its MCQ positions are shuffled; ordinary mocks retain their presentation.

### Intervals

The section already covers counts, paths, percentiles, forecasts, probability, expected values and arithmetic estimates. Several Fermi-style items nevertheless reduce to multiplying supplied quantities and converting units. Increasing their numbers would mainly increase arithmetic load. Some existing uncertainty allowances are authored rather than estimated from this learner's errors.

The new family contrasts equal-time and equal-distance averages, unequal-distance weighting, mixtures, dilution, reverse percentages, compound changes and combined work rates. Difficulty comes from the relationship, denominator or conserved quantity rather than numerical size. Its 3% arithmetic allowance is explicitly illustrative.

The prior score/coverage/mastery separation remains intact. Transfer summaries report interval mean score separately from non-interval accuracy.

### Orderbooks

The eight families already change exposure structure: crossed quotes, rich/cheap bundles, weighted bundles, spreads, chains, misleading mid-price gaps and hidden bundle hedges. The chain family introduces a longer replication at higher difficulty; hidden arbitrage uses different bundle identities. These are meaningful structural changes.

Some repetition teaches a limited set of hedge identities. Recognising equivalent portfolios quickly is itself a target skill, so this is not automatically a weakness. Artificial fees, changed scoring or different objectives would introduce unsupported assessment mechanics. Existing generators and independent solvers were preserved.

### Zap-N

Controls, instructions and speed/accuracy management remain worth practising. The games' chosen timing, feedback and hazard models do not establish broader mathematical transfer. No games were added or modified.

## Why a new mode was justified

Ordinary adaptive practice has family context, hints and immediate feedback. Full exams already hide family names but remain section-specific. Study-guide mixed exercises are tied to lessons or chapters, which do not match this user's question-engine workflow.

Transfer Challenge adds cross-section interleaving, withheld solutions, exact and branch-history preferences, four targeted extensions, timed/untimed attempts and isolated results. It uses one page and existing visual controls. The assessment preset, clocks, scoring and fixed libraries are unchanged.

## What was measured

| Evaluation | Result |
|---|---|
| Existing family inventory | 99 families × 80 deterministic samples |
| Added-family verifier sweep | 13,000 cases, zero disagreements |
| Independent Python export | 1,300 cases, full numerical coverage of that export, zero failures |
| Transfer sample | Ten sessions, 150 questions, zero exact repeats |
| Recorded structural exposure | 123 new signatures, 27 familiar signatures |
| Presented answers | All five MCQ positions and all six ranking orders occurred |
| Previous-version mock comparison | 990 item objects identical |

The four additions expose 33 authored branch signatures: eight observation, ten source, seven selection and eight rate signatures. That is **not 33 new concepts**. First-token and random-token observations can have equivalent calculations, for example, and comparing them with an existence report is still useful.

Existing-family signatures use selected discrete parameter tags, query types, operation order and pattern shapes. They deliberately exclude numerical values, wording, answer order and difficulty labels. They are conservative proxies: they may merge different reasoning paths or separate equivalent formulas. They do not parse arbitrary English or measure a learner's surprise.

The ordinary mocks had zero exact repeats in the comparison sample, but repeated branch signatures remained: BTO 110/200, NumberLogic 211/260, Likelihood-list 50/150, Intervals 119/180 and Orderbooks 182/200. This illustrates why exact freshness does not establish structural novelty. These are diagnostic samples, not estimates of useless questions or a controlled comparison against the transfer mode.

The 123/27 transfer split depends on the seed policy, sampler, signature definition and initially empty structural history. Previous exposure cannot be reconstructed from old summary-only saves. Small answer-position samples are not proof of perfect statistical uniformity; raw histograms are included.

## Judgment

The new mode and structural contrasts make OptPrep stronger for method selection and adapting known principles. This is a focused improvement to the training inputs. The effect on learning and assessment performance was not experimentally measured.

The best validation of transfer remains improved timed performance on external, unfamiliar problems: choosing a method correctly, solving faster without losing accuracy, and explaining the relationship. Repeating this generator library alone cannot supply that independent evidence.
