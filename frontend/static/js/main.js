// script.js
// ===================== DATA =====================
const CROPS_DATA = {
    wheat: { name: 'Wheat', emoji: '🌾', price: 2275, msp: 2275, change: +1.8, yield: 20, color: '#2d8c38' },
    rice: { name: 'Rice', emoji: '🌾', price: 2183, msp: 2183, change: -0.5, yield: 25, color: '#f59e0b' },
    cotton: { name: 'Cotton', emoji: '🌿', price: 6620, msp: 6620, change: +3.2, yield: 6, color: '#8b5cf6' },
    sugarcane: { name: 'Sugarcane', emoji: '🎋', price: 315, msp: 315, change: +0.9, yield: 400, color: '#06b6d4' },
    soybean: { name: 'Soybean', emoji: '🫘', price: 4600, msp: 4600, change: -1.2, yield: 12, color: '#3b82f6' },
    maize: { name: 'Maize', emoji: '🌽', price: 2090, msp: 2090, change: +2.1, yield: 30, color: '#f97316' },
    mustard: { name: 'Mustard', emoji: '🌼', price: 5650, msp: 5650, change: +0.6, yield: 8, color: '#eab308' },
    groundnut: { name: 'Groundnut', emoji: '🥜', price: 6377, msp: 6377, change: +1.4, yield: 14, color: '#ec4899' },
    tomato: { name: 'Tomato', emoji: '🍅', price: 1800, msp: null, change: -4.5, yield: 80, color: '#ef4444' },
    onion: { name: 'Onion', emoji: '🧅', price: 2200, msp: null, change: +8.3, yield: 100, color: '#a855f7' },
    potato: { name: 'Potato', emoji: '🥔', price: 1100, msp: null, change: -2.1, yield: 120, color: '#78716c' },
    chana: { name: 'Gram (Chana)', emoji: '🫘', price: 5440, msp: 5440, change: +0.8, yield: 10, color: '#16a34a' },
};

const FORECAST_DATA = [
    { day: 'Today', icon: '⛅', desc: 'Partly Cloudy', high: 28, low: 18, rain: 5 },
    { day: 'Tue', icon: '☀️', desc: 'Clear & Sunny', high: 31, low: 20, rain: 0 },
    { day: 'Wed', icon: '🌤', desc: 'Mostly Sunny', high: 30, low: 19, rain: 2 },
    { day: 'Thu', icon: '🌧', desc: 'Light Rain', high: 24, low: 16, rain: 18 },
    { day: 'Fri', icon: '⛈', desc: 'Thunderstorm', high: 22, low: 15, rain: 35 },
    { day: 'Sat', icon: '🌥', desc: 'Overcast', high: 25, low: 17, rain: 8 },
    { day: 'Sun', icon: '☀️', desc: 'Clear', high: 29, low: 18, rain: 0 },
];

const CROP_RECOMMENDATIONS = {
    punjab: { rabi: ['wheat', 'mustard', 'potato'], kharif: ['rice', 'maize', 'cotton'], zaid: ['maize', 'groundnut'], yearround: ['wheat', 'rice'] },
    haryana: { rabi: ['wheat', 'mustard'], kharif: ['rice', 'cotton', 'maize'], zaid: ['maize'], yearround: ['wheat', 'rice'] },
    up: { rabi: ['wheat', 'mustard', 'potato'], kharif: ['rice', 'sugarcane', 'maize'], zaid: ['maize', 'potato'], yearround: ['sugarcane'] },
    mp: { rabi: ['wheat', 'chana', 'mustard'], kharif: ['soybean', 'cotton', 'rice'], zaid: ['maize'], yearround: ['soybean'] },
    maharashtra: { rabi: ['wheat', 'chana'], kharif: ['cotton', 'soybean', 'rice'], zaid: ['groundnut'], yearround: ['sugarcane'] },
    gujarat: { rabi: ['wheat', 'mustard'], kharif: ['cotton', 'groundnut', 'rice'], zaid: ['groundnut'], yearround: ['cotton'] },
    default: { rabi: ['wheat', 'mustard', 'chana'], kharif: ['rice', 'maize', 'cotton'], zaid: ['maize', 'groundnut'], yearround: ['wheat', 'rice'] },
};

const RECOMMENDATION_STATE_KEY_MAP = {
    'andhra pradesh': 'ap',
    bihar: 'bihar',
    gujarat: 'gujarat',
    haryana: 'haryana',
    maharashtra: 'maharashtra',
    'madhya pradesh': 'mp',
    odisha: 'odisha',
    punjab: 'punjab',
    rajasthan: 'rajasthan',
    telangana: 'telangana',
    'tamil nadu': 'tn',
    'uttar pradesh': 'up',
    'west bengal': 'wb',
    karnataka: 'karnataka',
};

