// Book: Beat the Odds. Chapters come from two parts written in parallel (a.js, b.js);
// the recognition tree lives in tree.js. This file only assembles them.
import partA from './a.js';
import partB from './b.js';
import tree from './tree.js';
import curriculum from './curriculum.js';

const chapters = [{title:'Core models and mathematical transfer',intro:'Choose models from assumptions and apply them across contexts. These six practice families fill gaps between foundational theory and timed problem solving.',lessons:curriculum},...partA, ...partB];
export default {
  id: 'bto',
  title: 'Beat the Odds',
  blurb: 'Probability training: choose a model, count or weight outcomes, condition on information, and reason about expectation, dependence and sequential processes. Training coverage is not an official Optiver syllabus.',
  chapters,
  tree,
  pending: chapters.length === 0,
};
