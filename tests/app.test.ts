// The page logic, run as the page runs it (tests/vm-page.ts): cities.js, then the compiled app.js,
// with the clock fixed at 5 November 2026 12:00 in Oslo. The expected values are what the
// JavaScript before the move to TypeScript (commit d75fc01) showed at that instant.

process.env.TZ = 'Europe/Oslo';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from './vm-page.ts';

const NOW = Date.parse('2026-11-05T11:00:00Z');
const root = new URL('../', import.meta.url);
/** The empty reading of the page, two hyphen-minus signs and °C (written as escapes). */
const EMPTY = '\u002d\u002d°C';

/** A range row's date text for a day, in the locale of this run (as the page does). */
const shown = (day: string): string => new Date(day).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
const row = (day: string, min: number, max: number): [string, string] =>
  [shown(day), `<span class="range-min">${min}°</span><span class="range-max">${max}°</span>`];

test('load: the full city list, today as the start date, and the empty reading', () => {
  const page = loadPage(root, NOW);
  assert.equal(page.options.count, 25007);
  assert.equal(page.options.first, '‘Afak, Iraq');
  assert.equal(page.options.last, 'Żywiec, Poland');
  const s = page.state();
  assert.deepEqual([s.temp, s.time, s.hue, s.single, s.range, s.city, s.start, s.end],
    [EMPTY, '', '220', 'block', 'none', '', '2026-11-05', '']);
});

test('a city: part of a name shows nothing; the full name gives the reading of the hour', () => {
  const page = loadPage(root, NOW);
  page.typeCity('Oslo');
  assert.equal(page.state().temp, EMPTY);
  page.typeCity('Oslo, Norway');
  assert.deepEqual([page.state().temp, page.state().time, page.state().hue], ['3°C', '12:00 PM', '163.18471247419535']);
  const hours: [number, string, string][] = [[0, '-10°C', '12:00 AM'], [3, '-12°C', '3:00 AM'], [15, '5°C', '3:00 PM'], [23, '-8°C', '11:00 PM']];
  for (const [h, temp, time] of hours) {
    page.setHour(h);
    assert.deepEqual([page.state().temp, page.state().time], [temp, time], `hour ${h}`);
  }
  page.typeCity('Sydney, Australia');
  assert.deepEqual([page.state().temp, page.state().hue], ['11°C', '125.1093805339428']);
  page.typeCity('');
  assert.deepEqual([page.state().temp, page.state().hue], [EMPTY, '220']);
});

test('a date range: one row a day, at most 30, and the hue of the mean', () => {
  const page = loadPage(root, NOW);
  page.typeCity('Oslo, Norway');
  page.setDate('end', '2026-11-12');
  const s = page.state();
  assert.deepEqual([s.single, s.range, s.hue], ['none', 'block', '193.0909090909091']);
  assert.deepEqual(s.rows, [
    row('2026-11-05', -12, 5), row('2026-11-06', -12, 5), row('2026-11-07', -13, 5), row('2026-11-08', -13, 4),
    row('2026-11-09', -13, 4), row('2026-11-10', -13, 4), row('2026-11-11', -13, 4), row('2026-11-12', -14, 4),
  ]);
  page.setDate('end', '2026-11-01');
  assert.deepEqual([page.state().single, page.state().range], ['block', 'none'], 'an end before the start shows one day');
  page.setDate('end', '2027-01-31');
  assert.equal(page.state().rows.length, 30);
  assert.deepEqual(page.state().rows[29], row('2026-12-04', -18, -1));
});

test('the model: day of the year, the hour text and the temperature', () => {
  const page = loadPage(root, NOW);
  for (const [day, n] of [['2026-01-01', '1'], ['2026-11-05', '309'], ['2026-12-31', '365'], ['2028-12-31', '366']]) {
    assert.equal(page.call('getDayOfYear', [`${day}T12:00:00`]), n, day);
  }
  assert.deepEqual([0, 1, 11, 12, 13, 23].map((h) => page.call('formatTime', [h])), ['12:00 AM', '1:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '11:00 PM']);
  assert.equal(page.call('calculateTemperature', [59.91, 202, 15]), '22.021');
  assert.equal(page.call('calculateTemperature', [-33.87, 355, 3]), '12.136521466512733');
  assert.equal(page.call('calculateTemperature', [0, 100, 0]), '25.757359312880716');
  assert.equal(page.call('calculateTemperature', [90, 1, 23]), '-38.994356855828634');
});

test('the local day: a daylight-saving change does not move the day of the year, and the start date is the local day', () => {
  const page = loadPage(root, NOW);
  const days: [string, string][] = [['2026-03-30T00:00:00', '89'], ['2026-10-26T00:00:00', '299'], ['2026-12-31T23:59:00', '365']];
  for (const [day, n] of days) {
    assert.equal(page.call('getDayOfYear', [day]), n, day);
  }
  // 00:30 in Oslo on 5 November is still 4 November in UTC: the start date is the local day.
  assert.equal(loadPage(root, Date.parse('2026-11-04T23:30:00Z')).state().start, '2026-11-05');
});
