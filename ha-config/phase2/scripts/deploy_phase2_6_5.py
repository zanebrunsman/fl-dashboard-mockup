#!/usr/bin/env python3
"""
Phase 2.6.5 deploy — radar uses grid_options.rows (taller) + fullscreen button.

Replaces just the Weather view in lovelace.lovelace-fl with the new version.
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


def main():
    print("=== Phase 2.6.5 deploy: taller radar + fullscreen button ===")
    storage = STORAGE / "lovelace.lovelace-fl"
    if not storage.exists():
        print(f"  ERROR: {storage} not found")
        return

    # Backup
    backup = Path(str(storage) + BACKUP_SUFFIX)
    shutil.copy2(storage, backup)
    print(f"  backup -> {backup.name}")

    # Fetch new weather_view
    import yaml
    url = f"{PHASE}/dashboard/weather_view.yaml"
    print(f"  fetching {url}")
    with urllib.request.urlopen(url) as r:
        new_weather = yaml.safe_load(r.read().decode("utf-8"))

    # Replace view by path
    data = json.loads(storage.read_text())
    views = data.get("data", {}).get("config", {}).get("views", [])
    replaced = False
    for i, v in enumerate(views):
        if v.get("path") == "weather":
            views[i] = new_weather
            print(f"  replaced view[{i}] (weather)")
            replaced = True
            break
    if not replaced:
        print("  WARN: weather view not found")
        return

    data["data"]["config"]["views"] = views
    storage.write_text(json.dumps(data, indent=2))
    print(f"  saved {storage}")
    print()
    print("=== DONE ===")
    print("Hard-reload the iPad dashboard (force-quit HA app, reopen).")


if __name__ == "__main__":
    main()
