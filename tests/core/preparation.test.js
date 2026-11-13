import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INVITATION_DEADLINE, preparationPlan, deadlineLabel } from '../../src/core/preparation.js';
test('invitation deadline has the correct UK and CET conversion',()=>{
  const p=preparationPlan({},Date.parse('2026-11-13T12:00:00Z'));
  assert.equal(p.iso,'2026-12-06T22:59:00.000Z');assert.equal(p.days,24);assert.equal(p.weeklyHours,8);
  assert.match(deadlineLabel(p.deadline),/6 December 2026.*22:59/);
  assert.match(deadlineLabel(p.deadline,'Europe/Paris'),/6 December 2026.*23:59/);
  assert.equal(p.phase,'learn-mix');assert.ok(p.estimatedHours>26&&p.estimatedHours<27);
});
test('planning phases use the deadline rather than an invented whole-battery duration',()=>{
  const end=Date.parse(INVITATION_DEADLINE),day=86400000;
  for(const [remaining,phase] of [[15,'learn-mix'],[14,'timed-repair'],[5,'timed-repair'],[4,'consolidate'],[1,'consolidate'],[0,'due'],[-1,'due']])assert.equal(preparationPlan({},end-remaining*day).phase,phase);
  assert.equal(preparationPlan({},end+day).estimatedHours,0);
});
test('deadline and weekly budget are configurable without altering assessment timing',()=>{
  const settings={assessmentDeadline:'2026-12-05T22:59:00Z',weeklyPrepHours:12};
  const p=preparationPlan(settings,Date.parse('2026-11-21T22:59:00Z'));
  assert.equal(p.weeklyHours,12);assert.equal(p.days,14);assert.equal(p.estimatedHours,24);
  assert.deepEqual(settings,{assessmentDeadline:'2026-12-05T22:59:00Z',weeklyPrepHours:12});
  for(const value of [-1,0,41,'bad',Infinity])assert.equal(preparationPlan({weeklyPrepHours:value}).weeklyHours,8);
  assert.equal(preparationPlan({assessmentDeadline:'invalid'}).iso,INVITATION_DEADLINE);
});
