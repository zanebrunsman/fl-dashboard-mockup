#!/usr/bin/env python3
"""
Phase 2.5 deploy: layout reflow + AQI/UV + security tab + lightning fallback + theme fix.

Steps:
  1. Backup lovelace storage
  2. Download new view YAMLs (weather_view, security_view)
  3. Replace the entire 'weather' view with the new grid layout
  4. Add new 'security' view (or replace if exists)
  5. Drop any stale radar-fs subview
  6. Write helper packages (aqi_uv, lightning_fallback) to /config/packages/
  7. Persist storage + bump minor_version
  8. Reminder to reload YAML + restart for REST sensors

Run from HA terminal:
  curl -fsSL https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2/scripts/repair_phase2_5.py | python3
"""
import json, yaml, shutil, sys, os, urllib.request, time, pathlib

LOVELACE = "/config/.storage/lovelace.lovelace-fl"
BACKUP   = LOVELACE + f".bak.{int(time.time())}"
PKG_DIR  = "/config/packages"

BASE = "https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2"
WEATHER_YAML  = BASE + "/dashboard/weather_view.yaml"
SECURITY_YAML = BASE + "/dashboard/security_view.yaml"
AQI_PKG_YAML   = BASE + "/packages/aqi_uv.yaml"
LIGHT_PKG_YAML = BASE + "/packages/lightning_fallback.yaml"
THEME_PKG_YAML = BASE + "/packages/theme_switch.yaml"

def fetch_text(url):
    print(f"  fetching {url}")
    with urllib.request.urlopen(url, timeout=20) as r:
        return r.read().decode()

def fetch_yaml(url):
    return yaml.safe_load(fetch_text(url))

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
weather_view  = fetch_yaml(WEATHER_YAML)
security_view = fetch_yaml(SECURITY_YAML)
print("  ok")

print("=== STEP 3: replace 'weather' view ===")
replaced = False
for i, v in enumerate(views):
    if v.get("path") == "weather":
        views[i] = weather_view
        replaced = True
        print(f"  replaced view[{i}] (weather)")
        break
if not replaced:
    views.append(weather_view)
    print("  appended new weather view (none existed)")

print("=== STEP 4: add/replace 'security' view ===")
found = False
for i, v in enumerate(views):
    if v.get("path") == "security":
        views[i] = security_view
        found = True
        print(f"  replaced view[{i}] (security)")
        break
if not found:
    # insert before any subviews (subview:true) so it shows in tab bar
    insert_at = len(views)
    for i, v in enumerate(views):
        if v.get("subview") is True:
            insert_at = i; break
    views.insert(insert_at, security_view)
    print(f"  inserted security view at index {insert_at}")

print("=== STEP 5: drop radar-fs subview (Windy fullscreen replaces it) ===")
before = len(views)
views[:] = [v for v in views if v.get("path") != "radar-fs"]
print(f"  views: {before} -> {len(views)}")

print("=== STEP 6: write helper packages ===")
pathlib.Path(PKG_DIR).mkdir(parents=True, exist_ok=True)
for name, url in [
    ("aqi_uv.yaml", AQI_PKG_YAML),
    ("lightning_fallback.yaml", LIGHT_PKG_YAML),
    ("theme_switch.yaml", THEME_PKG_YAML),
]:
    dst = os.path.join(PKG_DIR, name)
    txt = fetch_text(url)
    with open(dst, "w") as f:
        f.write(txt)
    print(f"  wrote {dst} ({len(txt)} bytes)")

# Ensure packages/ is included in configuration.yaml
print("=== STEP 6b: verify configuration.yaml includes packages: ===")
config_yaml = "/config/configuration.yaml"
try:
    with open(config_yaml) as f:
        cfg_txt = f.read()
    if "packages:" in cfg_txt and "packages: !include_dir_named" in cfg_txt:
        print("  packages: include already present")
    elif "homeassistant:" in cfg_txt and "packages:" not in cfg_txt:
        # inject packages line under homeassistant:
        lines = cfg_txt.splitlines(keepends=True)
        out = []
        injected = False
        for ln in lines:
            out.append(ln)
            if (not injected) and ln.startswith("homeassistant:"):
                out.append("  packages: !include_dir_named packages\n")
                injected = True
        if injected:
            shutil.copy(config_yaml, config_yaml + f".bak.{int(time.time())}")
            with open(config_yaml, "w") as f:
                f.writelines(out)
            print("  injected: packages: !include_dir_named packages under homeassistant:")
        else:
            print("  WARN: could not auto-inject packages include; please add manually")
    else:
        print("  WARN: packages: not found; please add 'packages: !include_dir_named packages' under homeassistant:")
except Exception as e:
    print(f"  WARN: could not edit configuration.yaml: {e}")

print("=== STEP 7: persist lovelace ===")
store["minor_version"] = store.get("minor_version", 1) + 1
with open(LOVELACE, "w") as f:
    json.dump(store, f, indent=2)
print(f"  wrote {LOVELACE} (minor_version -> {store['minor_version']})")

print()
print("=== DONE ===")
print("Required follow-up in HA UI:")
print("  1. Settings -> System -> Restart Home Assistant")
print("     (needed to load aqi_uv.yaml + lightning_fallback.yaml packages")
print("      and register the new REST sensors)")
print("  2. After restart, open http://192.168.8.111:8123/lovelace-fl/weather")
print("     - Radar at top (full width)")
print("     - Current conditions + Lightning rings (left column)")
print("     - Air & UV with 24h chart + Hourly forecast iframe (right column)")
print("     - Tide chart at bottom (full width)")
print("  3. Open /lovelace-fl/security for live cams + traffic map")
print("  4. AQI/UV sensors populate within ~30s after restart")
