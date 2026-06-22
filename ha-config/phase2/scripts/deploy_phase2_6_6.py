#!/usr/bin/env python3
"""
Phase 2.6.6 deploy — radar fullscreen via dedicated subview.

What this does:
  1. Backup .storage/lovelace.lovelace-fl
  2. Replace the Weather view (now has tappable "Radar  · tap to expand" button)
  3. Add (or replace) the /radar subview — panel-layout full-bleed iframe with
     auto back-arrow header (subview: true)

Safe to re-run.
"""

import json
import shutil
import time
import urllib.request
from pathlib import Path

REPO = "https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main"
PHASE = f"{REPO}/ha-config/phase2"

STORAGE = Path("/config/.storage")
BACKUP_SUFFIX = f".bak.{int(time.time())}"


def fetch_yaml(path):
    import yaml
    url = f"{PHASE}/{path}"
    print(f"  fetching {url}")
    with urllib.request.urlopen(url) as r:
        return yaml.safe_load(r.read().decode("utf-8"))


def main():
    print("=== Phase 2.6.6 deploy: radar subview + tap-to-expand ===")
    storage = STORAGE / "lovelace.lovelace-fl"
    if not storage.exists():
        print(f"  ERROR: {storage} not found")
        return

    backup = Path(str(storage) + BACKUP_SUFFIX)
    shutil.copy2(storage, backup)
    print(f"  backup -> {backup.name}")

    data = json.loads(storage.read_text())
    views = data.get("data", {}).get("config", {}).get("views", [])
    print(f"  views before: {len(views)}")
    for i, v in enumerate(views):
        print(f"    [{i}] path={v.get('path')} subview={v.get('subview')} title={v.get('title')}")

    # 1. Replace Weather view
    new_weather = fetch_yaml("dashboard/weather_view.yaml")
    replaced = False
    for i, v in enumerate(views):
        if v.get("path") == "weather":
            views[i] = new_weather
            print(f"  replaced view[{i}] (weather)")
            replaced = True
            break
    if not replaced:
        print("  WARN: weather view not found")

    # 2. Add or replace /radar subview
    new_radar = fetch_yaml("dashboard/radar_subview.yaml")
    radar_idx = None
    for i, v in enumerate(views):
        if v.get("path") == "radar":
            radar_idx = i
            break
    if radar_idx is not None:
        views[radar_idx] = new_radar
        print(f"  replaced view[{radar_idx}] (radar subview)")
    else:
        views.append(new_radar)
        print(f"  appended radar subview at index {len(views)-1}")

    data["data"]["config"]["views"] = views
    storage.write_text(json.dumps(data, indent=2))
    print(f"  saved {storage}")
    print()
    print(f"  views after: {len(views)}")
    for i, v in enumerate(views):
        print(f"    [{i}] path={v.get('path')} subview={v.get('subview')}")
    print()
    print("=== DONE ===")
    print("Hard-reload the iPad dashboard (force-quit HA app, reopen).")
    print()
    print("Subviews don't show in the tab bar by design. To open the radar")
    print("full-screen, tap the 'Radar · tap to expand' button on the Weather tab.")


if __name__ == "__main__":
    main()
