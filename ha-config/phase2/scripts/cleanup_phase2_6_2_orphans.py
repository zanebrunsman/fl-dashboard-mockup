#!/usr/bin/env python3
"""
Phase 2.6.2 cleanup — remove orphan theme-switch helpers/automations left over
from Phase 2.6.1 that now reference deleted scripts.

Removes:
  - automation.theme_apply_selection_on_change_this_browser
  - automation.theme_apply_on_startup (if present, replaced by package)
  - input_select.theme_mode_selector (no longer needed; buttons call service directly)
  - script.apply_theme_to_this_browser (if still in .storage)

Safe to re-run.
"""

import json
import os
import shutil
import time
from pathlib import Path

STORAGE = Path("/config/.storage")
BACKUP_SUFFIX = f".bak.{int(time.time())}"

ORPHAN_AUTOMATION_IDS = {
    "theme_apply_selection_on_change_this_browser",
    "theme_apply_on_startup_this_browser",
    "theme_apply_on_startup",
}
ORPHAN_INPUT_SELECT_IDS = {"theme_mode_selector"}
ORPHAN_SCRIPT_OBJECT_IDS = {"apply_theme_to_this_browser"}


def load(path):
    if not path.exists():
        return None
    return json.loads(path.read_text())


def save(path, data):
    backup = Path(str(path) + BACKUP_SUFFIX)
    shutil.copy2(path, backup)
    path.write_text(json.dumps(data, indent=2))
    print(f"  saved (backup: {backup.name})")


def clean_automations():
    p = STORAGE / "automation"
    data = load(p)
    if not data:
        # automations might live in /config/automations.yaml instead
        print("  no .storage/automation file — checking automations.yaml")
        yaml_path = Path("/config/automations.yaml")
        if yaml_path.exists():
            import yaml
            autos = yaml.safe_load(yaml_path.read_text()) or []
            before = len(autos)
            autos = [
                a
                for a in autos
                if a.get("id") not in ORPHAN_AUTOMATION_IDS
                and a.get("alias", "").lower().replace(" ", "_").replace("-", "_")
                not in ORPHAN_AUTOMATION_IDS
            ]
            after = len(autos)
            if before != after:
                shutil.copy2(yaml_path, str(yaml_path) + BACKUP_SUFFIX)
                yaml_path.write_text(yaml.safe_dump(autos, sort_keys=False))
                print(f"  removed {before - after} automation(s) from automations.yaml")
        return
    items = data.get("data", {}).get("items", [])
    before = len(items)
    kept = [
        i
        for i in items
        if i.get("id") not in ORPHAN_AUTOMATION_IDS
        and i.get("alias", "").lower().replace(" ", "_").replace("-", "_")
        not in ORPHAN_AUTOMATION_IDS
    ]
    after = len(kept)
    if before == after:
        print("  no orphan automations to remove")
        return
    print(f"  removing {before - after} orphan automation(s)")
    data["data"]["items"] = kept
    save(p, data)


def clean_input_select():
    p = STORAGE / "input_select"
    data = load(p)
    if not data:
        print("  no .storage/input_select file")
        return
    items = data.get("data", {}).get("items", [])
    before = len(items)
    kept = [i for i in items if i.get("id") not in ORPHAN_INPUT_SELECT_IDS]
    after = len(kept)
    if before == after:
        print("  no orphan input_select to remove")
        return
    print(f"  removing {before - after} orphan input_select")
    data["data"]["items"] = kept
    save(p, data)


def clean_scripts():
    p = STORAGE / "script"
    data = load(p)
    if not data:
        print("  no .storage/script file")
        return
    items = data.get("data", {}).get("items", [])
    before = len(items)
    kept = [i for i in items if i.get("id") not in ORPHAN_SCRIPT_OBJECT_IDS]
    after = len(kept)
    if before == after:
        print("  no orphan scripts to remove")
        return
    print(f"  removing {before - after} orphan script(s)")
    data["data"]["items"] = kept
    save(p, data)


def clean_repairs():
    """Dismiss the 'unknown action' repair issue now that the automation is gone."""
    p = STORAGE / "repairs.issue_registry"
    data = load(p)
    if not data:
        print("  no .storage/repairs.issue_registry file")
        return
    issues = data.get("data", {}).get("issues", [])
    before = len(issues)
    kept = [
        i
        for i in issues
        if "theme_apply" not in str(i.get("issue_id", ""))
        and "theme_apply" not in str(i.get("data", {}).get("entity_id", ""))
    ]
    after = len(kept)
    if before == after:
        print("  no orphan repair issues to remove")
        return
    print(f"  dismissing {before - after} stale repair issue(s)")
    data["data"]["issues"] = kept
    save(p, data)


def main():
    print("=== Phase 2.6.2 cleanup ===")
    print("STEP 1: automations")
    clean_automations()
    print("STEP 2: input_select")
    clean_input_select()
    print("STEP 3: scripts")
    clean_scripts()
    print("STEP 4: stale repair issues")
    clean_repairs()
    print()
    print("=== DONE ===")
    print("Now: Settings -> System -> Restart Home Assistant (Quick reload won't reload .storage)")
    print("After restart, hard-reload the iPad dashboard.")


if __name__ == "__main__":
    main()
