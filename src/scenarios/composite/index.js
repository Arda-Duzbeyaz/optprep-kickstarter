import probability from './probability.js';
import stopping from './stopping.js';
import counting from './counting.js';
import numerical from './numerical.js';
import pricing from './pricing.js';
import ranking from './ranking.js';
import spinners from './spinners.js';
import intervals from './intervals.js';
import population from './population.js';
import planning from './planning.js';
import hedge from './hedges.js';
import markets from './markets.js';
export const generators={
  'box-experiment':probability,'stopped-process':stopping,'restricted-arrangements':counting,
  'production-network':numerical,tariff:pricing,'sampling-policies':ranking,'weighted-experiments':spinners,
  'population-survey':population,'finite-meter-survey':intervals,'planning-estimate':planning,'portfolio-network':(rng,level)=>rng.chance(.6)?hedge(rng,level):markets(rng,level),
};
