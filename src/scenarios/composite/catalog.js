const definitions={
  bto:[
    ['box-experiment','Learning from observations','Weight each possible source by the probability it would produce the report.'],
    ['stopped-process','Counters and stopping rules','Track the chance of still playing and the progress carried into the next attempt.'],
    ['restricted-arrangements','Arrangements and partial information','Count allowable placements after accounting for the boundary and any disclosed positions.']],
  nl:[
    ['production-network','Production rates and schedules','Translate the schedule into hours, apply each yield, then reconstruct the requested quantity.'],
    ['tariff','Tiered prices and reverse calculations','Identify the applicable rate band and apply the fee and discount in the stated order.']],
  ll:[
    ['sampling-policies','Ranking selection procedures','Identify which records are eligible and their sampling weights under each procedure.'],
    ['weighted-experiments','Ranking weighted outcomes','Count ordered outcomes with their sector multiplicities and any reporting weights.']],
  iv:[
    ['finite-meter-survey','Estimating from sampled groups','Calculate the requested quantity at meter level before expanding each district’s sample.'],
    ['population-survey','Estimating a hidden population','Infer population sizes from observed tag fractions before combining habitats.'],
    ['planning-estimate','Reference quantities and capacity','Estimate the reference scale and divide the relevant workload by productive capacity.']],
  ob:[['portfolio-network','Hedging overlapping contracts','Compare alternative ways to build the same exposure at executable prices.']],
};
export const modelHints = {
  'box-experiment': [
    'Imagine seeing both draws. Which pairs could have produced the report, and how often would each pair produce it?',
    'Weight each box by its prior and its report probability. For a conditional answer divide the appropriate weighted total by the total report probability.',
  ],
  'stopped-process': [
    'Draw a branch for a hit and a miss. Where does the progress counter go on each branch?',
    'End a branch as soon as the game stops. For an expected time or payoff, multiply each terminal value by its path probability.',
  ],
  'restricted-arrangements': [
    'Mark the disclosed positions and check whether the first and last positions count as neighbours.',
    'Count placements consistent with the observation. For a conditional probability, use that count as your denominator.',
  ],
  'production-network': [
    'Write a separate expression for the usable output of each line in terms of its hours.',
    'Use the schedule to relate the two hours. Put a recovered input back into both lines and see if their total matches.',
  ],
  'tariff': [
    'Try an order one unit above the threshold. Which units change price?',
    'Charge the fixed fee once per order and discount at the stated stage. To infer quantity, undo those stages in reverse.',
  ],
  'sampling-policies': [
    'For each statement, identify what the first draw chooses. Are groups equally likely, or are individual records equally likely?',
    'Track whether the second draw keeps the first group or removes a record. Compare the resulting probabilities before rounding.',
  ],
  'weighted-experiments': [
    'List the possible score pairs. How many physical sectors can produce each pair?',
    'Weight each pair by its chance of giving the observation, then compare the favourable weight with the total remaining weight.',
  ],
  'finite-meter-survey': [
    'Apply the requested rule to one day-and-night pair first. Would taking a maximum or applying a cap after averaging give the same result?',
    'Scale each sample to the size of its district. Use the variation among the readings when choosing how far your bounds extend.',
  ],
  'population-survey': [
    'What fraction of the sample was tagged? The full habitat contains a known number of tagged individuals.',
    'Estimate each habitat using its own observations. A small recapture count makes the estimate particularly sensitive to one more or one fewer sighting.',
  ],
  'planning-estimate': [
    'Choose a plausible low and high value for the reference quantity. Convert the requested percentage into a workload.',
    'Use productive crew-hours. If the crew size changes, compute the time for each part separately and add the times.',
  ],
  'portfolio-network': [
    'Write the product exposure from one unit of each contract. Which combination could leave every product at zero?',
    'Price buys at the ask and sales at the bid. A component valuation inside every quote can also explain why no flat trade can make money.',
  ],
};
export const modelCatalog = Object.fromEntries(Object.entries(definitions).map(([section, entries]) => [
  section, entries.map(([id, title, skill]) => ({id, title, skill, levels: [1, 2, 3]})),
]));
