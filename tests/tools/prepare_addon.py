#!/usr/bin/env python3
"""Copy the add-on's behavior pack for testing, using the beta Script API of the same game version.

Simulated players come from the beta-only @minecraft/server-gametest module. A pack on the
stable API (2.8.0) cannot see them: world.getAllPlayers() returns undefined for them. The
test copy therefore uses 2.9.0-beta, which is the same game version's API plus beta extras.
The shipped pack keeps 2.8.0; tools/check_log.py still verifies it loads without errors
because the server log is checked for every pack load problem.
"""

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "behavior_pack"
TARGET = ROOT / "tests" / ".build" / "behavior_pack"
TEST_API = "2.9.0-beta"


def main():
    shutil.rmtree(TARGET, ignore_errors=True)
    shutil.copytree(SOURCE, TARGET, ignore=shutil.ignore_patterns("node_modules", ".*"))
    manifest_path = TARGET / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for dependency in manifest["dependencies"]:
        if dependency.get("module_name") == "@minecraft/server":
            dependency["version"] = TEST_API
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared test copy of the add-on at {TARGET} (@minecraft/server {TEST_API})")


if __name__ == "__main__":
    main()
