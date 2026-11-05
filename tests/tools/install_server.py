#!/usr/bin/env python3
"""Put a manually downloaded Bedrock Dedicated Server zip into the bds-runner cache.

Use this when the automatic download fails (firewall, proxy, blocked host):
    python3 tests/tools/install_server.py ~/Downloads/bedrock-server-1.26.30.5.zip
The version is taken from tests/bds-runner.json, so it must match the zip.
"""

import json
import re
import stat
import sys
import zipfile
from pathlib import Path

TESTS = Path(__file__).resolve().parent.parent


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    archive = Path(sys.argv[1]).expanduser()
    version = json.loads((TESTS / "bds-runner.json").read_text())["version"]
    found = re.search(r"(\d+\.\d+\.\d+\.\d+)", archive.name)
    if found and found.group(1) != version:
        sys.exit(f"Zip is version {found.group(1)}, but tests/bds-runner.json pins {version}.")

    target = TESTS / ".bds" / "cache" / version / "linux-x64"
    target.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as zf:
        if "bedrock_server" not in zf.namelist():
            sys.exit("This zip has no bedrock_server - is it the Linux server download?")
        zf.extractall(target)
    server = target / "bedrock_server"
    server.chmod(server.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    print(f"Installed Bedrock Dedicated Server {version} to {target}")
    print("Now run: cd tests && npm test")


if __name__ == "__main__":
    main()
