// Third first-attempt form. Imported only by the independent-paper screen.
import { probability, number, ranking, estimate, board } from './material.js';
const pct={unit:'%',tolerance:.0051};
const p=(t,a,s)=>probability(t,a,s);
const rank=(t,rows,s)=>ranking(t,rows,s);
function sample(t,values,indices,unit,method){
  const measured=indices.map(i=>values[i]);
  return estimate('Simulation. '+t+' A uniform sample of '+indices.length+' from '+values.length+' gave '+measured.join(', ')+'. Estimate the full total.',
    values.reduce((a,b)=>a+b,0),unit,method+' The complete synthetic record is '+values.join(', ')+'.');
}
export const independent={
 bto:[
  p('Shuffle four numbered keys. Exactly one works. You try two different keys. Given both failed, what is the chance the working key is fourth?',.5,'The two untried positions are exchangeable.'),
  p('A fair die chooses a prize: 1–4 give one ticket, 5–6 give three. A ticket is picked uniformly from all tickets issued across equally many occurrences of each face. What is the chance its roll was 5 or 6?',.6,'Four tickets come from faces 1–4 and six from faces 5–6.'),
  number('Three independent fair coins pay their number of heads. You may replace the entire result once before seeing the replacement. What is the optimal expected payoff?',15/8,'A replacement averages 1.5. Keep two or three. The eight equally likely outcomes contribute 4 × 1.5 + 3 × 2 + 3 = 15.'),
  p('Among six equally likely routes, two cross bridge A, three cross B and one crosses both. A closure blocks every route crossing either bridge. What fraction remains open?',1/3,'Four use at least one bridge, leaving two of six.'),
  p('Three fair dice are rolled. Given that exactly one shows a six, what is the chance the other two match?',.2,'The two non-sixes are independent uniforms on 1–5 after their positions are specified. The second matches the first with chance 1/5.')
 ],
 nl:[
  number('In a 60-minute shift, a printer runs at 8 pages/minute until it changes to 12. It prints 600 pages. How many minutes did it run at the faster rate?',30,'All-slow output would be 480 pages. The extra 120 require 30 minutes at four extra pages per minute.'),
  number('A report gives whole-number counts. Exactly 37.5% of 88 tickets needed review. Five of these were withdrawn. How many reviewed tickets remained?',28,'Three eighths of 88 is 33. Subtract five.'),
  number('Two machines together need 6 hours for one batch. Machine A alone needs 10 hours. How long does B alone need, in hours?',15,'B processes 1/6 − 1/10 = 1/15 batch per hour.'),
  number('A supplier offers 9 usable units for £72. Another offers 12 for £90. By what percentage is the second unit price lower than the first?',6.25,'Unit prices are £8 and £7.50. Divide the £0.50 saving by £8.',pct),
  number('Two sensors record once every 8 and 12 seconds. Both record at time zero. During the next 60 seconds, how many distinct instants have at least one reading? Exclude time zero.',10,'There are seven multiples of 8 and five of 12. Subtract two shared multiples of 24.')
 ],
 ll:[
  rank('Two cards are drawn from four red and six black cards without replacement. Rank these events.',[['Exactly one red',48/90],['Both black',30/90],['At least one black',78/90]],'Count ordered pairs among 90. Use both orders for the mixed event.'),
  rank('A counter is uniform on 1–24. Rank these events.',[['Divisible by 4 or 6',8/24],['Divisible by 3 or 8',10/24],['Divisible by 2 and 3',4/24]],'Use inclusion–exclusion for unions and the least common multiple for intersections.'),
  rank('Seven tickets have distinct numbers 1 through 7. Two different tickets are drawn in order. Rank the events.',[['First exceeds second',.5],['First is odd',4/7],['Both are odd',12/42]],'Symmetry gives one half for the comparison. There are four odd tickets and then three.'),
  rank('A die is fair. A second independent fair roll is available. Rank these ways to finish with an even number.',[['Keep the first roll',.5],['Reroll only an odd first roll',.75],['Reroll only an even first roll',.25]],'Rerolling an odd first face gives an extra chance. Rerolling an even face risks losing it.'),
  rank('An alarm has sensitivity 90% and false-positive probability 10%. Different groups have the prior rates below. Rank their posterior chance of a fault after a positive alarm.',[['Prior 3%',.027/(.027+.097)],['Prior 5%',.045/(.045+.095)],['Prior 4%',.036/(.036+.096)]],'The same positive likelihood ratio multiplies the prior odds in each group, preserving their order.')
 ],
 iv:[
  sample('An archive contains boxes of paper files.',[15,21,17,22,31,14,19,24,18,16],[1,4,8],'files','Scale the sample mean by the box count.'),
  sample('A station counts evening passengers by equal time slot.',[61,82,79,94,88,66,51,43,35],[0,4,8],'passengers','Scale the three sampled slots, allowing room for unsampled peaks.'),
  sample('A synthetic factory log records daily electricity use in kWh.',[410,330,380,425,290,315,405,310,395,420],[0,2,6,7],'kWh','The typical day gives a scale. Daily loads differ.'),
  sample('A synthetic delivery fleet records kilometres per route.',[32,44,38,87,41,54,62,26],[1,4,6],'km','Allow room for a long route missing from the sample.'),
  sample('A synthetic reservoir log records daily inflow in thousands of litres.',[4,6,14,3,2,8,12,5,5,4,3,9],[0,3,6,9],'thousand litres','A few high days can dominate the total.')
 ],
 ob:[
  board(['U','V'],[['U',[1,0],9,11],['V',[0,1],19,21],['Two V less U',[-1,2],35,37]],'Sell the contract, buy two V and sell U. Cash is 35 − 42 + 9.'),
  board(['P','Q'],[['P',[1,0],18,20],['Q',[0,1],7,9],['P+Q',[1,1],27,29]],'Values P=19 and Q=8 place every instrument inside its spread.'),
  board(['J','K'],[['Pair',[1,1],15,16],['J',[1,0],7,8],['Pair plus J',[2,1],26,28]],'Buy the pair and J for 24 and sell the combined bundle for 26.'),
  board(['R','T'],[['R',[1,0],31,34],['T',[0,1],17,19],['R less T',[1,-1],14,16]],'Values R=33 and T=18 imply a difference of 15 and fit all three spreads.'),
  board(['M','N'],[['M',[1,0],24,26],['N',[0,1],12,13],['Triple',[1,2],45,47]],'Buy the triple for 47, sell M for 24 and sell two N for 24. The cash profit is one.')
 ]
};
