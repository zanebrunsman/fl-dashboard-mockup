#!/usr/bin/env python3
"""
Single-shot repair script. Run on HA host (it has yaml + access to /config).

Does in one go:
  0. Installs /config/www/radar.html (self-contained Leaflet page)
  1. Replaces existing radar card on Weather tab with iframe-based card
  2. Ensures the tide chart exists on Weather tab (re-appends if missing)
  3. Ensures the radar-fs subview exists with subview: true + iframe FS card
  4. Backs up the storage file first
  5. Bumps minor_version to nudge HA cache
"""
import json, yaml, shutil, sys, os, urllib.request, time

LOVELACE = "/config/.storage/lovelace.lovelace-fl"
BACKUP   = LOVELACE + f".bak.{int(time.time())}"

BASE = "https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2"
RADAR_YAML    = BASE + "/dashboard/radar_card.yaml"
RADAR_FS_YAML = BASE + "/dashboard/radar_fs_card.yaml"
TIDE_YAML     = BASE + "/dashboard/tide_chart_card.yaml"
RADAR_HTML    = BASE + "/www/radar.html"

WWW_DIR = "/config/www"
RADAR_HTML_PATH = os.path.join(WWW_DIR, "radar.html")

def fetch_text(url):
    print(f"  fetching {url}")
    with urllib.request.urlopen(url, timeout=15) as r:
        return r.read().decode()

def fetch_yaml(url):
    return yaml.safe_load(fetch_text(url))

print("=== STEP 0: backup ===")
shutil.copy(LOVELACE, BACKUP)
print(f"  backup -> {BACKUP}")

print("=== STEP 0b: install /config/www/radar.html ===")
os.makedirs(WWW_DIR, exist_ok=True)
try:
    html = fetch_text(RADAR_HTML)
    with open(RADAR_HTML_PATH, "w") as f:
        f.write(html)
    print(f"  wrote {RADAR_HTML_PATH} ({len(html)} bytes)")
except Exception as e:
    print(f"  ERROR fetching/writing radar.html: {e}")
    sys.exit(1)

print("=== STEP 1: load storage ===")
with open(LOVELACE) as f:
    store = json.load(f)
views = store["data"]["config"]["views"]
print(f"  views: {len(views)}")
for i, v in enumerate(views):
    print(f"   [{i}] path={v.get('path')} subview={v.get('subview')} title={v.get('title')}")

print("=== STEP 2: fetch card YAMLs ===")
radar_card    = fetch_yaml(RADAR_YAML)
radar_fs_card = fetch_yaml(RADAR_FS_YAML)
tide_card     = fetch_yaml(TIDE_YAML)
print("  ok")

def is_radar_card(card):
    if not isinstance(card, dict): return False
    t = card.get("type", "")
    if t == "custom:weather-radar-card": return True
    if t == "custom:html-template-card":
        content = card.get("content", "") or ""
        # match either old (radar-map div) or new (radar-iframe) variants
        return ("radar-map" in content) or ("radar-iframe" in content)
    return False

def is_tide_card(card):
    if not isinstance(card, dict): return False
    if card.get("type", "") == "custom:apexcharts-card":
        s = card.get("series") or []
        return any("tide_predictions" in (sr.get("entity") or "") for sr in s if isinstance(sr, dict))
    return False

def walk_cards(node, on_card):
    if isinstance(node, dict):
        for k, v in list(node.items()):
            if k == "cards" and isinstance(v, list):
                for i, c in enumerate(v):
                    on_card(v, i, c)
                    walk_cards(c, on_card)
            else:
                walk_cards(v, on_card)
    elif isinstance(node, list):
        for item in node:
            walk_cards(item, on_card)

print("=== STEP 3: replace radar card on Weather tab ===")
weather_view = None
for v in views:
    if v.get("path") == "weather":
        weather_view = v
        break
if not weather_view:
    print("  ERROR: no view with path=weather found"); sys.exit(1)

