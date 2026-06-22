#!/usr/bin/env python3
"""
Phase 2.6 deploy: 8 fixes from screenshots.

  1. Theme switch v2 (browser_mod.set_theme bypass per-user override)
  2. Separate iOS-style UV chart (gradient fill)
  3. Separate AQI chart (EPA color band)
  4. YouTube cams use youtube-nocookie.com (fixes Error 153)
  5. FL511 uses /Map/EmbeddedMap endpoint (fixes full-site takeover)
  6. Tide chart data_generator parses `predictions` list of {t,v}
  7. Convert Home + Settings to sections+grid layout like Weather
  8. Radar moved to narrower/taller col-1 slot; rings card removed;
     AQI/UV merged into Current conditions

Run from HA terminal:
  curl -fsSL https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2/scripts/repair_phase2_6.py | python3
"""
import json, yaml, shutil, sys, os, urllib.request, time, pathlib

LOVELACE = "/config/.storage/lovelace.lovelace-fl"
BACKUP   = LOVELACE + f".bak.{int(time.time())}"
PKG_DIR  = "/config/packages"

BASE = "https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2"
HOME_YAML     = BASE + "/dashboard/home_view.yaml"
WEATHER_YAML  = BASE + "/dashboard/weather_view.yaml"
SECURITY_YAML = BASE + "/dashboard/security_view.yaml"
SETTINGS_YAML = BASE + "/dashboard/settings_view.yaml"
THEME_PKG_YAML = BASE + "/packages/theme_switch.yaml"

def fetch_text(url):
    print(f"  fetching {url}")
    with urllib.request.urlopen(url, timeout=20) as r:
        return r.read().decode()

def fetch_yaml(url):
    return yaml.safe_load(fetch_text(url))

def replace_or_append(views, new_view, path):
    for i, v in enumerate(views):
        if v.get("path") == path:
            views[i] = new_view
            print(f"  replaced view[{i}] ({path})")
            return
    # append before any subviews
    insert_at = len(views)
    for i, v in enumerate(views):
        if v.get("subview") is True:
            insert_at = i; break
    views.insert(insert_at, new_view)
    print(f"  inserted {path} at index {insert_at}")

print("=== STEP 0: backup ===")
shutil.copy(LOVELACE, BACKUP)
print(f"  backup -> {BACKUP}")

print("=== STEP 1: load storage ===")
with open(LOVELACE) as f:
    store = json.load(f)
views = store["data"]["config"]["views"]
print(f"  views: {len(views)}")
for i, v in enumerate(views):
    print(f"   [{i}] path={v.get('path')} subview={v.get('subview')} title={v.get('title')}")

print("=== STEP 2: fetch new views ===")
home_view     = fetch_yaml(HOME_YAML)
weather_view  = fetch_yaml(WEATHER_YAML)
security_view = fetch_yaml(SECURITY_YAML)
settings_view = fetch_yaml(SETTINGS_YAML)
print("  ok")

print("=== STEP 3: replace/insert views ===")
# Maintain order: home, weather, security, settings (preserving any subviews)
replace_or_append(views, home_view, "home")
replace_or_append(views, weather_view, "weather")
replace_or_append(views, security_view, "security")
replace_or_append(views, settings_view, "settings")

# Reorder: ensure home, weather, security, settings come first in that order
desired = ["home", "weather", "security", "settings"]
def sort_key(v):
    p = v.get("path")
    if p in desired:
        return (0, desired.index(p))
    if v.get("subview") is True:
        return (2, 0)
    return (1, 0)
views.sort(key=sort_key)
print("  reordered views:")
for i, v in enumerate(views):
    print(f"   [{i}] path={v.get('path')} subview={v.get('subview')}")

print("=== STEP 4: write theme_switch package ===")
pathlib.Path(PKG_DIR).mkdir(parents=True, exist_ok=True)
dst = os.path.join(PKG_DIR, "theme_switch.yaml")
txt = fetch_text(THEME_PKG_YAML)
with open(dst, "w") as f:
    f.write(txt)
print(f"  wrote {dst} ({len(txt)} bytes)")

print("=== STEP 5: persist lovelace ===")
store["minor_version"] = store.get("minor_version", 1) + 1
with open(LOVELACE, "w") as f:
    json.dump(store, f, indent=2)
print(f"  wrote {LOVELACE} (minor_version -> {store['minor_version']})")

print()
print("=== DONE ===")
print("Required follow-up in HA UI:")
print("  1. Settings -> Developer tools -> YAML -> Reload Automations")
print("     (picks up new theme_switch.yaml)")
print("  2. Hard reload the dashboard (Cmd+Shift+R / pull-to-refresh)")
print("  3. Open /lovelace-fl/weather and verify:")
print("     - Radar in LEFT column, taller; right side has stacked charts")
print("     - Separate UV chart (gradient) and AQI chart (gradient)")
print("     - No Lightning rings card; AQI/UV inside Current conditions")
print("     - Tide chart shows actual data (not 'Loading...')")
print("  4. Open /lovelace-fl/security - YouTube cams should load (no Error 153)")
print("     and FL511 should show the embedded map (not full site)")
print("  5. Open /lovelace-fl/settings -> change Theme mode")
print("     If still no swap, set /profile -> Theme = Auto")
