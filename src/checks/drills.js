import { makeRng } from '../core/rng.js';
import { number, probability, ranking, estimate, board } from './material.js';

const add = xs => xs.reduce((sum, x) => sum + x, 0);
const table = (columns, rows) => ({ columns, rows });
const round2 = x => Math.round(x * 100) / 100;
const percent = { unit: '%', tolerance: 0.0051 };

function observedDice(rng) {
  const sides = rng.pick([4, 6, 8, 10]), face = rng.int(1, sides);
  const sum = face + rng.int(1, sides);
  const rule = rng.pick(['first', 'either', 'different']);
  const conditions = { first: `the first die shows ${face}`, either: `at least one die shows ${face}`, different: 'the two results differ' };
  const pairs = [];
  for (let a = 1; a <= sides; a++) for (let b = 1; b <= sides; b++) {
    if (rule === 'first' ? a === face : rule === 'either' ? a === face || b === face : a !== b) pairs.push(a + b);
  }
  const hits = pairs.filter(n => n === sum).length;
  return probability(`Two fair ${sides}-sided dice numbered 1 to ${sides} are rolled. You are told ${conditions[rule]}. Given that information, what is the probability of a sum of ${sum}?`,
    hits / pairs.length, `Keep the ordered pairs for which ${conditions[rule]}. That leaves ${pairs.length}. Of these, ${hits} sum to ${sum}. The conditional probability is ${hits}/${pairs.length}.`, 'conditional-dice');
}

function pairSource(rng) {
  const a = rng.int(1, 4), b = rng.int(6, 9), same = rng.chance(.5);
  const p = same ? (a*a+b*b)/200 : ((a+b)/20)**2;
  return probability(`Box A has ${a} red counters out of 10. Box B has ${b} out of 10. Two counters are drawn with replacement. ${same ? 'One fair coin chooses the box for both draws.' : 'A fresh fair coin chooses the box before each draw.'} What is the chance both counters are red?`, p,
    same ? 'Condition on the shared box. Square each box’s red rate, then take the mean of those two probabilities.' : 'Each draw has the same marginal red rate and its own independent box choice. Average the two rates, then square.', 'shared-source');
}

function sampleOrder(rng) {
  const x = rng.int(3,8), y = rng.int(3,8), ordered = rng.chance(.5), replace = rng.chance(.5);
  const p = x / (x+y) * y / (x+y-Number(!replace));
  return probability(`A bag contains ${x} amber and ${y} black tokens. Pick two ${replace ? 'with' : 'without'} replacement. What is the probability of ${ordered ? 'amber first and black second' : 'one of each colour, in either order'}?`, p*(ordered ? 1 : 2),
    `For amber then black, multiply ${x}/${x+y} by ${y}/${x+y-Number(!replace)}. ${ordered ? 'Only that order counts.' : 'The opposite order has the same probability, so double it.'}`, 'urn-draws');
}

function netPayoff(rng) {
  const sides = rng.pick([4,6,8,10]), low = rng.int(1,sides-1), win = rng.int(4,14), fee = rng.int(1,5);
  return number(`Entry costs £${fee}. A fair die numbered 1 to ${sides} pays £${win} if its result is strictly above ${low}, and pays nothing otherwise. What is the expected net gain in pounds?`, win*(sides-low)/sides-fee,
    `There are ${sides-low} winning faces. Weight the payout by ${sides-low}/${sides}, then subtract the entry cost once.`, { tolerance: .000501, skill: 'payout-models' });
}

function staffing(rng) {
  const a = rng.int(2,7), b = rng.int(2,7), h = rng.int(2,5), j = rng.int(3,8), faster = rng.int(13,21), slower = rng.int(4,11);
  const done = a*h*faster + b*j*slower, hours = a*h + b*j;
  return number('What was the combined throughput in orders per person-hour? Round to two decimal places.', round2(done/hours),
    `Add both output totals to get ${done}. Divide by ${a} × ${h} + ${b} × ${j} = ${hours} person-hours.`, { tolerance:.0051,
      table: table(['Desk','People','Hours each','Orders'], [['East',a,h,a*h*faster],['West',b,j,b*j*slower]]) });
}

