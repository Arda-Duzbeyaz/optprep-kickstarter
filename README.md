# OptPrep for Career Kickstarter Trading

**Version 2.0.0 · Question quality update, 22 November 2026**

## Start here

1. Export your current progress from **Settings → Backup**. Extract the ZIP. In the folder containing `package.json`, run `npm start` using Node.js 20 or newer. The app opens in your browser and needs no package installation for ordinary practice.
2. Use the same browser profile, protocol, hostname and port as before to pick up your saved data. If you move from GitHub Pages to the local app or change address, import the backup in **Settings → Backup**.
3. Open **Today**, choose your available time and press the first activity button. Return to Today after completing it. A 120-minute outline is a plan for one block. You can start another block immediately.
4. The first two assessments suggested to a new profile are Beat the Odds and NumberLogic. Seeing 25 minutes beside each means two separate timed sections totalling 50 minutes. An existing profile can start with a different recommendation based on its history.

## Which practice mode should I use?

| When | Open | What happens |
| --- | --- | --- |
| You cannot set up a question even after seeing the topic | Focused learning | Practise one family and read the explanation. Each topic has its own unfinished save. |
| You can solve it once told the topic | Mixed practice | Select the method yourself. The all-skills mix includes the new generators. Each mixed pool has a separate save. |
| You want to see what happens against the clock | Timed section | Take a fresh paper under the full section clock. Inspect incorrect, slow, skipped and unreached questions afterwards. Regular probability and numerical questions have multiple choices. |
| You want feedback after every answer | Workshop | Work through five questions. Some use open answers so you must produce the number yourself. |
| Today offers Paper A, B or C | Reserved paper | Five fixed questions authored separately for that assessment. Take the first attempt unaided. Review after finishing. The clock continues if you leave. |

**Beat the Odds mastery.** Mixed practice and the standard timed section, including Beat the Odds in Full mock, share the same skill checkpoints. Three fresh, correct, unaided answers at the same difficulty within 75 seconds each verify that difficulty. See the topic breakdown after a timed run. The timed format still uses a 90-second question clock and a 25-minute total.

**Arda’s next session.** Start on Today. If the latest timed result is weak, follow the suggested repair, then try mixed questions to see whether you recognise the method unprompted. For example, with two dice, “at least one was a six” and “a randomly chosen die showed six” give different denominators. Explain which outcomes survive before doing the arithmetic. If your accuracy is high but you run out of time, follow the paced recommendation. On another day, open Today again for a fresh timed comparison.

**Save the reserved papers for a check.** Today can suggest A after you meet the timed target. Later recommendations use your subsequent timed days and previous paper results before suggesting B or C. Each is also available under the section’s Assessment plan. Use regular timed sessions freely for volume. Revisiting an answer on a finished reserved paper is review. Your first score stays recorded separately. The per-section three-day target is an internal consistency measure. The days with a qualifying paper can be separated by rest days.

**NumberLogic.** Leave **Settings → NumberLogic question mix** at 35% applied for a sequence-heavy first benchmark. A full 26-question paper then contains 17 sequence questions and nine applied questions. Choose sequences only for concentrated pattern practice, or 65% applied to work on rates, percentages and tables. Compare scores under the same setting when judging progress.

**Intervals.** After a timed section, open its assessment plan and read coverage, typical upper-to-lower ratio and the direction of your misses together. Repeatedly missing high means your upper bounds were too low. Tighten a range when you can justify the inputs. Use the separate workshop calibration panel for its 80% coverage exercise.

**Zap-N.** Begin with CodeCompare, Pincode and The Switch. The plan lists the six remaining game formats and can suggest an untried game as you continue. Review the relevant measure for that game, such as accuracy, memory span, reaction time where shown, or excess moves.

## Release contents

- [Question-quality audit, evidence and validation](docs/OPTPREP_QUESTION_QUALITY_AUDIT.md)
- [OptPrep 2.0 release report and worked examples](docs/OPTPREP_2.0_REPORT.md)
- [Measured generation mix and reasoning groups by assessment](evaluation/compositional-rehearsal.json)
- [Release validation results](evaluation/compositional-validation.json)
- [Earlier research on the six assessments](docs/KICKSTARTER_1.9_RESEARCH.md)
- [Earlier audit of the original probability families](docs/KICKSTARTER_1.9_GENERATORS.md)

The original licence, study guides, other role presets and optional backend are included. For later hosting, the existing GitHub Pages workflow builds the static site. Local practice works through `npm start`. For offline use after closing the server, first allow the browser to finish installing the service worker on localhost or HTTPS.
