#!/usr/bin/env python3
"""
Build script for 9x Mace Addon.
Packages Behavior Pack and Resource Pack into a single .mcaddon file.
Validates JSON files and required assets before packaging.
"""

import json
import os
import sys
import zipfile
import uuid
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
BEHAVIOR_PACK_DIR = PROJECT_ROOT / "behavior_pack"
RESOURCE_PACK_DIR = PROJECT_ROOT / "resource_pack"
OUTPUT_DIR = PROJECT_ROOT / "build"
OUTPUT_FILE = OUTPUT_DIR / "9x-Mace-Addon.mcaddon"

# Required files to validate
REQUIRED_FILES = {
    "behavior_pack": [
        "manifest.json",
        "items/9x_mace.json",
        "recipes/9x_mace_recipe.json",
    ],
    "resource_pack": [
        "manifest.json",
        "textures/item_texture.json",
        "textures/items/9x_mace.png",
        "texts/en_US.lang",
    ]
}

def validate_json(filepath):
    """Validate that a file contains valid JSON."""
    try:
        with open(filepath, 'r') as f:
            json.load(f)
        return True, None
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON in {filepath}: {e}"
    except Exception as e:
        return False, f"Error reading {filepath}: {e}"

def validate_uuid(uuid_str, field_name):
    """Validate that a string is a valid UUID."""
    try:
        uuid.UUID(uuid_str)
        return True, None
    except ValueError:
        return False, f"Invalid UUID in {field_name}: {uuid_str}"

def validate_manifests():
    """Validate both manifest.json files."""
    errors = []
    
    # Validate behavior pack manifest
    bp_manifest_path = BEHAVIOR_PACK_DIR / "manifest.json"
    valid, error = validate_json(bp_manifest_path)
    if not valid:
        errors.append(error)
    else:
        with open(bp_manifest_path, 'r') as f:
            bp_manifest = json.load(f)
        
        # Check required fields
        required_fields = ["format_version", "header", "modules", "dependencies"]
        for field in required_fields:
            if field not in bp_manifest:
                errors.append(f"Behavior pack manifest missing required field: {field}")
        
        # Validate UUIDs
        if "header" in bp_manifest:
            valid, error = validate_uuid(bp_manifest["header"].get("uuid", ""), "behavior_pack.header.uuid")
            if not valid:
                errors.append(error)
        
        if "modules" in bp_manifest:
            for i, module in enumerate(bp_manifest["modules"]):
                valid, error = validate_uuid(module.get("uuid", ""), f"behavior_pack.modules[{i}].uuid")
                if not valid:
                    errors.append(error)
        
        if "dependencies" in bp_manifest:
            for i, dep in enumerate(bp_manifest["dependencies"]):
                valid, error = validate_uuid(dep.get("uuid", ""), f"behavior_pack.dependencies[{i}].uuid")
                if not valid:
                    errors.append(error)
    
    # Validate resource pack manifest
    rp_manifest_path = RESOURCE_PACK_DIR / "manifest.json"
    valid, error = validate_json(rp_manifest_path)
    if not valid:
        errors.append(error)
    else:
        with open(rp_manifest_path, 'r') as f:
            rp_manifest = json.load(f)
        
        required_fields = ["format_version", "header", "modules"]
        for field in required_fields:
            if field not in rp_manifest:
                errors.append(f"Resource pack manifest missing required field: {field}")
        
        if "header" in rp_manifest:
            valid, error = validate_uuid(rp_manifest["header"].get("uuid", ""), "resource_pack.header.uuid")
            if not valid:
                errors.append(error)
        
        if "modules" in rp_manifest:
            for i, module in enumerate(rp_manifest["modules"]):
                valid, error = validate_uuid(module.get("uuid", ""), f"resource_pack.modules[{i}].uuid")
                if not valid:
                    errors.append(error)
        
        # Verify behavior pack references resource pack UUID
        if "dependencies" in bp_manifest and "header" in rp_manifest:
            rp_uuid = rp_manifest["header"]["uuid"]
            bp_dep_uuids = [dep.get("uuid") for dep in bp_manifest.get("dependencies", [])]
            if rp_uuid not in bp_dep_uuids:
                errors.append(f"Behavior pack does not reference resource pack UUID: {rp_uuid}")
    
    return errors

