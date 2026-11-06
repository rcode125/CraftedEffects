#!/usr/bin/env python3
"""Fail if the newest server log has load errors (recipes, items, scripts, JSON ...).

bds-runner only fails on test results and uncaught script errors. Content errors
such as an invalid recipe are logged but would otherwise leave the run green.
Errors coming from the test pack itself are already covered by the test results.
"""

import sys
from pathlib import Path

LOGS = Path(__file__).resolve().parent.parent / ".bds" / "logs"
IGNORE = ("[CraftedEffects GameTests]", "onTestFailed")


def main():
    logs = sorted(p for p in LOGS.glob("*.log") if p.is_file())
    if not logs:
        sys.exit("No server log found - did the tests run?")
    log = logs[-1]
    errors = [
        line.strip()
        for line in log.read_text(encoding="utf-8", errors="replace").splitlines()
        if (" ERROR]" in line or (" WARN]" in line and "craftedeffects" in line.lower()))
        and not any(marker in line for marker in IGNORE)
    ]
    if errors:
        print(f"Server reported {len(errors)} load problem(s) in {log.name}:")
        for line in errors:
            print(f"  {line}")
        sys.exit(1)
    print(f"No load errors in {log.name}")


if __name__ == "__main__":
    main()
