import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audioRange } from '../scripts/audio-range.mjs';

test('offline MP3 cache answers mobile probing, open-ended and suffix byte ranges', async () => {
  const original = Uint8Array.from({ length: 100 }, (_, i) => i);
  for (const [range, start, end] of [['bytes=0-1', 0, 1], ['bytes=20-', 20, 99], ['bytes=-10', 90, 99], ['bytes=90-1000', 90, 99]]) {
    const response = await audioRange(new Response(original, { headers: { 'Content-Type': 'audio/mpeg' } }), range);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), `bytes ${start}-${end}/100`);
    assert.equal(response.headers.get('Content-Length'), String(end - start + 1));
    assert.equal(response.headers.get('Content-Type'), 'audio/mpeg');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), original.slice(start, end + 1));
  }
});

test('invalid or unsatisfiable ranges do not return corrupt audio bytes', async () => {
  for (const range of ['bytes=100-', 'bytes=20-10', 'bytes=-0', 'bytes=-', 'bytes=hello', 'bytes=999999999999999999999-']) {
    const response = await audioRange(new Response(new Uint8Array(100)), range);
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('Content-Range'), 'bytes */100');
  }
});
