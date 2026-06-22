#!/usr/bin/env python3
"""
Phase 2.6.4 deploy — switch to single merged "Casa Cola Creek" theme with
automatic Light/Dark following iPad system mode. Fixes 2.6.3 YAML structure
(HA requires BOTH light: and dark: keys under modes: for the Auto selector
to appear).

What this does:
  1. Backup .storage/lovelace.lovelace-fl
  2. Fetch the new settings_view.yaml (no theme buttons) and replace view[3]
  3. Fetch the merged casa_cola_creek.yaml theme (single theme with dark mode)
     and write to /config/themes/casa_cola_creek.yaml — REPLACING the two
     separate themes
  4. Empty out /config/packages/theme_switch.yaml (no automations needed)
  5. Clean up orphan automations and input_select.theme_mode_selector
  6. (Optional) Set the user's frontend storage theme to "Casa Cola Creek" + Auto

Safe to re-run. Restart HA after running.
"""

import json
import os
import shutil
import time
import urllib.request
from pathlib import Path

REPO = "https://raw.githubusercontent.com/zanebrunsman/fl-dashboard-mockup/main"
PHASE = f"{REPO}/ha-config/phase2"

CONFIG = Path("/config")
STORAGE = CONFIG / ".storage"
BACKUP_SUFFIX = f".bak.{int(time.time())}"


def fetch(url):
    print(f"  fetching {url}")
    with urllib.request.urlopen(url) as r:
        return r.read().decode("utf-8")


def backup(path):
    if path.exists():
        b = Path(str(path) + BACKUP_SUFFIX)
        shutil.copy2(path, b)
        print(f"  backup -> {b.name}")


