export function priceProblem(w){
  const {n,threshold,low,high,fee,rebate,policy,task,extra}=w;
  const variable=x=>policy==='marginal'?Math.min(x,threshold)*low+Math.max(0,x-threshold)*high:x*(x>threshold?high:low);
  const keep=1-rebate/100;
  const bill=x=>(fee+variable(x))*keep;
  const price=bill(n),diff=bill(n+extra)-price;
  const rule=policy==='marginal'?`Units 1–${threshold} cost £${low} each and only later units cost £${high} each.`:
    `The unit price for the entire order is £${low} at or below ${threshold} units and £${high} above that threshold.`;
  const info=`A supplier adds a £${fee} fixed charge per order, then discounts the entire bill by ${rebate}%.`;
  const asks={bill:`What is the bill for ${n} units?`,increment:`How much does the bill increase if one order grows from ${n} units to ${n+extra}?`,average:`What is the average final cost per unit for an order of ${n}?`,quantity:`The final bill for one order is £${Number(price.toFixed(2))}. How many units were ordered?`,split:`How much more would two orders of ${n} and ${extra} cost in total than a single order of ${n+extra}? Give a negative answer for a saving.`};
  const value={bill:price,increment:diff,average:price/n,quantity:n,split:price+bill(extra)-bill(n+extra)}[task];
  const f=x=>String(Number(x.toFixed(4)));
  const goods=x=>policy==='marginal' && x>threshold?`${threshold} × ${low} + ${x-threshold} × ${high}`:`${x} × ${x>threshold?high:low}`;
  const alternate=x=>policy==='marginal'?x*(x>threshold?high:low):Math.min(x,threshold)*low+Math.max(0,x-threshold)*high;
  const method={
    bill:'Add the fixed charge to the goods amount before applying the discount.',
    average:'Divide the discounted bill by the number of units.',
    increment:'Subtract the two goods amounts, then apply the discount. The fixed charge cancels.',
    quantity:'Undo the discount, remove the fixed charge, then recover the unit count from the price rule.',
    split:'Include the fixed charge twice for two orders and once for one order.',
  }[task];
  const math={
    bill:`(${goods(n)} + ${fee}) × ${keep} = £${f(value)}`,
    average:`[(${goods(n)} + ${fee}) × ${keep}] ÷ ${n} ≈ £${f(value)} per unit`,
    increment:`(${variable(n+extra)} − ${variable(n)}) × ${keep} = £${f(value)}`,
    quantity:`£${f(price)} ÷ ${keep} − £${fee} = £${variable(n)} for the goods`,
    split:`(${variable(n)} + ${variable(extra)} − ${variable(n+extra)} + ${fee}) × ${keep} = £${f(value)}`,
  }[task];
  const incorrectPolicy='Applied the other pricing rule to units above the threshold.';
  const common=(v,divisor=1)=>[
    [(v+fee)/divisor,'Used the bill before discount.'],
    [v*keep/divisor,'Left the fixed charge off the bill.'],
    [(v*keep+fee)/divisor,'Discounted the goods but charged the full fixed fee.'],
    [(alternate(n)+fee)*keep/divisor,incorrectPolicy],
  ];
  const mistakes={
    bill:common(variable(n)),average:[...common(variable(n),n),[price,'Found the full bill and stopped before dividing by units.']],
    increment:[[bill(n+extra),'Calculated the final bill instead of the change.'],[diff/keep,'Compared goods costs before applying the discount.'],[(alternate(n+extra)-alternate(n))*keep,incorrectPolicy],[diff+fee*keep,'Added an extra fixed charge to the larger order.']],
    quantity:[[variable(n)/low,'Priced every unit at the lower rate.'],[variable(n)/high,'Priced every unit at the higher rate.'],[price/(n>threshold?high:low),'Divided the final bill by the unit price without undoing the fee and discount.']],
    split:[[value-fee*keep,'Omitted the extra fixed charge on the split order.'],[-value,'Subtracted the split bill from the single bill, reversing the requested comparison.'],[value/keep,'Compared the bills before discount.'],[(alternate(n)+alternate(extra)-alternate(n+extra)+fee)*keep,incorrectPolicy]],
  }[task];
  const steps=task==='quantity'?[
    {say:'Recover the pre-discount goods charge.',math,why:'The discount applies to the fee as well as the goods.'},
    {say:'Use the price rule to match that charge.',math:`${goods(n)} = ${variable(n)}, so the order contains ${n} units`,why:'The charge increases with the number of units, so at most one quantity matches.'},
  ]:[
    {say:task==='split'?'Price the goods for each of the three order sizes.':task==='increment'?'Price the goods at both order sizes.':'Price the goods before the fixed charge.',math:task==='split'?`${n}: £${variable(n)}, ${extra}: £${variable(extra)}, ${n+extra}: £${variable(n+extra)}`:task==='increment'?`${n}: £${variable(n)}, ${n+extra}: £${variable(n+extra)}`:`£(${goods(n)}) = £${variable(n)}`,why:policy==='marginal'?'The first band keeps its price even when later units cost more.':'The order size sets the rate for every unit.'},
    {say:method,math,why:'Use the discount as a multiplier of the bill after its fixed charge.'},
  ];
  return {mode:'tariff',operations:[policy,task],params:w,text:rule+' '+info+' '+asks[task],value,steps,method,
    hints:['Does the higher unit rate apply to all units or only the excess?',task==='quantity'?'Undo the discount before subtracting the fixed charge.':'Apply one fixed charge per order and then the discount.'],
    distractors:mistakes.filter(([v])=>task==='split'||v>=0).map(([value,misconception])=>({value,misconception}))};
}
export default function pricing(rng,level){
  const threshold=rng.int(4,12),low=rng.int(2,7),high=low+rng.int(1,4),fee=rng.int(1,9);
  // Increasing rates make the inverse bill unique across the band boundary.
  return priceProblem({n:threshold+(level===1?rng.int(1,4):rng.int(-2,4)),threshold,low,high,fee,rebate:rng.pick([5,10,20,25]),
    policy:rng.pick(['marginal','whole-order']),task:rng.pick(level===1?['bill','average']:['bill','average','increment','quantity','split']),extra:rng.int(3,7)});
}
