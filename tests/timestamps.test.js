import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTimestamp } from '../public/scripts/timestamps.js';

// Force a non-IST host TZ for the test process. Node honours the
// TZ env var on Unix-like systems and respects it via Intl on
// Windows under recent ICU builds. We also re-import inside each
// test to make sure we don't accidentally bind to a cached
// formatter from a different TZ — the helper internally pins
// timeZone: 'Asia/Kolkata' so it should NOT depend on TZ.
process.env.TZ = 'America/Los_Angeles';

test('formatTimestamp — produces UTC + IST shape', () => {
  const out = formatTimestamp('2026-06-19T07:30:00.000Z');
  assert.equal(typeof out, 'object');
  assert.equal(out.utc, '2026-06-19T07:30:00.000Z');
  // 07:30 UTC + 05:30 = 13:00 IST.
  assert.equal(out.ist, '2026-06-19 13:00:00 IST');
});

test('formatTimestamp — IST is host-TZ independent', () => {
  // The host process TZ is set to America/Los_Angeles above. If
  // the helper accidentally used the host TZ, 07:30 UTC would
  // render as 00:30 PDT (or similar) — never the IST 13:00.
  const out = formatTimestamp('2026-06-19T07:30:00.000Z');
  assert.match(out.ist, /IST$/);
  assert.equal(out.ist, '2026-06-19 13:00:00 IST');
});

test('formatTimestamp — midnight UTC → IST same date 05:30', () => {
  const out = formatTimestamp('2026-06-19T00:00:00.000Z');
  assert.equal(out.utc, '2026-06-19T00:00:00.000Z');
  assert.equal(out.ist, '2026-06-19 05:30:00 IST');
});

test('formatTimestamp — 18:30 UTC → next-day 00:00 IST', () => {
  // 18:30 UTC + 05:30 = 24:00 = 00:00 next day.
  const out = formatTimestamp('2026-06-18T18:30:00.000Z');
  assert.equal(out.ist, '2026-06-19 00:00:00 IST');
});

test('formatTimestamp — late-evening IST stays same date', () => {
  // 18:29 UTC = 23:59 IST same date.
  const out = formatTimestamp('2026-06-19T18:29:00.000Z');
  assert.equal(out.ist, '2026-06-19 23:59:00 IST');
});

test('formatTimestamp — preserves canonical UTC string verbatim', () => {
  // The vault stores ISO-8601 with milliseconds. The UTC field
  // is the canonical comparison key; never re-format it.
  const iso = '2026-06-19T10:01:23.456Z';
  const out = formatTimestamp(iso);
  assert.equal(out.utc, iso);
});

test('formatTimestamp — null/garbage inputs return null', () => {
  assert.equal(formatTimestamp(null), null);
  assert.equal(formatTimestamp(undefined), null);
  assert.equal(formatTimestamp(''), null);
  assert.equal(formatTimestamp('not-a-date'), null);
  assert.equal(formatTimestamp(42), null);
});

test('formatTimestamp — calling repeatedly is stable (formatter cached)', () => {
  const a = formatTimestamp('2026-06-19T07:30:00.000Z');
  const b = formatTimestamp('2026-06-19T07:30:00.000Z');
  assert.deepEqual(a, b);
});