def write_file(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print(f"  wrote {path} ({len(content)} bytes)")


# ---------- STEP 1: lovelace dashboard ----------
def update_lovelace():
    print("=== STEP 1: update Casa Cola Creek dashboard ===")
    storage = STORAGE / "lovelace.lovelace-fl"
    if not storage.exists():
        print("  NOTE: lovelace.lovelace-fl not found — dashboard may use a different storage key")
        # try other names
        for p in STORAGE.glob("lovelace*"):
            print(f"    found: {p.name}")
        return
    backup(storage)
    data = json.loads(storage.read_text())
    views = data.get("data", {}).get("config", {}).get("views", [])
    print(f"  views found: {len(views)}")
    for i, v in enumerate(views):
        print(f"    [{i}] path={v.get('path')} title={v.get('title')}")

    # Fetch new settings_view
    import yaml
    new_settings = yaml.safe_load(fetch(f"{PHASE}/dashboard/settings_view.yaml"))

    # Find settings view by path and replace
    replaced = False
    for i, v in enumerate(views):
        if v.get("path") == "settings":
            views[i] = new_settings
            print(f"  replaced view[{i}] (settings)")
            replaced = True
            break
    if not replaced:
        print("  WARN: settings view not found by path — appending")
        views.append(new_settings)

    data["data"]["config"]["views"] = views
    storage.write_text(json.dumps(data, indent=2))
    print(f"  saved {storage}")


# ---------- STEP 2: merged theme ----------
def install_merged_theme():
    print("=== STEP 2: install merged Casa Cola Creek theme ===")
    themes_dir = CONFIG / "themes"
    themes_dir.mkdir(exist_ok=True)

    # Remove any old single-variant files
    for old in ["casa_cola_creek_light.yaml", "casa_cola_creek_dark.yaml"]:
        p = themes_dir / old
        if p.exists():
            backup(p)
            p.unlink()
            print(f"  removed old {old}")

    # Write merged theme
    content = fetch(f"{PHASE}/themes/casa_cola_creek.yaml")
    target = themes_dir / "casa_cola_creek.yaml"
    if target.exists():
        backup(target)
    write_file(target, content)

    # Make sure configuration.yaml includes themes folder
    config_yaml = CONFIG / "configuration.yaml"
    if config_yaml.exists():
        text = config_yaml.read_text()
        if "themes:" not in text:
            print("  WARN: configuration.yaml has no 'themes:' key — add manually:")
            print("    frontend:")
            print("      themes: !include_dir_merge_named themes")
        elif "themes:" in text and "!include_dir" not in text:
            print("  WARN: 'themes:' present but doesn't look like a folder include")


# ---------- STEP 3: empty theme_switch package ----------
def empty_theme_switch_package():
    print("=== STEP 3: empty theme_switch.yaml package ===")
    p = CONFIG / "packages" / "theme_switch.yaml"
    if p.exists():
        backup(p)
    content = fetch(f"{PHASE}/packages/theme_switch.yaml")
    write_file(p, content)


# ---------- STEP 4: cleanup orphans ----------
def clean_orphans():
    print("=== STEP 4: clean orphan automations / input_select / scripts ===")
    orphans_auto = {
        "theme_apply_selection_on_change_this_browser",
        "theme_apply_on_startup_this_browser",
        "theme_apply_on_startup",
    }
    orphans_input = {"theme_mode_selector"}
    orphans_script = {"apply_theme_to_this_browser"}

    def clean(filename, key, ids):
        p = STORAGE / filename
        if not p.exists():
            print(f"  no {filename}")
            return
        data = json.loads(p.read_text())
        items = data.get("data", {}).get(key, [])
        before = len(items)
        kept = [
            i
            for i in items
            if i.get("id") not in ids
            and i.get("alias", "").lower().replace(" ", "_").replace("-", "_")
            not in ids
        ]
        if before == len(kept):
            print(f"  {filename}: no orphans")
            return
        backup(p)
        data["data"][key] = kept
        p.write_text(json.dumps(data, indent=2))
        print(f"  {filename}: removed {before - len(kept)}")

    clean("automation", "items", orphans_auto)
    clean("input_select", "items", orphans_input)
    clean("script", "items", orphans_script)

    # Dismiss stale repair issues
    repairs = STORAGE / "repairs.issue_registry"
    if repairs.exists():
        data = json.loads(repairs.read_text())
        issues = data.get("data", {}).get("issues", [])
        kept = [
            i
            for i in issues
            if "theme_apply" not in str(i.get("issue_id", ""))
            and "theme_apply" not in str(i.get("data", {}).get("entity_id", ""))
            and "apply_theme" not in str(i.get("issue_id", ""))
        ]
        if len(kept) != len(issues):
            backup(repairs)
            data["data"]["issues"] = kept
            repairs.write_text(json.dumps(data, indent=2))
            print(f"  repairs: dismissed {len(issues) - len(kept)} stale issue(s)")
        else:
            print("  repairs: nothing stale")


# ---------- STEP 5: set frontend storage theme per user ----------
def set_frontend_theme():
    """Find the frontend.user_data_* file and set the theme/mode for the user.

    This is best-effort — if it fails the user can set it manually in /profile.
    """
    print("=== STEP 5: set per-user frontend theme to Casa Cola Creek + Auto ===")
    candidates = list(STORAGE.glob("frontend.user_data_*"))
    if not candidates:
        print("  no frontend.user_data_* files — user must set theme in /profile manually")
        return
    for p in candidates:
        try:
            data = json.loads(p.read_text())
            d = data.get("data", {})
            old_theme = d.get("selectedTheme")
            d["selectedTheme"] = {"theme": "Casa Cola Creek", "dark": None}
            data["data"] = d
            backup(p)
            p.write_text(json.dumps(data, indent=2))
            print(f"  {p.name}: theme set (was {old_theme})")
        except Exception as e:
            print(f"  {p.name}: skipped ({e})")


# ---------- MAIN ----------
def main():
    print("=== Phase 2.6.3 deploy: single Casa Cola Creek theme + system follow ===")
    update_lovelace()
    install_merged_theme()
    empty_theme_switch_package()
    clean_orphans()
    set_frontend_theme()
    print()
    print("=== DONE ===")
    print()
    print("REQUIRED next steps:")
    print("  1. Settings -> Developer tools -> YAML -> Reload THEMES")
    print("     (or just Restart Home Assistant if YAML reload is restricted)")
    print("  2. Hard-reload the iPad dashboard (force-quit HA app, reopen)")
    print("  3. Avatar (lower-left) -> profile -> confirm:")
    print("        Theme = Casa Cola Creek")
    print("        Mode = Auto")
    print("  4. iPad Settings -> Display & Brightness -> toggle Light/Dark")
    print("     and watch the dashboard follow automatically.")


if __name__ == "__main__":
    main()
