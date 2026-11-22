import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMcq } from '../../src/core/options.js';
import { checkItem, intervalScore } from '../../src/core/check.js';
import { rankDecimals } from '../../src/core/format.js';
import { makeRng } from '../../src/core/rng.js';
import { questionKey, questionSeen } from '../../src/core/questions.js';
import { PRACTICE_MODULES } from '../../src/practice/index.js';
import { composeEvent } from '../../src/scenarios/compose.js';
import { probabilityProblem } from '../../src/scenarios/composite/probability.js';
import { clarifyPrizeRule, stoppedProcess } from '../../src/scenarios/composite/stopping.js';
import { exactInterval, widthStep } from '../../src/sections/iv/lib.js';
import { btoChoices } from '../../src/sections/bto/lib.js';
import { PAPERS } from '../../src/checks/papers.js';
import { grade } from '../../src/checks/material.js';

test('stopped process states the prize rule and correctly separates a final win from any win', () => {
  const world = { horizon:3, needed:2, reset:true, start:1, p:.25, afterMiss:.25, reward:10, cost:1, target:'last-win' };
  const model = stoppedProcess(world);
  assert.match(model.text,/Reaching 2 wins the prize and ends play/);
  assert.match(model.text,/If your attempts run out first, you win nothing/);
  assert.equal(model.value, .75 * .25 ** 2); // Failure, then two successes. A first-attempt success already ended play.
  assert.equal(stoppedProcess({...world,target:'conditional'}).value, model.value / (.25 + model.value));
  const net = stoppedProcess({...world,target:'net'});
  assert.match(net.text,/Each attempt costs £1\. The prize is £10/);
  assert.equal(net.value, (.25 + model.value)*10 - (1 + .75 + .75));
  assert.match(clarifyPrizeRule(model.oldText),/wins the prize and ends play/);
});

test('correcting a stopped-process prompt keeps its previous exposure recognised', () => {
  const family=PRACTICE_MODULES.bto.families.find(f=>f.id==='stopped-process');
  const item=family.generate(makeRng('past-prompts'),{difficulty:4});
  const oldPrompt=stoppedProcess(item.params).oldText+' Pick the closest value.';
  const prior=questionKey({...item,prompt:{text:oldPrompt}});
  assert.equal(item.meta.previousPromptKey,prior);
  assert.ok(questionSeen(new Set([prior]),item));
});

test('composition defines a single trial in the conditioned sample space', () => {
  const family=PRACTICE_MODULES.bto.families.find(f=>f.id==='conditional-dice');
  const modes=new Set();
  for(let seed=0;seed<40;seed++){
    const rng=makeRng(seed),base=family.generate(rng,{difficulty:2});
    const item=composeEvent(base,rng);
    if(base.answer.value===1)continue;
    assert.ok(item.composition);
    if(base.prompt.text.includes('Given that')) assert.match(item.prompt.text,/Only outcomes where .* count as trials\./);
    assert.match(item.prompt.text,/A trial is a hit if /);
    assert.equal(item.prompt.text.match(/\?/g).length,1);
    assert.equal(item.prompt.text.match(/Pick the closest value\./g).length,1);
    assert.equal(item.composition.baseKey,questionKey(base));
    modes.add(item.composition.mode);
  }
  assert.equal(modes.size,4);
});

test('randomly choosing what to report does not reveal which draw was chosen', () => {
  const world = { boxes:[[2,5],[4,5]], prior:.5, replace:false, report:'display', target:'both', reward:5 };
  const { text,value } = probabilityProblem(world);
  assert.match(text,/chooses one draw uniformly and tells you only whether it was marked/);
  // Randomly showing one draw is equivalent to a first draw with the other still hidden.
  const chanceBoth = (.5 * (2/5) * (1/4) + .5 * (4/5) * (3/4));
  const chanceReported = .5 * (2/5) + .5 * (4/5);
  assert.ok(Math.abs(value - chanceBoth / chanceReported)<1e-12);
});

test('named distractors keep their diagnosis and fillers are marked as generic', () => {
  const item=buildMcq(makeRng(2),{correct:.4,format:String,distractors:[{value:.25,misconception:'Used the wrong denominator.'}]});
  assert.equal(item.options.find(o=>o.value===.25).misconception,'Used the wrong denominator.');
  assert.equal(item.options.find(o=>o.value===.25).generic,undefined);
  assert.equal(item.options.filter(o=>o.generic).length,3);
});

test('probability option spacing uses the displayed values and scales for rare answers', () => {
  const distractors = [0.4996, 0.5004, 0.532, 0.25, 0.6, 0.9].map(value => ({ value, misconception: 'Wrong model.' }));
  const {options,answerIndex} = btoChoices(makeRng(1),{correct:.5,distractors});
  assert.equal(options[answerIndex].label,'0.5');
  assert.ok(options.every((choice,i) => i===answerIndex || Math.abs(Number(choice.label)-.5)>=.035-1e-12));
  assert.ok(options.some(choice => choice.value===.25 && !choice.generic));
  const displayed = btoChoices(makeRng(2),{
    correct:.5,format:v=>v.toFixed(2),
    distractors:[...distractors,{value:.536,misconception:'Rounded close.'}],
    minGap:()=>.041,
  });
  assert.ok(!displayed.options.some(choice=>choice.label==='0.54'));
  const {options:rare,answerIndex:rareIndex} = btoChoices(makeRng(3),{correct:1/4096,distractors:[]});
  assert.ok(Number(rare[rareIndex].label)>0);
  assert.ok(rare.filter(choice=>Number(choice.label)<.001).length>=3);
  assert.ok(rare.every((choice,i)=>i===rareIndex || Math.abs(Number(choice.label)-1/4096)>Math.abs(Number(rare[rareIndex].label)-1/4096)));
});

