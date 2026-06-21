# Casa Cola Creek Dashboard Mockup

Visual mockup for an iPad-mounted Home Assistant dashboard at Casa Cola Creek
(St. Augustine, FL). Built as a static site for design review — no live data;
all readouts are placeholders unless explicitly wired (clock + sleep clock are
live).

**Live demo:** https://zanebrunsman.github.io/fl-dashboard-mockup/

## Features

- Five tabs: Home, Weather, Security, Media, Settings
- Light / dark theme with auto-switch toggle
- iOS Add-to-Home-Screen ready (manifest + apple-touch-icon)
- Sleep mode with bedside-clock view
- Demo data badge in every topbar
- LG OLED C6H TV control surface (power / volume / mute / HDMI inputs)
- Sonos source picker with gated Up Next queue
- App launchers: Sonos, Spotify, SiriusXM, Amazon Music
- Alert priority drag-list and per-alert audible toggles
- Numeric steppers for lightning chime radius (1-30 mi) and re-alert cooldown
  (0-120 min)
- Real Date() wiring for clock, sleep clock, freshness pills

## Files

- `index.html` — markup for all five tabs + sleep view
- `styles.css` — full design system (tokens, components, theme inversion)
- `app.js` — tab routing, theme toggle, clock, sleep, media, steppers
- `assets/` — camera placeholders, app icons
- `manifest.webmanifest` — PWA manifest for Add-to-Home-Screen

## Pending (next session)

- Live radar with Leaflet + CARTO Voyager basemap + RainViewer overlay +
  Blitzortung lightning strikes (currently a stylized SVG placeholder)
- Apple Music launcher (replace Amazon Music if Dad prefers)
