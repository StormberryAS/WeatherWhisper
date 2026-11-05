// Runs the page's two scripts, cities.js and then the compiled app.js, in a fresh node:vm context,
// one global scope as in a browser, with a stub of the few page parts app.js touches and a clock
// fixed at a given instant. No browser and no DOM library: app.js is a classic script that reads
// the page as it loads, so it cannot be imported; this runs it as the page does, then lets a test
// type a city, pick dates and move the hour slider through the same listeners the page uses.

import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

/** A page element with only what app.js uses. */
class StubElement {
  textContent = '';
  className = '';
  #html = '';
  value = '';
  readonly style: { display: string } = { display: '' };
  readonly children: StubElement[] = [];
  readonly listeners = new Map<string, (() => void)[]>();
  readonly tag: string;
  constructor(tag: string) { this.tag = tag; }
  /** Markup is only recorded; setting it to '' empties the element, as app.js expects. */
  get innerHTML(): string { return this.#html; }
  set innerHTML(html: string) { this.#html = html; if (html === '') this.children.splice(0); }
  appendChild(child: StubElement): StubElement {
    if (child.tag === '#fragment') this.children.push(...child.children.splice(0)); else this.children.push(child);
    return child;
  }
  addEventListener(type: string, fn: () => void): void { this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]); }
  fire(type: string): void { for (const fn of this.listeners.get(type) ?? []) fn(); }
}
// The kinds app.js checks with instanceof.
class StubInput extends StubElement {}
class StubDataList extends StubElement {}

/** What the page shows. */
export interface PageState {
  temp: string;
  time: string;
  hue: string | null;
  single: string;
  range: string;
  /** The range rows: date text, then the HTML of the temperatures. */
  rows: [string, string][];
  city: string;
  start: string;
  end: string;
}

export interface Page {
  /** The number of options in the city list, and the first and last. */
  options: { count: number; first: string; last: string };
  state(): PageState;
  /** Types text into the city field, as the input event delivers it. */
  typeCity(text: string): void;
  /** Sets a date field and fires its change event. */
  setDate(which: 'start' | 'end', value: string): void;
  /** Moves the hour slider and fires its input event. */
  setHour(hour: number): void;
  /** Calls a global function of app.js with numeric arguments. */
  call(name: 'calculateTemperature' | 'formatTime' | 'getDayOfYear', args: (number | string)[]): string;
}

/** Loads cities.js and app.js from root (a directory URL) at the instant now, and fires DOMContentLoaded. */
export function loadPage(root: URL, now: number): Page {
  const input = (): StubInput => new StubInput('input');
  const els = new Map<string, StubElement>([
    ['city-input', input()], ['city-datalist', new StubDataList('datalist')], ['date-start', input()], ['date-end', input()],
    ['time-slider', input()], ['time-val', new StubElement('span')], ['temp-val', new StubElement('div')],
    ['single-date-view', new StubElement('div')], ['range-date-view', new StubElement('div')], ['range-list', new StubElement('div')],
  ]);
  const slider = els.get('time-slider');
  if (slider) slider.value = '12';
  const props = new Map<string, string>();
  const docListeners = new Map<string, () => void>();

  // The clock: new Date() and Date.now() give the fixed instant; every other use is the real Date.
  class FixedDate extends Date {
    constructor(...args: [] | [number | string | Date] | [number, number, number]) {
      if (args.length === 0) super(now); else if (args.length === 1) super(args[0]); else super(args[0], args[1], args[2]);
    }
    static override now(): number { return now; }
  }

  const sandbox = {
    Date: FixedDate,
    HTMLElement: StubElement,
    HTMLInputElement: StubInput,
    HTMLDataListElement: StubDataList,
    document: {
      getElementById: (id: string): StubElement | null => els.get(id) ?? null,
      addEventListener: (type: string, fn: () => void): void => { docListeners.set(type, fn); },
      createElement: (tag: string): StubElement => new StubElement(tag),
      createDocumentFragment: (): StubElement => new StubElement('#fragment'),
      // The stub records each value as the CSSOM would store it, as text.
      documentElement: { style: { setProperty: (name: string, value: unknown): void => { props.set(name, String(value)); } } },
    },
  };
  const context = createContext(sandbox);
  runInContext('var window = globalThis;', context);
  for (const file of ['cities.js', 'app.js']) {
    runInContext(readFileSync(new URL(file, root), 'utf8'), context, { filename: file });
  }
  const ready = docListeners.get('DOMContentLoaded');
  if (!ready) throw new Error('app.js did not wait for DOMContentLoaded');
  ready();

  const el = (id: string): StubElement => {
    const e = els.get(id);
    if (!e) throw new Error(`no stub #${id}`);
    return e;
  };
  const list = el('city-datalist').children;
  return {
    options: { count: list.length, first: list[0]?.value ?? '', last: list[list.length - 1]?.value ?? '' },
    state: () => ({
      temp: el('temp-val').textContent,
      time: el('time-val').textContent,
      hue: props.get('--bg-hue') ?? null,
      single: el('single-date-view').style.display,
      range: el('range-date-view').style.display,
      rows: el('range-list').children.map((row): [string, string] => [row.children[0]?.textContent ?? '', row.children[1]?.innerHTML ?? '']),
      city: el('city-input').value,
      start: el('date-start').value,
      end: el('date-end').value,
    }),
    typeCity: (text) => { el('city-input').value = text; el('city-input').fire('input'); },
    setDate: (which, value) => { const e = el(which === 'start' ? 'date-start' : 'date-end'); e.value = value; e.fire('change'); },
    setHour: (hour) => { el('time-slider').value = String(hour); el('time-slider').fire('input'); },
    call: (name, args) => String(runInContext(`${name}(${args.map((a) => typeof a === 'string' ? `new Date(${JSON.stringify(a)})` : String(a)).join(', ')})`, context)),
  };
}
