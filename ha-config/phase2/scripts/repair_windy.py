#!/usr/bin/env python3
"""
Windy pivot repair script.

Replaces the broken html-template-card srcdoc radar with HA-native iframe
cards pointing at Windy.com embed. Adds a separate spot-forecast iframe,
a numeric range-ring readout card, and drops the radar-fs subview.

Run from HA terminal:
  curl -fsSL https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2/scripts/repair_windy.py | python3
"""
import json, yaml, shutil, sys, os, urllib.request, time

LOVELACE = "/config/.storage/lovelace.lovelace-fl"
BACKUP   = LOVELACE + f".bak.{int(time.time())}"

BASE = "https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main/ha-config/phase2"
WINDY_MAP_YAML  = BASE + "/dashboard/windy_map_card.yaml"
WINDY_FCST_YAML = BASE + "/dashboard/windy_forecast_card.yaml"
RING_YAML       = BASE + "/dashboard/ring_readout_card.yaml"
TIDE_YAML       = BASE + "/dashboard/tide_chart_card.yaml"

def fetch_text(url):
    print(f"  fetching {url}")
    with urllib.request.urlopen(url, timeout=15) as r:
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

print("=== STEP 2: fetch card YAMLs ===")
map_card  = fetch_yaml(WINDY_MAP_YAML)
fcst_card = fetch_yaml(WINDY_FCST_YAML)
ring_card = fetch_yaml(RING_YAML)
tide_card = fetch_yaml(TIDE_YAML)
print("  ok")

def is_old_radar(card):
    """Match any prior radar variant we want to remove."""
    if not isinstance(card, dict): return False
    t = card.get("type", "")
    if t == "custom:weather-radar-card": return True
    if t == "custom:html-template-card":
        content = card.get("content", "") or ""
        return ("radar-map" in content) or ("radar-iframe" in content) or ("radar.html" in content)
    # also remove any earlier iframe-with-/local/radar.html
    if t == "iframe":
        url = card.get("url", "") or ""
        if "/local/radar" in url:
            return True
    return False

def is_windy_map(card):
    if not isinstance(card, dict): return False
    if card.get("type") != "iframe": return False
    url = card.get("url", "") or ""
    return "embed.windy.com" in url and "type=map" in url

def is_windy_forecast(card):
    if not isinstance(card, dict): return False
    if card.get("type") != "iframe": return False
    url = card.get("url", "") or ""
    return "embed.windy.com" in url and "type=forecast" in url

def is_ring_readout(card):
    if not isinstance(card, dict): return False
    if card.get("type") != "horizontal-stack": return False
    inner = card.get("cards") or []
    return any(
        isinstance(c, dict)
        and c.get("type") == "custom:mushroom-template-card"
        and "lightning_audible_radius_mi" in (c.get("secondary") or "")
        for c in inner
    )

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

def remove_matching(view, pred):
    """Remove all cards matching pred; returns count removed."""
    removed = [0]
    def mark(container, idx, card):
        if pred(card):
            container[idx] = None
            removed[0] += 1
    walk_cards(view, mark)
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
    cleanup_nones(view)
    return removed[0]

print("=== STEP 3: find Weather view ===")
weather_view = None
for v in views:
    if v.get("path") == "weather":
        weather_view = v
        break
if not weather_view:
    print("  ERROR: no view with path=weather found"); sys.exit(1)

print("=== STEP 4: remove old radar variants ===")
n = remove_matching(weather_view, is_old_radar)
print(f"  removed {n} old radar cards")

print("=== STEP 5: remove existing Windy/ring/tide cards (idempotent re-add) ===")
n_map  = remove_matching(weather_view, is_windy_map)
n_fcst = remove_matching(weather_view, is_windy_forecast)
n_ring = remove_matching(weather_view, is_ring_readout)
n_tide = remove_matching(weather_view, is_tide_card)
print(f"  removed: windy_map={n_map} windy_fcst={n_fcst} ring={n_ring} tide={n_tide}")

print("=== STEP 6: insert new cards in order: windy_map, ring, windy_forecast, tide ===")
sections = weather_view.get("sections", [])
if sections:
    target = sections[0].setdefault("cards", [])
    target.insert(0, map_card)
    target.insert(1, ring_card)
    target.insert(2, fcst_card)
    target.append(tide_card)
    print("  inserted into weather section 0")
else:
    target = weather_view.setdefault("cards", [])
    target.insert(0, map_card)
    target.insert(1, ring_card)
    target.insert(2, fcst_card)
    target.append(tide_card)
    print("  inserted into weather.cards")

print("=== STEP 7: drop radar-fs subview (Windy has its own fullscreen) ===")
before = len(views)
views[:] = [v for v in views if v.get("path") != "radar-fs"]
after = len(views)
print(f"  views: {before} -> {after}")

print("=== STEP 8: persist ===")
store["minor_version"] = store.get("minor_version", 1) + 1
with open(LOVELACE, "w") as f:
    json.dump(store, f, indent=2)
print(f"  wrote {LOVELACE}  (minor_version -> {store['minor_version']})")

print("=== DONE ===")
print("In the browser:")
print("  1. Close ALL HA tabs")
print("  2. Open http://192.168.8.111:8123/lovelace-fl/weather")
print("  3. If still cached, restart HA from Settings -> System -> Restart")