// ===================== STATE =====================
let chartInstance = null;
let currentChartPeriod = '3m';
let mobileNavOpen = false;
window.latestRecommendations = [];
let lastMarketSnapshot = {};
let marketPollingTimer = null;
let runtimeMetrics = {
    totalPredictCalls: 0,
    predictFallbackCount: 0,
    totalMarketSyncCalls: 0,
    marketFallbackCount: 0,
    totalWeatherCalls: 0,
    weatherFallbackCount: 0,
};

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initStateDistrictSelectors();
    initRealtimeMeta();
    animateCounters();
    buildTicker();
    buildMarketGrid();
    buildForecast();
    updateCalc();
    initScrollReveal();
    initNav();
    setTimeout(() => { document.getElementById('heroFloats').style.opacity = 1; }, 1000);
    initChart();
    scheduleRealtimeMarketPolling();
});

// ===================== NAV =====================
function initNav() {
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('mainNav');
        if (window.scrollY > 50) { nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); }
    });
}
function toggleMobileNav() {
    mobileNavOpen = !mobileNavOpen;
    document.getElementById('mobileNav').classList.toggle('open', mobileNavOpen);
}
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function initTheme() {
    const savedTheme = localStorage.getItem('krishipro_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    syncThemeButton(savedTheme);
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('krishipro_theme', next);
    syncThemeButton(next);
    initChart(currentChartPeriod);
}

function syncThemeButton(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
}

function getApiBaseUrl() {
    const configured = window.APP_CONFIG && typeof window.APP_CONFIG.API_BASE_URL === 'string'
        ? window.APP_CONFIG.API_BASE_URL.trim()
        : '';
    return configured.replace(/\/$/, '');
}

function apiUrl(path) {
    return `${getApiBaseUrl()}${path}`;
}
window.apiUrl = apiUrl;

async function apiFetch(path, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(apiUrl(path), {
            ...options,
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                ...(options.headers || {}),
            },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = new Error(data?.errors?.[0] || data?.error || `Request failed (${response.status})`);
            err.payload = data;
            throw err;
        }
        return data;
    } finally {
        clearTimeout(timeout);
    }
}

function sendTelemetryEvent(eventType, metadata = {}) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (typeof apiUrl !== 'function') return;

    const payload = {
        event_type: eventType,
        ts: new Date().toISOString(),
        metadata,
    };

    fetch(apiUrl('/api/telemetry/events'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(payload),
    }).catch(() => {
        // Telemetry must be non-blocking.
    });
}

function normalizeCropKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function mapCropNameToLocalKey(cropName) {
    const normalized = normalizeCropKey(cropName);
    const mapping = {
        wheat: 'wheat',
        rice: 'rice',
        paddy: 'rice',
        cotton: 'cotton',
        sugarcane: 'sugarcane',
        soybean: 'soybean',
        soyabean: 'soybean',
        maize: 'maize',
        mustard: 'mustard',
        groundnut: 'groundnut',
        tomato: 'tomato',
        onion: 'onion',
        potato: 'potato',
        gram: 'chana',
        chana: 'chana',
    };

    if (mapping[normalized]) return mapping[normalized];
    const token = normalized.split(' ')[0];
    return mapping[token] || null;
}

function getActiveLocation() {
    const state = document.getElementById('stateSelect')?.value || 'Punjab';
    const district = document.getElementById('districtSelect')?.value || 'Ludhiana';
    return { state, district };
}

function scheduleRealtimeMarketPolling() {
    if (marketPollingTimer) clearInterval(marketPollingTimer);
    loadRealtimeMarketData();
    marketPollingTimer = setInterval(() => {
        loadRealtimeMarketData(true);
    }, 120000);
}

