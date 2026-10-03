import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_FACTS, choices, freshProgress, makeDeck, mastered, parseProgress, record, hint } from '../src/engine.ts';
function seeded(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
test('exactly 110 distinct additions cover every requested ordered pair', () => {
  assert.equal(ALL_FACTS.length, 110);
  assert.equal(new Set(ALL_FACTS.map(f => f.key)).size, 110);
  for (let a = 1; a <= 10; a++) for (let b = 0; b <= 10; b++) assert.ok(ALL_FACTS.some(f => f.a === a && f.b === b));
  assert.ok(ALL_FACTS.every(f => f.a + f.b >= 1 && f.a + f.b <= 20));
});
test('every choice set has one correct answer, three distinct distractors, and valid bounds', () => {
  for (let sum = 0; sum <= 20; sum++) for (let seed = 0; seed < 100; seed++) {
    const options = choices(sum, seeded(seed));
    assert.equal(options.length, 4); assert.equal(new Set(options).size, 4);
    assert.equal(options.filter(n => n === sum).length, 1); assert.ok(options.every(n => n >= 0 && n <= 20));
  }
});
test('correct answer appears at varied positions for every sum', () => {
  for (let sum = 1; sum <= 20; sum++) {
    const random = seeded(1892); const positions = new Set(Array.from({ length: 100 }, () => choices(sum, random).indexOf(sum)));
    assert.equal(positions.size, 4);
  }
});
test('selected tables only, without omissions or repeats in a fresh cycle', () => {
  for (const tables of [[1], [10], [1, 3, 9], Array.from({ length: 10 }, (_, i) => i + 1)]) {
    const deck = makeDeck(tables, freshProgress(), seeded(100));
    assert.equal(deck.length, tables.length * 11); assert.equal(new Set(deck.map(f => f.key)).size, deck.length);
    assert.ok(deck.every(f => tables.includes(f.a)));
  }
});
test('generator varies its order and revisits fragile facts before mastered ones', () => {
  const p = freshProgress(); const fact = ALL_FACTS[0]; record(p, fact, true); record(p, fact, true); record(p, fact, true);
  const decks = Array.from({ length: 30 }, (_, seed) => makeDeck([1, 2], p, seeded(seed)));
  assert.ok(new Set(decks.map(deck => deck.map(f => f.key).join(','))).size > 20);
  assert.ok(decks.every(deck => deck.at(-1)?.key === fact.key));
});
test('mastery requires three independent successes and resets once after an error or help', () => {
  const p = freshProgress(); const f = ALL_FACTS[0];
  record(p, f, true); record(p, f, true); assert.equal(mastered(p), 0);
  record(p, f, true); assert.equal(mastered(p), 1);
  record(p, f, false); assert.equal(mastered(p), 0); assert.equal(p.facts[f.key].attempts, 4);
});
test('corrupt, outdated, negative, and injected progress cannot break the game', () => {
  for (const raw of [null, '', '{', 'null', '{"version":2}', '[]']) assert.deepEqual(parseProgress(raw), freshProgress());
  const p = parseProgress('{"version":1,"sessions":-8,"stars":"<script>","best":9,"facts":{"1+0":{"attempts":4,"streak":999,"correct":10},"99+99":{"streak":3}}}');
  assert.equal(p.sessions, 0); assert.equal(p.stars, 0); assert.equal(p.best, 9); assert.equal(p.facts['1+0'].streak, 3);
  assert.equal(p.facts['1+0'].correct, 4); assert.equal(Object.keys(p.facts).length, 1);
});
test('hints handle adding zero and bridging ten with nonnegative parts', () => {
  assert.match(hint({ a: 8, b: 0, key: '8+0' }), /Ajouter 0/);
  assert.match(hint({ a: 8, b: 5, key: '8+5' }), /2 et 3/);
  assert.match(hint({ a: 4, b: 4, key: '4+4' }), /double/);
});