function priceChange(rng) {
  const price = rng.int(7,43)*20, up = rng.pick([5,10,15,20,25,30]), cut = rng.pick([5,10,15,20,25]);
  const final = round2(price * (1 + up/100) * (1 - cut/100));
  return number(`After a ${up}% rise and a ${cut}% discount on the new price, a pass costs £${final.toFixed(2)}. What was its initial price in pounds?`, price,
    `The two multipliers are ${1+up/100} and ${1-cut/100}. Divide the final price by their product.`, { tolerance: .0051 });
}

function gapToGoal(rng) {
  const previous = rng.int(8,20)*10, target = previous+rng.int(2,8)*5;
  return number(`A desk processed ${previous} requests. What percentage increase in output would reach ${target}? Round to two decimal places.`, round2(100*(target-previous)/previous),
    `The increase is ${target-previous}. Use the starting value ${previous} as the denominator.`, percent);
}

function units(rng) {
  const rate = rng.int(8,64)*125, bytes = rng.pick([200,320,400,640]), minutes = rng.pick([2,3,5,8,12]);
  return number(`A feed sends ${rate} packets each second, ${bytes} bytes per packet. How many decimal megabytes arrive in ${minutes} minutes? One MB is one million bytes.`, rate*bytes*60*minutes/1e6,
    'Convert minutes to seconds, multiply by packets per second and bytes per packet, then divide by one million.', { unit:'MB', tolerance:.000501 });
}

function mixTarget(rng) {
  const lo = rng.pick([10,15,20]), hi = rng.pick([55,60,65,70]), parts = rng.int(2,6), litres = parts*5, addLitres=rng.int(1,5)*5;
  const value = (litres*lo + addLitres*hi)/(litres+addLitres);
  return number(`Combine ${litres} litres of a ${lo}% solution with ${addLitres} litres of a ${hi}% solution. Assuming volumes add, what percentage of the mixture is solute? Round to two decimals.`, round2(value),
    'Multiply each concentration by its volume, add the two amounts of solute, then divide by total volume.', percent);
}

function closeRates(rng) {
  const base = rng.int(25,75), denom = rng.shuffle([100,200,300,400,500,600]).slice(0,3), direction = rng.chance(.5) ? 1 : -1;
  const rows = denom.map((n,i) => ['Desk ' + 'ABC'[i], n*base/100+direction,n]);
  return ranking('A case is sampled uniformly from its desk. Rank the chances it is accepted.',
    rng.shuffle(rows.map(([name, hits, n]) => [name,hits/n])), 'Each fraction is a common percentage plus or minus one case. One case changes a smaller group’s rate by more.',
    { table:table(['Desk','Accepted','Cases'],rows), skill:'conditional-rates' });
}

function closeAreas(rng) {
  const base=rng.int(22,80), counts=rng.shuffle([base-1,base,base+1]), widths=rng.shuffle([2,4,5,10]).slice(0,3);
  let edge = 0;
  const rows=widths.map((w,i)=>{const left=edge; edge+=w;return [`[${left}, ${edge})`,counts[i]/w];});
  return ranking('These data are summarised with frequency densities. Rank the chances that a uniformly chosen reading falls in each interval.',
    rng.shuffle(rows.map(([label],i)=>[label,counts[i]/add(counts)])), 'Multiply each interval’s width by its displayed density, then compare the resulting counts.',
    { table:table(['Interval','Count per unit'],rows),skill:'histogram-bins' });
}

