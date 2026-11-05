#!/usr/bin/env python3
"""Copy the add-on's behavior pack for testing, so it can see GameTest's simulated players.

Simulated players are SimulatedPlayer objects from the beta-only @minecraft/server-gametest
module. A pack that does not depend on that module gets undefined for them from
world.getAllPlayers() (verified in CI: "8 Spieler, 0 lesbar"). The test copy therefore uses
the beta API of the same game version and depends on the GameTest module; the code is unchanged.
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
    manifest["dependencies"].append({"module_name": "@minecraft/server-gametest", "version": "1.0.0-beta"})
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared test copy of the add-on at {TARGET} (@minecraft/server {TEST_API})")


if __name__ == "__main__":
    main()
