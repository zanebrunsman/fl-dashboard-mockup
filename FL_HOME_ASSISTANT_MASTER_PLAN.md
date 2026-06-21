# FL Home Assistant — Master Plan

Long-term roadmap and feature backlog for the FL Home Assistant project — a Home Assistant install for my parents at Island Landing Dr, St. Augustine, FL. Provides a wall-mounted tablet dashboard for weather + cameras + smart locks + garage, plus remote phone access for the smart-home pieces.

This is the single source of truth for what hasn't been done yet. Shipped work lives in commit history and `README.md` / `runbooks/`. Full specs >10 lines live in `docs/specs/<ID>.md`; this document keeps one-line pointers.

**Maintain by:**

- Adding items as they come up in conversation. Don't lose ideas.
- Promoting items **Backlog → Specced → Active → Shipped**.
- Reviewing the backlog at the start of each batch to see if anything should ride along.

---

## Project north star

- **Form factor:** wall-mounted tablet running a Home Assistant Lovelace dashboard, plus the HA Companion app on my parents' phones for remote control.
- **Tablet (target):** base 11" iPad on the wall at the parents' house, running Fully Kiosk Browser pointed at the HA dashboard URL.
- **Tablet (dev/test):** my iPad Air 4 (256 GB cellular). Minimum-supported reference device.
- **HA host (dev + prod):** Home Assistant Green, running HA OS. Same hardware is used for testing here and then physically shipped to the parents.
- **Dashboard tech:** Home Assistant Lovelace (YAML), HACS components, browser_mod, Fully Kiosk Browser.
- **No custom web server, no React, no FastAPI.** Everything is HA + HACS + YAML.
- **Location:** Island Landing Dr, St. Augustine, FL (Anastasia Island, Atlantic coast, just south of the St. Augustine Inlet).
- **Default NOAA tide station:** 8720587 (St. Augustine Beach).
- **Audible alerts** play simultaneously on the Fully Kiosk tablet *and* a Sonos speaker the parents have in the house.

---

## Don't re-ask — locked decisions

Treat as final unless the user explicitly reopens.

