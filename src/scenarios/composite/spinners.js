const rules={
  total:(a,b,k)=>a+b>=k,match:(a,b)=>a===b,above:(a,b)=>a>b,adjacent:(a,b)=>Math.abs(a-b)===1,
};
const query={total:k=>'their sum is at least '+k,match:()=>'the two scores match',above:()=>'the first score exceeds the second',adjacent:()=>'the scores differ by exactly one'};
const conditions={unfiltered:()=>1,distinct:(a,b)=>Number(a!==b),firstHigh:(a,b)=>Number(a>=2),
  shownTwo:(a,b)=>(Number(a===2)+Number(b===2))/2};
const observation={unfiltered:'',distinct:', given that the scores differ',firstHigh:', given that the first score is at least 2',shownTwo:', given that a uniformly chosen spin position was displayed and showed 2'};
export default function spinners(rng,level){
  for(let attempt=0;attempt<80;attempt++){
    const weights=Array.from({length:2},()=>Array.from({length:3},()=>rng.int(1,level===1?3:5)));
    const target=rng.pick(Object.keys(rules)),k=rng.int(4,6);
    const candidates=[];
    for(const pair of ['AB','AA','BA','BB'])for(const report of Object.keys(conditions)){
      if(level===1 && report!=='unfiltered')continue;
      let fav=0,total=0;
      for(let a=1;a<=3;a++)for(let b=1;b<=3;b++){
        const mass=weights[Number(pair[0]==='B')][a-1]*weights[Number(pair[1]==='B')][b-1]*conditions[report](a,b);
        total+=mass;fav+=mass*Number(rules[target](a,b,k));
      }
      if(fav===0||fav===total)continue;
      candidates.push({pair,report,p:fav/total,fav,total,text:'Spin '+pair[0]+' then '+pair[1]+observation[report]});
    }
    const picked=[];
    for(const c of rng.shuffle(candidates)){
      if(picked.every(x=>Math.abs(x.p-c.p)>(level===1?.015:.002)))picked.push(c);
      if(picked.length===3)break;
    }
    if(picked.length!==3)continue;
    const label=query[target](k);
    return {mode:'weighted-experiments',operations:[target,...picked.map(x=>x.pair+'-'+x.report).sort()],params:{weights,target,k,selected:picked.map(({pair,report})=>({pair,report}))},
      text:'Each spinner has equal-size sectors. The table gives sector counts. Spins are independent before any observation. Rank the procedures by the probability that '+label+'.',
      visual:{type:'table',columns:['Spinner','Score 1','Score 2','Score 3'],rows:weights.map((r,i)=>['AB'[i],...r])},statements:picked.map(({p,text})=>({p,text})),
      working:picked.map(c=>c.text+' gives favourable weight '+c.fav+' out of '+c.total+'.').join(' '),
      method:'Multiply sector counts for an ordered pair. Apply its reporting probability before dividing favourable weight by the total surviving weight.'};
  }
  throw Error('Unable to separate spinner probabilities');
}