function pooledRates(rng) {
  const base=rng.int(25,70), diff=rng.pick([1,2,3]), n=rng.int(2,5), bigIsHigher=rng.chance(.5);
  const smallRate=base+(bigIsHigher ? -diff : diff), bigRate=base+(bigIsHigher ? diff : -diff);
  const rows=[['Small',smallRate,100],['Large',bigRate*n,n*100]];
  return ranking('Rank the chance of a successful case for these sampling rules.',
    rng.shuffle([['Use the small site only',smallRate/100],['Select a site uniformly first',base/100],['Draw uniformly from all cases',(smallRate+bigRate*n)/((n+1)*100)]]),
    'Selecting a site first gives both sites equal weight. Pooling individual cases gives the larger site more weight.',
    { table:table(['Site','Successes','Cases'],rows),skill:'selection-weights' });
}

function estimatePopulation(rng, groups) {
  const rows = [], observations = []; let truth = 0;
  for (const label of groups) {
    const n=rng.int(24,85), base=rng.int(8,45);
    const population=Array.from({length:n},()=>rng.int(Math.max(1,base-6),base+7));
    const sample=rng.shuffle(population).slice(0,4);
    rows.push([label,n,sample.join(', ')]); truth+=add(population);
    observations.push(n*add(sample)/sample.length);
  }
  return estimate('A simulated delivery has crates of different grades. Four crates were sampled uniformly within each grade. Estimate the total number of pieces in the entire delivery, including the sampled crates.',truth,'pieces',
    `One estimate is to multiply each sample mean by the number of crates in its grade and add. That gives ${Math.round(add(observations))}. The reference counts the contents of every simulated crate. The unobserved crates can change the total.`,
    { table:table(['Grade','All crates','Pieces in sampled crates'],rows) });
}

function estimateShift(rng) {
  const n=rng.pick([12,16,24]), baseline=rng.int(15,70), counts=Array.from({length:n},()=>rng.int(Math.ceil(.45*baseline),Math.floor(1.6*baseline)));
  const sample=rng.shuffle(counts).slice(0,4), estimateTotal=n*add(sample)/4;
  return estimate(`A simulated station recorded arrivals in ${n} equal time slots. A random sample of four slots contained ${sample.join(', ')} arrivals. Estimate total arrivals across all slots.`,add(counts),'arrivals',
    `Scale the sample average by ${n} to get ${Math.round(estimateTotal)}. Allow for variation in the unobserved slots. The reference is the sum of all ${n} actual simulated counts.`);
}

function baskets(rng) {
  const x=rng.int(10,55), y=rng.int(12,45), weight=rng.pick([1,2,3]), sign=rng.pick([-1,1]), edge=rng.pick(['buy','sell','none']);
  const unit=weight*x+sign*y;
  const hedgeCost=weight*(x+1)+(sign>0?y+1:-y+1);
  const hedgeBid=weight*(x-1)+(sign>0?y-1:-y-1);
  const bid=edge==='sell'?hedgeCost+1:edge==='buy'?hedgeBid-3:unit-1, ask=edge==='buy'?hedgeBid-1:bid+2;
  const item=board(['X','Y'],rng.shuffle([['X',[1,0],x-1,x+1],['Y',[0,1],y-1,y+1],['Pack',[weight,sign],bid,ask]]),
    edge==='none' ? `Component values X = ${x} and Y = ${y} price every instrument inside its spread. There is no executable arbitrage.` :
      'Price the hedging legs on their executable sides. A negative ingredient reverses the side needed in the hedge.',sign>0?'weighted':'spread');
  return item;
}

const generators={
  bto:[observedDice,pairSource,sampleOrder,netPayoff],
  nl:[staffing,priceChange,gapToGoal,units,mixTarget],
  ll:[closeRates,closeAreas,pooledRates],
  iv:[rng=>estimatePopulation(rng,['Standard','Premium']),estimateShift,rng=>estimatePopulation(rng,['Small','Medium','Large'])],
  ob:[baskets],
};

// Cycle the structures in each five-question block, randomise their order and parameters.
export function drillItem(section, seed, index) {
  const gens=generators[section], rng=makeRng('workshop-v1:'+section+':'+seed);
  const order=rng.fork('order:'+Math.floor(index/gens.length)).shuffle(gens);
  return order[index%gens.length](rng.fork('item:'+index));
}
