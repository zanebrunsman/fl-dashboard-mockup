// FL Home Dashboard — interaction demo
// why: keeps every state-changing action behind a PIN, per standing order #9

(() => {
  // ---- Clock (drives topbar clock, sleep clock, camera timestamp) ----
  const tEl = document.getElementById('clockTime');
  const mEl = document.getElementById('clockMeridiem');
  const dEl = document.getElementById('clockDate');
  const stEl = document.getElementById('sleepClockTime');
  const smEl = document.getElementById('sleepClockMer');
  const sdEl = document.getElementById('sleepClockDate');
  function tick() {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const mer = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const time = `${h}:${m}`;
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).replace(',', ' ·');
    if (tEl) tEl.textContent = time;
    if (mEl) mEl.textContent = mer;
    if (dEl) dEl.textContent = dateStr;
    if (stEl) stEl.textContent = time;
    if (smEl) smEl.textContent = mer;
    if (sdEl) sdEl.textContent = dateStr;
    const camTime = document.getElementById('camTime');
    if (camTime) camTime.textContent = `${time} ${mer}`;
  }
  tick();
  setInterval(tick, 1000);

  // ---- View routing ----
  const views = document.querySelectorAll('[data-view]');
  function go(view) {
    views.forEach((v) => {
      v.hidden = v.dataset.view !== view;
    });
  }
  document.body.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl) {
      go(navEl.dataset.nav);
    }
  });

  // ---- Sleep mode toggle (DASH-6) ----
  // Tapping the bed icon on any topbar (or the 'Sleep now' button in Settings)
  // routes to the sleep view. While the sleep view is shown, tapping ANYWHERE
  // on the sleep view (not just the Wake button) returns to home.
  document.body.addEventListener('click', (e) => {
    const sleepView = document.querySelector('[data-view="sleep"]');
    const sleepShown = sleepView && !sleepView.hidden;
    // 1) Any click inside the sleep view wakes the dashboard
    if (sleepShown && sleepView.contains(e.target)) {
      e.preventDefault();
      go('home');
      return;
    }
    // 2) Otherwise, sleep-toggle buttons enter sleep mode
    const btn = e.target.closest('[data-sleep-toggle]');
    if (!btn) return;
    e.preventDefault();
    go(sleepShown ? 'home' : 'sleep');
  });

  // ---- Theme toggle ----
  const root = document.documentElement;
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
        b.innerHTML =
          next === 'dark'
            ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
            : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      });
    });
  });

  // ---- Camera switcher (Security view) ----
  const camView = document.getElementById('camView');
  const camTitle = document.getElementById('camTitle');
  const camNames = { front: 'Front door', drive: 'Driveway', back: 'Backyard', gar: 'Garage' };
  const camImages = { front: 'assets/cams/cam-front.png', drive: 'assets/cams/cam-drive.png', back: 'assets/cams/cam-back.png', gar: 'assets/cams/cam-garage.png' };
  document.querySelectorAll('.cam-rail__btn[data-cam]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const which = btn.dataset.cam;
      if (camView) {
        camView.dataset.cam = which;
        camView.style.backgroundImage = `url('${camImages[which]}')`;
      }
      if (camTitle) camTitle.textContent = camNames[which] || '';
      document.querySelectorAll('.cam-rail__btn[data-cam]').forEach((b) =>
        b.classList.toggle('cam-rail__btn--active', b === btn)
      );
    });
  });

  // ---- PIN flow ----
  const pinModal = document.querySelector('[data-pin]');
  const pinDots = () => Array.from(pinModal.querySelectorAll('.pin__dot'));
  const pinSub = document.getElementById('pinSub');
  let pinBuf = '';
  let pinPending = null;

  function openPin(pending) {
    pinPending = pending;
    pinBuf = '';
    pinSub.textContent = pending.label;
    paintPin();
    pinModal.hidden = false;
  }
  function closePin() {
    pinModal.hidden = true;
    pinBuf = '';
    pinPending = null;
  }
  function paintPin() {
    pinDots().forEach((d, i) => d.classList.toggle('pin__dot--filled', i < pinBuf.length));
  }

  pinModal.addEventListener('click', (e) => {
    if (e.target === pinModal) closePin();
    const k = e.target.closest('[data-pin-key]');
    if (k) {
      if (pinBuf.length < 4) {
        pinBuf += k.dataset.pinKey;
        paintPin();
        if (pinBuf.length === 4) {
          // any PIN works in the mockup
          setTimeout(() => {
            const action = pinPending;
            closePin();
            if (action) action.run();
          }, 220);
        }
      }
    }
    if (e.target.closest('[data-pin-back]')) {
      pinBuf = pinBuf.slice(0, -1);
      paintPin();
    }
    if (e.target.closest('[data-pin-cancel]')) closePin();
  });

  // ---- Toast ----
  const toast = document.querySelector('[data-toast]');
  const toastText = document.querySelector('[data-toast-text]');
  let toastTimer;
  function showToast(msg) {
    clearTimeout(toastTimer);
    toastText.textContent = msg;
    toast.hidden = false;
    toastTimer = setTimeout(() => (toast.hidden = true), 1300);
  }

  // ---- Control actions ----
  document.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const act = btn.dataset.act;
      const target = btn.dataset.target;
      const card = document.querySelector(`[data-control="${target}"]`);
      const labelMap = {
        'front-door': 'front door',
        'back-door': 'back door',
        garage: 'garage door',
      };
      const friendly = labelMap[target] || target;
      const isUnlock = card.dataset.state === 'locked' || card.dataset.state === 'closed';
      const verb = isUnlock ? (target === 'garage' ? 'Open' : 'Unlock') : (target === 'garage' ? 'Close' : 'Lock');

      openPin({
        label: `Confirm: ${verb} ${friendly}`,
        run: () => {
          if (target === 'garage') {
            card.dataset.state = card.dataset.state === 'closed' ? 'open' : 'closed';
            card.querySelector('.control__state').textContent =
              card.dataset.state === 'closed' ? 'Closed · Just now' : 'Open · Just now';
            card.querySelector('.control__btn').textContent =
              card.dataset.state === 'closed' ? 'Open' : 'Close';
          } else {
            card.dataset.state = card.dataset.state === 'locked' ? 'unlocked' : 'locked';
            const battery = target === 'front-door' ? '87%' : '92%';
            card.querySelector('.control__state').textContent =
              `${card.dataset.state === 'locked' ? 'Locked' : 'Unlocked'} · Battery ${battery}`;
            card.querySelector('.control__btn').textContent =
              card.dataset.state === 'locked' ? 'Unlock' : 'Lock';
          }
          showToast(`${friendly[0].toUpperCase() + friendly.slice(1)} ${isUnlock ? (target === 'garage' ? 'opening' : 'unlocked') : (target === 'garage' ? 'closing' : 'locked')}`);
        },
      });
    });
  });

  // ---- Audio test ----
  document.querySelectorAll('[data-action="play-audio"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Playing test chime on Sonos + tablet');
    });
  });

  // ---- Media tab: source tabs (Sonos vs TV) ----
  function setMediaSource(src) {
    document.querySelectorAll('[data-src]').forEach((t) => {
      const active = t.dataset.src === src;
      t.classList.toggle('src-tab--active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const sonosPanel = document.querySelector('[data-player="sonos"]');
    const tvPanel = document.querySelector('[data-tv-panel]');
    const queueCard = document.querySelector('.media-side .card:first-child');
    if (src === 'tv') {
      if (sonosPanel) sonosPanel.hidden = true;
      if (tvPanel) tvPanel.hidden = false;
      // gate Up next on Sonos availability — TV has no queue
      if (queueCard) queueCard.classList.add('card--muted');
    } else {
      if (sonosPanel) sonosPanel.hidden = false;
      if (tvPanel) tvPanel.hidden = true;
      if (queueCard) queueCard.classList.remove('card--muted');
    }
  }
  document.querySelectorAll('[data-src]').forEach((tab) => {
    tab.addEventListener('click', () => {
      setMediaSource(tab.dataset.src);
      showToast(`Switched to ${tab.dataset.src === 'sonos' ? 'Sonos' : 'Living Room TV'}`);
    });
  });
  setMediaSource('sonos');

  // ---- Media tab: extra actions ----
  const mediaApps = {
    'open-sonos': 'Launching Sonos app…',
    'open-spotify': 'Launching Spotify…',
    'open-siriusxm': 'Launching SiriusXM…',
    'open-amazon-music': 'Launching Amazon Music…',
  };
  Object.entries(mediaApps).forEach(([action, msg]) => {
    document.querySelectorAll(`[data-action="${action}"]`).forEach((btn) => {
      btn.addEventListener('click', () => showToast(msg));
    });
  });
  document.querySelectorAll('[data-action="test-chime"]').forEach((btn) => {
    btn.addEventListener('click', () => showToast('Playing test chime on Sonos + tablet'));
  });

  // ---- LG C6H TV controls ----
  let tvOn = true;
  let tvVol = 24;
  let tvMuted = false;
  let tvInput = 'HDMI 1 · Apple TV';
  function syncTv() {
    const power = document.querySelector('[data-tv-power-state]');
    const volNum = document.querySelector('[data-tv-vol-num]');
    const volFill = document.querySelector('[data-tv-vol-fill]');
    const volKnob = document.querySelector('[data-tv-vol-knob]');
    const muteBtn = document.querySelector('[data-action="tv-mute"]');
    const inputLabel = document.querySelector('[data-tv-input-label]');
    if (power) power.textContent = tvOn ? 'Power off' : 'Power on';
    if (volNum) volNum.textContent = tvMuted ? 'Muted' : String(tvVol);
    if (volFill) volFill.style.width = (tvMuted ? 0 : tvVol) + '%';
    if (volKnob) volKnob.style.left = (tvMuted ? 0 : tvVol) + '%';
    if (muteBtn) muteBtn.classList.toggle('btn--on', tvMuted);
    if (inputLabel) inputLabel.textContent = tvInput;
  }
  document.querySelectorAll('[data-action="tv-power"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tvOn = !tvOn;
      syncTv();
      showToast(`TV ${tvOn ? 'on' : 'off'}`);
    });
  });
  document.querySelectorAll('[data-action="tv-vol-up"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tvMuted = false;
      tvVol = Math.min(100, tvVol + 2);
      syncTv();
    });
  });
  document.querySelectorAll('[data-action="tv-vol-down"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tvMuted = false;
      tvVol = Math.max(0, tvVol - 2);
      syncTv();
    });
  });
  document.querySelectorAll('[data-action="tv-mute"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tvMuted = !tvMuted;
      syncTv();
      showToast(tvMuted ? 'TV muted' : 'TV unmuted');
    });
  });
  document.querySelectorAll('[data-tv-input]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const label = btn.dataset.tvInput;
      tvInput = label;
      document.querySelectorAll('[data-tv-input]').forEach((b) =>
        b.classList.toggle('chip--on', b === btn)
      );
      syncTv();
      showToast(`Switched to ${label}`);
    });
  });
  syncTv();

  // ---- Settings: numeric steppers (lightning radius, re-alert cooldown) ----
  document.querySelectorAll('[data-stepper]').forEach((root) => {
    const valueEl = root.querySelector('[data-stepper-value]');
    const minus = root.querySelector('[data-stepper-minus]');
    const plus = root.querySelector('[data-stepper-plus]');
    const min = parseInt(root.dataset.min || '0', 10);
    const max = parseInt(root.dataset.max || '100', 10);
    const step = parseInt(root.dataset.step || '1', 10);
    const unit = root.dataset.unit || '';
    let v = parseInt(root.dataset.value || '0', 10);
    function paint() {
      if (valueEl) valueEl.textContent = `${v}${unit ? ' ' + unit : ''}`;
      if (minus) minus.disabled = v <= min;
      if (plus) plus.disabled = v >= max;
      root.dataset.value = String(v); // expose for listeners (radar lightning radius, etc.)
    }
    if (minus) minus.addEventListener('click', () => { v = Math.max(min, v - step); paint(); });
    if (plus) plus.addEventListener('click', () => { v = Math.min(max, v + step); paint(); });
    paint();
  });

  // ---- Radar (Leaflet + CARTO basemap + RainViewer overlay) ----
  // why: real map tiles + live RainViewer precipitation, far more useful than the
  //      stylized SVG. Lazy-inits on first weather-tab activation to keep boot light.
  const RADAR_HOME = [29.90, -81.31]; // Casa Cola Creek, St. Augustine
  const CARTO = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  };
  const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
  function fmtAge(ts) {
    const s = Math.max(0, Math.floor((Date.now() - ts * 1000) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ago`;
    return `${Math.floor(m / 60)} h ago`;
  }

  function createRadarMap(mapEl, opts) {
    if (!mapEl || !window.L) return null;
    const cfg = Object.assign({ defaultZoom: 11, center: RADAR_HOME, lightningRadiusMi: 12 }, opts || {});
    const map = L.map(mapEl, {
      center: cfg.center,
      zoom: cfg.defaultZoom,
      minZoom: 4,
      maxZoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    // basemap layer (swappable on theme change)
    let baseLayer = L.tileLayer(CARTO[currentTheme() === 'dark' ? 'dark' : 'light'], {
      subdomains: 'abcd', maxZoom: 19, attribution: CARTO_ATTR,
    }).addTo(map);

    function applyTheme(theme) {
      const target = theme === 'dark' ? 'dark' : 'light';
      const nextUrl = CARTO[target];
      if (baseLayer && baseLayer._url === nextUrl) return;
      const newLayer = L.tileLayer(nextUrl, { subdomains: 'abcd', maxZoom: 19, attribution: CARTO_ATTR });
      newLayer.addTo(map);
      if (baseLayer) map.removeLayer(baseLayer);
      baseLayer = newLayer;
    }

    // home marker
    const homeIcon = L.divIcon({
      className: 'radar-home-icon',
      html: '<span class="radar-home-dot"></span>',
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    L.marker(cfg.center, { icon: homeIcon, interactive: false }).addTo(map);

    // lightning radius ring (in meters; 1 mi = 1609.34 m)
    let ringLayer = L.circle(cfg.center, {
      radius: cfg.lightningRadiusMi * 1609.34,
      color: '#f5b942', weight: 2, opacity: 0.85,
      fillColor: '#f5b942', fillOpacity: 0.08,
      interactive: false,
    }).addTo(map);

    function setLightningRadius(mi) {
      if (!ringLayer) return;
      ringLayer.setRadius(mi * 1609.34);
    }

    // rainviewer overlay
    let rainLayer = null;
    let rainTimestamp = null;
    async function loadRain() {
      try {
        const r = await fetch(RAINVIEWER_API, { cache: 'no-store' });
        const j = await r.json();
        const radar = j.radar && j.radar.past && j.radar.past.length ? j.radar.past[j.radar.past.length - 1] : null;
        if (!radar) throw new Error('no radar frame');
        // RainViewer: /size/{z}/{x}/{y}/{color}/{options}.png
        // size 256, color 2 (universal blue), options 1_1 (smooth + snow)
        const url = `${j.host}${radar.path}/256/{z}/{x}/{y}/2/1_1.png`;
        // RainViewer's public free tier caps at z7 — above that it serves a 1.4 KB
        // "Zoom Level Not Supported" placeholder. Cap maxNativeZoom so Leaflet upscales
        // z7 tiles instead of requesting unsupported zooms.
        const next = L.tileLayer(url, {
          opacity: 0.65,
          attribution: 'RainViewer',
          maxNativeZoom: 7,
          maxZoom: 13,
          tileSize: 256,
        });
        next.addTo(map);
        if (rainLayer) map.removeLayer(rainLayer);
        rainLayer = next;
        rainTimestamp = radar.time;
        return radar.time;
      } catch (e) {
        return null;
      }
    }

    function reset() {
      map.setView(cfg.center, cfg.defaultZoom, { animate: true });
    }

    // resize hook: Leaflet must recompute size after parent unhides
    function invalidate() { setTimeout(() => map.invalidateSize(), 50); }

    return { map, applyTheme, setLightningRadius, loadRain, reset, invalidate, getTimestamp: () => rainTimestamp };
  }

  // Lazy initialize card-radar when weather tab is first shown
  let cardRadar = null;
  function ensureCardRadar() {
    if (cardRadar) { cardRadar.invalidate(); return cardRadar; }
    const el = document.getElementById('radar-map');
    if (!el || !window.L) return null;
    cardRadar = createRadarMap(el, { defaultZoom: 11 });
    refreshRadarTimestamp();
    cardRadar.loadRain().then(refreshRadarTimestamp);
    // re-fetch rainviewer every 5 minutes
    setInterval(() => cardRadar && cardRadar.loadRain().then(refreshRadarTimestamp), 5 * 60 * 1000);
    return cardRadar;
  }

  function refreshRadarTimestamp() {
    const ts = cardRadar && cardRadar.getTimestamp();
    const pill = document.querySelector('[data-radar-ts]');
    const ageEl = document.querySelector('[data-radar-age]');
    const errEl = document.querySelector('[data-radar-err]');
    if (!pill || !ageEl) return;
    if (!ts) {
      pill.hidden = true;
      if (errEl) errEl.hidden = false;
      return;
    }
    if (errEl) errEl.hidden = true;
    pill.hidden = false;
    ageEl.textContent = fmtAge(ts);
  }
  setInterval(refreshRadarTimestamp, 30 * 1000);

  // FS radar — same engine, different container
  let fsRadar = null;
  function ensureFsRadar() {
    if (fsRadar) { fsRadar.invalidate(); return fsRadar; }
    const el = document.getElementById('radar-map-fs');
    if (!el || !window.L) return null;
    fsRadar = createRadarMap(el, { defaultZoom: 7 }); // wider state-level view
    fsRadar.loadRain();
    return fsRadar;
  }

  // Hook: weather tab activation -> init card radar
  document.querySelectorAll('[data-nav="weather"]').forEach((btn) => {
    btn.addEventListener('click', () => setTimeout(ensureCardRadar, 50));
  });
  // If we ever land on weather tab directly, init immediately
  if (document.querySelector('[data-view="weather"]') && !document.querySelector('[data-view="weather"]').hidden) {
    setTimeout(ensureCardRadar, 50);
  }

  // Reset buttons (card + fs)
  document.querySelectorAll('[data-radar-action="reset"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fs = btn.dataset.radarTarget === 'fs';
      const r = fs ? ensureFsRadar() : ensureCardRadar();
      if (r) r.reset();
    });
  });

  // Expand to full-screen
  const fsEl = document.querySelector('[data-fsr]');
  document.querySelectorAll('[data-radar-action="expand"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!fsEl) return;
      fsEl.hidden = false;
      fsEl.setAttribute('aria-hidden', 'false');
      setTimeout(() => { const r = ensureFsRadar(); if (r) r.reset(); }, 80);
    });
  });

  // Close full-screen
  function closeFsr() {
    if (!fsEl) return;
    fsEl.hidden = true;
    fsEl.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('[data-fsr-close]').forEach((btn) => btn.addEventListener('click', closeFsr));
  if (fsEl) {
    fsEl.addEventListener('click', (e) => { if (e.target === fsEl) closeFsr(); });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fsEl && !fsEl.hidden) closeFsr();
  });

  // Theme change -> swap basemaps
  const themeObserver = new MutationObserver(() => {
    const t = currentTheme();
    if (cardRadar) cardRadar.applyTheme(t);
    if (fsRadar) fsRadar.applyTheme(t);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Lightning radius stepper -> resize ring
  const radiusStepper = document.querySelector('[data-stepper="lightning-radius"]');
  if (radiusStepper) {
    const observer = new MutationObserver(() => {
      const v = parseInt(radiusStepper.dataset.value || '12', 10);
      if (cardRadar) cardRadar.setLightningRadius(v);
      if (fsRadar) fsRadar.setLightningRadius(v);
    });
    observer.observe(radiusStepper, { attributes: true, attributeFilter: ['data-value'] });
    // also catch click-driven changes (stepper rewrites .stepper__value text)
    radiusStepper.addEventListener('click', () => {
      setTimeout(() => {
        const valEl = radiusStepper.querySelector('.stepper__value');
        if (!valEl) return;
        const mi = parseInt(valEl.textContent || '12', 10);
        if (!isNaN(mi)) {
          if (cardRadar) cardRadar.setLightningRadius(mi);
          if (fsRadar) fsRadar.setLightningRadius(mi);
        }
      }, 10);
    });
  }

  // ---- Lightning window toggle (10/30/60 min) ----
  const windowLabel = document.querySelector('[data-fsr-lightning-label]');
  document.querySelectorAll('[data-fsr-window]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-fsr-window]').forEach((b) =>
        b.classList.toggle('fsr__win-btn--active', b === btn)
      );
      const w = btn.dataset.fsrWindow;
      if (windowLabel) {
        windowLabel.textContent = w === '60'
          ? 'Lightning · last 1 hr'
          : `Lightning · last ${w} min`;
      }
    });
  });
})();