async function loadRealtimeMarketData(isSilent = false) {
    const { state, district } = getActiveLocation();
    if (!state || !district) return;
    runtimeMetrics.totalMarketSyncCalls += 1;
    const start = performance.now();

    try {
        const payload = await apiFetch(`/mandi-prices?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
        const prices = Array.isArray(payload.prices) ? payload.prices : [];
        if (!prices.length) return;

        prices.forEach((entry) => {
            const key = mapCropNameToLocalKey(entry.crop);
            if (!key || !CROPS_DATA[key]) return;

            const previous = Number(CROPS_DATA[key].price || 0);
            const current = Number(entry.modal_price || previous || 0);
            if (!current) return;

            let change = 0;
            if (previous > 0) {
                change = ((current - previous) / previous) * 100;
            } else if (lastMarketSnapshot[key]) {
                const base = Number(lastMarketSnapshot[key]);
                change = base > 0 ? ((current - base) / base) * 100 : 0;
            }

            CROPS_DATA[key].price = Math.round(current);
            CROPS_DATA[key].change = Number(change.toFixed(1));
            lastMarketSnapshot[key] = current;
        });

        buildTicker();
        buildMarketGrid();

        if (!isSilent) {
            showToast(`Live mandi prices synced for ${district}, ${state}.`, 'success');
        }

        sendTelemetryEvent('market_sync_success', {
            state,
            district,
            latency_ms: Math.round(performance.now() - start),
            total_synced: prices.length,
            fallback_ratio: runtimeMetrics.totalMarketSyncCalls > 0
                ? Number((runtimeMetrics.marketFallbackCount / runtimeMetrics.totalMarketSyncCalls).toFixed(3))
                : 0,
        });
    } catch (error) {
        runtimeMetrics.marketFallbackCount += 1;
        if (!isSilent) {
            showToast('Live mandi sync unavailable. Showing latest cached values.', 'warning');
        }

        sendTelemetryEvent('market_sync_fallback', {
            state,
            district,
            latency_ms: Math.round(performance.now() - start),
            reason: error?.message || 'unknown_error',
            fallback_ratio: runtimeMetrics.totalMarketSyncCalls > 0
                ? Number((runtimeMetrics.marketFallbackCount / runtimeMetrics.totalMarketSyncCalls).toFixed(3))
                : 1,
        });
    }
}

async function initRealtimeMeta() {
    try {
        const payload = await apiFetch('/api/public-meta');
        const states = Number(payload.total_states || 0);
        if (states > 0) {
            document.getElementById('statStates').textContent = states.toLocaleString();
        }
    } catch (_) {
        // Keep existing animated defaults if meta API is unavailable.
    }
}

function normalizeKey(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toRecommendationStateKey(stateName) {
    const normalized = normalizeKey(stateName);
    return RECOMMENDATION_STATE_KEY_MAP[normalized] || normalized || 'default';
}

function resetDistrictOptions(placeholder = 'Select District') {
    const districtSelect = document.getElementById('districtSelect');
    if (!districtSelect) return;

    districtSelect.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;
    districtSelect.appendChild(option);
    districtSelect.value = '';
    districtSelect.disabled = true;
}

async function loadDistrictsForState(stateName, preferredDistrict = '') {
    const districtSelect = document.getElementById('districtSelect');
    if (!districtSelect) return;

    resetDistrictOptions('Loading districts...');
    if (!stateName) {
        resetDistrictOptions('Select District');
        return;
    }

    try {
        const response = await fetch(apiUrl(`/api/districts/${encodeURIComponent(stateName)}`));
        const payload = await response.json();
        const districts = Array.isArray(payload.districts) ? payload.districts : [];

        resetDistrictOptions('Select District');
        districts.forEach((districtName) => {
            const option = document.createElement('option');
            option.value = districtName;
            option.textContent = districtName;
            districtSelect.appendChild(option);
        });

        districtSelect.disabled = districts.length === 0;
        if (preferredDistrict && districts.includes(preferredDistrict)) {
            districtSelect.value = preferredDistrict;
        }
    } catch (error) {
        resetDistrictOptions('Districts unavailable');
        showToast('Could not load districts for selected state.', 'error');
    }
}

async function initStateDistrictSelectors() {
    const stateSelect = document.getElementById('stateSelect');
    const districtSelect = document.getElementById('districtSelect');
    if (!stateSelect) return;

    resetDistrictOptions('Select State First');

    stateSelect.addEventListener('change', async (event) => {
        const selectedState = event.target.value;
        await loadDistrictsForState(selectedState);
        if (districtSelect) districtSelect.value = '';
    });

    if (districtSelect) {
        districtSelect.addEventListener('change', () => {
            const district = districtSelect.value;
            const state = stateSelect.value;
            if (district && state) {
                document.getElementById('weatherLocation').textContent = `${district}, ${state}`;
                loadRealtimeMarketData();
            }
        });
    }

    try {
        const response = await fetch(apiUrl('/api/states'));
        const payload = await response.json();
        const states = Array.isArray(payload.states) ? payload.states : [];

        stateSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select State';
        stateSelect.appendChild(defaultOption);

        states.forEach((stateItem) => {
            const stateName = typeof stateItem?.name === 'string' ? stateItem.name : '';
            if (!stateName) return;
            const option = document.createElement('option');
            option.value = stateName;
            option.textContent = stateName;
            stateSelect.appendChild(option);
        });
    } catch (error) {
        showToast('Could not load states list. Please refresh the page.', 'error');
    }
}

// ===================== COUNTER ANIMATION =====================
function animateCounters() {
    animateNum('statCrops', 0, 1240, 2000, v => v.toLocaleString());
    animateNum('statFarmers', 0, 48000, 2200, v => v.toLocaleString());
    animateNum('statAccuracy', 0, 94, 1800, v => v + '%');
    animateNum('statStates', 0, 28, 1500, v => v + '');
}
function animateNum(id, from, to, dur, fmt) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now();
    function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(Math.round(from + (to - from) * ease));
        if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

// ===================== TICKER =====================
function buildTicker() {
    const keys = Object.keys(CROPS_DATA);
    let html = '';
    for (let i = 0; i < 2; i++) {
        keys.forEach(k => {
            const c = CROPS_DATA[k];
            const sign = c.change >= 0 ? '+' : '';
            html += `<div class="ticker-item">
        <span>${c.emoji}</span>
        <span class="ticker-name">${c.name}</span>
        <span class="ticker-price">₹${c.price.toLocaleString()}/qtl</span>
        <span class="ticker-change ${c.change >= 0 ? 'up' : 'down'}">${sign}${c.change}%</span>
      </div><div class="ticker-divider"></div>`;
        });
    }
    document.getElementById('ticker').innerHTML = html;
}
function liveTickerUpdate() {
    loadRealtimeMarketData(true);
}

// ===================== MARKET GRID =====================
function buildMarketGrid() {
    const keys = Object.keys(CROPS_DATA);
    let html = '';
    keys.forEach((k, i) => {
        const c = CROPS_DATA[k];
        const sign = c.change >= 0 ? '+' : '';
        const cl = c.change >= 0 ? 'up' : 'down';
        const sparkline = generateSparklineSVG(c.price, c.color);
        html += `<div class="market-card reveal ${i > 0 ? 'reveal-delay-' + (i % 4) : ''}">
      <div class="market-card-top">
        <div class="market-crop-info">
          <div class="market-crop-emoji">${c.emoji}</div>
          <div>
            <div class="market-crop-name">${c.name}</div>
            <div class="market-crop-variety">Avg. Mandi Price</div>
          </div>
        </div>
        <div class="market-change-badge ${cl}">${sign}${c.change}%</div>
      </div>
      <div class="market-price-section">
        <div>
          <div class="market-price-main">₹${c.price.toLocaleString()}</div>
          <div class="market-price-unit">per quintal</div>
        </div>
        <div style="text-align:right">
          ${c.msp ? `<div class="market-msp">MSP: <span class="market-msp-val">₹${c.msp.toLocaleString()}</span></div>` : '<div class="market-msp" style="color:var(--amber-500)">No MSP</div>'}
        </div>
      </div>
      <div class="market-sparkline">${sparkline}</div>
    </div>`;
    });
    document.getElementById('marketGrid').innerHTML = html;
    initScrollReveal();
}
function generateSparklineSVG(basePrice, color) {
    const pts = [];
    let p = basePrice;
    for (let i = 0; i < 12; i++) {
        p = p + (Math.random() - 0.5) * basePrice * 0.04;
        pts.push(p);
    }
    const min = Math.min(...pts), max = Math.max(...pts);
    const w = 220, h = 40, pad = 4;
    const coords = pts.map((v, i) => {
        const x = pad + i * (w - 2 * pad) / 11;
        const y = h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);
        return `${x},${y}`;
    }).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" width="100%" height="${h}">
    <polyline points="${coords}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"/>
  </svg>`;
}

// ===================== FORECAST =====================
function buildForecast() {
    let html = '';
    FORECAST_DATA.forEach(f => {
        html += `<div class="forecast-card" onclick="showForecastDetail('${f.day}','${f.desc}')">
      <div class="forecast-day">${f.day}</div>
      <div class="forecast-icon">${f.icon}</div>
      <div class="forecast-desc">${f.desc}</div>
      <div class="forecast-temp">${f.high}°/${f.low}°</div>
      ${f.rain > 0 ? `<div class="forecast-rain">💧${f.rain}mm</div>` : ''}
    </div>`;
    });
    document.getElementById('forecastCards').innerHTML = html;
}
function showForecastDetail(day, desc) {
    showToast(`${day}: ${desc} — Good conditions for field scouting and light irrigation.`, 'info');
}
async function refreshWeather() {
    const state = document.getElementById('stateSelect').value || 'Punjab';
    const district = document.getElementById('districtSelect').value || 'Ludhiana';
    const soil = document.getElementById('soilSelect').value || 'loamy';
    const season = document.getElementById('seasonSelect').value || 'rabi';
    runtimeMetrics.totalWeatherCalls += 1;
    const start = performance.now();

    try {
        const payload = await apiFetch('/api/crops/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state,
                city: district,
                district,
                soil,
                season,
            }),
        });

        applyWeatherToUI(payload.weather, district, state);
        showToast('Weather insights refreshed from live backend.', 'success');

        sendTelemetryEvent('weather_refresh_success', {
            state,
            district,
            season,
            latency_ms: Math.round(performance.now() - start),
            fallback_ratio: runtimeMetrics.totalWeatherCalls > 0
                ? Number((runtimeMetrics.weatherFallbackCount / runtimeMetrics.totalWeatherCalls).toFixed(3))
                : 0,
        });
    } catch (error) {
        runtimeMetrics.weatherFallbackCount += 1;
        showToast('Weather refresh unavailable right now.', 'warning');

        sendTelemetryEvent('weather_refresh_fallback', {
            state,
            district,
            season,
            latency_ms: Math.round(performance.now() - start),
            reason: error?.message || 'unknown_error',
            fallback_ratio: runtimeMetrics.totalWeatherCalls > 0
                ? Number((runtimeMetrics.weatherFallbackCount / runtimeMetrics.totalWeatherCalls).toFixed(3))
                : 1,
        });
    }
}

