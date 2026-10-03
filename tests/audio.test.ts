import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { TableReader } from '../src/audio.ts';
import { ALL_FACTS } from '../src/engine.ts';

class Media extends EventTarget {
  src = '';
  preload = '';
  paused = true;
  playResult = Promise.resolve();
  play() { this.paused = false; return this.playResult; }
  pause() { this.paused = true; }
}
function setup() {
  const media = new Media();
  const reader = new TableReader(media as unknown as HTMLAudioElement, () => {});
  return { media, reader };
}

test('speech advances after a repetition pause, and stopping cancels the next addition', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const { reader, media } = setup();
  let advances = 0;
  reader.read(3, 5, () => advances++);
  await Promise.resolve();
  assert.equal(media.src, './audio/3-5.mp3');
  assert.equal(reader.status, 'playing');
  media.dispatchEvent(new Event('ended'));
  assert.equal(reader.status, 'waiting');
  context.mock.timers.tick(2999);
  assert.equal(advances, 0);
  reader.stop();
  context.mock.timers.tick(5000);
  assert.equal(advances, 0);
  assert.equal(media.paused, true);
  reader.read(3, 5, () => advances++);
  await Promise.resolve();
  media.dispatchEvent(new Event('ended'));
  context.mock.timers.tick(3000);
  assert.equal(advances, 1);
  reader.stop();
});

test('a cancelled playback rejection cannot stop a newer addition', async () => {
  const { reader, media } = setup();
  let reject!: (reason: Error) => void;
  media.playResult = new Promise((_, fail) => { reject = fail; });
  reader.read(1, 0);
  media.playResult = Promise.resolve();
  reader.read(10, 10);
  await Promise.resolve();
  reject(new Error('Old interrupted playback'));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(reader.status, 'playing');
  assert.equal(media.paused, false);
  assert.equal(media.src, './audio/10-10.mp3');
  reader.stop();
});

test('stopping while the browser authorizes playback cannot restart speech', async () => {
  const { reader, media } = setup();
  let resolve!: () => void;
  media.playResult = new Promise(done => { resolve = done; });
  reader.read(2, 2);
  reader.stop();
  resolve();
  await Promise.resolve();
  assert.equal(reader.status, 'idle');
  assert.equal(media.paused, true);
});

test('blocked or broken audio offers retry and never advances', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const { reader, media } = setup();
  let advances = 0;
  media.playResult = Promise.reject(new Error('User gesture required'));
  reader.read(3, 5, () => advances++);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(reader.status, 'error');
  assert.equal(media.paused, true);
  media.dispatchEvent(new Event('ended'));
  context.mock.timers.tick(5000);
  assert.equal(advances, 0);
  media.playResult = Promise.resolve();
  reader.read(3, 5);
  await Promise.resolve();
  media.dispatchEvent(new Event('error'));
  assert.equal(reader.status, 'error');
  reader.stop();
});

test('a single addition finishes without automatically revealing the next line', async () => {
  const { reader, media } = setup();
  reader.read(3, 5);
  await Promise.resolve();
  media.dispatchEvent(new Event('ended'));
  assert.equal(reader.status, 'idle');
  assert.equal(media.paused, true);
});

test('every requested addition has a bundled offline recording with Poslovitch provenance', () => {
  for (const fact of ALL_FACTS) {
    const file = new URL(`../public/audio/${fact.a}-${fact.b}.mp3`, import.meta.url);
    assert.ok(existsSync(file), `Missing spoken addition ${fact.key}`);
    assert.ok(readFileSync(file).length > 5000, `Truncated audio ${fact.key}`);
  }
  const sources = JSON.parse(readFileSync(new URL('../public/audio/sources.json', import.meta.url), 'utf8'));
  assert.equal(sources.length, 22);
  assert.ok(sources.every((source: { speaker: string; license: string }) => source.speaker === 'Poslovitch' && source.license === 'CC0'));
  assert.deepEqual(sources.map((source: { word: string }) => source.word), [...Array.from({ length: 21 }, (_, i) => String(i)), '+']);
});
