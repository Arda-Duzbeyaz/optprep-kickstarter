const earth='https://science.nasa.gov/earth/facts/';
const bridge='https://www.transport.gov.scot/news/135-years-of-the-forth-bridge/';
const plant='https://www.itaipu.gov.br/wp-content/uploads/2025/11/brochure-itaipu-in-numbers-2023-2025.pdf';
const ons='https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/populationandhouseholdestimatesenglandandwales/census2021unroundeddata';
const bases=[
  {id:'residents',label:'the 2021 Census usual-resident population of England and Wales',unit:'residents',value:59597542,source:ons,what:'people to serve',rates:[2500,5000,10000],credit:'ONS Census 2021'},
  {id:'crossing',label:'the length of the Forth rail bridge',unit:'metres',value:2467,source:bridge,what:'metres to inspect',rates:[6,12,20],credit:'Transport Scotland'},
  {id:'equator',label:'the circumference of Earth’s equator, treating the equator as circular',unit:'km',value:Math.PI*12756,source:earth,what:'kilometres to survey',rates:[40,60,80],credit:'NASA equatorial diameter of 12,756 km, multiplied by π'},
  {id:'generation',label:'one hour of electrical output at Itaipu’s full installed capacity',unit:'MWh',value:14000,source:plant,what:'MWh to distribute',rates:[20,50,100],credit:'Itaipu’s installed 14,000 MW × 1 hour'},
];
export default function planning(rng,level){
  const base=rng.pick(bases),fraction=rng.pick([10,20,25,40,50,75]),team=rng.int(2,6),rate=rng.pick(base.rates);
  const efficiency=level===1?1:rng.pick([.6,.75,.8,.9]);
  const task=rng.pick(level===1?['time','rate']:['time','rate','unserved','switch']);
  const hours=rng.int(1,6);
  const amount=base.value*fraction/100;
  const capacity=team*rate*efficiency;
  // The second stage has a positive workload by construction. A fixed fraction
  // is used for the handover so the prompt never requires guessing a hidden date.
  const share=rng.pick([20,25,40,50]),next=team+rng.int(1,3);
  const intro=`A hypothetical project has a workload equal to ${fraction}% of ${base.label}, measured in ${base.unit} (${base.what}).`;
  const description=`Each crew covers ${rate} ${base.unit} per productive hour and is productive for ${efficiency*100}% of clock time.`;
  const ask={time:`${description} With ${team} crews running in parallel, how many clock hours are needed?`,rate:`${team} crews have ${hours} clock hours each at ${efficiency*100}% productive time. What throughput per productive crew-hour is required to finish?`,
    unserved:`${share}% of the workload has already been completed. ${description} How many further clock hours will ${team} crews need?`,
    switch:`${description} Initially ${team} crews operate. After ${share}% of the work is complete, ${next} crews operate. How many total clock hours are needed?`}[task];
  const truth=task==='time'?amount/capacity:task==='rate'?amount/(team*hours*efficiency):task==='unserved'?amount*(1-share/100)/capacity:
    amount*(share/100)/capacity+amount*(1-share/100)/(next*rate*efficiency);
  const method={time:'Divide workload by effective combined throughput.',rate:'Divide workload by total productive crew-hours.',unserved:'Apply the unfinished fraction before dividing by effective throughput.',switch:'Divide each portion by its own effective throughput, then add the two elapsed times.'}[task];
  return {mode:'planning-estimate',operations:[base.id,task],params:{base:base.id,fraction,team,rate,efficiency,task,hours,share,next},
    text:intro+' '+ask,source:base.source,truth,unit:task==='rate'?base.unit+' per productive crew-hour':'clock hours',
    working:`Reference scale ≈ ${Number(base.value.toPrecision(6))} ${base.unit} (${base.credit}). At ${fraction}% the workload is approximately ${Number(amount.toPrecision(5))} ${base.unit}.`,method};
}