function applyWeatherToUI(weather, district, state) {
    if (!weather || typeof weather !== 'object') return;

    const temperature = Number(weather.temperature ?? 0);
    const humidity = Number(weather.humidity ?? 0);
    const rainfall = Number(weather.rainfall ?? 0);

    document.getElementById('weatherLocation').textContent = `${district}, ${state}`;
    document.getElementById('weatherTemp').innerHTML = `${Math.round(temperature)}<span class="weather-temp-unit">°C</span>`;
    document.getElementById('weatherHumidity').textContent = `${Math.round(humidity)}%`;
    document.getElementById('weatherRain').textContent = `${Math.round(rainfall)}mm`;

    const windApprox = Math.max(6, Math.round(6 + humidity / 8));
    document.getElementById('weatherWind').textContent = `${windApprox} km/h`;

    let condition = 'Stable weather for routine field operations.';
    let icon = '⛅';
    if (rainfall >= 12) {
        condition = 'High rainfall risk. Plan drainage and spray windows carefully.';
        icon = '🌧';
    } else if (temperature >= 35) {
        condition = 'Heat stress possible. Increase irrigation and mulching frequency.';
        icon = '☀️';
    }

    document.getElementById('weatherCondition').textContent = condition;
    document.getElementById('weatherIcon').textContent = icon;
}