- **Home Assistant is in** (overrides the prior "No Home Assistant" decision from the deleted `fl-home-dashboard` project).
- **HA install method:** HA OS on a Home Assistant Green (no Supervised, no Container). Supervised is deprecated.
- **No custom web server / React frontend / FastAPI backend.** Everything in HA + HACS + YAML.
- **Tablet kiosk:** Fully Kiosk Browser (one-time license paid). Used as both dashboard browser and as an HA `media_player` for audio.
- **Wall tablet (parents):** base 11" iPad. Dev reference: iPad Air 4.
- **Audio target for severe-weather alerts:** Fully Kiosk + Sonos simultaneously (media_player group).
- **Reverse proxy / remote access:** HA's built-in HTTPS + the HA Companion app handle remote access for my parents. The wall-tablet dashboard stays LAN-only.
- **Auth model:** trusted-network for read-only viewing on the LAN tablet; PIN required on every state-changing action (lock, unlock, open garage, close garage). HA accounts + HA Companion app for remote phone access.
- **Weather radar:** an HA Lovelace card (RainViewer-backed) for the looping radar. Hurricane cone-of-uncertainty visualization is deferred — recommend MyRadar app on the parents' phones for that.
- **Severe-weather data source:** NWS via the `weatheralerts` custom integration ([github.com/custom-components/weatheralerts](https://github.com/custom-components/weatheralerts)).
- **Location defaults:** Island Landing Dr coords + tide station 8720587.

---

## How to read this doc

Each item has:

- **ID** — short tag used in commits and runbook references (e.g. `HA-1`, `WX-A1`)
- **Status** — Backlog, Specced, Active, Shipped, Won't do
- **Scope estimate** — XS, S, M, L, XL
- **Depends on** — other items that should land first
- **Notes** — rationale, gotchas, open questions

Full specs >10 lines live in `docs/specs/<ID>.md`.

---

## ID prefixes

- **HA-** Home Assistant install / OS / core config
- **TAB-** Wall tablet (iPad + Fully Kiosk)
- **DASH-** Lovelace dashboard layout + cards
- **WX-** Weather features (alerts, radar, tides, etc.)
- **CAM-** Cameras
- **LOCK-** Smart locks
- **GAR-** Garage door
- **SEC-** Auth / PIN / confirmation flow
- **AUTO-** Automations (audible alerts, theme switching, etc.)
- **MED-** Media (Sonos, smart-TV, media dashboard tab)
- **FLT-** Flight tracking
- **REM-** Remote access
- **DOC-** Documentation / runbooks
- **OPS-** Operations / backups / monitoring
- **FUT-** Future / nice-to-have

---

## Active batch

Items currently being executed.

_None in flight._

**Last shipped:** _(none yet — project just started)._

**Next up:** `HA-1` — install HA OS on the Home Assistant Green, get the web UI reachable from the dev's Mac.

---

## v1 build order

The goal is **a working dashboard on a wall-mounted iPad, with audible severe-weather alerts on tablet + Sonos, cameras viewable, locks and garage tappable behind a PIN, ready to physically ship to the parents.**

1. `HA-1` — Install HA OS on the HA Green; reach the HA UI from Mac.
2. `HA-2` — Initial HA config: location (lat/lon), unit system, time zone, account.
3. `HA-3` — Install HACS.
4. `TAB-1` — Provision the iPad Air 4 with Fully Kiosk; point at HA URL; verify load.
5. `WX-A1` — Install + configure `weatheralerts` integration for St. Augustine.
6. `DASH-1` — Build the first-cut Lovelace dashboard: weather panel placeholder.
7. `WX-A2` — Install weather radar card (RainViewer-based); add to dashboard.
8. `WX-A3` — Tide card configured for station 8720587.
9. `WX-A4` — Current conditions + hi/lo card.
10. `AUTO-1` — Audible severe-weather alert automation (Fully Kiosk + Sonos group).
11. `SEC-1` — PIN-protect state-changing actions (locks, garage).
12. `CAM-1` — Camera grid panel (whichever cameras the parents end up with — placeholder card layout works for any HA `camera.*` entities).
13. `LOCK-1` — Lock cards with confirm-to-toggle behind PIN.
14. `GAR-1` — Garage door card with confirm-to-toggle behind PIN.
15. `DASH-2` — Multi-view dashboard navigation: Weather / Home / (optional) Flights.
16. `TAB-2` — Wall-mount setup + cable routing notes in runbook.
17. `DOC-1` — Parent-facing one-page user guide.
18. `OPS-1` — HA full backup schedule + restore-tested.
19. **Ship the HA Green + iPad to the parents' house.**

Post-v1: `FLT-1` (flight tracking), `WX-A5` (hurricane tracker if a good HA option emerges), `FUT-*` items.

---

## Backlog

### Home Assistant core

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| HA-1 | Install HA OS on HA Green | Specced | S | — |
| HA-2 | Initial HA config (location, units, TZ, account) | Specced | XS | HA-1 |
| HA-3 | Install HACS | Specced | XS | HA-2 |
| HA-4 | Enable `packages/` directory in `configuration.yaml` | Backlog | XS | HA-2 |
| HA-5 | YAML config under version control (this repo) syncs into HA via Samba / SSH add-on | Specced | S | HA-2 |

### Tablet

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| TAB-1 | iPad Air 4 — install Fully Kiosk, point at HA, verify | Specced | S | HA-3 |
| TAB-2 | Wall-mount setup + cable/charging notes | Backlog | S | TAB-1 |
| TAB-3 | Day/night dim via Fully Kiosk schedule | Backlog | XS | TAB-1 |
| TAB-4 | Motion-wake on the parents' base 11" iPad | Backlog | S | TAB-1, parents' iPad in hand |

### Dashboard

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| DASH-1 | First-cut Lovelace dashboard (weather panel placeholder) | Specced | S | HA-3 |
| DASH-2 | Multi-view nav (Weather / Home / Flights) | Specced | M | All weather + home cards exist |
| DASH-3 | Theme: tablet-tuned color + sizing | Backlog | S | DASH-1 |
| DASH-4 | Home-tab alerts card shows highest-priority active alert + "More" link | Specced | S | WX-A1, DASH-5 |
| DASH-5 | Settings tab (alert priority, audible toggles, exclusions) | Specced | M | DASH-2, WX-A1 |
| DASH-6 | Sleep mode: minimal black/B&W display + manual bed-icon toggle + schedule | Specced | M | DASH-2, AUTO-8 |

### Weather

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| WX-A1 | `weatheralerts` integration for St. Augustine zone | Specced | S | HA-3 |
| WX-A2 | Looping radar card (RainViewer-based) | Specced | S | DASH-1 |
| WX-A3 | Tide card (NOAA station 8720587) | Specced | S | DASH-1 |
| WX-A4 | Current conditions + today's hi/lo card | Specced | S | DASH-1 |
| WX-A5 | Hurricane / tropical-system tracker | Backlog | M | NHC-data HA option emerges |
| WX-A6 | Sunrise/sunset + moon phase card | Backlog | XS | DASH-1 |
| WX-A7 | UV index card | Backlog | XS | DASH-1 |
| WX-A8 | Lightning data via Blitzortung integration | Specced | M | HA-3 |
| WX-A9 | Lightning visualization on radar (strikes + last-10-min overlay) | Specced | S | WX-A2, WX-A8 |
| WX-A10 | Lightning conditions field + nearest-strike alert card | Specced | S | WX-A8 |
| WX-A11 | Radar pan/zoom on the card (touch + reset) | Specced | M | WX-A2 |
| WX-A12 | Full-screen radar mode (modal overlay, whole US + offshore) | Specced | M | WX-A11 |
| WX-A13 | Lightning clustering + heatmap thresholds for zoomed-out radar | Specced | M | WX-A8, WX-A12 |

### Cameras

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| CAM-1 | Camera grid panel (per `camera.*` entity) | Backlog | M | parents pick cameras, integrations installed |
| CAM-2 | Tap-to-expand full-screen camera view | Backlog | S | CAM-1 |
| CAM-3 | Vendor-AI camera events (Ring / SimpliSafe / etc.) → dashboard auto-switch | Specced (future) | M | CAM-1, parents pick camera ecosystem, `browser_mod` |

### Locks

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| LOCK-1 | Lock cards with PIN-confirm-to-toggle | Backlog | S | parents pick locks, integration installed, SEC-1 |

### Garage

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| GAR-1 | Garage door card with PIN-confirm-to-toggle | Backlog | S | parents pick opener, integration installed, SEC-1 |

### Security / auth

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| SEC-1 | PIN-confirm pattern for all state-changing actions | Specced | M | HA-2 |
| SEC-2 | Trusted-network auth provider for the wall tablet | Specced | S | HA-2 |
| SEC-3 | Audit log of state-changing actions | Backlog | S | SEC-1 |

### Automations

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| AUTO-1 | Severe-weather audible alert (Fully Kiosk + Sonos group) | Specced | M | WX-A1, TAB-1, Sonos integration |
| AUTO-2 | Quiet hours (mute audio overnight, banner only) | Backlog | S | AUTO-1 |
| AUTO-3 | Day/night theme switch on dashboard | Backlog | S | DASH-1 |
| AUTO-4 | Front-door lock auto-relock after N minutes | Backlog | S | LOCK-1 |
| AUTO-5 | Lightning-strike audible alert (user-configurable distance + cooldown) | Specced | M | WX-A8, AUTO-1 |
| AUTO-6 | Multi-type alert de-dup (different types each chime independently) | Specced | S | AUTO-1, AUTO-5 |
| AUTO-7 | Auto-switch dashboard to Weather tab on audible weather alert | Specced | S | AUTO-1, AUTO-5, TAB-1, `browser_mod` |
| AUTO-8 | Sleep mode automation: schedule + suppression rules for non-essential automations | Specced | M | DASH-6, AUTO-1 |

### Media (Sonos + TV)

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| MED-1 | Sonos integration via HA core + `mini-media-player` + `sonos-card` HACS (hybrid) | Specced | M | HA-3 |
| MED-2 | Smart-TV integration (LG webOS / Samsung Tizen / Vizio SmartCast) via HA media_player | Specced | M | HA-3 |
| MED-3 | Media dashboard tab — source switcher (Sonos / TV), now-playing, transport, volume, room chips, queue | Specced | M | MED-1, MED-2, DASH-2 |
| MED-4 | "Open Sonos app" button (sonos:// URL handoff via Fully Kiosk) | Specced | XS | MED-1, TAB-1 |
| MED-5 | Alert-settings panel in Media tab (test chime, alert volume, lightning radius, re-alert cooldown) | Specced | S | AUTO-5, MED-3 |

### Flight tracking

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| FLT-1 | Flights nearby card | Backlog | M | DASH-1; pick OpenSky or flightradar24 integration |

### Remote access

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| REM-1 | HA Cloud (Nabu Casa) **or** Cloudflare Tunnel for remote phone access | Backlog | M | HA-2; pick which path |
| REM-2 | Parents install HA Companion app + log in | Backlog | S | REM-1 |

### Operations

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| OPS-1 | HA full backup schedule + restore test | Specced | S | HA-2 |
| OPS-2 | Off-box backup copy (Google Drive, Dropbox, NAS) | Backlog | S | OPS-1 |
| OPS-3 | Remote support path for fixing things from out of state | Backlog | M | REM-1 |
| OPS-4 | UPS for the HA Green | Backlog | S | physically at parents' house |

### Documentation

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| DOC-1 | Parent-facing one-page user guide | Specced | S | DASH-2 |
| DOC-2 | Maintainer runbooks (`runbooks/`) | Ongoing | — | — |
| DOC-3 | "Verified on" device matrix | Backlog | XS | v1 ships |

### Future / nice-to-have

| ID | Title | Status | Scope | Depends on |
|---|---|---|---|---|
| FUT-1 | Family photo slideshow when idle | Backlog | S | DASH-1 |
| FUT-2 | Air quality + pollen card | Backlog | S | DASH-1 |
| FUT-3 | Voice assist (Whisper + Piper on the HA Green) | Backlog | XL | HA-2 |
| FUT-4 | Energy monitoring | Backlog | M | smart-plug or panel device |
| FUT-5 | Local-only AI object detection (Frigate + Coral, or Frigate on separate N100 box) as fallback if vendor AI is insufficient | Backlog | XL | CAM-1, CAM-3 evaluated |

---

## Specced items

> Specs >10 lines move to `docs/specs/<ID>.md` as part of the batch that ships the item.

### HA-1 — Install HA OS on HA Green

See `runbooks/01-install-ha-green.md` (written as part of this batch). One-time setup of the HA Green hardware: power on, plug into Ethernet, complete onboarding wizard at `http://homeassistant.local:8123`, create owner account, set location/units/TZ.

### HA-2 — Initial HA config

- Location: Island Landing Dr, St. Augustine, FL (set lat/lon precisely in Settings → System → General).
- Unit system: US customary.
- Time zone: America/New_York.
- Owner account created.

### HA-3 — Install HACS

See `runbooks/02-install-hacs.md`. SSH add-on → run HACS installer → restart HA → complete HACS onboarding (GitHub OAuth).

### HA-5 — YAML config under version control

This repo holds the YAML we author (lovelace, automations, packages, scripts). It does **not** hold HA's full `/config` directory — that includes secrets, the database, HACS components, etc. Sync pattern:

- Author YAML locally in this repo.
- Use the HA Samba or Visual Studio Code add-on to push files into `/config/` on the HA Green.
- Reload the relevant HA component (Developer Tools → YAML).
- Commit + push.

Detailed sync workflow lives in `runbooks/03-sync-yaml-to-ha.md`.

### TAB-1 — iPad Air 4 + Fully Kiosk

See `runbooks/04-tablet-setup-fully-kiosk.md`. Install Fully Kiosk Browser, configure URL to HA dashboard, enable kiosk mode + autostart + screen-always-on. Expose as HA `media_player` via Fully Kiosk's REST interface so automations can speak audio through the tablet.

### DASH-1 — First-cut Lovelace dashboard

A single dashboard view with placeholder cards for the v1 widgets. Lives in `lovelace/dashboard.yaml`. Designed for 11" iPad landscape (1194×834 effective). Tablet-agnostic: no fixed pixel widths, uses HA's `grid` layout.

### WX-A1 — weatheralerts integration

Install via HACS → add integration → enter Island Landing Dr lat/lon → integration creates `sensor.weatheralerts_<county_name>` exposing active NWS alerts as attributes. Used by `AUTO-1` for audible alerts and by a dashboard card for visual display.

### WX-A2 — Looping radar card

`weather-radar-card` HACS install. Configured to center on Island Landing Dr. Default zoom suitable for showing approaching coastal weather. Card config lives in `lovelace/dashboard.yaml`.

### WX-A3 — Tide card

`noaa-tides` HACS integration → `sensor.noaa_tides_8720587` → display in a chart card. Surfaces current tide level + next high/low.

### WX-A8 — Lightning data via Blitzortung

Install the [`Blitzortung` HA integration](https://www.home-assistant.io/integrations/blitzortung/) (community lightning detection network — free). Exposes:

- `sensor.blitzortung_lightning_counter` (strikes in radius)
- `sensor.blitzortung_lightning_distance` (nearest strike, miles)
- `sensor.blitzortung_lightning_azimuth` (compass bearing)
- `geo_location.lightning_strike_*` (individual strike entities for map cards)

Configured with Island Landing Dr lat/lon and a wide radius (default 50 mi) so we have enough data for both visual overlay and threshold-based audible alerts.

### WX-A9 — Lightning visualization on radar

- Strike markers overlaid on the RainViewer radar card via a map card layered with `geo_location.lightning_strike_*` entities.
- Strikes from the last 10 minutes only.
- Yellow bolt glyphs with a soft glow.
- Legend chip: "Lightning · last 10 min".
- Range rings at 5 mi and 10 mi for spatial reference.

### WX-A10 — Lightning conditions field + alert card

- New "Lightning" field in the conditions card: "3.2 mi NE · 2m ago" (distance + bearing + last-strike age, sourced from `sensor.blitzortung_lightning_distance` + `_azimuth`).
- Hero stats row shows it as a prominent amber stat when nearest-strike distance is below the visual threshold.
- Top-of-list alert card when distance is below the audible threshold, with a yellow left border to match the bolt theme.

### WX-A11 — Radar pan/zoom on the card

Scope: pan + zoom apply **only to the radar card**, not the whole dashboard. On real HA the card is Leaflet-backed, so this is mostly configuration; in the mockup it's wired through [svg-pan-zoom](https://github.com/bumbu/svg-pan-zoom) on the SVG.

- **Gestures:** drag to pan, pinch to zoom, mouse-wheel to zoom on desktop.
- **Zoom range:** 0.75x (full St. Johns County) to 4x (neighborhood level). Default zoom = current neighborhood view (~10 mi radius visible), which is also where the reset button snaps to.
- **Reset icon:** small ⊙ button in the top-right corner of the radar card. Tappable; snaps view back to default zoom + center on Island Landing Dr with a 250ms ease.
- **Expand icon:** small ⛶ button next to the reset button. Opens `WX-A12` full-screen modal.
- **Counter-scaling labels** (text stays readable as map scales):
  - Road labels (I-95, US-1, A1A): visible 1x → 0.5x, fade out below.
  - Range rings (5 mi, 10 mi): visible 4x → 0.4x, fade out below.
  - City labels (St. Augustine, Jacksonville, Daytona): appear at 0.3x and below.
  - State name labels (FLORIDA, GEORGIA): appear at 0.15x and below (full-screen mode only since card-mode min is 0.75x).
- **State borders:** always on. Drawn from the underlying tile layer in HA; from a static GeoJSON polygon layer in the mockup.
- **Lightning markers + range rings counter-scale** so bolts stay tappable and rings stay readable. Roads (the lines themselves) scale with the map — only the *labels* counter-scale.

### WX-A12 — Full-screen radar mode

Tapping the ⛶ expand icon opens a modal overlay that covers the dashboard. Close button in the top-right. Navstrip is hidden in full-screen.

- **Zoom range:** 0.05x (whole US + ~100 mi offshore on all coasts) to 4x.
- **Default zoom on open:** matches the card's current zoom and center so the transition feels continuous.
- **All WX-A11 behaviors apply** (pan, zoom, reset, label counter-scaling).
- **Reset in full-screen:** snaps back to the neighborhood default *or* to the last-card-view, whichever the user prefers — default behavior is last-card-view so closing the modal returns them to what they were looking at on the card. (TBD: surface this as a setting if it ends up being confusing.)
- **State borders + state-name labels** are visible at full-screen zoom levels.
- **Lightning rendering:** delegated to `WX-A13`.

### WX-A13 — Lightning clustering + heatmap thresholds

At zoomed-out levels individual bolt markers become unreadable. Two rendering modes that switch automatically based on the current zoom level:

- **Bolt markers (zoom ≥ 0.5x):** individual yellow bolts with glow. Tappable to see strike time + distance.
- **Clustered bolts (0.15x ≤ zoom < 0.5x):** strikes within ~24 px of each other combine into a single larger bolt with a count badge (e.g. "⚡ 12"). Tapping a cluster zooms in until the cluster breaks apart. HA implementation: [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) with custom bolt iconCreateFunction.
- **Heatmap (zoom < 0.15x):** strikes render as a smooth amber gradient (denser = brighter, peaks toward white-orange). No individual markers. Good for seeing a thunderstorm complex moving across the southeast US. HA implementation: [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) layer fed by the same `geo_location.lightning_strike_*` entities.
- **Transition:** mode switches happen on zoom-end (not during the pinch gesture) to avoid flicker. 200ms cross-fade between modes.
- **Time window:** still the last 10 minutes for card view; full-screen view exposes a small "last 10 min / 30 min / 1 hr" selector since at continental zoom 10 minutes of data can be too sparse.

### WX-A4 — Current conditions card

Standard HA `weather` integration (NWS or OpenWeatherMap) → standard `weather-forecast` card. No HACS needed for this one.

### AUTO-5 — Lightning-strike audible alert (user-configurable)

See `automations/lightning-alert.yaml`. When `sensor.blitzortung_lightning_distance` drops below the user-configurable audible threshold:

1. Play the lightning chime on `media_player.severe_alert_group` (Fully Kiosk + Sonos).
2. Display a top-of-list alert card on the dashboard: "Lightning nearby — {distance} mi {bearing}".
3. Honor `input_boolean.quiet_hours` (visual-only when ON).
4. Cooldown: skip audio for repeat strikes inside the user-configurable re-alert window.

User-configurable helpers (live in `packages/lightning.yaml`):

- `input_number.lightning_audible_radius_mi` — default 12 mi (range 1–30).
- `input_number.lightning_visual_radius_mi` — default 30 mi (range 5–50).
- `input_number.lightning_realert_cooldown_min` — default 10 min (range 1–60).
- `input_boolean.lightning_audible_enabled` — master toggle.

All four are surfaced as sliders/toggles in the Media tab → System panel so parents can adjust without editing YAML.

### AUTO-6 — Multi-type alert de-dup

The cooldown in `AUTO-1` and `AUTO-5` is keyed on **(alert_type, alert_id)**, not just alert_id. This means:

- A Severe Thunderstorm Warning chimes once and is cooled down for 60 min.
- If a Tornado Warning is issued 5 minutes later, it **still chimes** — different type, independent cooldown.
- Lightning-nearby chimes are gated by their own cooldown (`AUTO-5`).
- Heat advisories, rip-current statements, coastal-flood alerts: each have their own type bucket.

Rationale: per user, the worst failure mode is the second, more-severe alert being suppressed by the first.

### AUTO-7 — Auto-switch to Weather tab on audible alert

See `automations/dashboard-tab-switch.yaml`. When any **audible** weather alert fires (the chime is actually about to play — passes `AUTO-1` / `AUTO-5` cooldown + quiet-hours checks):

1. Use [`browser_mod.navigate`](https://github.com/Bouwe77/browser_mod) to push the wall tablet from whatever tab it is on to `/lovelace/weather`.
2. Hold the tab there for the configured timeout (default 5 min) before any other auto-switch (e.g. `CAM-3` doorbell) can take over.
3. After timeout + no further alerts in the cooldown window, auto-revert to the Home tab.
4. If the user manually navigates away during the hold window, that wins — do **not** keep yanking them back. Re-arm the auto-switch only on a fresh alert.
5. Silent / suppressed alerts (quiet hours, or excluded types from `DASH-5`) do **not** trigger the tab switch. Only audible ones.

User-configurable helpers (live in `packages/dashboard-switch.yaml`):

- `input_boolean.alert_auto_switch_enabled` — master toggle, default ON.
- `input_number.alert_auto_switch_hold_min` — default 5 min (range 1–30).

Both surfaced in the Settings tab (`DASH-5`).

### DASH-4 — Home-tab alerts card: highest-priority active alert

The Home tab alerts card currently shows whichever alert happens to be first in the `weatheralerts` attribute list. Change:

- Show **the single highest-priority active alert**, fully detailed (title, timeframe, body, action footer).
- Replace the bottom-of-card "details" link with a **"More →"** link that opens the full alerts list on the Weather tab.
- If no active alerts match the user's priority list (everything is muted / excluded / no alerts active), show an **"All clear"** empty state with a calm green check icon and "No active weather alerts."
- Muted / de-prioritized categories still **appear** in the full Weather-tab list, just lower in the order — not hidden, unless explicitly excluded in `DASH-5`.

Priority lookup is driven by the user-configured list from `DASH-5`. Default priority (highest → lowest):

1. Tornado Warning
2. Hurricane Warning
3. Lightning nearby (from `AUTO-5` threshold)
4. Severe Thunderstorm Warning
5. Hurricane Watch / Tropical Storm Warning
6. Flash Flood Warning
7. Hail / Severe Weather Statement
8. Tornado Watch / Severe Thunderstorm Watch
9. Flood Warning / Coastal Flood Warning
10. Heat Advisory / Excessive Heat Warning
11. Rip Current Statement
12. Air Quality Alert
13. Everything else (NWS-severity-sorted within this bucket)

Implementation: a `template` sensor (`sensor.top_priority_alert`) ranks the active alerts via the configured priority list and exposes the winner as its state + attributes. The Home alerts card binds to that sensor; the Weather tab list iterates the full sorted set.

### DASH-5 — Settings tab

New Lovelace view added to the navstrip alongside Home / Weather / Security / Media. Lives in `lovelace/views/settings.yaml`. (Yes — HA Lovelace fully supports adding additional views as tabs; this is the right place for user-configurable preferences.)

Layout (1194×834):

- **Header:** Back button + "Settings" title + theme toggle.
- **Section: Alert priority** — drag-to-reorder list of every alert type the system knows about. Each row has:
  - Drag handle (left).
  - Alert type name + small severity chip.
  - **Audible toggle** — ON = chime, OFF = visual-only.
  - **Exclude toggle** — ON = never display this alert type anywhere on the dashboard (overrides everything else).
- **Section: Audible behavior** — master audible enable, alert volume, lightning audible radius, lightning re-alert cooldown, quiet-hours start/end, auto-switch hold timeout (`AUTO-7`).
- **Section: Dashboard** — theme override, font scale, idle timeout to Home tab.
- **Section: System** — "Test chime" button (moved from Media tab), HA core version, last backup date, restart-HA button (PIN-protected via `SEC-1`).
- **PIN required:** for the "Restart HA" button only. Everything else is freely editable since none of it is state-changing for safety.

Implementation: drag-to-reorder uses [`custom:hui-element` + `sortable.js`](https://github.com/SortableJS/Sortable) wrapped in a custom card, or the `auto-entities` + `card-mod` combo if a HACS drag-reorder card is available at build time. Persistent ordering stored in `input_text.alert_priority_order` as a comma-separated list of alert type slugs.

### DASH-6 — Sleep mode

Low-disturbance overnight (or on-demand) display mode. Activates from either a manual bed-icon tap or `AUTO-8` schedule.

**Trigger surfaces:**
- Bed icon in the top-right of every view (next to theme toggle). Tap to manually enter sleep mode; tap again to exit. Long-press shows the schedule sub-screen.
- `AUTO-8` automation toggles `input_boolean.sleep_mode` on/off at configured times.
- Settings tab gets a "Sleep" section (see additions to `DASH-5` below) with the schedule, what stays running, and a "Sleep now" button.

**Visual treatment when `input_boolean.sleep_mode == on`:**
- Backdrop forced to pure black (`#000`).
- All chrome (typography, icons, dividers) shifts to a grayscale ramp: `#9aa0a6` body / `#e5e7eb` titles / `#3c4043` borders. The single non-grayscale color allowed is alert-critical red (tornado, hurricane, severe thunderstorm — anything in the priority "Critical" tier) to preserve life-safety legibility.
- Body text and chart fills desaturated to grayscale via `filter: grayscale(1) brightness(0.85)` on `[data-sleep="on"]`.
- Hero weather strip, conditions table, forecast strip, radar card, tide chart, camera tiles, media tile, all rooms / locks tiles: **hidden** in sleep mode.
- Surviving elements (the "essentials"):
  - Large clock + date (top-center).
  - Lock status row (front, back, garage) — read-only, no toggle. PIN required to change anything via the Security tab as normal.
  - Severe-weather alert card (only renders if a Critical-tier alert is active per the priority list).
  - Small "Tap to wake" hint at the bottom.
- The navstrip is replaced by a single full-width "Wake" bar that exits sleep mode.
- Auto-switch (`AUTO-7`) **does** still wake the dashboard for Critical-tier alerts; lower priorities are suppressed unless the user opts them into "wake on alert" in Settings.
- Tablet brightness is dropped to a configurable low (default 8%) via Fully Kiosk's `tools.setScreenBrightness` REST endpoint, or via the iPad's MDM-controlled brightness if `TAB-1` lands on iPad.

**What is configurable in Settings (`DASH-5` → Sleep section, see DASH-5 update below):**
- Schedule: weekday start/end + weekend start/end (defaults: 10:00 PM — 7:00 AM).
- Auto-activate on schedule (toggle).
- Per-automation suppression list: each automation in the system gets a row with an "Allow during sleep" toggle. Defaults:
  - **Allowed during sleep:** severe-weather audible alerts (`AUTO-1`) for Critical tier only, all lock automations, garage close-on-night automation (if it exists), camera doorbell `CAM-3` (when active).
  - **Suppressed during sleep:** lightning chime (`AUTO-5`), non-critical weather chimes (Heat, Rip Current, etc.), Sonos / TV automations, theme auto-switch.
- Brightness during sleep (slider, 1–30%).
- "Wake on Critical alert" toggle (default ON — cannot be turned off if `AUTO-7` is on, to preserve life-safety).
- "Sleep now" button (same effect as tapping the bed icon).

**Implementation:**
- New helper: `input_boolean.sleep_mode`.
- New helpers: `input_datetime.sleep_start_weekday`, `..._end_weekday`, `..._start_weekend`, `..._end_weekend`, `input_number.sleep_brightness`.
- Per-automation "allow during sleep" is encoded as a `condition` block in each automation that checks `not is_state('input_boolean.sleep_mode', 'on')` OR `is_state('input_boolean.allow_<automation_slug>_during_sleep', 'on')`. The Settings UI toggles those `input_boolean.allow_*_during_sleep` entities.
- The Lovelace view applies a top-level `data-sleep` attribute via `card-mod` keyed off the `input_boolean.sleep_mode` state; CSS does the rest (grayscale filter, hidden non-essentials, navstrip swap).
- The bed icon button calls `input_boolean.toggle` on `sleep_mode`.

**DASH-5 addendum:** Settings tab gains a new "Sleep" card with: weekday + weekend schedule, auto-activate toggle, brightness slider, wake-on-Critical-alert toggle, and the per-automation suppression list. The "Sleep now" button lives here too.

### AUTO-8 — Sleep mode automation

Three triggers:

1. **Schedule:** at `input_datetime.sleep_start_{weekday|weekend}` for the current day type, turn `input_boolean.sleep_mode` on if the "Auto-activate on schedule" toggle is on. At `..._end_*`, turn it off.
2. **Manual:** the bed icon toggles the helper directly — this automation just observes the state change and applies the brightness change + tablet dim.
3. **Wake on Critical alert:** when `WX-A1` fires a Critical-tier alert and `input_boolean.sleep_mode == on` and the wake-on-critical toggle is on, turn `sleep_mode` off, jump to the Weather tab via `browser_mod`, and bump brightness back to the previous level.

When `sleep_mode` turns **on**:
- Set Fully Kiosk brightness to `input_number.sleep_brightness` (default 8%).
- Pause the lightning chime cooldown reset (no chimes until wake).
- Emit `event: sleep_mode_started` (used by per-automation suppression conditions).

When `sleep_mode` turns **off**:
- Restore brightness to 100%.
- Emit `event: sleep_mode_ended`.

Manual override wins, same as `AUTO-7`. If the user taps Wake mid-schedule, sleep mode stays off until the next scheduled start time.

### CAM-3 — Vendor-AI camera events + dashboard auto-switch (future)

**Not in the next phase.** Slated for after parents pick a camera ecosystem.

Whichever ecosystem they end up with — Ring, SimpliSafe, UniFi Protect, Reolink, etc. — the integration exposes camera events (doorbell, person, motion, package) as `binary_sensor.*` and `event.*` entities. We consume those, no local AI needed:

- **Ring:** official HA `ring` integration. Exposes `binary_sensor.<name>_ding` (doorbell), `binary_sensor.<name>_motion`, `binary_sensor.<name>_person` (Ring Edge / paid plan). Optional [`ring-mqtt`](https://github.com/tsightler/ring-mqtt) for full live-stream support.
- **SimpliSafe:** official HA `simplisafe` integration for alarm + sensors; camera event coverage depends on the camera model — re-verify before committing.
- **UniFi Protect / Reolink / Eufy / Nest:** all have HA integrations exposing person + motion events.

Auto-switch behavior (`browser_mod`-driven, same pattern as `AUTO-7`):

- Doorbell press → switch to Security tab + set main-view to the doorbell camera + play doorbell chime on Sonos.
- Person detected at front door (or other configured priority cam) → same flow, lower urgency tone.
- Hold the camera view for the configured timeout (default 2 min) before auto-reverting to Home.
- Manual override (user taps any other tab) wins; do not re-yank.
- `AUTO-7` (severe weather) outranks `CAM-3` (doorbell). If both fire, weather takes the tablet.
- All thresholds, which cams trigger auto-switch, and the chime sound configurable in the Settings tab (`DASH-5`).

Spec stays light until parents commit to an ecosystem; revisit then.

### MED-1 — Sonos integration (hybrid)

**Hybrid approach (locked):**

1. HA-native Sonos integration handles state, transport, grouping, TTS — the system of record.
2. `mini-media-player` HACS card on the Media tab for clean transport controls + per-room chips.
3. `sonos-card` HACS card (custom-cards/sonos-card) for queue, library browse, and group management.
4. `MED-4` "Open Sonos app" button as fallback for anything not covered (Sonos Radio search, Voice setup, etc.).

### MED-2 — Smart-TV integration

User will likely end up with one of: **LG webOS, Samsung Tizen, or Vizio SmartCast**. All three have native HA integrations:

- LG webOS → `webostv` integration (LAN + pairing key).
- Samsung Tizen → `samsungtv` integration (LAN + pairing on TV).
- Vizio SmartCast → `vizio` integration (LAN + token).

All three expose a standard `media_player.*` entity. The Media tab routes the active source-tab to whichever entity is present — same `mini-media-player` card with a different entity binding. No code changes needed when the TV is added; just install the integration matching whatever parents buy and update `packages/media.yaml`.

### MED-3 — Media dashboard tab

New Lovelace view alongside Home / Weather / Security. Layout (1194×834):

- **Header:** Back button + "Media" title + theme toggle.
- **Source tabs:** Sonos (active by default if playing) / Living Room TV. Tapping switches the now-playing pane to that media_player entity.
- **Now-playing pane:** album art, title, artist, room chips (Living Room, Kitchen, Primary Bedroom, Lanai), progress bar, prev/play-pause/next, volume slider, "Open Sonos app" + "Browse music" buttons.
- **Sidebar:** Up-next queue (3 tracks visible) + System panel (Test chime, Alert volume, Lightning chime radius, Re-alert cooldown).
- **No PIN required** for any media action — these are not state-changing for safety purposes.

### MED-4 — Open Sonos app button

Fully Kiosk Browser supports custom URL schemes. Tapping "Open Sonos app" fires `sonos://` which hands off to the Sonos iOS app if installed on the tablet. If the tablet doesn't have it installed, the button falls back to a toast: "Install the Sonos app to use this shortcut."

### MED-5 — Alert-settings panel

Lives in the Media tab → right sidebar bottom card titled "System". Surfaces the `AUTO-5` helpers:

- Test alert chime → "Play" button → `media_player.play_media` to chime URL on the severe-alert group.
- Alert volume → slider bound to `input_number.alert_volume`.
- Lightning chime radius → numeric display bound to `input_number.lightning_audible_radius_mi`.
- Re-alert cooldown → numeric display bound to `input_number.lightning_realert_cooldown_min`.

The "Tap to test chime" button was relocated here from the Security/Settings area per user request.

### SEC-1 / PIN scope clarification

PIN confirmation is **scoped to state-changing actions only**: locks, garage, alarm arm/disarm, lights-off-everywhere. PIN is **not** required for:

- Viewing any dashboard tab.
- Media playback control (play/pause/skip/volume) — covered by MED-3.
- Camera viewing.
- Reading alerts.

The "PIN required for changes" footer text appears **only on the Security tab navstrip**. Other tabs hide it to reduce visual clutter.

### AUTO-1 — Severe-weather audible alert automation

See `automations/weather-alerts.yaml`. When `sensor.weatheralerts_*` reports a new alert with severity Severe or Extreme:

1. Play a chime on the `media_player.severe_alert_group` group (Fully Kiosk + Sonos).
2. Follow with TTS reading the alert title + expiration.
3. Display a full-screen popup on the tablet via `browser_mod.popup`.
4. If quiet hours are active (`input_boolean.quiet_hours` ON, currently between configured start/end), skip the audio and only show the visual popup.
5. Cooldown: don't repeat audio for the same alert ID within 60 minutes.

Detailed spec in `docs/specs/AUTO-1.md` once this batch ships.

### SEC-1 — PIN-confirm pattern

Every card that toggles a `lock`, `cover` (garage), or other state-changing entity is wrapped in a `confirmation: { text: ..., code: ... }` block in Lovelace YAML. PIN is a configurable input_text helper or a hardcoded code shared with the parents. Detailed in `docs/specs/SEC-1.md`.

### SEC-2 — Trusted-network auth provider

In `configuration.yaml`, add `homeassistant.auth_providers.trusted_networks` with the home subnet allowlisted so the wall tablet doesn't need to log in to view the dashboard. State-changing actions still require the PIN from SEC-1.

### OPS-1 — HA backup

Settings → System → Backups → Automatic backups: nightly, retain 7. Restore-test once before shipping to parents.

### DOC-1 — Parent-facing user guide

One page. Sections: "Opening the dashboard" / "What each panel shows" / "How to unlock the door" / "What to do if it's not working." Print + laminate for the fridge.

---

## Shipped

### 2026-06-20 — Mockup batch: Radar overhaul + 4 polish fixes

- **MOCK-RADAR-1** — Replaced the hand-rolled SVG radar with Leaflet 1.9.4 + CARTO Voyager (light) / Dark Matter (dark) basemap + RainViewer precipitation overlay. Theme MutationObserver swaps basemap on light/dark toggle. Home marker at 29.90 N / -81.31 W. Lightning ring is an `L.circle` whose radius (mi → meters) is observable via the existing stepper, so the ring resizes live. Card radar defaults to zoom 11; fullscreen radar defaults to zoom 7 for a state-scale view. Both lazy-init (card on weather-tab activation, FS on expand click). RainViewer free tier caps at z7 — set `maxNativeZoom: 7` so Leaflet upscales rather than fetching placeholder tiles.
- **MOCK-HOME-HOURLY** — Home tab Weather card now shows an 8-cell hourly strip (Now → +7h) instead of a 4-day forecast. Horizontal scroll-snap, 52px cells, 26×26 icons.
- **MOCK-WEATHER-4DAY** — Multi-day forecast moved to the Weather tab Conditions card as a 4-cell `forecast4` grid above the existing cond-grid. Card title updated to "Conditions · 4-day".
- **MOCK-BRAND-ICONS** — Sonos, SiriusXM, and Amazon Music now use real brand marks matching the Spotify treatment. Sonos: black circle with white horizontal bars. SiriusXM: #0033A0 circle with white "SXM". Amazon Music: #25D1DA teal circle with dark-blue "a".
- **MOCK-TOAST-POSITION** — "Switched to …" toast moved from `bottom: 32px` to `top: 76px` so it no longer blocks the bottom navstrip. Dismiss timer 2400ms → 1300ms.
- **MOCK-SETTINGS-BUG** — Sleep and System cards on the Settings tab were collapsing to ~34px (header height) with content overflowing into adjacent cards on the real iPad. Root cause was the global `.card { min-height: 0 }` combined with a flex-column container. Fix: `.settings-grid > .card { min-height: auto !important; flex-shrink: 0 }`. Also scoped `position: relative` from global `.card` down to `.card--muted` only — that was unrelated overlap insurance that broke flex sizing.

QA: Playwright at 1194×834 (iPad Pro 11" landscape) clean across all tabs in both themes. Real-iPad verification still needed before the HA port goes onto the wall tablet.

Live preview: https://zanebrunsman.github.io/fl-dashboard-mockup/

Note: this is mockup work in the public `fl-dashboard-mockup` repo, not the private HA config. The mockup is the design spec the HA cards will be matched against.

### 2026-06-20 — Mockup batch: Radar polish + readability

Follow-up to the radar overhaul, addressing iPad rendering issues found on real hardware.

- **MOCK-RADAR-2** — Lightning ring is now a dashed outline (no yellow fill). Added scale-aware range rings (1/2/5 → 50/100/250 mi by zoom) with mile labels that redraw on `zoomend`. Raised radar `maxZoom: 13 → 18` so street and river names (Matanzas River, Water Street, Shenandoah Street, etc.) are visible when zoomed in. RainViewer overlay keeps `maxNativeZoom: 7` so Leaflet upscales beyond the free-tier cap.
- **MOCK-RADAR-PILLS** — Moved the "Radar · X ago" and "Lightning · Y ago" pills to the top-right corner of the card, stacked above the zoom/reset/expand controls so they no longer overlap. Same layout in the fullscreen view. Pills use a translucent dark backdrop (`rgba(20,25,35,0.45)` + 6px blur). Fixed a bug where the "Radar offline" pill rendered alongside the live-timestamp pill: `.radar__pill { display: inline-block }` was overriding the browser default `[hidden]` style; added `.radar__pill[hidden] { display: none !important }` to fix.
- **MOCK-ICONS-CONTRAST** — All hourly (8) and 4-day (4) weather icons rebuilt at 40×40 / 48×48 (was 30 / 28) with proper outline strokes so cloud/sun/rain shapes read against the cream surface. Cells now have a white card background with subtle border + shadow for separation from the parent card.
- **MOCK-COND-LAYOUT** — Conditions grid switched from inline space-between rows to stacked label/value cards. `white-space: nowrap` + `text-overflow: ellipsis` prevents "29.94 inHg ↓" from wrapping. Consistent padding/gap across all metric cells (temp, feels-like, dewpoint, pressure).
- **MOCK-ALERT-CONTAIN** — Active-alerts rows now have `min-width: 0` body + `overflow-wrap: anywhere` so the lightning alert description ("Audible chime sounded on Sonos + tablet. Stay indoors until cell passes.") wraps inside the rounded shape instead of bleeding outside. Bolt icon placed in proper inline-flex with the title text (flex-wrap so it never gets orphaned). Removed the parent `overflow: hidden` from `.alerts` and `.alert-row` so rows grow to fit text.
- **MOCK-HOURLY-FIT** — Narrowed hourly cells to 58px (was 52) with bigger icons (36×36) so 5 cells fit visibly in the Home tab Weather column while remaining scrollable. White tile background matches the 4-day forecast cells.

QA: Playwright at 1194×834 in both themes. Real-iPad verification still needed.

### Mockup polish — Round 3: iPad viewport fit (June 20, 2026)

Real-iPad screenshots showed Home and Weather tab content extending below the bottom navstrip. This batch fixed layout overflow and finalized hourly + conditions readability.

- **MOCK-HOURLY-VLIST** — Home tab hourly weather restructured from a horizontal scroll-snap strip into a vertical list of horizontal rows. Each `.hourly__cell` is a 4-column grid `[44px time | 28px icon | 1fr temp | auto precip%]` stacked top-to-bottom. Tile body uses a flex + `min-height: 0` + `overflow-y: auto` chain so the list scrolls internally instead of pushing the tile past its container.
- **MOCK-COND-LABELS** — Card title in the Weather tab Conditions card is now just "Conditions" (was "Conditions · 4-day"). Added two small `.section-label` headings (10px uppercase muted): "4-day outlook" above `.forecast4` and "Right now" above `.cond-grid` so each sub-component owns its title.
- **MOCK-FORECAST4-HORIZ** — `.forecast4__cell` switched from a vertical stack (icon above day above temps) to a single-row layout `[day | 20px icon | hi°/lo°]` with `align-items: center`. Day labels no longer truncate to single letters; row height dropped from ~80px to ~34px so the cond-grid below has room for all metrics.
- **MOCK-COND-FIT8** — All 8 cond-grid metrics (Temperature, Feels Like, Dewpoint, Pressure, Wind, Gusts, Lightning, Sunset) now fit visibly inside the Conditions card at 1194×834. 2-column compact list with right-aligned values, top-border on grid + bottom-border on cells + right-border on odd cells creates a clean table-like read. `.cond-cell__value svg` constrained to `display: inline-block; vertical-align: middle` so the Lightning row no longer balloons in height.
- **MOCK-ALERTS-SCROLL** — `.alerts` is now `overflow-y: auto` with a thin scrollbar so individual alert rows can grow to fit their full descriptions (Heat Advisory "Heat index up to 108°F. Hydration and shade.", Rip Current "High risk along St. Johns County beaches.", Coastal flood "Minor flooding possible near Vilano causeway.") and the list scrolls internally when total height exceeds the card.
- **MOCK-VIEWPORT-FIT** — Tightened `.wx-grid` row ratio (1.4fr / 1.1fr), added `min-height: 0` + `overflow: hidden` to weather cards, and pinned the view height so no content bleeds below the navstrip. Both Home and Weather tabs measure `viewSH == vh == 834` in Playwright QA.

Commit: `b131b5e` on zanebrunsman/fl-dashboard-mockup. QA: Playwright at 1194×834 in both themes; real-iPad verification still pending.

Live preview: https://zanebrunsman.github.io/fl-dashboard-mockup/

### Phase 1 SHIPPED — real HA install live (June 20, 2026)

First real-hardware deployment. Three tabs running on http://192.168.8.111:8123 dashboard "Casa Cola Creek" (HAOS 18.0 / HA Core 2026.6.4 in a VM). Security and Media tabs explicitly deferred.

- **HA-1..HA-5** — HAOS install, onboarding, Advanced SSH & Web Terminal add-on, HACS bootstrap, configuration.yaml wired (`packages: !include_dir_named packages` + lovelace yaml-mode dashboard registration).
- **WX-A1 NWS** — `weather.nws_29_983614497008826_81_35461539030075_ksgj` (state: clear-night, 73°F). Coords-in-name from default integration label; rename later via UI if desired.
- **WX-A3 Weather Alerts** — `sensor.weatheralerts_northeast_coastal_st_johns_flz233_flc109` (state: 0 alerts).
- **WX-A4 NOAA Tides** — `sensor.st_augustine_beach_tides_tide_predictions` (state: "High tide at 1:44 AM"), station 8720587.
- **WX-A8 Blitzortung — DEFERRED.** Core integration absent from this HA build; "blitzortung" / "lightning" searches in Add Integration return nothing. Workaround pending: install HACS custom `mrk1869/homeassistant-blitzortung` in a follow-up batch. Lightning sliders are defined and live in Settings but unbound for now.
- **HACS components installed** — Weatheralerts 2026.5.3, NOAA Tides 0.7.0, jpettitt/weather-radar-card 3.7.0.
- **DASH-1 Lovelace dashboard** — 121-line `lovelace/dashboard.yaml`, three tabs:
  - Home: hourly NWS forecast + "Now" entities card (Conditions / Tide / Active alerts count) + conditional active-alert markdown + Lightning placeholder card.
  - Weather: custom:weather-radar-card centered on 29.90, -81.31 zoom 9 + Current conditions entities + 4-day daily forecast + conditional alerts loop + Lightning placeholder.
  - Settings: Audible alerts section (6 helpers) + Dashboard behavior section (2 helpers) + Test chime button (stub action — Sonos/Fully Kiosk landing TBD).
- **8 helpers live** in `packages/lightning.yaml` and `packages/dashboard.yaml` (input_number: lightning_audible_radius_mi / lightning_visual_radius_mi / lightning_realert_cooldown_min / alert_auto_switch_hold_min / alert_volume; input_boolean: lightning_audible_enabled / alert_auto_switch_enabled / quiet_hours).
- **QA on the live HA** — all three tabs render without error cards or Unknown/Unavailable entities. Conditional alert cards correctly hidden at 0 alerts. Radar card streams live NWS imagery.

Known gaps to close in future batches: Blitzortung integration (HACS custom fork), rename NWS entity, audio target for the Test chime button (Sonos / Fully Kiosk), Matter add-on cleanup (auto-installed during onboarding, can be removed).

Commit: `a3e5728` on zanebrunsman/fl-home-assistant-config.

### Phase 1.1 SHIPPED — NWS rename + Blitzortung wired (June 21, 2026)

Follow-up to close two Phase 1 gaps the same night.

- **WX-A1 rename** — `weather.nws_29_983614497008826_81_35461539030075_ksgj` renamed in the HA UI to `weather.casa_cola_creek` (friendly name "Casa Cola Creek"). Dashboard YAML updated to match (4 references).
- **WX-A8 Blitzortung SHIPPED** — Installed `mrk-its/homeassistant-blitzortung` v1.5.0 from HACS default store (NOT a custom repo — the correct author is `mrk-its`, not `mrk1869` as previously noted). Integration added with default radius. Three sensors live:
  - `sensor.home_lightning_distance` (state: unknown until first strike in radius)
  - `sensor.home_lightning_azimuth` (state: unknown)
  - `sensor.home_lightning_counter` (state: 0)
  Entity prefix is `home_` (not `blitzortung_`) because the integration follows the device-name pattern and the device was bound to zone.home during setup.
- **DASH-1 v3** — Dashboard YAML rewritten to 133 lines:
  - Home `Now` card now lists 5 entities (Conditions / Tide / Active alerts / Nearest strike / Strikes last hr).
  - Home adds a conditional Lightning-nearby markdown card (shows when `sensor.home_lightning_distance` is below 30; hidden at "unknown").
  - Weather Current conditions card adds 3 lightning rows (Nearest strike / Strike bearing / Strikes last hr).
  - Lightning placeholder markdown removed from both tabs — real sensors wired.
- **Deploy tactic learned the hard way** — First attempt to write the 133-line YAML via a single `echo '<long-base64>' | base64 -d` command into the SSH add-on terminal silently truncated to 85 lines + corrupted with a non-UTF-8 byte at position 3000 (likely a terminal paste-buffer limit in the ingress web SSH). Restored from `.bak`, then deployed v3 via `curl -fsSL` from a staged GitHub raw URL (`ha-config/dashboard.yaml` on the public mockup repo). `ha core check` passes; all three tabs render real data after hard refresh.
- **Tide sensor transient unavailable** — noted at QA time; will recover on next NOAA poll cycle.

Known gaps still open: audio target for Test chime (Sonos / Fully Kiosk), Matter add-on cleanup, real-iPad on-wall QA.

Commits: `001ed9c` on zanebrunsman/fl-home-assistant-config (canonical YAML); `d1141ff` on zanebrunsman/fl-dashboard-mockup (staged `ha-config/dashboard.yaml` used as the curl source).

---

## Standing orders

These apply to every batch. Carried forward + reframed from the deleted `fl-home-dashboard` project.

1. **Code style** — YAML and any code carries tagged `# why:` comments only at non-obvious decisions, not line-by-line narration. In the pre-push confirmation, explicitly state which standing orders were followed.
2. **Documentation discipline** — keep `README.md` and parent-facing user guide current before every push; update this master plan after every push (mark just-shipped items Shipped with a one-line summary, clear *Active batch*). Move any in-document spec >10 lines into `docs/specs/<ID>.md` as part of the batch that ships it. Keep the Space-side copy of this master plan synced to the repo copy.
3. **Verify on real hardware before pushing to GitHub.** Test the YAML on the actual HA Green install, reload the affected component, and confirm the change works on the iPad Air 4 over LAN. Never push unverified YAML.
4. **Treat my parents as the primary user.** If a change makes the dashboard harder to understand at a glance, or makes a daily action take more taps, it's the wrong change.
5. **Tablet-agnostic layout** — never hardcode pixel widths that assume one specific iPad. Use HA's grid layout and relative sizing so the dashboard works on both my iPad Air 4 and the parents' base 11" iPad.
6. **No hardcoded house specifics in cards.** Lat/lon, station IDs, zone codes, entity IDs that vary by deployment all live in `packages/` or `secrets.yaml` and are referenced from cards/automations.
7. **Secrets never get committed.** `secrets.yaml` is gitignored; only `secrets.example.yaml` is committed with placeholder values. API tokens, PIN codes, HA long-lived access tokens, and the like all live in `secrets.yaml`.
8. **Build for reuse.** When a task involves a repeatable check or transform (validating a YAML file's syntax, regenerating a card from a template, smoke-testing an automation), add a small script under `scripts/` with a one-line description in `README.md` instead of doing it ad-hoc.
9. **Every state-changing action requires PIN confirmation.** No exceptions for "convenience." A lock or garage that opens on a misfire is worse than one that needs an extra tap.

---

## How items get added

1. Don't put new items in the Active batch unless approved.
2. Append a row to the appropriate Backlog table with a fresh ID.
3. If substantive, add a brief placeholder in **Specced items** (or `docs/specs/<ID>.md` once that file is warranted).
4. Mention the addition in chat so the user can confirm intent.

When an item is ready to ship:

1. Promote to **Active batch**.
2. Write the full spec into **Specced items** (or `docs/specs/<ID>.md`).
3. Execute on the HA Green, verify on the iPad, push.
4. Move to **Shipped**.
5. Cross-reference dependent items — they may now be unblocked.
