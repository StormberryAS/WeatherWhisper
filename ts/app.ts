/*! WeatherWhisper: app.js is compiled from ts/app.ts by tools/build-ts.sh, which leaves out every
    comment but this one: the explanations are in the source. Edit the .ts, never the .js: the build
    refuses to overwrite a hand edit, and its check mode fails on one. */

/* WeatherWhisper Logic
   Modelled temperatures from latitude, season and time of day.

   A classic script, not a module: index.html loads cities.js (the shared Labs city catalogue,
   which publishes the global CITIES, typed in ts/cities.d.ts) and then app.js at the end of the
   body, and both share one global scope. This file has no import or export, so tsc compiles it to
   a plain script at the same path (app.js). It keeps nothing in localStorage.
*/

/** A catalogue city as this page uses it: initCities adds the "Name, Country" text of the list. */
type NamedCity = City & { fullName?: string };

/** The element with this id, of this kind; the page always has it, so a miss is a broken page. */
function byId<T extends HTMLElement>(id: string, kind: { new (): T; prototype: T }): T {
  const el = document.getElementById(id);
  if (!(el instanceof kind)) throw new Error(`WeatherWhisper: #${id} is missing from the page`);
  return el;
}

const cityInput = byId('city-input', HTMLInputElement);
const datalist = byId('city-datalist', HTMLDataListElement);
const dateStart = byId('date-start', HTMLInputElement);
const dateEnd = byId('date-end', HTMLInputElement);
const timeSlider = byId('time-slider', HTMLInputElement);
const timeVal = byId('time-val', HTMLElement);
const tempVal = byId('temp-val', HTMLElement);
const singleDateView = byId('single-date-view', HTMLElement);
const rangeDateView = byId('range-date-view', HTMLElement);
const rangeList = byId('range-list', HTMLElement);
const root = document.documentElement;

let currentCity: NamedCity | null = null;

// Populate cities
function initCities(): void {
  const sorted: NamedCity[] = CITIES.sort((a, b) => a.name.localeCompare(b.name));
  const fragment = document.createDocumentFragment();

  sorted.forEach((city) => {
    city.fullName = `${city.name}, ${city.country}`;
    const opt = document.createElement('option');
    opt.value = city.fullName;
    fragment.appendChild(opt);
  });

  datalist.appendChild(fragment);

  currentCity = null;
  cityInput.value = "";

  // Set default dates
  dateStart.value = toDayString(new Date());
  dateEnd.value = "";
}

/** The local calendar day of a date as YYYY-MM-DD (toISOString gives the UTC day, a day off near midnight). */
function toDayString(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A YYYY-MM-DD field value as local midnight of that day (new Date('YYYY-MM-DD') is UTC midnight,
 *  which is the day before west of UTC). An empty or malformed value gives local midnight today. */
function parseDay(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** The day of the year (1 to 366) of the local calendar day of a date. Counted in UTC from the
 *  local year, month and day, so a daylight-saving change cannot move it by one. */
function getDayOfYear(date: Date): number {
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((day - Date.UTC(date.getFullYear(), 0, 0)) / oneDay);
}

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:00 ${ampm}`;
}

function calculateTemperature(lat: number, dayOfYear: number, hour: number): number {
  const latFactor = Math.abs(lat) / 90;
  let baseTemp = 30 - (latFactor * 45);

  const seasonOffset = ((dayOfYear - 202) / 365) * 2 * Math.PI;
  const seasonalAmp = latFactor * 20;
  const hemisphereMult = lat >= 0 ? 1 : -1;

  const dailyMean = baseTemp + (hemisphereMult * seasonalAmp * Math.cos(seasonOffset));

  const diurnalAmp = 6 + (latFactor * 4);
  const hourOffset = ((hour - 15) / 24) * 2 * Math.PI;

  return dailyMean + (diurnalAmp * Math.cos(hourOffset));
}

function setHueFromTemp(temp: number): void {
  const clamped = Math.max(-15, Math.min(temp, 40));
  const pct = (clamped + 15) / 55; // 0.0 to 1.0
  const targetHue = 240 - (pct * 240);
  root.style.setProperty('--bg-hue', String(targetHue));
}

function updateUI(): void {
  const cities: NamedCity[] = CITIES;
  const found = cities.find(c => c.fullName === cityInput.value);
  currentCity = found || null;

  if (!currentCity) {
    // The empty reading, as in index.html: two hyphen-minus signs (written as escapes) and °C.
    tempVal.textContent = '\u002d\u002d°C';
    root.style.setProperty('--bg-hue', '220');
    singleDateView.style.display = 'block';
    rangeDateView.style.display = 'none';
    return;
  }

  const startStr = dateStart.value;
  const endStr = dateEnd.value;
  const d1 = parseDay(startStr);
  const d2 = parseDay(endStr || startStr);

  // Check if Range View
  if (endStr && d2 > d1) {
    singleDateView.style.display = 'none';
    rangeDateView.style.display = 'block';
    rangeList.innerHTML = '';

    let currentDate = new Date(d1);
    let daysCount = 0;
    let totalMean = 0;

    // Loop up to 30 days
    while (currentDate <= d2 && daysCount < 30) {
      const doy = getDayOfYear(currentDate);
      const minTemp = Math.round(calculateTemperature(currentCity.lat, doy, 3));
      const maxTemp = Math.round(calculateTemperature(currentCity.lat, doy, 15));
      totalMean += (minTemp + maxTemp) / 2;

      const div = document.createElement('div');
      div.className = 'range-item';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'range-date';
      dateSpan.textContent = currentDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

      const tempSpan = document.createElement('span');
      tempSpan.className = 'range-temps';
      tempSpan.innerHTML = `<span class="range-min">${minTemp}°</span><span class="range-max">${maxTemp}°</span>`;

      div.appendChild(dateSpan);
      div.appendChild(tempSpan);
      rangeList.appendChild(div);

      currentDate.setDate(currentDate.getDate() + 1);
      daysCount++;
    }

    if (daysCount > 0) setHueFromTemp(totalMean / daysCount);

  } else {
    // Single Date View
    singleDateView.style.display = 'block';
    rangeDateView.style.display = 'none';

    const doy = getDayOfYear(d1);
    const hour = parseFloat(timeSlider.value);
    timeVal.textContent = formatTime(hour);

    const temp = calculateTemperature(currentCity.lat, doy, hour);
    tempVal.textContent = `${Math.round(temp)}°C`;
    setHueFromTemp(temp);
  }
}

// Event Listeners
cityInput.addEventListener('input', updateUI);
cityInput.addEventListener('change', updateUI);
dateStart.addEventListener('change', updateUI);
dateEnd.addEventListener('change', updateUI);
timeSlider.addEventListener('input', updateUI);

// Init
document.addEventListener('DOMContentLoaded', () => {
  initCities();
  updateUI();
});
