#!/usr/bin/env python3
"""Generate, validate and package the CraftedEffects relic add-on."""

import json
import shutil
import subprocess
import sys
import uuid
import zipfile
from io import BytesIO
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_content as content  # noqa: E402

ROOT = content.ROOT
BP_DIR = content.BP_DIR
RP_DIR = content.RP_DIR
BUILD_DIR = ROOT / "build"
SCRIPT_API = "2.8.0"  # stable Script API shipped with Bedrock 26.3 (2.9.0 is only beta there)
MIN_ENGINE = [1, 26, 30]  # Bedrock 26.3 = engine 1.26.30


def load_json(path):
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def fail(message):
    raise ValueError(message)


def validate_manifests():
    bp = load_json(BP_DIR / "manifest.json")
    rp = load_json(RP_DIR / "manifest.json")
    version = bp["header"]["version"]
    if rp["header"]["version"] != version:
        fail("Behavior and Resource Pack must have the same version")
    for pack in (bp, rp):
        if pack["header"]["min_engine_version"] != MIN_ENGINE:
            fail(f"Both packs must use min_engine_version {MIN_ENGINE}")
        if "v" + ".".join(map(str, version)) not in pack["header"]["name"]:
            fail("Pack name must contain the current version")

    all_uuids = [bp["header"]["uuid"], rp["header"]["uuid"]]
    all_uuids += [m["uuid"] for m in bp["modules"] + rp["modules"]]
    for value in all_uuids:
        uuid.UUID(value)
    if len(set(all_uuids)) != len(all_uuids):
        fail("Pack header and module UUIDs must all be unique")

    deps = bp["dependencies"]
    if not any(d.get("uuid") == rp["header"]["uuid"] and d.get("version") == version for d in deps):
        fail("Behavior Pack must depend on the Resource Pack with the same version")
    if not any(d.get("module_name") == "@minecraft/server" and d.get("version") == SCRIPT_API for d in deps):
        fail(f"Behavior Pack must use @minecraft/server {SCRIPT_API}")
    scripts = [m for m in bp["modules"] if m["type"] == "script"]
    if len(scripts) != 1 or scripts[0].get("entry") != "scripts/main.js":
        fail("Script module must point to scripts/main.js")
    return version


def validate_relics():
    textures = load_json(RP_DIR / "textures" / "item_texture.json")["texture_data"]
    lang = (RP_DIR / "texts" / "en_US.lang").read_text(encoding="utf-8")
    recipes_seen = set()
    item_names = [content.relic_id(r) for r in content.RELICS] + ["diadem"]
    expected_files = {f"{name}.json" for name in item_names}
    for folder in ("items", "recipes"):
        found = {p.name for p in (BP_DIR / folder).glob("*.json")}
        if found != expected_files:
            fail(f"{folder}/ must contain exactly the relic and diadem files, found extra/missing: {found ^ expected_files}")

    for name in item_names:
        is_relic = name != "diadem"
        full_id = f"{content.NAMESPACE}:{name}"
        item = load_json(BP_DIR / "items" / f"{name}.json")["minecraft:item"]
        if item["description"]["identifier"] != full_id:
            fail(f"{name}: wrong item identifier")
        components = item["components"]
        if is_relic and components["minecraft:max_stack_size"] != 1:
            fail(f"{name}: relics must not stack (needed for serial numbers)")
        component = "relic" if is_relic else "diadem"
        if f"{content.NAMESPACE}:{component}" not in components:
            fail(f"{name}: missing {component} custom component")
        texture_key = components["minecraft:icon"]["textures"]["default"]
        if texture_key not in textures:
            fail(f"{name}: icon {texture_key} missing in item_texture.json")
        if not (RP_DIR / (textures[texture_key]["textures"] + ".png")).is_file():
            fail(f"{name}: texture file missing")
        if f"item.{full_id}.name=" not in lang:
            fail(f"{name}: name missing in en_US.lang")

        recipe = load_json(BP_DIR / "recipes" / f"{name}.json")["minecraft:recipe_shaped"]
        if recipe["result"] != {"item": full_id, "count": 1}:
            fail(f"{name}: recipe result does not match the item")
        used = {c for row in recipe["pattern"] for c in row if c != " "}
        if used != set(recipe["key"]):
            fail(f"{name}: recipe pattern and key do not match ({sorted(used ^ set(recipe['key']))})")
        signature = json.dumps([recipe["pattern"], recipe["key"]], sort_keys=True)
        if signature in recipes_seen:
            fail(f"{name}: recipe is identical to another item")
        recipes_seen.add(signature)

    data_js = (BP_DIR / "scripts" / "data.js").read_text(encoding="utf-8")
    if f'"version": {content.CONFIG_VERSION},' not in data_js or data_js.count('"maxLevel":') != len(content.RELICS):
        fail("scripts/data.js is out of date - run scripts/generate_content.py")


def validate_scripts():
    node = shutil.which("node")
    if not node:
        print("Note: Node.js not found, skipping JavaScript syntax check")
        return
    for script in sorted((BP_DIR / "scripts").glob("*.js")):
        result = subprocess.run([node, "--check", str(script)], capture_output=True, text=True)
        if result.returncode != 0:
            fail(f"{script.name} has a syntax error:\n{result.stderr}")


def pack_directory(folder):
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as pack:
        for path in sorted(folder.rglob("*")):
            parts = path.relative_to(folder).parts  # only look inside the pack, not at the checkout location
            if path.is_file() and not any(part.startswith(".") or part == "node_modules" for part in parts):
                pack.write(path, path.relative_to(folder).as_posix())
    return buffer.getvalue()


def build():
    content.main()
    version = validate_manifests()
    validate_relics()
    validate_scripts()

    BUILD_DIR.mkdir(exist_ok=True)
    for old in BUILD_DIR.glob("*.mcaddon"):
        old.unlink()
    output = BUILD_DIR / f"CraftedEffects-{'.'.join(map(str, version))}.mcaddon"
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as addon:
        addon.writestr("CraftedEffects_BP.mcpack", pack_directory(BP_DIR))
        addon.writestr("CraftedEffects_RP.mcpack", pack_directory(RP_DIR))
    print(f"Created {output}")
    print(f"Size: {output.stat().st_size} bytes")


if __name__ == "__main__":
    build()