test('Bayes solutions show both paths before cancellation for positive and negative reports', () => {
  const family=PRACTICE_MODULES.bto.families.find(f=>f.id==='bayes-test');
  const forms=new Set();
  for (const difficulty of [2,4]) for (let seed=0;seed<30;seed++) {
    const item=family.generate(makeRng(seed),{difficulty});
    const [formula,setup,reduced]=item.solution.steps;
    const {variant}=item.params;
    forms.add(variant);
    assert.match(formula.math,/P\(E \| H\) \+ P\(not H\) × P\(E \| not H\)/);
    assert.match(setup.math,/×.*\) \/ \(.*×.* \+ .*×/);
    if(variant==='twoPos') assert.match(setup.math,/²/);
    if(variant==='negative') assert.match(setup.math,/1 − /);
    assert.match(reduced.say,/cancel/);
    assert.ok(reduced.math.endsWith(' = '+item.answer.exact));
    assert.equal(family.verify(item).ok,true);
  }
  assert.deepEqual(forms,new Set(['pos','twoPos','negative']));
});

test('composed posterior retains the exact base fraction and cancels scaled evidence', () => {
  const family=PRACTICE_MODULES.bto.families.find(f=>f.id==='conditional-dice');
  let tested=0;
  for(let seed=0;seed<50;seed++){
    const rng=makeRng(seed), base=family.generate(rng,{difficulty:2}), item=composeEvent(base,rng);
    if(item.composition?.mode!=='posterior')continue;
    const [setup,reduced]=item.solution.steps.slice(-2);
    assert.ok(setup.math.includes(base.answer.exact));
    assert.match(setup.math,/P\(hit \| positive\) = .* \/ .* \+ /);
    assert.match(reduced.say,/cancel/);
    assert.ok(reduced.math.endsWith(' = '+item.answer.exact));
    tested++;
  }
  assert.ok(tested>5);
});

test('close ranking probabilities stay distinct in their displayed order', () => {
  const statements=[{p:.2523},{p:.2521},{p:.2522}];
  const labels=rankDecimals(statements);
  assert.equal(new Set(labels).size,3);
  assert.ok(+labels[0]>+labels[2] && +labels[2]>+labels[1]);
});

test('reported exact-model bounds earn the displayed score for terminating and repeating values', () => {
  const model={exact:true,belief:{kind:'point'}};
  for(const truth of [125/3,1/3,1/30000,200000/3,4.00125,0.000002]){
    const {lower,upper,score}=exactInterval(truth);
    assert.ok(lower>0 && lower<=truth && upper>=truth);
    assert.equal(score,intervalScore(lower,upper,truth));
    assert.ok(score>.99);
    assert.ok(widthStep(model,truth).say.includes(`[${lower}, ${upper}]`));
  }
  assert.deepEqual(exactInterval(4.00125),{lower:4.00125,upper:4.00125,score:1,shortDecimal:true});
});

test('density fast path distinguishes counts from height times bin width', () => {
  const fam=PRACTICE_MODULES.ll.families.find(f=>f.id==='histogram-bins');
  const count=fam.generate(makeRng('counts'),{difficulty:3});
  const density=fam.generate(makeRng('unequal-bin-widths'),{difficulty:4});
  assert.match(count.solution.fast,/multiply each height by its bin width/);
  assert.match(density.solution.fast,/frequency density × width/);
  assert.equal(fam.verify(density).ok,true);
});

test('score-grid hints match the particular quantity the question requests', () => {
  const family=PRACTICE_MODULES.iv.families.find(f=>f.id==='percentile');
  const cases=new Map();
  for(let i=0;i<60;i++) for(const difficulty of family.levels){
    const item=family.generate(makeRng(i),{difficulty});
    cases.set(item.params.scenario,item.hints.join(' '));
  }
  assert.equal(cases.size,4);
  assert.match(cases.get('mean'),/average deviation/);
  assert.match(cases.get('above'),/Include scores equal to/);
  assert.match(cases.get('median'),/about half/);
  assert.match(cases.get('pct'),/at or below/);
});

test('orderbook scoring accepts executable trades and excludes invalid sides or over-limit trades', () => {
  const paper=PAPERS.ob.a.find(q=>q.best);
  const item={...paper,tradeLimit:paper.best.trades.length,tradeOrPass:true};
  assert.equal(checkItem(item,item.best).correct,true);
  assert.equal(grade(paper,item.best).score,1);
  assert.equal(checkItem(item,{trades:[...paper.best.trades,paper.best.trades[0]]}).correct,false);
  assert.equal(checkItem(item,{trades:[{...paper.best.trades[0],side:'short'}]}).correct,false);
  assert.equal(checkItem(item,{pass:true}).correct,false);
  const pass=PAPERS.ob.a.find(q=>q.best===null);
  assert.equal(checkItem({...pass,tradeOrPass:true},{pass:true}).correct,true);
});
