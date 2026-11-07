// The page logic west of UTC (New York). new Date('YYYY-MM-DD') is UTC midnight, which is the evening
// before in New York: the page must read a date field as the local day, or every reading is a day off.

process.env.TZ = 'America/New_York';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from './vm-page.ts';

const root = new URL('../', import.meta.url);
/** A range row's date text for a local day, in the locale of this run (as the page does). */
const shown = (y: number, m: number, d: number): string => new Date(y, m - 1, d).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

test('New York: the start date, the rows and the day of the year are the local days', () => {
  // 21:00 on 5 November in New York is 6 November in UTC.
  const page = loadPage(root, Date.parse('2026-11-06T02:00:00Z'));
  assert.equal(page.state().start, '2026-11-05');
  page.typeCity('Oslo, Norway');
  page.setDate('start', '2026-01-01');
  page.setDate('end', '2026-01-03');
  assert.deepEqual(page.state().rows.map((r) => r[0]), [shown(2026, 1, 1), shown(2026, 1, 2), shown(2026, 1, 3)]);
  const days: [string, string][] = [['2026-01-01T00:00:00', '1'], ['2026-03-09T00:00:00', '68'], ['2026-11-05T00:00:00', '309']];
  for (const [day, n] of days) {
    assert.equal(page.call('getDayOfYear', [day]), n, day);
  }
});
