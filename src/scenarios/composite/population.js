const sum=xs=>xs.reduce((a,b)=>a+b,0);
function habitat(rng,rounds){
  const size=rng.int(75,180),marked=rng.int(20,45);
  const ids=Array.from({length:size},(_,i)=>i);
  const samples=Array.from({length:rounds},()=>rng.shuffle(ids).slice(0,rng.int(16,32)));
  return {size,marked,samples};
}
export default function population(rng,level){
  const design=rng.pick(level===1?['single']:['single','repeat','stratified']);
  const goal=rng.pick(level===1?['total','unmarked']:['total','unmarked','density',...(design==='stratified'?['share']:[])]);
  const area=rng.int(3,18);
  // Two sightings or more keep the scale estimate informative. This is a
  // selected practice scenario; the stored full population supplies truth.
  for(let i=0;i<80;i++){
    const groups=Array.from({length:design==='stratified'?2:1},()=>habitat(rng,design==='repeat'?2:1));
    const observed=groups.map(g=>g.samples.map(ids=>ids.filter(x=>x<g.marked).length));
    if(observed.some(s=>sum(s)<2))continue;
    const guesses=groups.map((g,j)=>g.marked*sum(g.samples.map(a=>a.length))/sum(observed[j]));
    const combine=ns=>goal==='share'?100*ns[0]/sum(ns):goal==='unmarked'?sum(ns)-sum(groups.map(g=>g.marked)):goal==='density'?sum(ns)/area:sum(ns);
    const asks={total:'Estimate the total population.',unmarked:'Estimate how many individuals were never tagged.',density:'Estimate the population per square kilometre over a total habitat area of '+area+' km².',share:'Estimate the percentage of the total population living in A.'};
    const text='The population in each habitat stays fixed and tags stay on. Each survey samples uniformly within its habitat, without replacement. All individuals are returned before the next survey. '+asks[goal];
    const visual={type:'table',columns:['Habitat','Originally tagged','Subsequent survey(s): tagged / examined'],rows:groups.map((g,j)=>['AB'[j],g.marked,g.samples.map((v,k)=>observed[j][k]+' / '+v.length).join('; ')])};
    return {mode:'population-survey',operations:[design,goal],params:{groups,design,goal,area},text,visual,
      truth:combine(groups.map(g=>g.size)),unit:goal==='share'?'percent':goal==='density'?'individuals per km²':'individuals',
      steps:[
        {say:'Estimate the tagged share in each habitat from all its survey draws.',why:'Pool tagged and examined counts across repeated samples. Bigger surveys contribute more draws.',math:groups.map((g,j)=>`${'AB'[j]}: ${sum(observed[j])}/${sum(g.samples.map(s=>s.length))}`).join(', ')},
        {say:'Divide each original tag count by the estimated tagged share.',why:'A fixed count divided by its share estimates the full population. A few tagged sightings give a noisy share.',math:guesses.map((v,j)=>`${'AB'[j]}: ${groups[j].marked} ÷ (${sum(observed[j])}/${sum(groups[j].samples.map(s=>s.length))}) ≈ ${Math.round(v)}`).join(', ')},
        {say:'Combine the population estimates for the quantity asked.',why:'The simulator knows the full habitat sizes. In practice the estimates depend on who was recaptured.',math:`Sample estimate ≈ ${Number(combine(guesses).toPrecision(5))}, full population result ≈ ${Number(combine(groups.map(g=>g.size)).toPrecision(5))}`},
      ],
      method:'Within each habitat, divide the number tagged by the sampled tagged fraction. Then combine the resulting habitat estimates.'};
  }
  throw Error('Could not obtain informative recapture data');
}
