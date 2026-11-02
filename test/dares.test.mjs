import assert from 'node:assert/strict';
import { DARES, WILDS, SPICE, pickDare } from '../web/js/games/dares.js';

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

test('every dare has a level, text and 1-5 sips', () => {
  for (const d of DARES) {
    assert.ok(SPICE[d.lvl], `bad level on ${d.id}`);
    assert.ok(d.text.length > 10 && d.text.length < 110, `text length on ${d.id}`);
    assert.ok(d.sips >= 1 && d.sips <= 5, `sips on ${d.id}`);
  }
});

test('ids are unique', () => {
  const ids = [...DARES, ...WILDS].map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('no leftover placeholders', () => {
  for (const d of [...DARES, ...WILDS]) assert.ok(!/[{}]/.test(d.text), d.id);
});

test('each level has dares', () => {
  for (const lvl of [1, 2, 3]) assert.ok(DARES.filter((d) => d.lvl === lvl).length >= 10);
});

test('pickDare respects the spice level', () => {
  for (let i = 0; i < 50; i++) assert.equal(pickDare(DARES, 2, []).dare.lvl, 2);
});

test('pickDare does not repeat until the level is exhausted', () => {
  const n = DARES.filter((d) => d.lvl === 3).length;
  let used = [];
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const r = pickDare(DARES, 3, used);
    assert.ok(!seen.has(r.dare.id), `repeat ${r.dare.id}`);
    seen.add(r.dare.id);
    used = r.used;
  }
  const again = pickDare(DARES, 3, used);
  assert.ok(seen.has(again.dare.id));
  assert.equal(again.used.length, 1, 'level ids cleared on reshuffle');
});

test('reshuffling one level keeps the others used', () => {
  const lvl1 = DARES.filter((d) => d.lvl === 1).map((d) => d.id);
  const lvl3 = DARES.filter((d) => d.lvl === 3).map((d) => d.id);
  const r = pickDare(DARES, 3, [...lvl1, ...lvl3]);
  for (const id of lvl1) assert.ok(r.used.includes(id));
});

test('mix draws from every level', () => {
  const lvls = new Set();
  let used = [];
  for (let i = 0; i < DARES.length; i++) {
    const r = pickDare(DARES, 'mix', used);
    lvls.add(r.dare.lvl);
    used = r.used;
  }
  assert.equal(lvls.size, 3);
});

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
