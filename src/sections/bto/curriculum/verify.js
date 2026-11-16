// Independent finite-outcome oracles. Do not import the question-building formulas.
// Generation uses combinations, convolution and moment identities; these checks use
// explicit paths/subsets and centred deviations. All weights remain exact rationals.
import { Q } from '../../../core/rational.js';
import { agree } from '../lib.js';
const R=(n,d=1)=>Q.of(n,d), add=xs=>xs.reduce((a,b)=>a.add(b),R(0));
const mean=atoms=>add(atoms.map(([x,p])=>p.mul(R(x))));
const variance=atoms=>{const m=mean(atoms);return add(atoms.map(([x,p])=>{const z=R(x).sub(m);return p.mul(z).mul(z);}));};
function bits(n,pFor,onLeaf) {
  function visit(i,values,w){if(w.isZero())return;if(i===n){onLeaf(values,w);return;}const p=pFor(i,values);visit(i+1,[...values,0],w.mul(R(1).sub(p)));visit(i+1,[...values,1],w.mul(p));}
  visit(0,[],R(1));
}
const count=xs=>xs.reduce((a,b)=>a+b,0);
function subsets(n,k,onSubset) {
  function visit(start,selected){if(selected.length===k){onSubset(selected);return;}for(let i=start;i<=n-(k-selected.length);i++)visit(i+1,[...selected,i]);}
  visit(0,[]);
}
function tuples(values,weights,n,onTuple) {
  const total=weights.reduce((a,b)=>a+b,0);
  function visit(xs,w){if(xs.length===n){onTuple(xs,w);return;}values.forEach((v,i)=>visit([...xs,v],w.mul(R(weights[i],total))));}
  visit([],R(1));
}
export function verifyEvents(item) {
  const p=item.params;let numerator=R(0),denominator=R(1);
  if(p.kind==='independent'){
    const a=R(...p.pa),b=R(...p.pb);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)if(i||j)numerator=numerator.add((i?a:R(1).sub(a)).mul(j?b:R(1).sub(b)));
  }else{
    const weights=p.weights||p.cells,N=weights.reduce((a,b)=>a+b,0);let hit=0,allowed=0;
    weights.forEach((w,i)=>{const A=!!(i&1),B=!!(i&2),eligible=p.kind!=='conditional'||A;
      if(eligible)allowed+=w;
      const yes=p.kind==='three-union'?i!==0:p.kind==='union'?A||B:p.kind==='exclusive'?A!==B:p.kind==='neither'?!A&&!B:A&&B;
      if(eligible&&yes)hit+=w;
    });numerator=R(hit,N);denominator=R(allowed,N);
  }
  return agree(item,numerator.div(denominator));
}
export function verifyCounts(item) {
  const p=item.params;let hit=R(0),allowed=R(0);const n=p.kind==='split'?p.a+p.b:p.kind==='unequal'?p.ps.length:p.n;
  bits(n,(i,previous)=>p.kind==='unequal'?R(...p.ps[i]):p.e.replacement?R(p.e.good,p.e.total):R(p.e.good-count(previous),p.e.total-i),(xs,w)=>{
    const k=count(xs),condition=p.kind==='split'?k===p.K:p.condition==null||k>=p.condition;
    if(condition)allowed=allowed.add(w);
    const yes=p.kind==='split'?count(xs.slice(0,p.a))===p.j:p.kind==='unequal'?k===p.k:k>=p.lo&&k<=p.hi;
    if(condition&&yes)hit=hit.add(w);
  });return agree(item,hit.div(allowed));
}
export function verifyPayout(item) {
  const p=item.params;
  if(p.kind==='fair-win') {
    const a=item.answer.value,residual=a*p.win-(1-a)*p.loss;
    return {ok:a>=0&&a<=1&&Math.abs(residual)<1e-9&&item.options[item.answerIndex].value===a,detail:`break-even residual ${residual}`};
  }
  let num=R(0),den=R(0);
  if(p.kind==='mixture'||p.kind==='information'){
    const N=count(p.priors);
    p.priors.forEach((w,i)=>{
      for(let green=0;green<2;green++)for(let hit=0;hit<2;hit++){
        if(p.kind==='information'&&!green)continue;
        const atom=R(w,N).mul(R(green?p.lights[i]:4-p.lights[i],4)).mul(R(hit?p.hit[i]:4-p.hit[i],4));
        den=den.add(atom);num=num.add(atom.mul(R(hit?p.pays[i]:0)));
      }
    });
  }else{
    const N=count(p.weights);
    p.values.forEach((x,i)=>{
      if(p.kind==='conditional'&&x<0)return;
      const y=p.kind==='profit'?x-p.fee:p.kind==='cap'?Math.min(x,p.cap):p.kind==='bonus'?x+(x>=p.threshold?p.bonus:0):x;
      const w=R(p.weights[i],N);den=den.add(w);num=num.add(w.mul(R(y)));
    });
  }return agree(item,num.div(den));
}
export function verifyVariance(item) {
  const p=item.params;let atoms=[];
  if(p.kind==='covariance'){
    const N=count(p.cells),mx=R(p.cells[2]+p.cells[3],N),my=R(p.cells[1]+p.cells[3],N);
    let v=R(0);p.cells.forEach((w,i)=>{v=v.add(R(w,N).mul(R(i>>1).sub(mx)).mul(R(i&1).sub(my)));});return agree(item,v);
  }
  if(p.kind==='sample'){
    const sums=[];subsets(p.N,p.n,selected=>sums.push(selected.reduce((s,i)=>s+i+1,0)));atoms=sums.map(x=>[x,R(1,sums.length)]);
  }else if(p.kind==='mixture'||p.kind==='conditional-variance'){
    const priors=[R(p.prior,4),R(4-p.prior,4)];
    for(let source=0;source<2;source++){
      if(!p.shared&&source===1)continue;
      const base=p.shared?priors[source]:R(1),light=p.kind==='conditional-variance'?R(p.lights[source],4):R(1);
      // Fresh choices expand source/outcome at every step; no total-variance identity.
      if(!p.shared){
        function fresh(i,k,w){if(i===p.n){atoms.push([k,w]);return;}for(let s=0;s<2;s++)for(let hit=0;hit<2;hit++)fresh(i+1,k+hit,w.mul(priors[s]).mul(R(hit?p.rates[s]:5-p.rates[s],5)));}
        fresh(0,0,R(1));
      }else bits(p.n,()=>R(p.rates[source],5),(xs,w)=>atoms.push([count(xs),w.mul(base).mul(light)]));
    }
    const den=add(atoms.map(([,w])=>w));atoms=atoms.map(([x,w])=>[x,w.div(den)]);
  }else{
    const N=count(p.weights);
    if(p.kind==='sum')for(let i=0;i<p.values.length;i++)for(let j=0;j<p.values.length;j++)atoms.push([p.a*p.values[i]+p.b*p.values[j],R(p.weights[i]*p.weights[j],N*N)]);
    else atoms=p.values.map((x,i)=>[p.kind==='reuse'?(p.a+p.b)*x:p.kind==='affine'?p.a*x+p.shift:x,R(p.weights[i],N)]);
  }
  return agree(item,variance(atoms));
}
export function verifySums(item) {
  const p=item.params;let hit=R(0),allowed=R(0);
  if(p.kind==='random-total'){
    p.counts.forEach((n,i)=>tuples(p.xs,p.wx,n,(xs,w)=>{if(count(xs)>=p.limit)hit=hit.add(w.mul(R(p.countWeights[i],count(p.countWeights))));}));return agree(item,hit);
  }
  const nx=count(p.wx),ny=count(p.wy);
  if(p.kind==='reuse'&&!p.independent){p.xs.forEach((x,i)=>{if(2*x>=p.t)hit=hit.add(R(p.wx[i],nx));});return agree(item,hit);}
  p.xs.forEach((x,i)=>p.ys.forEach((y,j)=>{
    const w=R(p.wx[i]*p.wy[j],nx*ny),eligible=p.kind!=='conditional'||x+y>=p.t;
    if(eligible)allowed=allowed.add(w);
    const yes=p.kind==='conditional'?x>=p.bound:p.kind==='comparison'?x>y:p.kind==='exact'?x+y===p.t:x+y>=p.t;
    if(eligible&&yes)hit=hit.add(w);
  }));return agree(item,hit.div(allowed));
}
export function verifyCounting(item) {
  const p=item.params;let hit=0,total=0;
  if(p.kind==='roles'){
    const N=p.a+p.b;for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(i!==j){total++;if(i<p.a&&j>=p.a)hit++;}
  }else if(p.kind==='group'||p.kind==='conditioned'){
    const N=count(p.counts);
    subsets(N,p.k,selected=>{
      const colourCounts=[0,0,0];selected.forEach(i=>colourCounts[i<p.counts[0]?0:i<p.counts[0]+p.counts[1]?1:2]++);
      if(p.kind==='conditioned'&&colourCounts[0]===0)return;
      total++;if(p.kind==='conditioned'?colourCounts.every(x=>x>0):colourCounts.every((x,i)=>x===p.target[i]))hit++;
    });
  }else if(p.kind==='adjacent'){
    // Ordered positions of the two specified people; all other (n-2)! orders cancel.
    for(let i=0;i<p.n;i++)for(let j=0;j<p.n;j++)if(i!==j){total++;if((Math.abs(i-j)===1)!==p.apart)hit++;}
  }else if(p.kind==='gaps'){
    subsets(p.r+p.b,p.r,selected=>{total++;if(selected.every((x,i)=>i===0||x-selected[i-1]>1))hit++;});
  }else if(p.kind==='repeated'){
    // Build unique strings directly instead of dividing labelled permutations.
    const counts=[...p.counts];function visit(){if(counts.every(x=>x===0)){hit++;return;}for(let i=0;i<counts.length;i++)if(counts[i]){counts[i]--;visit();counts[i]++;}}
    visit();return agree(item,hit);
  }else throw new Error(`Unknown counting task: ${p.kind}`);
  return agree(item,R(hit,total));
}
