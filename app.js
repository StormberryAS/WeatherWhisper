/* WeatherWhisper Logic
   Offline mathematical climate interpolation.
*/

const cityInput = document.getElementById('city-input');
const datalist = document.getElementById('city-datalist');
const timeSlider = document.getElementById('time-slider');
const timeVal = document.getElementById('time-val');
const tempVal = document.getElementById('temp-val');
const root = document.documentElement;

let currentCity = null;

// Populate cities
function initCities() {
  const sorted = CITIES.sort((a, b) => a.name.localeCompare(b.name));
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
  const latFactor = Math.abs(lat) / 90;
  let baseTemp = 30 - (latFactor * 45); 
  
  const seasonOffset = ((dayOfYear - 202) / 365) * 2 * Math.PI;
  const seasonalAmp = latFactor * 20; 
  const hemisphereMult = lat >= 0 ? 1 : -1;
  
  const dailyMean = baseTemp + (hemisphereMult * seasonalAmp * Math.cos(seasonOffset));
  
  const diurnalAmp = 6 + (latFactor * 4); 
  const hourOffset = ((hour - 15) / 24) * 2 * Math.PI;
  
  const finalTemp = dailyMean + (diurnalAmp * Math.cos(hourOffset));
  return finalTemp;
}

function updateUI() {
  // Try to find the city matching input
  const found = CITIES.find(c => c.fullName === cityInput.value);
  if (found) {
    currentCity = found;
  } else {
    currentCity = null;
  }
  
  const hour = parseFloat(timeSlider.value);
  timeVal.textContent = formatTime(hour);

  if (!currentCity) {
    tempVal.textContent = '--°C';
    root.style.setProperty('--bg-hue', 220);
    return;
  }
  
  const temp = calculateTemperature(currentCity.lat, hour);
  tempVal.textContent = `${Math.round(temp)}°C`;
  
  // Clamp temp between -15 and 40
  const clamped = Math.max(-15, Math.min(temp, 40));
  const pct = (clamped + 15) / 55; // 0.0 to 1.0
  const targetHue = 240 - (pct * 240);
  
  root.style.setProperty('--bg-hue', targetHue);
}

// Event Listeners
cityInput.addEventListener('input', updateUI);
cityInput.addEventListener('change', updateUI);
timeSlider.addEventListener('input', updateUI);

// Init
document.addEventListener('DOMContentLoaded', () => {
  initCities();
  updateUI();
});
