import assert from 'node:assert/strict';
import { ANDY_TYPES, SIDEKICKS, pickAndy } from '../web/js/games/andy-types.js';

let failed = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n     ${e.message}`);
  }
};

test('every type is complete and ends in ANDY', () => {
  for (const t of ANDY_TYPES) {
    for (const k of ['id', 'emoji', 'name', 'line', 'power', 'weakness', 'mission']) assert.ok(t[k], `${t.id} missing ${k}`);
    assert.match(t.name, /ANDY$/, t.id);
    assert.ok(t.mission.length < 80, `${t.id} mission too long`);
  }
});

test('ids are unique', () => {
  assert.equal(new Set(ANDY_TYPES.map((t) => t.id)).size, ANDY_TYPES.length);
});

test('pickAndy avoids the last six results', () => {
  let recent = [];
  for (let i = 0; i < 200; i++) {
    const r = pickAndy(recent);
    assert.ok(!recent.includes(r.type.id), `repeat ${r.type.id}`);
    recent = r.recent;
    assert.ok(recent.length <= 6);
  }
});

test('pickAndy stats stay in range', () => {
  for (let i = 0; i < 200; i++) {
    const r = pickAndy();
    assert.ok(r.andyness >= 72 && r.andyness <= 100);
    assert.ok(r.heat >= 1 && r.heat <= 5);
    assert.ok(SIDEKICKS.includes(r.sidekick));
  }
});

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