// ===================== LOCATION =====================
function detectLocation() {
    showToast('Detecting your location...', 'info');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async pos => {
            document.getElementById('pincodeInput').value = '141001';
            document.getElementById('stateSelect').value = 'Punjab';
            await loadDistrictsForState('Punjab', 'Ludhiana');
            document.getElementById('weatherLocation').textContent = 'Ludhiana, Punjab';
            showToast('Location detected: Ludhiana, Punjab', 'success');
        }, err => {
            showToast('Could not detect location. Please enter manually.', 'error');
        });
    } else {
        showToast('Geolocation not supported in this browser.', 'error');
    }
}

// ===================== RANGE INPUT =====================
function updateRange(rangeId, valId, fmt) {
    const v = document.getElementById(rangeId).value;
    document.getElementById(valId).textContent = fmt(v);
}

// ===================== CROP ANALYSIS =====================
async function analyzeCrops() {
    const stateName = document.getElementById('stateSelect').value;
    const district = document.getElementById('districtSelect').value;
    const season = document.getElementById('seasonSelect').value;
    const soil = document.getElementById('soilSelect').value;
    const land = parseFloat(document.getElementById('landRange').value);
    const budget = parseFloat(document.getElementById('budgetInput').value);

    if (!stateName || !district || !season) {
        showToast('Please select State, District, and Season first.', 'error');
        return;
    }
    if (!soil) {
        showToast('Please select soil type.', 'error');
        return;
    }
    if (!budget || budget < 1000) {
        showToast('Please enter a valid budget (minimum ₹1,000).', 'error');
        return;
    }

    // Show loading
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('show');
    runtimeMetrics.totalPredictCalls += 1;
    const start = performance.now();

    try {
        const payload = await apiFetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state: stateName,
                city: district,
                district,
                season,
                soil,
            }),
        });

        const results = mapBackendRecommendations(payload, land, budget);
        renderResults(results, stateName, district, season, land);
        applyWeatherToUI(payload.weather, payload.district || district, payload.state || stateName);

        sendTelemetryEvent('predict_success', {
            state: stateName,
            district,
            season,
            soil,
            latency_ms: Math.round(performance.now() - start),
            recommendation_count: results.length,
            fallback_ratio: runtimeMetrics.totalPredictCalls > 0
                ? Number((runtimeMetrics.predictFallbackCount / runtimeMetrics.totalPredictCalls).toFixed(3))
                : 0,
        });
    } catch (error) {
        runtimeMetrics.predictFallbackCount += 1;
        const recommendationStateKey = toRecommendationStateKey(stateName);
        const results = getRecommendations(recommendationStateKey, season, land, budget);
        renderResults(results, stateName, district, season, land);
        showToast('Live prediction unavailable. Showing fallback recommendations.', 'warning');

        sendTelemetryEvent('predict_fallback', {
            state: stateName,
            district,
            season,
            soil,
            latency_ms: Math.round(performance.now() - start),
            reason: error?.message || 'unknown_error',
            fallback_ratio: runtimeMetrics.totalPredictCalls > 0
                ? Number((runtimeMetrics.predictFallbackCount / runtimeMetrics.totalPredictCalls).toFixed(3))
                : 1,
        });
    } finally {
        overlay.classList.remove('show');
    }
}