def validate_item_definition():
    """Validate the custom item definition."""
    errors = []
    item_path = BEHAVIOR_PACK_DIR / "items" / "9x_mace.json"
    
    valid, error = validate_json(item_path)
    if not valid:
        errors.append(error)
        return errors
    
    with open(item_path, 'r') as f:
        item_def = json.load(f)
    
    # Check required structure
    if "minecraft:item" not in item_def:
        errors.append("Item definition missing 'minecraft:item' root")
        return errors
    
    item = item_def["minecraft:item"]
    
    # Check description
    if "description" not in item:
        errors.append("Item missing 'description'")
    else:
        desc = item["description"]
        if "identifier" not in desc:
            errors.append("Item description missing 'identifier'")
        elif desc["identifier"] != "craftedeffects:9x_mace":
            errors.append(f"Item identifier mismatch: expected 'craftedeffects:9x_mace', got '{desc['identifier']}'")
    
    # Check components
    if "components" not in item:
        errors.append("Item missing 'components'")
    else:
        comps = item["components"]
        if "minecraft:max_stack_size" not in comps:
            errors.append("Item missing 'minecraft:max_stack_size' component")
        elif comps["minecraft:max_stack_size"] != 1:
            errors.append(f"Item max_stack_size should be 1, got {comps['minecraft:max_stack_size']}")
        
        if "minecraft:display_name" not in comps:
            errors.append("Item missing 'minecraft:display_name' component")
        elif comps["minecraft:display_name"].get("value") != "9x Mace":
            errors.append(f"Item display_name should be '9x Mace', got '{comps['minecraft:display_name'].get('value')}'")
        
        if "minecraft:icon" not in comps:
            errors.append("Item missing 'minecraft:icon' component")
        elif comps["minecraft:icon"].get("texture") != "9x_mace":
            errors.append(f"Item icon texture should be '9x_mace', got '{comps['minecraft:icon'].get('texture')}'")
    
    return errors

def validate_recipe():
    """Validate the crafting recipe."""
    errors = []
    recipe_path = BEHAVIOR_PACK_DIR / "recipes" / "9x_mace_recipe.json"
    
    valid, error = validate_json(recipe_path)
    if not valid:
        errors.append(error)
        return errors
    
    with open(recipe_path, 'r') as f:
        recipe = json.load(f)
    
    if "minecraft:recipe_shaped" not in recipe:
        errors.append("Recipe missing 'minecraft:recipe_shaped' root")
        return errors
    
    shaped = recipe["minecraft:recipe_shaped"]
    
    # Check pattern
    if "pattern" not in shaped:
        errors.append("Recipe missing 'pattern'")
    else:
        pattern = shaped["pattern"]
        if len(pattern) != 3:
            errors.append(f"Recipe pattern should have 3 rows, got {len(pattern)}")
        for i, row in enumerate(pattern):
            if len(row) != 3:
                errors.append(f"Recipe pattern row {i} should have 3 chars, got {len(row)}")
            if row != "###":
                errors.append(f"Recipe pattern row {i} should be '###', got '{row}'")
    
    # Check key
    if "key" not in shaped:
        errors.append("Recipe missing 'key'")
    else:
        key = shaped["key"]
        if "#" not in key:
            errors.append("Recipe key missing '#' entry")
        elif key["#"].get("item") != "minecraft:mace":
            errors.append(f"Recipe key '#' should use 'minecraft:mace', got '{key['#'].get('item')}'")
    
    # Check result
    if "result" not in shaped:
        errors.append("Recipe missing 'result'")
    else:
        result = shaped["result"]
        if result.get("item") != "craftedeffects:9x_mace":
            errors.append(f"Recipe result item should be 'craftedeffects:9x_mace', got '{result.get('item')}'")
        if result.get("count") != 1:
            errors.append(f"Recipe result count should be 1, got {result.get('count')}")
    
    # Check tags
    if "tags" not in shaped or "crafting_table" not in shaped.get("tags", []):
        errors.append("Recipe missing 'crafting_table' tag")
    
    return errors

def validate_texture_registration():
    """Validate the item_texture.json registration."""
    errors = []
    texture_reg_path = RESOURCE_PACK_DIR / "textures" / "item_texture.json"
    
    valid, error = validate_json(texture_reg_path)
    if not valid:
        errors.append(error)
        return errors
    
    with open(texture_reg_path, 'r') as f:
        tex_reg = json.load(f)
    
    if "texture_data" not in tex_reg:
        errors.append("item_texture.json missing 'texture_data'")
    else:
        tex_data = tex_reg["texture_data"]
        if "9x_mace" not in tex_data:
            errors.append("item_texture.json missing '9x_mace' texture entry")
        else:
            entry = tex_data["9x_mace"]
            if "textures" not in entry:
                errors.append("9x_mace texture entry missing 'textures' field")
            elif entry["textures"] != "textures/items/9x_mace":
                errors.append(f"9x_mace texture path should be 'textures/items/9x_mace', got '{entry['textures']}'")
    
    return errors

