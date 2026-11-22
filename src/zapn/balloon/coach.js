// Numbers below come from engine.solveRound with pop point K ~ Uniform{1..20};
// tests/zapn/balloon.test.js pins them so this text cannot drift from the engine.
export default {
  purpose: 'Measures how you size risk: whether you push each bet to the point where its expected value peaks, and whether you change that point when the cost of losing changes.',
  howItWorks: [
    'Each safe pump adds money to the current balloon. Press Collect to bank that amount and move on. A pop loses everything in that balloon.',
    'Round 1: 30 balloons at 10c per pump.',
    'Round 2: 20 balloons at 20c per pump. Start this round with a fresh bank. A pop also deducts half of that bank, rounded down to whole cents.',
    'Each balloon independently pops on one of pumps 1 to 20, all equally likely. You can collect before your first pump. Time is recorded.',
  ],
  scoring: 'Your total bank divided by what the expected-value-optimal policy earns on the same balloons. The same pop points make a paired comparison, but luck remains because strategies survive different balloons. Decision cost separately measures conditional expected-value loss under the known trainer model. Target: 0.85 or better.',
  strategy: [
    { say: 'Anchor: this is a coin you keep flipping for a growing prize. Each pump is one more flip.', why: 'Every pump is a separate bet: it adds 10c if the balloon survives and forfeits everything on it if it pops.' },
    { say: 'Round 1: after t safe pumps, the next pump pops with probability 1/(20 - t) and adds 10c.', why: 'Given no pop yet, K is uniform on the 20 - t remaining pump numbers, so one of them is the next pump.' },
    { say: 'Expected value of cashing at t is 10c x t x (20 - t) / 20. The next pump adds 10c x (19 - 2t) / 20.', why: 'Survival to t pumps has probability (20 - t)/20. The difference between t + 1 and t is positive while t < 9.5.' },
    { say: 'So pump to 10 and cash, every balloon. Greed after the midpoint loses: pump 11 has negative expected value.', why: 'Past the midpoint you risk more banked-in-balloon money than the 10c the pump adds.' },
    { say: 'Round 2 pays more per pump and also puts part of your round-2 bank at risk.', why: 'The downside of a pump now includes half of everything you already won this round, so the break-even pump count falls as the bank grows.' },
    { say: 'Round 2 targets from the exact solution: empty bank, 11 pumps; $2 banked, about 9; $4, about 7; $6, about 5; $8, about 3; $10 or more, 0 to 2.', why: 'Backward induction over (balloons left, bank) maximises the expected final bank. An early pop at a small bank is cheap, so you start aggressive and taper.' },
    { say: 'For an unknown pop distribution, keep track of which balloons popped and which were cashed. Do not halve the mean of observed pops.', why: 'Pops are censored by your stopping policy: cashing early hides larger K. A small cluster does not identify the distribution. The fixed targets here depend on the stated uniform 1..20 model.' },
  ],
  rule: 'Round 1: 10 pumps, cash. Round 2: pump about 11 minus your round-2 bank in dollars; stop pumping once that bank passes $10.',
  drills: [
    'Play round 1 at exactly 10 pumps for 10 balloons and compare your bank to 10 x $0.50 = $5 expected.',
    'Before each round-2 balloon, say the target out loud from the rule, then execute it without changing your mind mid-balloon.',
    'Predict: if pop points were uniform on 1..30, what is the round-1 target? (15.)',
  ],
};