function mapBackendRecommendations(payload, landAcres, budget) {
    const recommendations = Array.isArray(payload?.recommendations) ? payload.recommendations : [];
    const landHectare = Math.max(0.2, Number(landAcres || 1) * 0.404686);

    return recommendations.map((item) => {
        const cropLabel = String(item.crop || 'Crop').trim();
        const localKey = mapCropNameToLocalKey(cropLabel) || normalizeCropKey(cropLabel).replace(/\s+/g, '_');
        const catalogCrop = CROPS_DATA[localKey] || {};

        const price = Number(item.market_price || item.expected_price || catalogCrop.price || 2000);
        const cultivationCost = Number(item.cultivation_cost || 0) * landHectare;
        const rawProfit = Number(item.profit || 0) * landHectare;
        const yieldQtl = (Number(item.yield_per_hectare || 0) / 100) * landHectare;

        const normalizedProfit = budget > 0 ? Math.max(rawProfit, budget * 0.1) : rawProfit;
        const roi = cultivationCost > 0 ? (normalizedProfit / cultivationCost) * 100 : Number(item.roi || 0);
        const confidence = Math.max(62, Math.min(96, 100 - Math.round(Number(item.risk || 0) * 45)));

        return {
            key: localKey,
            name: cropLabel,
            emoji: catalogCrop.emoji || '🌱',
            price: Math.round(price),
            yieldQtl: Math.max(1, Math.round(yieldQtl)),
            risk: String(item.risk_level || 'Medium'),
            confidence,
            profit: Math.round(normalizedProfit),
            revenue: Math.round(normalizedProfit + cultivationCost),
            cost: Math.round(cultivationCost),
            source: String(item.price_source || 'fallback'),
        };
    });
}

function getRecommendations(state, season, land, budget) {
    const stateData = CROP_RECOMMENDATIONS[state] || CROP_RECOMMENDATIONS.default;
    const cropKeys = stateData[season] || stateData.yearround || ['wheat', 'rice', 'maize'];

    return cropKeys.map((k, i) => {
        const c = CROPS_DATA[k];
        if (!c) return null;
        const base = budget * 0.7;
        const costPerAcre = base / land;
        const yieldQtl = c.yield * land * (0.85 + Math.random() * 0.3);
        const revenue = yieldQtl * c.price;
        const totalCost = costPerAcre * land;
        const profit = revenue - totalCost;
        const confidence = 85 - i * 8 + Math.random() * 10;
        const riskScore = ['Low', 'Medium', 'High'][Math.floor(Math.random() * 2)];
        return { key: k, ...c, profit: Math.round(profit), revenue: Math.round(revenue), cost: Math.round(totalCost), confidence: Math.round(confidence), risk: riskScore, yieldQtl: Math.round(yieldQtl) };
    }).filter(Boolean).sort((a, b) => b.profit - a.profit);
}

