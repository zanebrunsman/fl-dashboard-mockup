#!/usr/bin/env python3
"""
Single-shot repair script. Run on HA host (it has yaml + access to /config).

Does in one go:
  1. Replaces existing radar card on Weather tab with v3 animated YAML
  2. Ensures the tide chart exists on Weather tab (re-appends if missing)
  3. Ensures the radar-fs subview exists with subview: true + animated FS card
  4. Strips any leftover legacy custom:weather-radar-card references
  5. Backs up the storage file first
"""
import json, yaml, shutil, sys, os, urllib.request, time

LOVELACE = "/config/.storage/lovelace.lovelace-fl"
BACKUP   = LOVELACE + f".bak.{int(time.time())}"

BASE = "https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2/dashboard"
RADAR_YAML    = BASE + "/radar_card.yaml"
RADAR_FS_YAML = BASE + "/radar_fs_card.yaml"
TIDE_YAML     = BASE + "/tide_chart_card.yaml"

def fetch_yaml(url):
    print(f"  fetching {url}")
    with urllib.request.urlopen(url, timeout=15) as r:
        return yaml.safe_load(r.read().decode())

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
        # legacy/new both have radar-map div somewhere
        return "radar-map" in content
    return False

def is_tide_card(card):
    if not isinstance(card, dict): return False
    if card.get("type", "") == "custom:apexcharts-card":
        # tide chart references sensor.tide_predictions_48h
        s = card.get("series") or []
        return any("tide_predictions" in (sr.get("entity") or "") for sr in s if isinstance(sr, dict))
    return False

def walk_cards(node, on_card):
    """Yield (parent_container, key_or_index, card) for every card-like dict found."""
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

# If there was none, append it to the first section
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
    print("  tide chart already present ✓")
else:
    sections = weather_view.get("sections", [])
    if sections:
        sections[0].setdefault("cards", []).append(tide_card)
        print("  tide chart appended to weather section 0")
    else:
        weather_view.setdefault("cards", []).append(tide_card)
        print("  tide chart appended to weather.cards")

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
with open(LOVELACE, "w") as f:
    json.dump(store, f, indent=2)
print(f"  wrote {LOVELACE}")

print("=== STEP 7: nudge HA to reload lovelace storage ===")
# HA caches the dashboard in memory. Bump the storage version-ish via the
# minor_version field so HA picks it up, and also touch the on-disk mtime.
try:
    # bump minor_version inside the .storage file so HA invalidates its cache
    with open(LOVELACE) as f:
        s2 = json.load(f)
    s2["minor_version"] = s2.get("minor_version", 1) + 1
    with open(LOVELACE, "w") as f:
        json.dump(s2, f, indent=2)
    print(f"  bumped minor_version -> {s2['minor_version']}")
except Exception as e:
    print(f"  (skip) {e}")

print("=== DONE ===")
print("IMPORTANT: After running this, in the browser do:")
print("  1. Hard-refresh /lovelace-fl/weather (Ctrl+Shift+R)")
print("  2. If overlays/subview still don't appear, go to Settings → System → restart HA")
print(f"Backup at {BACKUP}")
