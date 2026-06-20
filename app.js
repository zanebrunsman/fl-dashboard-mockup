// FL Home Dashboard — interaction demo
// why: keeps every state-changing action behind a PIN, per standing order #9

(() => {
  // ---- Clock ----
  const tEl = document.getElementById('clockTime');
  const mEl = document.getElementById('clockMeridiem');
  const dEl = document.getElementById('clockDate');
  function tick() {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const mer = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    if (tEl) tEl.textContent = `${h}:${m}`;
    if (mEl) mEl.textContent = mer;
    if (dEl) {
      dEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).replace(',', ' ·');
    }
    const camTime = document.getElementById('camTime');
    if (camTime) camTime.textContent = `${h}:${m} ${mer}`;
  }
  tick();
  setInterval(tick, 15000);

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
  // routes to the sleep view. The 'Wake' bar inside the sleep view routes back to home.
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sleep-toggle]');
    if (!btn) return;
    e.preventDefault();
    const currentlySleeping = !document.querySelector('[data-view="sleep"]').hidden;
    go(currentlySleeping ? 'home' : 'sleep');
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

  // ---- Media tab: source tabs ----
  document.querySelectorAll('[data-src]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-src]').forEach((t) => {
        const active = t === tab;
        t.classList.toggle('src-tab--active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      showToast(`Switched to ${tab.dataset.src === 'sonos' ? 'Sonos' : 'TV'} controls`);
    });
  });

  // ---- Media tab: extra actions ----
  document.querySelectorAll('[data-action="open-sonos"]').forEach((btn) => {
    btn.addEventListener('click', () => showToast('Launching Sonos app…'));
  });
  document.querySelectorAll('[data-action="browse-music"]').forEach((btn) => {
    btn.addEventListener('click', () => showToast('Opening music library'));
  });
  document.querySelectorAll('[data-action="test-chime"]').forEach((btn) => {
    btn.addEventListener('click', () => showToast('Playing test chime on Sonos + tablet'));
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
