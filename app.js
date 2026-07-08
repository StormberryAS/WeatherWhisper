/* WeatherWhisper Logic
   Offline mathematical climate interpolation.
*/

const citySelect = document.getElementById('city-select');
const timeSlider = document.getElementById('time-slider');
const timeVal = document.getElementById('time-val');
const tempVal = document.getElementById('temp-val');
const root = document.documentElement;

// Populate cities
function initCities() {
  // CITIES is loaded from cities.js
  const sorted = CITIES.sort((a, b) => a.name.localeCompare(b.name));
  
  // Create document fragment for performance
  const fragment = document.createDocumentFragment();
  
  sorted.forEach((city, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = `${city.name}, ${city.country}`;
    fragment.appendChild(opt);
  });
  
  citySelect.appendChild(fragment);
  
  // Default to Oslo if exists, else first
  const osloIdx = sorted.findIndex(c => c.name === 'Oslo');
  citySelect.value = osloIdx !== -1 ? osloIdx : 0;
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function formatTime(hour) {
  const h = Math.floor(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:00 ${ampm}`;
}

function calculateTemperature(lat, hour) {
  const dayOfYear = getDayOfYear();
  
  // Mathematical Climate Model
  // 1. Base temperature decreases as latitude increases (0 at pole, 30 at equator)
  const latFactor = Math.abs(lat) / 90;
  let baseTemp = 30 - (latFactor * 45); 
  
  // 2. Seasonal variation (peaks around July 21st (day 202) for North, Jan 21 for South)
  const seasonOffset = ((dayOfYear - 202) / 365) * 2 * Math.PI;
  const seasonalAmp = latFactor * 20; // Poles have huge swings, equator has none
  const hemisphereMult = lat >= 0 ? 1 : -1;
  
  const dailyMean = baseTemp + (hemisphereMult * seasonalAmp * Math.cos(seasonOffset));
  
  // 3. Diurnal (Daily) variation (peaks at 15:00, coldest at 03:00)
  const diurnalAmp = 6 + (latFactor * 4); // Deserts/higher lats have more swing
  const hourOffset = ((hour - 15) / 24) * 2 * Math.PI;
  
  const finalTemp = dailyMean + (diurnalAmp * Math.cos(hourOffset));
  return finalTemp;
}

function updateUI() {
  const selectedIdx = citySelect.value;
  const city = CITIES[selectedIdx];
  const hour = parseFloat(timeSlider.value);
  
  timeVal.textContent = formatTime(hour);
  
  const temp = calculateTemperature(city.lat, hour);
  tempVal.textContent = `${Math.round(temp)}°C`;
  
  // Map temp to Hue: 
  // 35°C+ -> 0 (Red)
  // 15°C -> 60 (Yellow)
  // 0°C -> 180 (Cyan)
  // -10°C -> 240 (Blue)
  
  // Clamp temp between -15 and 40
  const clamped = Math.max(-15, Math.min(temp, 40));
  // Map range [-15, 40] to [240, 0]
  const pct = (clamped + 15) / 55; // 0.0 to 1.0
  const targetHue = 240 - (pct * 240);
  
  root.style.setProperty('--bg-hue', targetHue);
}

// Event Listeners
citySelect.addEventListener('change', updateUI);
timeSlider.addEventListener('input', updateUI);

// Init
document.addEventListener('DOMContentLoaded', () => {
  initCities();
  updateUI();
});
