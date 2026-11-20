# OptPrep for the Career Kickstarter trading assessments

**Version 1.8.0-kickstarter.1 · 20 November 2026**

Open **Today → Assessment plan**. A new profile starts with full timed Beat the Odds and NumberLogic sections. If you already have eligible timed results, Today uses those to pick your next session. Choose a 30-, 60- or 120-minute budget.

## Practise the six assessments

| Assessment | What to use |
| --- | --- |
| Beat the Odds | Take a timed section, then practise an identified weakness. The workshop uses open answers for conditional probability, sampling, shared information and expected payoffs. |
| NumberLogic | The timed section trains sequences. The numerical reasoning workshop adds weighted averages, ratios, percentage changes, units and table interpretation. Both types appear in the reserved papers. |
| Likelihood List | Rank closely matched outcomes, distinguish pooled rates from equally weighted groups, and use area when comparing histogram bins. |
| Intervals | Estimate totals from partial observations in workshops. On the two reserved papers, estimate a missing real-world input and give lower and upper bounds. The review shows published values, how often your ranges covered them, and your typical width. |
| Orderbooks | Build positions from executable bids and asks. In the workshop and reserved papers you can choose **No opportunity** when every available trade combination fails. |
| Zap-N | Start with CodeCompare, Pincode and The Switch for visual comparison, working memory and rule switching. The game page also contains the full set of nine practice games. |

## Use a timed result

The review distinguishes errors, skipped questions, unreached questions and correct answers over pace. From **What to work on**, open the skill that cost the most points. After a repair, do a mixed block and return for a fresh timed section on another day. The planner counts the latest eligible result per London practice day. Three days at the section target are OptPrep's consistency benchmark.

Each of the five quantitative sections has two reserved five-question papers. They sit outside lessons, workshops and regular exams. Pick **Paper A** for a first check and save **Paper B** for a later day. Once a paper starts, its clock continues across navigation and reloads. Your first result stays in the section history. Workshops provide worked feedback after each answer. For an independently authored cross-check, Beat the Odds and NumberLogic also have outside resources and a place to record your timed score.

The five full section durations follow the invitation. Question counts, detailed scoring, practice targets, short-paper clocks, the 80% interval exercise and the choice of starter games are training settings. The email describes NumberLogic broadly as numerical reasoning and leaves the game selection open.

## Run the app and keep your progress

1. In your existing app, export your progress in **Settings → Backup**.
2. Extract this ZIP. In the inner folder containing `package.json`, run the following with Node.js 20 or newer.

   ```sh
   npm start
   ```

3. Use the same browser profile and address as before. If your old app runs at a different address, import the backup in **Settings → Backup**. Each unfinished topic and each mixed-practice pool keeps its own save.
4. If you normally host OptPrep on GitHub Pages, deploy the inner folder to your existing repository and keep its existing Pages address.

The app runs locally without installing packages. The original MIT licence and attribution are included.

## Developer checks

```sh
npm test
node tools/assessment-plan-flow.mjs
```

The second command uses jsdom for simulated browser testing. Install it in the developer environment or point `OPTPREP_TEST_JSDOM` at an existing installation. The release passed 1,202 JavaScript tests, 492 assertions through the new routes, 13 existing interface scripts and 171 assertions covering separate topic and mixed saves. The new route checks submit 75 answers through the input, ranking, interval and orderbook controls.

`BUILD_INFO.json` contains release details. `SOURCE_REVISION.txt` identifies the source revision of the input ZIP. Earlier curriculum work is described in [the assessment audit](docs/ASSESSMENT_BATTERY_AUDIT.md), [the probability audit](docs/BTO_CURRICULUM_AUDIT.md), and [the separate-saves report](docs/SEPARATE_PRACTICE_SAVES.md).