def validate_lang_file():
    """Validate the language file."""
    errors = []
    lang_path = RESOURCE_PACK_DIR / "texts" / "en_US.lang"
    
    if not lang_path.exists():
        errors.append("en_US.lang file missing")
        return errors
    
    with open(lang_path, 'r') as f:
        content = f.read()
    
    if "item.craftedeffects:9x_mace.name=9x Mace" not in content:
        errors.append("en_US.lang missing correct translation entry for 9x Mace")
    
    return errors

def check_required_files():
    """Check that all required files exist."""
    errors = []
    for pack_name, files in REQUIRED_FILES.items():
        pack_dir = BEHAVIOR_PACK_DIR if pack_name == "behavior_pack" else RESOURCE_PACK_DIR
        for file in files:
            filepath = pack_dir / file
            if not filepath.exists():
                errors.append(f"Required file missing: {pack_name}/{file}")
    return errors

def create_mcaddon():
    """Create the .mcaddon file."""
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    if OUTPUT_FILE.exists():
        OUTPUT_FILE.unlink()
    
    with zipfile.ZipFile(OUTPUT_FILE, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add behavior pack files
        for file_path in BEHAVIOR_PACK_DIR.rglob("*"):
            if file_path.is_file() and not file_path.name.startswith('.'):
                arcname = f"behavior_pack/{file_path.relative_to(BEHAVIOR_PACK_DIR)}"
                zf.write(file_path, arcname)
        
        # Add resource pack files
        for file_path in RESOURCE_PACK_DIR.rglob("*"):
            if file_path.is_file() and not file_path.name.startswith('.'):
                arcname = f"resource_pack/{file_path.relative_to(RESOURCE_PACK_DIR)}"
                zf.write(file_path, arcname)
    
    print(f"Created {OUTPUT_FILE}")
    print(f"Size: {OUTPUT_FILE.stat().st_size} bytes")

def main():
    print("=" * 60)
    print("9x Mace Addon - Build Script")
    print("=" * 60)
    
    all_errors = []
    
    # Check required files exist
    print("\n[1/6] Checking required files...")
    errors = check_required_files()
    all_errors.extend(errors)
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
    else:
        print("  OK: All required files present")
    
    # Validate JSON syntax
    print("\n[2/6] Validating JSON syntax...")
    json_files = [
        BEHAVIOR_PACK_DIR / "manifest.json",
        BEHAVIOR_PACK_DIR / "items" / "9x_mace.json",
        BEHAVIOR_PACK_DIR / "recipes" / "9x_mace_recipe.json",
        RESOURCE_PACK_DIR / "manifest.json",
        RESOURCE_PACK_DIR / "textures" / "item_texture.json",
    ]
    for jf in json_files:
        valid, error = validate_json(jf)
        if not valid:
            all_errors.append(error)
            print(f"  ERROR: {error}")
        else:
            print(f"  OK: {jf.relative_to(PROJECT_ROOT)}")
    
    # Validate manifests
    print("\n[3/6] Validating manifests...")
    errors = validate_manifests()
    all_errors.extend(errors)
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
    else:
        print("  OK: Manifests valid")
    
    # Validate item definition
    print("\n[4/6] Validating item definition...")
    errors = validate_item_definition()
    all_errors.extend(errors)
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
    else:
        print("  OK: Item definition valid")
    
    # Validate recipe
    print("\n[5/6] Validating crafting recipe...")
    errors = validate_recipe()
    all_errors.extend(errors)
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
    else:
        print("  OK: Crafting recipe valid")
    
    # Validate texture registration
    print("\n[6/6] Validating texture registration...")
    errors = validate_texture_registration()
    all_errors.extend(errors)
    if not errors:
        errors = validate_lang_file()
        all_errors.extend(errors)
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
    else:
        print("  OK: Texture registration valid")
    
    # Summary
    print("\n" + "=" * 60)
    if all_errors:
        print(f"BUILD FAILED: {len(all_errors)} error(s) found")
        print("=" * 60)
        sys.exit(1)
    else:
        print("ALL VALIDATIONS PASSED")
        print("=" * 60)
        
        # Create the .mcaddon file
        print("\nPackaging .mcaddon file...")
        create_mcaddon()
        print("\nBuild successful!")
        print(f"Output: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()