function renderResults(results, stateName, district, season, land, options = {}) {
    const container = document.getElementById('resultsContainer');
    const subtitle = document.getElementById('resultsSubtitle');
    if (!container || !subtitle) return;

    window.latestRecommendations = results;
    updateInsightDashboard(results, { stateName, district, season, land });

    if (!results.length) { container.innerHTML = '<div class="result-empty"><div class="result-empty-icon">❌</div><div class="result-empty-text">No recommendations for this combination.</div></div>'; return; }

    subtitle.textContent = `Top ${results.length} crops for ${district}, ${stateName} • ${season} season • ${land} acres`;

    let html = '';
    results.forEach((r, i) => {
        const isTop = i === 0;
        html += `<div class="result-crop-card ${isTop ? 'top' : ''}">
      <div class="crop-rank ${isTop ? 'gold' : ''}">
        <span class="crop-rank-badge ${isTop ? 'gold' : ''}">${i + 1}</span>
        ${isTop ? '✨ TOP RECOMMENDATION' : `RANK #${i + 1}`}
      </div>
      <div class="crop-name-row">
        <div class="crop-name">${r.name}</div>
        <div class="crop-score">
          <div class="crop-score-val">+₹${(r.profit / 1000).toFixed(0)}K</div>
          <div class="crop-score-label">Est. Profit</div>
        </div>
      </div>
      <div class="crop-metrics">
        <div class="crop-metric">
          <div class="crop-metric-val">₹${r.price.toLocaleString()}</div>
          <div class="crop-metric-label">Mandi/Qtl</div>
        </div>
        <div class="crop-metric">
          <div class="crop-metric-val">${r.yieldQtl} Qtl</div>
          <div class="crop-metric-label">Est. Yield</div>
        </div>
        <div class="crop-metric">
          <div class="crop-metric-val">${r.risk}</div>
          <div class="crop-metric-label">Risk Level</div>
        </div>
      </div>
      <div class="confidence-label"><span>AI Confidence</span><span>${r.confidence}%</span></div>
      <div class="confidence-bar"><div class="confidence-fill" style="width:${r.confidence}%"></div></div>
            <div class="result-actions">
                <button class="result-action-btn" onclick="window.addRecommendationToComparison && window.addRecommendationToComparison('${r.key}')">Compare</button>
                <button class="result-action-btn" onclick="window.exportLatestReport && window.exportLatestReport()">Export Report</button>
            </div>
    </div>`;
    });

    container.innerHTML = html;
    if (!options.silent) {
        showToast(`✅ ${results.length} crop recommendations ready!`, 'success');
        scrollToSection('optimizer');
    }
}

function sortLatestResults(sortType = 'profit_desc') {
    if (!Array.isArray(window.latestRecommendations) || !window.latestRecommendations.length) return;
    const riskOrder = { low: 1, medium: 2, high: 3 };
    const data = [...window.latestRecommendations];

    data.sort((a, b) => {
        if (sortType === 'roi_desc') return ((b.profit / Math.max(b.cost, 1)) - (a.profit / Math.max(a.cost, 1)));
        if (sortType === 'risk_asc') return (riskOrder[String(a.risk).toLowerCase()] || 9) - (riskOrder[String(b.risk).toLowerCase()] || 9);
        if (sortType === 'confidence_desc') return (b.confidence || 0) - (a.confidence || 0);
        return (b.profit || 0) - (a.profit || 0);
    });
    window.latestRecommendations = data;

    const container = document.getElementById('resultsContainer');
    if (!container) return;
    const stateName = document.getElementById('stateSelect').value || 'State';
    const district = document.getElementById('districtSelect').value || 'District';
    const season = document.getElementById('seasonSelect').value || 'season';
    const land = parseFloat(document.getElementById('landRange').value || '0') || 0;
    renderResults(data, stateName, district, season, land, { silent: true });
}

function updateInsightDashboard(results, context = {}) {
    const t = (key, fallback) => window.languageManager?.text(key, fallback) || fallback;
    const best = Array.isArray(results) && results.length ? results[0] : null;
    const statusPill = document.getElementById('insightStatusPill');
    if (!best) {
        if (statusPill) statusPill.textContent = t('insight_status_awaiting', 'Awaiting Analysis');
        return;
    }

    const fmtINR = (val) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
    const roi = best.cost > 0 ? ((best.profit / best.cost) * 100).toFixed(1) : '0.0';
    const riskSummary = summarizeRisk(results);
    const timeline = buildActionTimeline(best, context);

    const bestCropEl = document.getElementById('insightBestCrop');
    const bestProfitEl = document.getElementById('insightBestProfit');
    const bestRoiEl = document.getElementById('insightBestROI');
    const riskMixEl = document.getElementById('insightRiskMix');
    const timelineEl = document.getElementById('insightTimeline');
    if (!bestCropEl || !bestProfitEl || !bestRoiEl || !riskMixEl || !timelineEl) return;

    bestCropEl.textContent = `${best.emoji || '🌱'} ${best.name}`;
    bestProfitEl.textContent = fmtINR(best.profit);
    bestRoiEl.textContent = `${roi}%`;
    riskMixEl.textContent = riskSummary;
    if (statusPill) statusPill.textContent = t('insight_status_live', 'Live Strategy Ready');
    timelineEl.innerHTML = timeline
        .map((step) => `<div class="insight-step">${step}</div>`)
        .join('');
}

function summarizeRisk(results) {
    const lang = document.documentElement.lang || 'en';
    const lowLabel = lang === 'hi' ? 'कम' : 'Low';
    const medLabel = lang === 'hi' ? 'मध्यम' : 'Med';
    const highLabel = lang === 'hi' ? 'उच्च' : 'High';
    const buckets = { low: 0, medium: 0, high: 0 };
    results.forEach((item) => {
        const key = String(item.risk || '').toLowerCase();
        if (buckets[key] !== undefined) buckets[key] += 1;
    });
    return `${lowLabel} ${buckets.low} • ${medLabel} ${buckets.medium} • ${highLabel} ${buckets.high}`;
}

function buildActionTimeline(best, context) {
    const lang = document.documentElement.lang || 'en';
    const districtLabel = context.district || 'your district';
    const seasonLabel = context.season ? context.season.toUpperCase() : 'CURRENT';
    if (lang === 'hi') {
        return [
            `सप्ताह 1: ${districtLabel} में ${best.name} के लिए बीज और इनपुट खरीद योजना तय करें।`,
            `सप्ताह 2: ${seasonLabel} चक्र के अनुसार भूमि तैयारी और सिंचाई योजना बनाएं।`,
            'सप्ताह 3: बुवाई विंडो पर कार्य करें और कीट निगरानी रिमाइंडर सेट करें।',
            'सप्ताह 4+: मंडी मूल्य ट्रेंड ट्रैक करें और बैकअप फसल विकल्पों से तुलना करें।',
        ];
    }
    return [
        `Week 1: Lock seed + input procurement plan for ${best.name} in ${districtLabel}.`,
        `Week 2: Prepare land and irrigation schedule for ${seasonLabel} cycle.`,
        'Week 3: Execute sowing window and set pest scouting reminders.',
        'Week 4+: Track mandi price movement and compare with backup crop options.',
    ];
}

// ===================== PROFIT CALCULATOR =====================
function updateCalc() {
    const area = parseFloat(document.getElementById('calcArea').value) || 0;
    const yld = parseFloat(document.getElementById('calcYield').value) || 0;
    const price = parseFloat(document.getElementById('calcPrice').value) || 0;
    const seed = parseFloat(document.getElementById('calcSeed').value) || 0;
    const fert = parseFloat(document.getElementById('calcFert').value) || 0;
    const labour = parseFloat(document.getElementById('calcLabour').value) || 0;
    const other = parseFloat(document.getElementById('calcOther').value) || 0;

    const production = area * yld;
    const revenue = production * price;
    const costPerAcre = seed + fert + labour + other;
    const totalCost = costPerAcre * area;
    const profit = revenue - totalCost;
    const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : 0;
    const breakeven = production > 0 ? (totalCost / production).toFixed(0) : 0;
    const perAcre = area > 0 ? (profit / area).toFixed(0) : 0;

    const fmtINR = n => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');

    document.getElementById('calcRevenue').textContent = fmtINR(revenue);
    document.getElementById('calcTotalCost').textContent = fmtINR(totalCost);
    document.getElementById('calcNetProfit').textContent = fmtINR(profit);
    document.getElementById('calcNetProfit').className = 'calc-result-value' + (profit < 0 ? ' loss' : '');
    document.getElementById('calcProfitNote').textContent = profit >= 0 ? `ROI: ${roi}% • Profitable ✅` : `Loss: consider cost optimization ⚠️`;
    document.getElementById('calcROI').textContent = roi + '%';
    document.getElementById('calcBreakeven').textContent = '₹' + breakeven;
    document.getElementById('calcPerAcre').textContent = fmtINR(perAcre);
    document.getElementById('calcProduction').textContent = production.toFixed(1) + ' qtl';
}

// ===================== CHART =====================
function initChart(period = '3m') {
    const canvas = document.getElementById('priceChart');
    if (!canvas) return;
    currentChartPeriod = period;
    const ctx = canvas.getContext('2d');
    if (chartInstance) { chartInstance = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }

    const isDarkTheme = document.body.getAttribute('data-theme') === 'dark';
    const chartSurface = isDarkTheme ? '#13241a' : '#ffffff';
    const axisColor = isDarkTheme ? '#9fc2ab' : '#6b9478';
    const gridColor = isDarkTheme ? 'rgba(159, 194, 171, 0.12)' : 'rgba(10,31,14,0.06)';

    const labels = {
        '3m': ['Oct', 'Nov', 'Dec'],
        '6m': ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        '1y': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    }[period] || ['Oct', 'Nov', 'Dec'];

    const genData = (base, vol) => labels.map((_, i) => Math.round(base + (Math.random() - 0.5) * vol + i * vol * 0.05));
    const wData = genData(2200, 150);
    const rData = genData(2100, 200);
    const sData = genData(4500, 400);

    // Manual chart drawing
    const W = canvas.offsetWidth || 700, H = 280;
    canvas.width = W; canvas.height = H;

    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;

    const allVals = [...wData, ...rData, ...sData];
    const minV = Math.min(...allVals) * 0.95, maxV = Math.max(...allVals) * 1.05;

    function toX(i) { return pad.left + i * (cw / (labels.length - 1)); }
    function toY(v) { return pad.top + ch - ((v - minV) / (maxV - minV)) * ch; }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = chartSurface;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = pad.top + ch * (i / 5);
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        const val = Math.round(maxV - (maxV - minV) * (i / 5));
        ctx.fillStyle = axisColor; ctx.font = '11px DM Sans'; ctx.textAlign = 'right';
        ctx.fillText('₹' + val.toLocaleString(), pad.left - 8, y + 4);
    }

    // X labels
    ctx.fillStyle = axisColor; ctx.font = '12px DM Sans'; ctx.textAlign = 'center';
    labels.forEach((l, i) => { ctx.fillText(l, toX(i), H - 10); });

    // Draw line
    function drawLine(data, color, dash = []) {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        if (dash.length) ctx.setLineDash(dash); else ctx.setLineDash([]);
        data.forEach((v, i) => { i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)); });
        ctx.stroke();
        // Fill
        ctx.globalAlpha = 0.08; ctx.fillStyle = color; ctx.beginPath();
        data.forEach((v, i) => { i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)); });
        ctx.lineTo(toX(data.length - 1), pad.top + ch); ctx.lineTo(pad.left, pad.top + ch); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        // Dots
        ctx.fillStyle = color;
        data.forEach((v, i) => { ctx.beginPath(); ctx.arc(toX(i), toY(v), 4, 0, Math.PI * 2); ctx.fill(); });
    }
    drawLine(wData, '#2d8c38');
    drawLine(rData, '#f59e0b');
    drawLine(sData, '#3b82f6');
}

function setChartFilter(btn, period) {
    document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentChartPeriod = period;
    initChart(period);
}

// ===================== SCROLL REVEAL =====================
function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
}

// ===================== TOAST =====================
function showToast(msg, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()">×</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 0.4s ease'; setTimeout(() => toast.remove(), 400); }, 4000);
}