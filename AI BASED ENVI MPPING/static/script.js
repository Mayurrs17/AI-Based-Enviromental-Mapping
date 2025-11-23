/* global L, Chart */
(function () {
  const hasWeather = String(window.__HAS_WEATHER_KEY__) === 'true';
  const startInput = document.getElementById('startInput');
  const endInput = document.getElementById('endInput');
  const routeBtn = document.getElementById('routeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const geolocateBtn = document.getElementById('geolocateBtn');
  const themeToggle = document.getElementById('themeToggle');
  const apiWarning = document.getElementById('apiWarning');
  const startSuggest = document.getElementById('startSuggest');
  const endSuggest = document.getElementById('endSuggest');
  const weatherList = document.getElementById('weatherList');
  const distanceOut = document.getElementById('distanceOut');
  const durationOut = document.getElementById('durationOut');
  const safetyBadge = document.getElementById('safetyBadge');
  const sunInfo = document.getElementById('sunInfo');
  const exportBtn = document.getElementById('exportBtn');
  const toastContainer = document.getElementById('toastContainer');
  const shareBtn = document.getElementById('shareBtn');
  const historyBtn = document.getElementById('historyBtn');
  const historyDropdown = document.getElementById('historyDropdown');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const compareRoutesBtn = document.getElementById('compareRoutesBtn');
  const routeComparison = document.getElementById('routeComparison');
  const bestTimeBtn = document.getElementById('bestTimeBtn');
  const bestTimeResults = document.getElementById('bestTimeResults');
  const totalCo2Saved = document.getElementById('totalCo2Saved');
  const routesThisMonth = document.getElementById('routesThisMonth');
  const achievementBadges = document.getElementById('achievementBadges');
  
  // Collapsible sections
  const envToggle = document.getElementById('envToggle');
  const envContent = document.getElementById('envContent');
  const envToggleIcon = document.getElementById('envToggleIcon');
  const carbonToggle = document.getElementById('carbonToggle');
  const carbonContent = document.getElementById('carbonContent');
  const carbonToggleIcon = document.getElementById('carbonToggleIcon');
  const forecastToggle = document.getElementById('forecastToggle');
  const forecastContent = document.getElementById('forecastContent');
  const forecastToggleIcon = document.getElementById('forecastToggleIcon');
  const chartsToggle = document.getElementById('chartsToggle');
  const chartsContent = document.getElementById('chartsContent');
  const chartsToggleIcon = document.getElementById('chartsToggleIcon');
  const weatherToggle = document.getElementById('weatherToggle');
  const weatherContent = document.getElementById('weatherContent');
  const weatherToggleIcon = document.getElementById('weatherToggleIcon');
  const prefsToggle = document.getElementById('prefsToggle');
  const prefsContent = document.getElementById('prefsContent');
  const prefsToggleIcon = document.getElementById('prefsToggleIcon');
  const eduToggle = document.getElementById('eduToggle');
  const eduContent = document.getElementById('eduContent');
  const eduToggleIcon = document.getElementById('eduToggleIcon');
  const recommendationsPanel = document.getElementById('recommendationsPanel');
  const recommendationsList = document.getElementById('recommendationsList');
  const envAlertsPanel = document.getElementById('envAlertsPanel');
  const envAlertsList = document.getElementById('envAlertsList');
  
  // User Preferences
  const PREFERENCES_KEY = 'user_preferences';
  const prefAvoidRain = document.getElementById('prefAvoidRain');
  const prefEcoFriendly = document.getElementById('prefEcoFriendly');
  const prefAvoidPollution = document.getElementById('prefAvoidPollution');
  const prefShorterRoutes = document.getElementById('prefShorterRoutes');
  
  // Toggle functions
  function setupToggle(button, content, icon) {
    if (!button || !content) return;
    button.addEventListener('click', () => {
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');
      if (icon) icon.textContent = isHidden ? '▲' : '▼';
    });
  }
  
  setupToggle(envToggle, envContent, envToggleIcon);
  setupToggle(carbonToggle, carbonContent, carbonToggleIcon);
  setupToggle(forecastToggle, forecastContent, forecastToggleIcon);
  setupToggle(chartsToggle, chartsContent, chartsToggleIcon);
  setupToggle(weatherToggle, weatherContent, weatherToggleIcon);
  setupToggle(prefsToggle, prefsContent, prefsToggleIcon);
  setupToggle(eduToggle, eduContent, eduToggleIcon);
  
  const offlineRoutesToggle = document.getElementById('offlineRoutesToggle');
  const offlineRoutesContent = document.getElementById('offlineRoutesContent');
  const offlineRoutesToggleIcon = document.getElementById('offlineRoutesToggleIcon');
  if (offlineRoutesToggle && offlineRoutesContent && offlineRoutesToggleIcon) {
    setupToggle(offlineRoutesToggle, offlineRoutesContent, offlineRoutesToggleIcon);
  }
  
  // Load and save preferences
  function loadPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
      if (prefAvoidRain) prefAvoidRain.checked = prefs.avoidRain || false;
      if (prefEcoFriendly) prefEcoFriendly.checked = prefs.ecoFriendly || false;
      if (prefAvoidPollution) prefAvoidPollution.checked = prefs.avoidPollution || false;
      if (prefShorterRoutes) prefShorterRoutes.checked = prefs.shorterRoutes || false;
    } catch (e) {
      console.error('Failed to load preferences:', e);
    }
  }
  
  function savePreferences() {
    try {
      const prefs = {
        avoidRain: prefAvoidRain?.checked || false,
        ecoFriendly: prefEcoFriendly?.checked || false,
        avoidPollution: prefAvoidPollution?.checked || false,
        shorterRoutes: prefShorterRoutes?.checked || false,
      };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  }
  
  // Load preferences on startup
  loadPreferences();
  
  // Save preferences on change
  [prefAvoidRain, prefEcoFriendly, prefAvoidPollution, prefShorterRoutes].forEach(el => {
    if (el) el.addEventListener('change', savePreferences);
  });

  if (!hasWeather) apiWarning.classList.remove('hidden');

  // Helper function to get CSS variables
  function getCSSVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Theme handling - using data-theme attribute
  function toggleTheme() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
    localStorage.setItem("theme", isDark ? "light" : "dark");
    updateThemeIcon();
    updateChartColors();
  }

  function updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (themeIcon) {
      themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
  }

  // Initialize theme
  if (localStorage.getItem("theme")) {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("theme"));
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }

  updateThemeIcon();
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Map
  const map = L.map('map', { zoomControl: true });
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  map.setView([20, 0], 2);

  let routeLine = null;
  let checkpointMarkers = [];
  let lastRoute = null;
  let lastWeather = null;
  let lastStartInput = null;
  let lastEndInput = null;

  // Charts
  function updateChartColors() {
    const primaryColor = getCSSVariable('--primary');
    const primaryHover = getCSSVariable('--primary-hover');
    if (tempChart) {
      tempChart.data.datasets[0].borderColor = primaryColor;
      tempChart.update('none');
    }
    if (windChart) {
      windChart.data.datasets[0].borderColor = primaryHover;
      windChart.update('none');
    }
  }

  const tempCtx = document.getElementById('tempChart');
  const windCtx = document.getElementById('windChart');
  const primaryColor = getCSSVariable('--primary');
  const primaryHover = getCSSVariable('--primary-hover');
  const tempChart = new Chart(tempCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Temp (°C)', data: [], borderColor: primaryColor, tension: .35, fill: false }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: true } } }
  });
  const windChart = new Chart(windCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Wind (m/s)', data: [], borderColor: primaryHover, tension: .35, fill: false }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: true } } }
  });

  // Toast utility
  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = 'toast toast-enter';
    el.innerHTML = `<div class="flex items-center gap-2 text-sm">${iconFor(type)}<span>${message}</span></div>`;
    toastContainer.appendChild(el);
    setTimeout(() => { el.remove(); }, 3500);
  }
  function iconFor(type) {
    const base = 'w-4 h-4';
    if (type === 'danger') return `<span class="${base}">⚠️</span>`;
    if (type === 'warning') return `<span class="${base}">🌧️</span>`;
    if (type === 'success') return `<span class="${base}">✅</span>`;
    return `<span class="${base}">🔔</span>`;
  }

  // Geocoding autosuggest (Nominatim)
  async function searchPlaces(q) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    return r.ok ? r.json() : [];
  }
  function bindSuggest(input, listEl) {
    let timer;
    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearTimeout(timer);
      if (!q) { listEl.classList.add('hidden'); listEl.innerHTML=''; return; }
      timer = setTimeout(async () => {
        const results = await searchPlaces(q);
        listEl.innerHTML = '';
        results.forEach((p) => {
          const li = document.createElement('li');
          li.className = 'suggest-item';
          li.textContent = p.display_name;
          li.addEventListener('click', () => {
            input.value = p.display_name;
            input.dataset.lat = p.lat;
            input.dataset.lon = p.lon;
            listEl.classList.add('hidden');
            listEl.innerHTML = '';
          });
          listEl.appendChild(li);
        });
        listEl.classList.toggle('hidden', results.length === 0);
      }, 250);
    });
    input.addEventListener('blur', () => setTimeout(() => { listEl.classList.add('hidden'); }, 200));
    input.addEventListener('focus', () => { if (listEl.children.length) listEl.classList.remove('hidden'); });
  }
  bindSuggest(startInput, startSuggest);
  bindSuggest(endInput, endSuggest);

  // Geolocate
  geolocateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return toast('Geolocation not supported', 'warning');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 12);
      // Reverse geocode for start field convenience
      try {
        const u = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        const r = await fetch(u);
        const j = await r.json();
        startInput.value = j.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        startInput.dataset.lat = latitude;
        startInput.dataset.lon = longitude;
      } catch {}
    }, () => toast('Unable to retrieve your location', 'warning'));
  });

  // Route History Management
  const HISTORY_KEY = 'route_history';
  const MAX_HISTORY = 10;

  function saveRouteToHistory(route, startName, endName) {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const routeData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        startName,
        endName,
        start: { lat: parseFloat(startInput.dataset.lat), lon: parseFloat(startInput.dataset.lon) },
        end: { lat: parseFloat(endInput.dataset.lat), lon: parseFloat(endInput.dataset.lon) },
        route: {
          distanceText: route.distanceText,
          durationText: route.durationText,
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          checkpoints: route.checkpoints
        }
      };
      // Remove duplicates (same start/end)
      const filtered = history.filter(h => 
        !(Math.abs(h.start.lat - routeData.start.lat) < 0.0001 && 
          Math.abs(h.start.lon - routeData.start.lon) < 0.0001 &&
          Math.abs(h.end.lat - routeData.end.lat) < 0.0001 && 
          Math.abs(h.end.lon - routeData.end.lon) < 0.0001)
      );
      filtered.unshift(routeData);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
      updateHistoryDropdown();
    } catch (e) {
      console.error('Failed to save route history:', e);
    }
  }

  function updateHistoryDropdown() {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      historyList.innerHTML = '';
      if (history.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'p-3 text-xs opacity-70 text-center';
        empty.textContent = 'No saved routes';
        historyList.appendChild(empty);
        return;
      }
      history.forEach(item => {
        const li = document.createElement('div');
        li.className = 'suggest-item cursor-pointer';
        const date = new Date(item.timestamp);
        li.innerHTML = `
          <div class="font-semibold text-xs">${escapeHtml(item.startName || 'Unknown')} → ${escapeHtml(item.endName || 'Unknown')}</div>
          <div class="text-xs opacity-70">${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        li.addEventListener('click', () => loadRouteFromHistory(item));
        historyList.appendChild(li);
      });
    } catch (e) {
      console.error('Failed to update history dropdown:', e);
    }
  }

  async function loadRouteFromHistory(item) {
    try {
      startInput.value = item.startName || '';
      startInput.dataset.lat = item.start.lat;
      startInput.dataset.lon = item.start.lon;
      endInput.value = item.endName || '';
      endInput.dataset.lat = item.end.lat;
      endInput.dataset.lon = item.end.lon;
      historyDropdown.classList.add('hidden');
      await planRoute();
      toast('Route loaded from history', 'success');
    } catch (e) {
      toast('Failed to load route from history', 'danger');
    }
  }

  historyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateHistoryDropdown();
    const isHidden = historyDropdown.classList.contains('hidden');
    historyDropdown.classList.toggle('hidden');
    
    if (!isHidden) {
      // When opening, position dropdown using fixed positioning
      const rect = historyBtn.getBoundingClientRect();
      historyDropdown.style.position = 'fixed';
      historyDropdown.style.top = `${rect.bottom + 4}px`;
      historyDropdown.style.left = `${rect.left}px`;
      historyDropdown.style.width = `${rect.width}px`;
      historyDropdown.style.right = 'auto';
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all route history?')) {
      localStorage.removeItem(HISTORY_KEY);
      updateHistoryDropdown();
      toast('History cleared', 'success');
    }
  });

  document.addEventListener('click', (e) => {
    if (!historyBtn.contains(e.target) && !historyDropdown.contains(e.target)) {
      historyDropdown.classList.add('hidden');
    }
  });

  // Share Route via URL
  function encodeRouteToUrl() {
    if (!lastRoute || !lastStartInput || !lastEndInput) return null;
    try {
      const data = {
        start: { name: lastStartInput, lat: parseFloat(startInput.dataset.lat), lon: parseFloat(startInput.dataset.lon) },
        end: { name: lastEndInput, lat: parseFloat(endInput.dataset.lat), lon: parseFloat(endInput.dataset.lon) }
      };
      const encoded = btoa(JSON.stringify(data));
      return `${window.location.origin}${window.location.pathname}#route=${encoded}`;
    } catch (e) {
      console.error('Failed to encode route:', e);
      return null;
    }
  }

  function loadRouteFromUrl() {
    try {
      const hash = window.location.hash;
      if (!hash.startsWith('#route=')) return;
      const encoded = hash.substring(7);
      const data = JSON.parse(atob(encoded));
      if (data.start && data.end) {
        startInput.value = data.start.name || '';
        startInput.dataset.lat = data.start.lat;
        startInput.dataset.lon = data.start.lon;
        endInput.value = data.end.name || '';
        endInput.dataset.lat = data.end.lat;
        endInput.dataset.lon = data.end.lon;
        planRoute();
      }
    } catch (e) {
      console.error('Failed to load route from URL:', e);
    }
  }

  shareBtn.addEventListener('click', () => {
    const url = encodeRouteToUrl();
    if (!url) {
      toast('No route to share', 'warning');
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      toast('Route link copied to clipboard!', 'success');
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast('Route link copied to clipboard!', 'success');
    });
  });

  // Fullscreen Map Toggle
  fullscreenBtn.addEventListener('click', () => {
    const mapContainer = document.getElementById('map');
    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().catch(err => {
        toast('Unable to enter fullscreen', 'warning');
      });
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.innerHTML = document.fullscreenElement 
      ? '<span>✕</span> <span>Exit Fullscreen</span>'
      : '<span>⛶</span> <span>Fullscreen</span>';
  });

  // Offline Support
  const offlineIndicator = document.getElementById('offlineIndicator');
  
  function updateOfflineStatus() {
    if (!navigator.onLine) {
      if (offlineIndicator) offlineIndicator.classList.remove('hidden');
      toast('You are offline. Using cached data.', 'warning');
    } else {
      if (offlineIndicator) offlineIndicator.classList.add('hidden');
    }
  }
  
  window.addEventListener('online', () => {
    updateOfflineStatus();
    toast('Connection restored!', 'success');
  });
  
  window.addEventListener('offline', () => {
    updateOfflineStatus();
  });
  
  // Enhanced Route Caching with Full Data
  const OFFLINE_ROUTES_KEY = 'offline_routes';
  
  function saveRouteForOffline(route, weather, envData) {
    try {
      const offlineRoutes = JSON.parse(localStorage.getItem(OFFLINE_ROUTES_KEY) || '[]');
      const routeData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        route: route,
        weather: weather,
        environmental: envData,
        startName: lastStartInput,
        endName: lastEndInput,
        start: { lat: parseFloat(startInput.dataset.lat), lon: parseFloat(startInput.dataset.lon) },
        end: { lat: parseFloat(endInput.dataset.lat), lon: parseFloat(endInput.dataset.lon) }
      };
      
      offlineRoutes.unshift(routeData);
      // Keep last 20 offline routes
      const trimmed = offlineRoutes.slice(0, 20);
      localStorage.setItem(OFFLINE_ROUTES_KEY, JSON.stringify(trimmed));
      
      toast('Route saved for offline access', 'success');
    } catch (e) {
      console.error('Failed to save route for offline:', e);
    }
  }
  
  function loadOfflineRoute(routeData) {
    try {
      startInput.value = routeData.startName || '';
      startInput.dataset.lat = routeData.start.lat;
      startInput.dataset.lon = routeData.start.lon;
      endInput.value = routeData.endName || '';
      endInput.dataset.lat = routeData.end.lat;
      endInput.dataset.lon = routeData.end.lon;
      
      lastRoute = routeData.route;
      lastWeather = routeData.weather;
      
      renderRoute(routeData.route);
      if (routeData.weather) {
        renderWeather(routeData.route, routeData.weather, []);
      }
      if (routeData.environmental) {
        renderEnvironmentalData(routeData.environmental);
      }
      
      toast('Offline route loaded', 'success');
    } catch (e) {
      toast('Failed to load offline route', 'danger');
    }
  }
  
  // Load and display offline routes
  const offlineRoutesList = document.getElementById('offlineRoutesList');
  
  function loadOfflineRoutes() {
    if (!offlineRoutesList) return;
    try {
      const routes = JSON.parse(localStorage.getItem(OFFLINE_ROUTES_KEY) || '[]');
      offlineRoutesList.innerHTML = '';
      
      if (routes.length === 0) {
        offlineRoutesList.innerHTML = '<div class="text-center small-text p-3" style="color: var(--text-secondary);">No offline routes saved</div>';
        return;
      }
      
      routes.forEach(routeData => {
        const card = document.createElement('div');
        card.className = 'p-3 rounded-lg cursor-pointer transition-all hover:shadow-lg mb-2';
        card.style.border = '1px solid var(--border)';
        card.style.background = 'var(--surface)';
        card.addEventListener('click', () => loadOfflineRoute(routeData));
        
        const date = new Date(routeData.timestamp);
        card.innerHTML = `
          <div class="font-semibold text-sm mb-1">${escapeHtml(routeData.startName || 'Unknown')} → ${escapeHtml(routeData.endName || 'Unknown')}</div>
          <div class="text-xs mb-1" style="color: var(--text-secondary);">
            ${routeData.route.distanceText} · ${routeData.route.durationText}
          </div>
          <div class="text-xs" style="color: var(--text-secondary);">
            Saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        `;
        offlineRoutesList.appendChild(card);
      });
    } catch (e) {
      console.error('Failed to load offline routes:', e);
      if (offlineRoutesList) {
        offlineRoutesList.innerHTML = '<div class="text-center small-text p-3" style="color: var(--text-secondary);">Error loading routes</div>';
      }
    }
  }
  
  // Weather Forecast Pre-fetching
  const FORECAST_CACHE_KEY = 'forecast_cache';
  
  function cacheForecast(forecastData, location) {
    try {
      const cache = JSON.parse(localStorage.getItem(FORECAST_CACHE_KEY) || '{}');
      const key = `${location.lat.toFixed(2)}_${location.lon.toFixed(2)}`;
      cache[key] = {
        forecast: forecastData,
        timestamp: Date.now(),
        expires: Date.now() + (3 * 60 * 60 * 1000) // 3 hours
      };
      localStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to cache forecast:', e);
    }
  }
  
  function getCachedForecast(location) {
    try {
      const cache = JSON.parse(localStorage.getItem(FORECAST_CACHE_KEY) || '{}');
      const key = `${location.lat.toFixed(2)}_${location.lon.toFixed(2)}`;
      const cached = cache[key];
      
      if (cached && cached.expires > Date.now()) {
        return cached.forecast;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  
  // Map Tile Caching (using IndexedDB)
  let tileDB = null;
  
  function initTileCache() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('mapTiles', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        tileDB = request.result;
        resolve(tileDB);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('tiles')) {
          const store = db.createObjectStore('tiles', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  function cacheMapTile(tileUrl, tileData) {
    if (!tileDB) return;
    try {
      const transaction = tileDB.transaction(['tiles'], 'readwrite');
      const store = transaction.objectStore('tiles');
      store.put({
        key: tileUrl,
        data: tileData,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error('Failed to cache tile:', e);
    }
  }
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/static/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
    
    // Initialize tile cache
    initTileCache().catch(err => console.error('Tile cache init failed:', err));
  }
  
  // Initialize on page load
  window.addEventListener('load', () => {
    updateHistoryDropdown();
    updateOfflineStatus();
    loadOfflineRoutes();
    setTimeout(loadRouteFromUrl, 500);
  });

  // Route flow
  routeBtn.addEventListener('click', () => planRoute());
  async function planRoute() {
    try {
      const start = getLatLonFromInput(startInput);
      const end = getLatLonFromInput(endInput);
      if (!start || !end) return toast('Please select both start and destination', 'warning');

      setLoading(true);
      const routeRes = await fetch(`/api/route?start=${start.lat},${start.lon}&end=${end.lat},${end.lon}`);
      const route = await routeRes.json();
      if (!routeRes.ok) throw new Error(route.error || 'Route error');
      lastRoute = route;
      renderRoute(route);

      // Fetch environmental data
      const envRes = await fetch('/api/environmental', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ distance: route.distance, duration: route.duration }) 
      });
      if (envRes.ok) {
        const envData = await envRes.json();
        renderEnvironmentalData(envData);
        // Track carbon footprint
        trackCarbonFootprint(envData);
        // Save route for offline access
        if (hasWeather && lastWeather) {
          saveRouteForOffline(route, lastWeather, envData);
        }
      }

      if (hasWeather) {
        const weatherRes = await fetch('/api/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkpoints: route.checkpoints }) });
        const w = await weatherRes.json();
        if (!weatherRes.ok) throw new Error(w.error || 'Weather error');
        lastWeather = w.weather;
        renderWeather(route, w.weather, w.alerts || []);
        // Add pollution heatmap
        addPollutionHeatmap(w.weather);
        
        // Cache weather patterns
        cacheWeatherPatterns(w.weather);
        
        // Generate personalized recommendations
        generateRecommendations(route, w.weather, w.alerts || []);
        
        // Generate enhanced environmental alerts
        generateEnhancedAlerts(route, w.weather, w.alerts || []);

        // Fetch forecast
        const forecastRes = await fetch('/api/forecast', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ checkpoints: route.checkpoints }) 
        });
        if (forecastRes.ok) {
          const forecastData = await forecastRes.json();
          renderForecastTimeline(forecastData.forecast || []);
        }
      } else {
        lastWeather = null;
        sunInfo.textContent = 'Sunrise: - | Sunset: -';
        weatherList.innerHTML = '';
        setSafetyBadge([]);
        document.getElementById('forecastTimeline').innerHTML = '<div class="text-center small-text" style="color: var(--text-secondary);">Weather API key required</div>';
      }

      // Save to history
      lastStartInput = startInput.value;
      lastEndInput = endInput.value;
      saveRouteToHistory(route, lastStartInput, lastEndInput);
      
      // Update URL with route
      const shareUrl = encodeRouteToUrl();
      if (shareUrl) {
        window.history.replaceState(null, '', shareUrl);
      }

      toast('Route loaded successfully', 'success');
    } catch (e) {
      console.error(e);
      toast(String(e.message || e), 'danger');
    } finally {
      setLoading(false);
    }
  }

  function getLatLonFromInput(el) {
    const lat = parseFloat(el.dataset.lat || '');
    const lon = parseFloat(el.dataset.lon || '');
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  }

  function renderRoute(route) {
    distanceOut.textContent = route.distanceText || '-';
    durationOut.textContent = route.durationText || '-';
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    checkpointMarkers.forEach(m => map.removeLayer(m));
    checkpointMarkers = [];

    const latlngs = (route.geometry.coordinates || []).map(([lon, lat]) => [lat, lon]);
    const primaryColor = getCSSVariable('--primary');
    routeLine = L.polyline(latlngs, { color: primaryColor, weight: 5, opacity: .85 }).addTo(map);
    try { map.fitBounds(routeLine.getBounds(), { padding: [30, 30] }); } catch {}
  }

  function renderWeather(route, weather, alerts) {
    // Sun info from first item with sys
    if (weather && weather.length) {
      const first = weather[0];
      if (first.sunrise && first.sunset) {
        const rs = tsToLocal(first.sunrise), ss = tsToLocal(first.sunset);
        sunInfo.textContent = `Sunrise: ${rs} | Sunset: ${ss}`;
      }
    }

    // Safety badge
    setSafetyBadge(alerts);

    // Markers
    checkpointMarkers.forEach(m => map.removeLayer(m));
    checkpointMarkers = [];
    const byIndex = new Map(weather.map(w => [w.index, w]));
    route.checkpoints.forEach((cp, i) => {
      const w = byIndex.get(cp.index);
      const icon = L.divIcon({ className: 'marker-drop', html: markerHtml(w), iconSize: [34, 34], iconAnchor: [17, 34] });
      const marker = L.marker([cp.lat, cp.lon], { icon }).addTo(map);
      const popupHtml = popupFor(w, cp);
      marker.bindPopup(popupHtml);
      checkpointMarkers.push(marker);
    });

    // Weather list panel
    weatherList.innerHTML = '';
    weather.sort((a, b) => a.index - b.index).forEach(w => {
      weatherList.appendChild(renderWeatherCard(w));
    });

    // Charts
    const labels = weather.map(w => `#${w.index}`);
    tempChart.data.labels = labels;
    tempChart.data.datasets[0].data = weather.map(w => w.temp);
    tempChart.update();
    windChart.data.labels = labels;
    windChart.data.datasets[0].data = weather.map(w => w.wind);
    windChart.update();
  }

  function markerHtml(w) {
    if (!w) return `<div class="w-8 h-8 rounded-full" style="background: var(--border); border: 1px solid var(--surface);"></div>`;
    const url = `https://openweathermap.org/img/wn/${w.icon || '01d'}@2x.png`;
    const primaryColor = getCSSVariable('--primary');
    return `<div class="relative">
      <img src="${url}" class="w-9 h-9 -mt-2 -ml-2" alt="icon"/>
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8" style="border-top-color: ${primaryColor};"></div>
    </div>`;
  }

  function popupFor(w, cp) {
    if (!w) return `<div class="p-1 text-sm">No weather</div>`;
    const aqiHtml = w.aqi ? `<div>AQI: <b>${w.aqi_level || w.aqi}</b></div>` : '';
    const uvHtml = w.uv_index !== undefined ? `<div>UV Index: <b>${fmt(w.uv_index)}</b></div>` : '';
    return `<div class="text-sm"><div class="font-semibold mb-1">Checkpoint #${cp.index}${w.city ? ' · ' + escapeHtml(w.city) : ''}</div>
      <div class="grid grid-cols-2 gap-2">
        <div>Temp: <b>${fmt(w.temp)}°C</b></div>
        <div>Wind: <b>${fmt(w.wind)} m/s</b></div>
        <div>Humidity: <b>${fmt(w.humidity)}%</b></div>
        <div>Cond: <b>${escapeHtml(w.condition || '-') }</b></div>
        ${uvHtml}
        ${aqiHtml}
      </div></div>`;
  }

  function renderWeatherCard(w) {
    const li = document.createElement('div');
    li.className = 'glass-card rounded-xl p-3';
    const iconUrl = `https://openweathermap.org/img/wn/${w.icon || '01d'}@2x.png`;
    
    // AQI badge
    let aqiBadge = '';
    if (w.aqi) {
      const aqiColors = {1: '#10b981', 2: '#84cc16', 3: '#f59e0b', 4: '#ef4444', 5: '#991b1b'};
      const aqiColor = aqiColors[w.aqi] || '#6b7280';
      aqiBadge = `<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style="background: ${aqiColor}20; color: ${aqiColor};">
        <span>🌬️</span> <span>AQI: ${w.aqi_level || w.aqi}</span>
      </div>`;
    }
    
    // UV Index badge
    let uvBadge = '';
    if (w.uv_index !== undefined) {
      let uvColor = '#10b981';
      let uvText = 'Low';
      if (w.uv_index >= 8) { uvColor = '#991b1b'; uvText = 'Very High'; }
      else if (w.uv_index >= 6) { uvColor = '#ef4444'; uvText = 'High'; }
      else if (w.uv_index >= 3) { uvColor = '#f59e0b'; uvText = 'Moderate'; }
      uvBadge = `<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style="background: ${uvColor}20; color: ${uvColor};">
        <span>☀️</span> <span>UV: ${fmt(w.uv_index)} (${uvText})</span>
      </div>`;
    }
    
    li.innerHTML = `<div class="flex items-center gap-3">
      <img src="${iconUrl}" class="w-10 h-10" alt="icon"/>
      <div class="flex-1">
        <div class="text-sm font-semibold">#${w.index} ${w.city ? '· ' + escapeHtml(w.city) : ''}</div>
        <div class="text-xs" style="color: var(--text-secondary);">${escapeHtml(w.description || '-') }</div>
        <div class="flex gap-2 mt-1 flex-wrap">
          ${aqiBadge}
          ${uvBadge}
        </div>
      </div>
      <div class="text-right">
        <div class="text-sm font-semibold">${fmt(w.temp)}°C</div>
        <div class="text-xs" style="color: var(--text-secondary);">${fmt(w.wind)} m/s · ${fmt(w.humidity)}%</div>
      </div>
    </div>`;
    return li;
  }

  function renderEnvironmentalData(data) {
    const envScoreEl = document.getElementById('envScoreValue');
    const envScoreBar = document.getElementById('envScoreBar');
    const co2El = document.getElementById('co2Emissions');
    const fuelEl = document.getElementById('fuelUsed');
    const treesEl = document.getElementById('treesOffset');

    if (envScoreEl) {
      envScoreEl.textContent = `${data.environmental_score || 0}/100`;
      if (envScoreBar) {
        envScoreBar.style.width = `${data.environmental_score || 0}%`;
      }
    }
    if (co2El) {
      co2El.textContent = `${data.co2_emissions_kg || 0} kg`;
    }
    if (fuelEl) {
      fuelEl.textContent = `${data.fuel_consumption_liters || 0} L`;
    }
    if (treesEl) {
      treesEl.textContent = `${data.trees_to_offset || 0}`;
    }
  }

  function renderForecastTimeline(forecast) {
    const timelineEl = document.getElementById('forecastTimeline');
    if (!timelineEl || !forecast || forecast.length === 0) {
      if (timelineEl) {
        timelineEl.innerHTML = '<div class="text-center small-text" style="color: var(--text-secondary);">No forecast data</div>';
      }
      return;
    }

    timelineEl.innerHTML = '';
    forecast.forEach(item => {
      const date = new Date(item.dt * 1000);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const iconUrl = `https://openweathermap.org/img/wn/${item.icon || '01d'}@2x.png`;
      
      const card = document.createElement('div');
      card.className = 'flex items-center gap-3 p-2 rounded-lg';
      card.style.background = 'var(--surface)';
      card.style.border = '1px solid var(--border)';
      
      card.innerHTML = `
        <div class="text-xs font-semibold" style="min-width: 50px; color: var(--text-secondary);">${timeStr}</div>
        <img src="${iconUrl}" class="w-8 h-8" alt="icon"/>
        <div class="flex-1">
          <div class="text-sm font-semibold">${fmt(item.temp)}°C</div>
          <div class="text-xs" style="color: var(--text-secondary);">${escapeHtml(item.description || '')}</div>
        </div>
        <div class="text-right text-xs" style="color: var(--text-secondary);">
          <div>💨 ${fmt(item.wind)} m/s</div>
          ${item.precipitation > 0 ? `<div>🌧️ ${fmt(item.precipitation)}mm</div>` : ''}
        </div>
      `;
      timelineEl.appendChild(card);
    });
  }

  function setSafetyBadge(alerts) {
    const baseClasses = 'inline-flex items-center justify-center small-text mt-1 px-2 py-1 rounded-full';
    if (!alerts || !alerts.length) {
      safetyBadge.textContent = 'OK';
      safetyBadge.className = baseClasses;
      safetyBadge.style.background = 'var(--surface)';
      safetyBadge.style.color = 'var(--text)';
      safetyBadge.style.border = '1px solid var(--border)';
      return;
    }
    const worst = alerts.find(a => a.type === 'danger') || alerts[0];
    if (worst.type === 'danger') {
      safetyBadge.textContent = 'Storm Risk';
      safetyBadge.className = baseClasses;
      safetyBadge.style.background = 'rgba(239, 68, 68, 0.1)';
      safetyBadge.style.color = '#ef4444';
      safetyBadge.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    } else {
      safetyBadge.textContent = 'Rain Expected';
      safetyBadge.className = baseClasses;
      safetyBadge.style.background = 'rgba(251, 191, 36, 0.1)';
      safetyBadge.style.color = '#fbbf24';
      safetyBadge.style.border = '1px solid rgba(251, 191, 36, 0.3)';
    }
  }

  function tsToLocal(ts) {
    try { return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '-'; }
  }
  function fmt(v) { return (v === null || v === undefined) ? '-' : Math.round(v * 10) / 10; }
  function escapeHtml(s) { return String(s).replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // Cache Weather Patterns
  const WEATHER_CACHE_KEY = 'weather_patterns_cache';
  
  function cacheWeatherPatterns(weather) {
    try {
      const cache = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || '{}');
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0];
      
      if (!cache[dateKey]) cache[dateKey] = [];
      cache[dateKey].push({
        timestamp: now.toISOString(),
        patterns: weather.map(w => ({
          condition: w.condition,
          temp: w.temp,
          aqi: w.aqi,
          uv_index: w.uv_index
        }))
      });
      
      // Keep only last 30 days
      const keys = Object.keys(cache).sort().reverse().slice(0, 30);
      const newCache = {};
      keys.forEach(k => newCache[k] = cache[k]);
      
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(newCache));
    } catch (e) {
      console.error('Failed to cache weather patterns:', e);
    }
  }

  // Generate Personalized Recommendations
  function generateRecommendations(route, weather, alerts) {
    if (!recommendationsPanel || !recommendationsList) return;
    
    const prefs = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
    const recommendations = [];
    
    // Check preferences and generate recommendations
    if (prefs.avoidRain) {
      const hasRain = weather.some(w => w.condition && ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.condition));
      if (hasRain) {
        recommendations.push({
          icon: '🌧️',
          type: 'warning',
          title: 'Rain Detected',
          message: 'Your route passes through rainy areas. Consider using the "Best Time" feature to find a better travel window.',
          action: 'bestTime'
        });
      }
    }
    
    if (prefs.avoidPollution) {
      const highPollution = weather.filter(w => w.aqi && w.aqi >= 4);
      if (highPollution.length > 0) {
        recommendations.push({
          icon: '🌬️',
          type: 'danger',
          title: 'High Pollution Zones',
          message: `${highPollution.length} checkpoint(s) have poor air quality. Consider using route comparison to find cleaner alternatives.`,
          action: 'compare'
        });
      }
    }
    
    if (prefs.ecoFriendly) {
      const distanceKm = route.distance / 1000;
      if (distanceKm > 50) {
        recommendations.push({
          icon: '🌱',
          type: 'info',
          title: 'Long Route Detected',
          message: `This route is ${distanceKm.toFixed(1)}km long. Consider route comparison to find more eco-friendly alternatives.`,
          action: 'compare'
        });
      }
    }
    
    // UV Index recommendations
    const highUV = weather.filter(w => w.uv_index && w.uv_index >= 6);
    if (highUV.length > 0) {
      recommendations.push({
        icon: '☀️',
        type: 'warning',
        title: 'High UV Exposure',
        message: `UV index is high at ${highUV.length} checkpoint(s). Remember to use sunscreen and protective clothing.`,
        action: null
      });
    }
    
    // Display recommendations
    if (recommendations.length > 0) {
      recommendationsPanel.classList.remove('hidden');
      recommendationsList.innerHTML = '';
      recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'p-3 rounded-lg text-sm';
        const bgColor = rec.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : rec.type === 'warning' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        const borderColor = rec.type === 'danger' ? 'rgba(239, 68, 68, 0.3)' : rec.type === 'warning' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(59, 130, 246, 0.3)';
        card.style.background = bgColor;
        card.style.border = `1px solid ${borderColor}`;
        
        card.innerHTML = `
          <div class="flex items-start gap-2">
            <span class="text-lg">${rec.icon}</span>
            <div class="flex-1">
              <div class="font-semibold mb-1">${escapeHtml(rec.title)}</div>
              <div class="text-xs" style="color: var(--text-secondary);">${escapeHtml(rec.message)}</div>
              ${rec.action ? `<button class="mt-2 text-xs px-2 py-1 rounded" style="background: var(--primary); color: white;" onclick="handleRecommendationAction('${rec.action}')">Take Action</button>` : ''}
            </div>
          </div>
        `;
        recommendationsList.appendChild(card);
      });
    } else {
      recommendationsPanel.classList.add('hidden');
    }
  }

  // Handle recommendation actions
  window.handleRecommendationAction = function(action) {
    if (action === 'compare') {
      compareRoutesBtn?.click();
    } else if (action === 'bestTime') {
      bestTimeBtn?.click();
    }
  };

  // Generate Enhanced Environmental Alerts
  function generateEnhancedAlerts(route, weather, alerts) {
    if (!envAlertsPanel || !envAlertsList) return;
    
    const enhancedAlerts = [];
    
    // Analyze weather data for comprehensive alerts
    const highPollutionCount = weather.filter(w => w.aqi && w.aqi >= 4).length;
    const rainCount = weather.filter(w => w.condition && ['Rain', 'Drizzle'].includes(w.condition)).length;
    const stormCount = weather.filter(w => w.condition && ['Thunderstorm'].includes(w.condition)).length;
    const highUVCount = weather.filter(w => w.uv_index && w.uv_index >= 8).length;
    const lowVisibilityCount = weather.filter(w => w.visibility && w.visibility < 1).length;
    
    // Generate summary alerts
    if (highPollutionCount > 0) {
      enhancedAlerts.push({
        severity: 'high',
        icon: '🌬️',
        title: 'Air Quality Alert',
        summary: `${highPollutionCount} area(s) along your route have poor air quality (AQI 4-5).`,
        recommendation: 'Consider wearing a mask if you have respiratory sensitivities. Use route comparison to find cleaner alternatives.',
        affectedAreas: highPollutionCount
      });
    }
    
    if (stormCount > 0) {
      enhancedAlerts.push({
        severity: 'critical',
        icon: '⛈️',
        title: 'Severe Weather Warning',
        summary: `Thunderstorms detected at ${stormCount} checkpoint(s).`,
        recommendation: 'Postpone travel if possible. If you must travel, drive slowly and be prepared for reduced visibility.',
        affectedAreas: stormCount
      });
    } else if (rainCount > 0) {
      enhancedAlerts.push({
        severity: 'moderate',
        icon: '🌧️',
        title: 'Rain Advisory',
        summary: `Rain expected at ${rainCount} checkpoint(s) along your route.`,
        recommendation: 'Allow extra travel time. Ensure windshield wipers are working. Reduce speed in wet conditions.',
        affectedAreas: rainCount
      });
    }
    
    if (highUVCount > 0) {
      enhancedAlerts.push({
        severity: 'moderate',
        icon: '☀️',
        title: 'High UV Index Warning',
        summary: `Very high UV levels (8+) detected at ${highUVCount} checkpoint(s).`,
        recommendation: 'Apply SPF 30+ sunscreen, wear sunglasses, and consider protective clothing. Limit sun exposure during peak hours.',
        affectedAreas: highUVCount
      });
    }
    
    if (lowVisibilityCount > 0) {
      enhancedAlerts.push({
        severity: 'high',
        icon: '🌫️',
        title: 'Low Visibility Alert',
        summary: `Poor visibility (<1km) at ${lowVisibilityCount} checkpoint(s).`,
        recommendation: 'Use headlights, reduce speed, and increase following distance. Consider delaying travel if visibility is extremely poor.',
        affectedAreas: lowVisibilityCount
      });
    }
    
    // Display alerts
    if (enhancedAlerts.length > 0) {
      envAlertsPanel.classList.remove('hidden');
      envAlertsList.innerHTML = '';
      enhancedAlerts.forEach(alert => {
        const card = document.createElement('div');
        card.className = 'p-3 rounded-lg';
        const severityColors = {
          critical: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#dc2626' },
          high: { bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)', text: '#ea580c' },
          moderate: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', text: '#d97706' }
        };
        const colors = severityColors[alert.severity] || severityColors.moderate;
        card.style.background = colors.bg;
        card.style.border = `1px solid ${colors.border}`;
        
        card.innerHTML = `
          <div class="flex items-start gap-2 mb-2">
            <span class="text-xl">${alert.icon}</span>
            <div class="flex-1">
              <div class="font-semibold text-sm mb-1" style="color: ${colors.text};">${escapeHtml(alert.title)}</div>
              <div class="text-xs mb-2" style="color: var(--text);">${escapeHtml(alert.summary)}</div>
              <div class="text-xs p-2 rounded" style="background: var(--surface); color: var(--text-secondary);">
                <strong>Recommendation:</strong> ${escapeHtml(alert.recommendation)}
              </div>
            </div>
          </div>
        `;
        envAlertsList.appendChild(card);
      });
    } else {
      envAlertsPanel.classList.add('hidden');
    }
  }

  function setLoading(isLoading) {
    routeBtn.disabled = isLoading;
    routeBtn.textContent = isLoading ? 'Loading…' : 'Get Route';
    if (isLoading) {
      weatherList.innerHTML = '';
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('div'); s.className = 'skeleton h-12'; s.style.margin = '.4rem 0'; weatherList.appendChild(s);
      }
    }
  }

  // Carbon Footprint Tracker
  const CARBON_TRACKER_KEY = 'carbon_footprint_tracker';
  
  function trackCarbonFootprint(envData) {
    try {
      const tracker = JSON.parse(localStorage.getItem(CARBON_TRACKER_KEY) || '{}');
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      if (!tracker.monthly) tracker.monthly = {};
      if (!tracker.monthly[monthKey]) {
        tracker.monthly[monthKey] = { co2: 0, routes: 0 };
      }
      
      tracker.monthly[monthKey].co2 += envData.co2_emissions_kg || 0;
      tracker.monthly[monthKey].routes += 1;
      
      if (!tracker.total) tracker.total = { co2: 0, routes: 0 };
      tracker.total.co2 += envData.co2_emissions_kg || 0;
      tracker.total.routes += 1;
      
      tracker.lastUpdated = now.toISOString();
      localStorage.setItem(CARBON_TRACKER_KEY, JSON.stringify(tracker));
      
      updateCarbonTracker();
      checkAchievements(tracker);
    } catch (e) {
      console.error('Failed to track carbon footprint:', e);
    }
  }

  function updateCarbonTracker() {
    try {
      const tracker = JSON.parse(localStorage.getItem(CARBON_TRACKER_KEY) || '{}');
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const monthly = tracker.monthly?.[monthKey] || { co2: 0, routes: 0 };
      const total = tracker.total || { co2: 0, routes: 0 };
      
      if (totalCo2Saved) {
        totalCo2Saved.textContent = `${total.co2.toFixed(1)} kg`;
      }
      if (routesThisMonth) {
        routesThisMonth.textContent = monthly.routes;
      }
    } catch (e) {
      console.error('Failed to update carbon tracker:', e);
    }
  }

  function checkAchievements(tracker) {
    const achievements = [];
    const total = tracker.total || { co2: 0, routes: 0 };
    
    if (total.routes >= 1) achievements.push({ icon: '🌱', text: 'First Route', color: '#10b981' });
    if (total.routes >= 10) achievements.push({ icon: '🌿', text: '10 Routes', color: '#84cc16' });
    if (total.routes >= 50) achievements.push({ icon: '🌳', text: '50 Routes', color: '#3b82f6' });
    if (total.co2 >= 100) achievements.push({ icon: '♻️', text: '100kg CO₂', color: '#f59e0b' });
    if (total.co2 >= 500) achievements.push({ icon: '🌍', text: '500kg CO₂', color: '#ef4444' });
    
    renderAchievements(achievements);
  }

  function renderAchievements(achievements) {
    if (!achievementBadges) return;
    achievementBadges.innerHTML = '';
    achievements.forEach(ach => {
      const badge = document.createElement('div');
      badge.className = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs';
      badge.style.background = `${ach.color}20`;
      badge.style.color = ach.color;
      badge.innerHTML = `<span>${ach.icon}</span><span>${ach.text}</span>`;
      achievementBadges.appendChild(badge);
    });
  }

  // Route Comparison
  compareRoutesBtn?.addEventListener('click', async () => {
    try {
      const start = getLatLonFromInput(startInput);
      const end = getLatLonFromInput(endInput);
      if (!start || !end) return toast('Please select both start and destination', 'warning');

      compareRoutesBtn.style.opacity = '0.6';
      compareRoutesBtn.style.pointerEvents = 'none';
      
      const res = await fetch('/api/route-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get alternatives');
      
      renderRouteComparison(data.alternatives || []);
      routeComparison.classList.remove('hidden');
      toast('Alternative routes found!', 'success');
    } catch (e) {
      toast(String(e.message || e), 'danger');
    } finally {
      compareRoutesBtn.style.opacity = '1';
      compareRoutesBtn.style.pointerEvents = 'auto';
    }
  });

  function renderRouteComparison(alternatives) {
    if (!routeComparison) return;
    routeComparison.innerHTML = '';
    
    if (alternatives.length === 0) {
      routeComparison.innerHTML = '<div class="text-center small-text" style="color: var(--text-secondary);">No alternatives found</div>';
      return;
    }

    alternatives.forEach((alt, idx) => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl cursor-pointer transition-all hover:shadow-lg';
      card.style.border = '2px solid var(--border)';
      card.style.background = 'var(--surface)';
      card.addEventListener('click', () => {
        loadAlternativeRoute(alt);
      });
      
      const isBest = idx === 0 || alt.co2_emissions_kg === Math.min(...alternatives.map(a => a.co2_emissions_kg));
      
      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold text-sm">Route ${idx + 1} ${isBest ? '🏆' : ''}</div>
          ${isBest ? '<span class="text-xs px-2 py-1 rounded-full" style="background: var(--primary); color: white;">Best</span>' : ''}
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs mb-2">
          <div><span style="color: var(--text-secondary);">Distance:</span> <strong>${alt.distanceText}</strong></div>
          <div><span style="color: var(--text-secondary);">Time:</span> <strong>${alt.durationText}</strong></div>
          <div><span style="color: var(--text-secondary);">CO₂:</span> <strong>${alt.co2_emissions_kg} kg</strong></div>
          <div><span style="color: var(--text-secondary);">Fuel:</span> <strong>${alt.fuel_liters} L</strong></div>
        </div>
        <div class="text-xs" style="color: var(--text-secondary);">Click to load</div>
      `;
      routeComparison.appendChild(card);
    });
  }

  function loadAlternativeRoute(alt) {
    // Render the alternative route on map
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    checkpointMarkers.forEach(m => map.removeLayer(m));
    checkpointMarkers = [];
    
    const latlngs = (alt.geometry.coordinates || []).map(([lon, lat]) => [lat, lon]);
    const primaryColor = getCSSVariable('--primary');
    routeLine = L.polyline(latlngs, { color: primaryColor, weight: 5, opacity: 0.85 }).addTo(map);
    try { map.fitBounds(routeLine.getBounds(), { padding: [30, 30] }); } catch {}
    
    distanceOut.textContent = alt.distanceText;
    durationOut.textContent = alt.durationText;
    
    // Update environmental data
    renderEnvironmentalData({
      co2_emissions_kg: alt.co2_emissions_kg,
      fuel_consumption_liters: alt.fuel_liters,
      environmental_score: 100 - (alt.distance / 1000 * 0.5),
      trees_to_offset: Math.max(1, Math.ceil(alt.co2_emissions_kg / 21))
    });
    
    toast('Alternative route loaded', 'success');
  }

  // Best Time to Travel
  bestTimeBtn?.addEventListener('click', async () => {
    try {
      if (!lastRoute || !lastRoute.checkpoints) {
        return toast('Please calculate a route first', 'warning');
      }

      bestTimeBtn.style.opacity = '0.6';
      bestTimeBtn.style.pointerEvents = 'none';
      
      const res = await fetch('/api/best-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpoints: lastRoute.checkpoints, hours_ahead: 24 })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to calculate best time');
      
      renderBestTimes(data.best_times || []);
      bestTimeResults.classList.remove('hidden');
      toast('Best travel times calculated!', 'success');
    } catch (e) {
      toast(String(e.message || e), 'danger');
    } finally {
      bestTimeBtn.style.opacity = '1';
      bestTimeBtn.style.pointerEvents = 'auto';
    }
  });

  function renderBestTimes(bestTimes) {
    if (!bestTimeResults) return;
    bestTimeResults.innerHTML = '';
    
    if (bestTimes.length === 0) {
      bestTimeResults.innerHTML = '<div class="text-center small-text" style="color: var(--text-secondary);">No optimal times found</div>';
      return;
    }

    bestTimes.forEach((bt, idx) => {
      const date = new Date(bt.dt * 1000);
      const timeStr = date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      
      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl';
      card.style.border = idx === 0 ? '2px solid var(--primary)' : '1px solid var(--border)';
      card.style.background = 'var(--surface)';
      
      const scoreColor = bt.score >= 70 ? '#10b981' : bt.score >= 50 ? '#f59e0b' : '#ef4444';
      
      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold text-sm">${timeStr}</div>
          <div class="text-xs px-2 py-1 rounded-full" style="background: ${scoreColor}20; color: ${scoreColor};">
            ${bt.score}/100
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs" style="color: var(--text-secondary);">
          <div>Temp: <strong style="color: var(--text);">${fmt(bt.temp)}°C</strong></div>
          <div>Wind: <strong style="color: var(--text);">${fmt(bt.wind)} m/s</strong></div>
          <div>Condition: <strong style="color: var(--text);">${escapeHtml(bt.condition)}</strong></div>
          ${bt.rain > 0 ? `<div>Rain: <strong style="color: var(--text);">${fmt(bt.rain)}mm</strong></div>` : '<div>Rain: <strong style="color: var(--text);">None</strong></div>'}
        </div>
      `;
      bestTimeResults.appendChild(card);
    });
  }

  // Initialize carbon tracker on load
  window.addEventListener('load', () => {
    updateCarbonTracker();
    const tracker = JSON.parse(localStorage.getItem(CARBON_TRACKER_KEY) || '{}');
    checkAchievements(tracker);
  });

  // Pollution Heatmap (simplified - using AQI data)
  function addPollutionHeatmap(weather) {
    // Remove existing heatmap if any
    if (window.pollutionLayer) {
      map.removeLayer(window.pollutionLayer);
    }
    
    if (!weather || weather.length === 0) return;
    
    // Create heatmap data from AQI
    const heatmapData = weather
      .filter(w => w.aqi && w.lat && w.lon)
      .map(w => {
        const intensity = w.aqi === 1 ? 0.2 : w.aqi === 2 ? 0.4 : w.aqi === 3 ? 0.6 : w.aqi === 4 ? 0.8 : 1.0;
        return [w.lat, w.lon, intensity];
      });
    
    if (heatmapData.length > 0) {
      // Create circle markers with opacity based on AQI
      const markers = L.layerGroup();
      heatmapData.forEach(([lat, lon, intensity]) => {
        const color = intensity < 0.4 ? '#10b981' : intensity < 0.6 ? '#f59e0b' : '#ef4444';
        L.circleMarker([lat, lon], {
          radius: 15,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0.6,
          fillOpacity: intensity * 0.5
        }).addTo(markers);
      });
      markers.addTo(map);
      window.pollutionLayer = markers;
    }
  }

  // Clear
  clearBtn.addEventListener('click', () => {
    lastRoute = null; lastWeather = null;
    lastStartInput = null; lastEndInput = null;
    distanceOut.textContent = '-';
    durationOut.textContent = '-';
    sunInfo.textContent = 'Sunrise: - | Sunset: -';
    setSafetyBadge([]);
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    checkpointMarkers.forEach(m => map.removeLayer(m));
    checkpointMarkers = [];
    tempChart.data.labels = []; tempChart.data.datasets[0].data = []; tempChart.update();
    windChart.data.labels = []; windChart.data.datasets[0].data = []; windChart.update();
    weatherList.innerHTML = '';
    
    // Clear environmental data
    const envScoreEl = document.getElementById('envScoreValue');
    const envScoreBar = document.getElementById('envScoreBar');
    const co2El = document.getElementById('co2Emissions');
    const fuelEl = document.getElementById('fuelUsed');
    const treesEl = document.getElementById('treesOffset');
    if (envScoreEl) envScoreEl.textContent = '-';
    if (envScoreBar) envScoreBar.style.width = '0%';
    if (co2El) co2El.textContent = '-';
    if (fuelEl) fuelEl.textContent = '-';
    if (treesEl) treesEl.textContent = '-';
    
    // Clear forecast
    const forecastEl = document.getElementById('forecastTimeline');
    if (forecastEl) {
      forecastEl.innerHTML = '<div class="text-center small-text" style="color: var(--text-secondary);">No forecast data</div>';
    }
    
    // Clear route comparison and best time
    if (routeComparison) {
      routeComparison.classList.add('hidden');
      routeComparison.innerHTML = '';
    }
    if (bestTimeResults) {
      bestTimeResults.classList.add('hidden');
      bestTimeResults.innerHTML = '';
    }
    
    // Clear pollution heatmap
    if (window.pollutionLayer) {
      map.removeLayer(window.pollutionLayer);
      window.pollutionLayer = null;
    }
    
    // Clear recommendations and alerts
    if (recommendationsPanel) recommendationsPanel.classList.add('hidden');
    if (recommendationsList) recommendationsList.innerHTML = '';
    if (envAlertsPanel) envAlertsPanel.classList.add('hidden');
    if (envAlertsList) envAlertsList.innerHTML = '';
    
    // Clear URL hash
    window.history.replaceState(null, '', window.location.pathname);
    toast('Cleared route');
  });

  // Export PDF
  exportBtn.addEventListener('click', async () => {
    try {
      if (!lastRoute) return toast('No route to export', 'warning');
      const payload = { route: lastRoute, checkpoints: lastRoute.checkpoints, weather: lastWeather || [] };
      const r = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('Failed to generate report');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'route_report.pdf'; a.click();
      URL.revokeObjectURL(url);
      toast('Report downloaded', 'success');
    } catch (e) { toast(String(e.message || e), 'danger'); }
  });
})();



