/* WeatherWhisper Logic
   Offline mathematical climate interpolation.
*/

const cityInput = document.getElementById('city-input');
const datalist = document.getElementById('city-datalist');
const dateStart = document.getElementById('date-start');
const dateEnd = document.getElementById('date-end');
const timeSlider = document.getElementById('time-slider');
const timeVal = document.getElementById('time-val');
const tempVal = document.getElementById('temp-val');
const singleDateView = document.getElementById('single-date-view');
const rangeDateView = document.getElementById('range-date-view');
const rangeList = document.getElementById('range-list');
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
  
  // Set default dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  dateStart.value = todayStr;
  dateEnd.value = "";
}

function getDayOfYear(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function formatTime(hour) {
  const h = Math.floor(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:00 ${ampm}`;
}

function calculateTemperature(lat, dayOfYear, hour) {
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

function setHueFromTemp(temp) {
  const clamped = Math.max(-15, Math.min(temp, 40));
  const pct = (clamped + 15) / 55; // 0.0 to 1.0
  const targetHue = 240 - (pct * 240);
  root.style.setProperty('--bg-hue', targetHue);
}

function updateUI() {
  const found = CITIES.find(c => c.fullName === cityInput.value);
  currentCity = found || null;

  if (!currentCity) {
    tempVal.textContent = '--°C';
    root.style.setProperty('--bg-hue', 220);
    singleDateView.style.display = 'block';
    rangeDateView.style.display = 'none';
    return;
  }

  const startStr = dateStart.value;
  const endStr = dateEnd.value;
  const d1 = new Date(startStr || new Date());
  const d2 = new Date(endStr || startStr || new Date());

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
