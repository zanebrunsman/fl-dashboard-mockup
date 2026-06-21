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
    toastTimer = setTimeout(() => (toast.hidden = true), 2400);
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
    }
    if (minus) minus.addEventListener('click', () => { v = Math.max(min, v - step); paint(); });
    if (plus) plus.addEventListener('click', () => { v = Math.min(max, v + step); paint(); });
    paint();
  });

  // ---- Radar pan/zoom engine ----
  // why: lets dad zoom from neighborhood (4×) out to whole US (0.05×)
  //      with smooth pan, pinch on touch, wheel on desktop
  function createRadar(container, opts) {
    const svg = container.querySelector('[data-radar-svg], [data-radar-svg-fs]');
    const viewport = container.querySelector('[data-radar-viewport]');
    if (!svg || !viewport) return null;

    const vb = svg.viewBox.baseVal; // viewBox width/height in svg units
    const state = { scale: opts.defaultScale, tx: 0, ty: 0 };
    const minScale = opts.minScale;
    const maxScale = opts.maxScale;
    const isFs = opts.mode === 'fs';

    // Label groups for counter-scaling + threshold fade
    const labelGroups = Array.from(container.querySelectorAll('[data-radar-labels]'));
    // Capture each text element's design font-size so counter-scaling math is correct
    labelGroups.forEach((g) => {
      g.querySelectorAll('text').forEach((t) => {
        if (!t.dataset.baseFs) {
          const fs = parseFloat(getComputedStyle(t).fontSize) || parseFloat(t.getAttribute('font-size')) || 11;
          t.dataset.baseFs = String(fs);
        }
      });
    });
    // Range rings also fade out at low zoom (so they aren't a giant ring across continent)
    const ringsGroup = container.querySelector('[data-radar-rings]');
    const homeGroup = container.querySelector('[data-radar-home]');

    // Lightning layers (fs only)
    const bolts = container.querySelector('[data-radar-lightning-bolts]');
    const clusters = container.querySelector('[data-radar-lightning-clusters]');
    const heat = container.querySelector('[data-radar-lightning-heat]');
    // Card has single lightning group (always shown)
    const cardLightning = container.querySelector('[data-radar-lightning]');

    function svgPointFromClient(clientX, clientY) {
      const rect = svg.getBoundingClientRect();
      // map client coords -> svg user-units using the active viewBox
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      return { x: px * vb.width, y: py * vb.height };
    }

    function apply() {
      viewport.setAttribute(
        'transform',
        `translate(${state.tx.toFixed(3)} ${state.ty.toFixed(3)}) scale(${state.scale.toFixed(4)})`
      );
      // Counter-scale label text + fade thresholds
      labelGroups.forEach((g) => {
        const kind = g.dataset.radarLabels;
        let op = 1;
        if (kind === 'roads') {
          // visible 1.0× and above, fade out by 0.5×
          op = clamp((state.scale - 0.5) / 0.5, 0, 1);
        } else if (kind === 'rings') {
          // visible 4× down to 0.4× (fade between 0.4 and 0.6)
          op = clamp((state.scale - 0.4) / 0.2, 0, 1);
        } else if (kind === 'cities') {
          // appear ≤ 0.3× (1 below 0.3, fade up to 0 above 0.45)
          op = clamp((0.45 - state.scale) / 0.15, 0, 1);
        } else if (kind === 'states') {
          // appear ≤ 0.15× (fade in between 0.22 → 0.12)
          op = clamp((0.22 - state.scale) / 0.1, 0, 1);
        }
        g.setAttribute('opacity', op.toFixed(2));
        // Counter-scale text size so labels remain readable
        g.querySelectorAll('text').forEach((t) => {
          const base = parseFloat(t.dataset.baseFs) || 11;
          t.setAttribute('font-size', (base / state.scale).toFixed(2));
        });
      });

      // Range rings: fade out below 0.3× (no longer useful at continental zoom)
      if (ringsGroup) {
        const ringOp = clamp((state.scale - 0.3) / 0.2, 0, 1);
        ringsGroup.setAttribute('opacity', ringOp.toFixed(2));
      }
      // Home marker text counter-scales but circle scales with map
      if (homeGroup) {
        const homeText = homeGroup.querySelector('text');
        if (homeText) {
          if (!homeText.dataset.baseFs) homeText.dataset.baseFs = homeText.getAttribute('font-size') || '12';
          const base = parseFloat(homeText.dataset.baseFs);
          homeText.setAttribute('font-size', (base / state.scale).toFixed(2));
        }
      }

      // Lightning rendering mode (fs only)
      if (isFs && bolts && clusters && heat) {
        let bOp = 0, cOp = 0, hOp = 0;
        if (state.scale >= 0.5) bOp = 1;
        else if (state.scale >= 0.15) cOp = 1;
        else hOp = 1;
        bolts.setAttribute('opacity', bOp);
        clusters.setAttribute('opacity', cOp);
        heat.setAttribute('opacity', hOp);
      }
      if (cardLightning) {
        // card view is always neighborhood-scale → always show bolts
        cardLightning.setAttribute('opacity', '1');
      }

      // Zoom readout (fs only)
      const readout = container.querySelector('[data-fsr-readout]');
      if (readout) readout.textContent = state.scale >= 1
        ? `${state.scale.toFixed(1)}×`
        : `${state.scale.toFixed(2)}×`;
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function setScaleAround(newScale, pivotX, pivotY) {
      newScale = clamp(newScale, minScale, maxScale);
      // Keep the svg point under (pivotX,pivotY) fixed during zoom
      const k = newScale / state.scale;
      state.tx = pivotX - k * (pivotX - state.tx);
      state.ty = pivotY - k * (pivotY - state.ty);
      state.scale = newScale;
    }

    function reset(animate = true) {
      if (!animate) container.classList.add('is-zooming');
      state.scale = opts.defaultScale;
      // Center the home marker (or the viewBox center) at reset
      const cx = opts.homeX != null ? opts.homeX : vb.width / 2;
      const cy = opts.homeY != null ? opts.homeY : vb.height / 2;
      state.tx = vb.width / 2 - state.scale * cx;
      state.ty = vb.height / 2 - state.scale * cy;
      apply();
      if (!animate) requestAnimationFrame(() => container.classList.remove('is-zooming'));
    }

    // ---- pointer-based pan + pinch ----
    const pointers = new Map();
    let lastPinchDist = 0;
    let lastPinchMid = null;

    container.addEventListener('pointerdown', (e) => {
      // Don't pan when user clicks a control button
      if (e.target.closest('.radar__ctrl, .radar__ctrls')) return;
      container.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        container.classList.add('is-panning');
      } else if (pointers.size === 2) {
        container.classList.remove('is-panning');
        container.classList.add('is-zooming');
        const [a, b] = [...pointers.values()];
        lastPinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        lastPinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
    });

    container.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1) {
        // Pan — translate svg coords
        const rect = svg.getBoundingClientRect();
        const dx = ((e.clientX - prev.x) / rect.width) * vb.width;
        const dy = ((e.clientY - prev.y) / rect.height) * vb.height;
        state.tx += dx;
        state.ty += dy;
        apply();
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (lastPinchDist > 0) {
          const factor = dist / lastPinchDist;
          const pivot = svgPointFromClient(mid.x, mid.y);
          setScaleAround(state.scale * factor, pivot.x, pivot.y);
          // Also pan with midpoint drift
          const rect = svg.getBoundingClientRect();
          const ddx = ((mid.x - lastPinchMid.x) / rect.width) * vb.width;
          const ddy = ((mid.y - lastPinchMid.y) / rect.height) * vb.height;
          state.tx += ddx;
          state.ty += ddy;
          apply();
        }
        lastPinchDist = dist;
        lastPinchMid = mid;
      }
    });

    function endPointer(e) {
      if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
      if (pointers.size < 2) { lastPinchDist = 0; lastPinchMid = null; }
      if (pointers.size === 0) {
        container.classList.remove('is-panning', 'is-zooming');
      }
    }
    container.addEventListener('pointerup', endPointer);
    container.addEventListener('pointercancel', endPointer);
    container.addEventListener('pointerleave', endPointer);

    // ---- wheel zoom (desktop) ----
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const pivot = svgPointFromClient(e.clientX, e.clientY);
      const factor = Math.exp(-e.deltaY * 0.0015);
      container.classList.add('is-zooming');
      setScaleAround(state.scale * factor, pivot.x, pivot.y);
      apply();
      clearTimeout(container._zoomTimer);
      container._zoomTimer = setTimeout(() => container.classList.remove('is-zooming'), 180);
    }, { passive: false });

    // ---- reset button ----
    container.querySelectorAll('[data-radar-action="reset"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        reset(true);
      });
    });

    // Initial layout
    reset(false);

    return {
      reset,
      getState: () => ({ ...state }),
      setState: (s) => {
        if (s.scale != null) state.scale = clamp(s.scale, minScale, maxScale);
        if (s.tx != null) state.tx = s.tx;
        if (s.ty != null) state.ty = s.ty;
        apply();
      },
    };
  }

  // Card radar
  const cardEl = document.querySelector('[data-radar="card"]');
  const cardRadar = cardEl ? createRadar(cardEl, {
    mode: 'card',
    minScale: 0.75,
    maxScale: 4,
    defaultScale: 1,
    homeX: 215, homeY: 190,
  }) : null;

  // Full-screen radar
  const fsEl = document.querySelector('[data-fsr]');
  const fsBody = fsEl ? fsEl.querySelector('[data-radar="fs"]') : null;
  const fsRadar = fsBody ? createRadar(fsBody, {
    mode: 'fs',
    minScale: 0.05,
    maxScale: 4,
    defaultScale: 0.7,
    homeX: 1115, homeY: 712,
  }) : null;

  // ---- Expand button: open full-screen modal ----
  document.querySelectorAll('[data-radar-action="expand"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!fsEl) return;
      fsEl.hidden = false;
      fsEl.setAttribute('aria-hidden', 'false');
      // Open at the FS default (continental view) so user can see whole state + offshore
      if (fsRadar) fsRadar.reset(false);
    });
  });

  // ---- Close button + backdrop click ----
  function closeFsr() {
    if (!fsEl) return;
    fsEl.hidden = true;
    fsEl.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('[data-fsr-close]').forEach((btn) => {
    btn.addEventListener('click', closeFsr);
  });
  if (fsEl) {
    fsEl.addEventListener('click', (e) => {
      if (e.target === fsEl) closeFsr();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fsEl && !fsEl.hidden) closeFsr();
  });

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
