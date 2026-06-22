#!/usr/bin/env python3
"""
Phase 2.6.1 deploy: follow-up fixes from second screenshot batch.

Fixes:
  1. Home tab: drop duplicated hourly hero (was redundant with Now entities)
  2. Weather tab: radar aspect_ratio 110% -> 180% (taller, still col 1)
  3. Security tab: YouTube cams use custom:youtube-video-card (HACS, fixes Error 153)
     + replace FL511 iframe with link-out + Windy FDOT I-95 cams (clean embed)
  4. Settings tab: add Light/Dark/Auto buttons (script targets browser_id THIS)
  5. theme_switch v3: dedicated script using browser_mod with browser_id THIS

Prereq:
  - HACS card "YouTube Video Card" (by loryanstrant) must be installed.
    The deploy script attempts to register the lovelace resource automatically
    if not already present, but the card files themselves must be downloaded
    via HACS first.

Run from HA terminal:
  curl -fsSL https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2/scripts/repair_phase2_6_1.py | python3
"""
import json, yaml, shutil, sys, os, urllib.request, time, pathlib

LOVELACE = "/config/.storage/lovelace.lovelace-fl"
RESOURCES_STORE = "/config/.storage/lovelace_resources"
BACKUP   = LOVELACE + f".bak.{int(time.time())}"
PKG_DIR  = "/config/packages"

BASE = "https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2"
HOME_YAML     = BASE + "/dashboard/home_view.yaml"
WEATHER_YAML  = BASE + "/dashboard/weather_view.yaml"
SECURITY_YAML = BASE + "/dashboard/security_view.yaml"
SETTINGS_YAML = BASE + "/dashboard/settings_view.yaml"
THEME_PKG_YAML = BASE + "/packages/theme_switch.yaml"

YT_CARD_URL = "/hacsfiles/ha-youtubevideocard/youtube-video-card.js"

def fetch_text(url):
    print(f"  fetching {url}")
    with urllib.request.urlopen(url, timeout=20) as r:
        return r.read().decode()

def fetch_yaml(url):
    return yaml.safe_load(fetch_text(url))

def replace_or_insert(views, new_view, path):
    for i, v in enumerate(views):
        if v.get("path") == path:
            views[i] = new_view
            print(f"  replaced view[{i}] ({path})")
            return
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

print("=== STEP 3: replace views ===")
replace_or_insert(views, home_view, "home")
replace_or_insert(views, weather_view, "weather")
replace_or_insert(views, security_view, "security")
replace_or_insert(views, settings_view, "settings")

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

print("=== STEP 5: register YouTube Video Card resource (if needed) ===")
try:
    with open(RESOURCES_STORE) as f:
        res_store = json.load(f)
    res_items = res_store["data"]["items"]
    already = any("youtube-video-card" in (it.get("url") or "") for it in res_items)
    if already:
        print("  youtube-video-card resource already registered, skipping")
    else:
        new_id = str(int(time.time()))
        res_items.append({
            "id": new_id,
            "type": "module",
            "url": YT_CARD_URL,
        })
        shutil.copy(RESOURCES_STORE, RESOURCES_STORE + f".bak.{int(time.time())}")
        with open(RESOURCES_STORE, "w") as f:
            json.dump(res_store, f, indent=2)
        print(f"  registered resource: {YT_CARD_URL}")
        print(f"  NOTE: install the HACS card 'YouTube Video Card' (by loryanstrant)")
        print(f"        BEFORE reloading the dashboard, otherwise cards show 'card not found'")
except FileNotFoundError:
    print("  WARN: lovelace_resources store not found — register manually:")
    print("        Settings -> Dashboards -> 3-dot menu -> Resources -> Add Resource")
    print(f"        URL: {YT_CARD_URL}  Type: JavaScript Module")
except Exception as e:
    print(f"  WARN: could not edit resources store: {e}")

print("=== STEP 6: persist lovelace ===")
store["minor_version"] = store.get("minor_version", 1) + 1
with open(LOVELACE, "w") as f:
    json.dump(store, f, indent=2)
print(f"  wrote {LOVELACE} (minor_version -> {store['minor_version']})")

print()
print("=== DONE ===")
print("Required follow-up:")
print("  1. HACS -> Frontend -> + Explore & Download Repositories")
print("     Search 'YouTube Video Card' (by loryanstrant) -> Download")
print("  2. Settings -> Developer tools -> YAML -> Reload Automations + Scripts")
print("  3. Hard reload the dashboard on iPad (pull-to-refresh long press)")
print()
print("Verify:")
print("  - /lovelace-fl/home  -> hourly hero + Now (no duplicate)")
print("  - /lovelace-fl/weather -> radar fills left column (much taller)")
print("  - /lovelace-fl/security -> YouTube cams play (no Error 153)")
print("  - /lovelace-fl/settings -> tap Light/Dark/Auto buttons; theme swaps")
print()
print("If theme STILL doesn't swap on iPad:")
print("  - Settings -> Browser Mod -> confirm this iPad shows up with Register ON")
print("  - /profile (lower-left avatar) -> set Theme = Auto")