replaced = 0
def replace_radar(container, idx, card):
    global replaced
    if is_radar_card(card):
        container[idx] = radar_card
        replaced += 1
walk_cards(weather_view, replace_radar)
print(f"  replaced radar cards: {replaced}")

if replaced == 0:
    sections = weather_view.get("sections", [])
    if sections:
        sections[0].setdefault("cards", []).insert(0, radar_card)
        print("  no existing radar found; prepended new radar card to weather section 0")
    else:
        weather_view.setdefault("cards", []).insert(0, radar_card)
        print("  no existing radar found; prepended to weather.cards")

print("=== STEP 4: ensure tide chart on Weather tab ===")
has_tide = [False]
def check_tide(container, idx, card):
    if is_tide_card(card): has_tide[0] = True
walk_cards(weather_view, check_tide)
if has_tide[0]:
    print("  tide chart already present (re-appending fresh copy to ensure visibility)")
    # Re-append: remove existing tide card and add a fresh one at end
    def strip_tide(container, idx, card):
        if is_tide_card(card):
            container[idx] = None  # mark for removal
    walk_cards(weather_view, strip_tide)
    # cleanup Nones
    def cleanup_nones(node):
        if isinstance(node, dict):
            for k, v in list(node.items()):
                if k == "cards" and isinstance(v, list):
                    node[k] = [c for c in v if c is not None]
                    for c in node[k]:
                        cleanup_nones(c)
                else:
                    cleanup_nones(v)
        elif isinstance(node, list):
            for item in node:
                cleanup_nones(item)
    cleanup_nones(weather_view)

sections = weather_view.get("sections", [])
if sections:
    sections[0].setdefault("cards", []).append(tide_card)
    print("  tide chart (re-)appended to weather section 0")
else:
    weather_view.setdefault("cards", []).append(tide_card)
    print("  tide chart (re-)appended to weather.cards")

print("=== STEP 5: ensure radar-fs subview ===")
fs_view = None
for v in views:
    if v.get("path") == "radar-fs":
        fs_view = v
        break

if fs_view is None:
    print("  creating new radar-fs subview")
    fs_view = {
        "title": "Radar",
        "path": "radar-fs",
        "icon": "mdi:radar",
        "subview": True,
        "type": "sections",
        "max_columns": 1,
        "sections": [{"type": "grid", "cards": [radar_fs_card]}],
    }
    views.append(fs_view)
else:
    print("  radar-fs exists; normalizing")
    fs_view["subview"] = True
    fs_view["path"] = "radar-fs"
    fs_view["title"] = "Radar"
    fs_view["icon"] = "mdi:radar"
    fs_view["type"] = "sections"
    fs_view["max_columns"] = 1
    fs_view["sections"] = [{"type": "grid", "cards": [radar_fs_card]}]
    if "cards" in fs_view:
        del fs_view["cards"]

print("=== STEP 6: persist ===")
# Bump minor_version so HA invalidates its cached copy
store["minor_version"] = store.get("minor_version", 1) + 1
with open(LOVELACE, "w") as f:
    json.dump(store, f, indent=2)
print(f"  wrote {LOVELACE}  (minor_version -> {store['minor_version']})")

print("=== STEP 7: diag — tide sensor state ===")
try:
    import subprocess
    # try to dump tide sensor state via HA CLI if available; otherwise skip
    r = subprocess.run(["ha", "core", "info"], capture_output=True, text=True, timeout=5)
    print(f"  ha core info rc={r.returncode}")
except Exception as e:
    print(f"  (skip ha CLI) {e}")

print("=== DONE ===")
print("In the browser:")
print("  1. Close ALL HA tabs (forces fresh /lovelace/config WS fetch on reopen)")
print("  2. Open http://192.168.8.111:8123/lovelace-fl/weather")
print("  3. If still cached, restart HA from Settings → System → Restart")
print(f"Backup at {BACKUP}")
