#!/usr/bin/env python3
"""Generate every relic file of the add-on from one table.

Writes item and recipe JSON, the effect entities (sword ring, shield dome),
the touch crosshair UI, item textures (a PNG in art/items/ replaces the
generated one), language files, the script data
module (behavior_pack/scripts/data.js) and the player guide EFFEKTE.md.
Edit the tables below, then run this script (build_addon.py runs it too).
"""

import json
import struct
import zlib
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BP_DIR = ROOT / "behavior_pack"
RP_DIR = ROOT / "resource_pack"
ART_DIR = ROOT / "art" / "items"  # hand-drawn textures (e.g. from the Pixelstation) win over generated ones

NAMESPACE = "craftedeffects"
ITEM_FORMAT = "1.21.90"
RECIPE_FORMAT = "1.20.10"
CONFIG_VERSION = 7  # bump when the relic table changes; old world settings are migrated (levels kept). 6 = cooldown-bar version

# Item ids used in recipes -> German name (for EFFEKTE.md)
ITEM_NAMES = {
    "minecraft:firework_rocket": "Feuerwerksrakete",
    "minecraft:flow_armor_trim_smithing_template": "Flow-Rüstungsbesatz",
    "minecraft:bolt_armor_trim_smithing_template": "Bolt-Rüstungsbesatz",
    "minecraft:nautilus_shell": "Nautilusschale",
    "minecraft:glass_bottle": "Glasflasche",
    "minecraft:diamond_leggings": "Diamanthose",
    "minecraft:diamond_pickaxe": "Diamant-Spitzhacke",
    "minecraft:diamond": "Diamant",
    "minecraft:emerald": "Smaragd",
    "minecraft:blaze_rod": "Lohenrute",
    "minecraft:gold_ingot": "Goldbarren",
    "minecraft:magma_cream": "Magmacreme",
    "minecraft:golden_apple": "Goldener Apfel",
    "minecraft:breeze_rod": "Breeze-Rute",
    "minecraft:player_head": "Spielerkopf",
    "minecraft:ender_eye": "Enderauge",
    "minecraft:diamond_axe": "Diamantaxt",
    "minecraft:diamond_sword": "Diamantschwert",
    "minecraft:ward_armor_trim_smithing_template": "Ward-Rüstungsbesatz",
    "minecraft:ghast_tear": "Ghast-Träne",
    "minecraft:end_crystal": "Endkristall",
    "minecraft:trident": "Dreizack",
    "minecraft:gold_ore": "Golderz",
    "minecraft:disc_fragment_5": "Plattenfragment",
    "minecraft:tnt": "TNT",
    "minecraft:fire_charge": "Feuerkugel",
    "minecraft:wither_skeleton_skull": "Witherskelett-Schädel",
    "minecraft:lava_bucket": "Lavaeimer",
    "minecraft:diamond_chestplate": "Diamantbrustpanzer",
    "minecraft:enchanted_book": "Verzaubertes Buch (Schutz empfohlen)",
    "minecraft:totem_of_undying": "Totem der Unsterblichkeit",
    "minecraft:ominous_bottle": "Unheilvolle Flasche",
    "minecraft:wind_charge": "Windkugel",
    "minecraft:echo_shard": "Echoscherbe",
    "minecraft:rabbit_foot": "Hasenpfote",
    "minecraft:diamond_boots": "Diamantstiefel",
    "minecraft:prismarine_shard": "Prismarinscherbe",
    "minecraft:sponge": "Schwamm",
    "minecraft:conduit": "Aquisitor",
    "minecraft:coast_armor_trim_smithing_template": "Coast-Rüstungsbesatz",
    "minecraft:tide_armor_trim_smithing_template": "Tide-Rüstungsbesatz",
    "minecraft:water_bucket": "Wassereimer",
}

# Effects an admin can assign: id -> (German name, description)
EFFECTS = {
    "none": ("Keine Wirkung", "Der Effekt gibt keine Dauerwirkung."),
    "speed": ("Schnelligkeit", "Schneller laufen."),
    "haste": ("Eile", "Schneller abbauen."),
    "strength": ("Stärke", "Mehr Nahkampfschaden."),
    "jump_boost": ("Sprungkraft", "Höher springen, weniger Fallschaden."),
    "fire_resistance": ("Feuerresistenz", "Immun gegen Feuer und Lava."),
    "health_boost": ("Gesundheitsschub", "Mehr maximale Herzen."),
    "regeneration": ("Regeneration", "Leben regeneriert sich laufend."),
    "resistance": ("Resistenz", "Weniger Schaden aus allen Quellen."),
    "water_breathing": ("Wasseratmung", "Unter Wasser atmen."),
    "night_vision": ("Nachtsicht", "Im Dunkeln alles hell sehen."),
    "absorption": ("Absorption", "Goldene Extra-Herzen."),
    "slow_falling": ("Sanfter Fall", "Langsam fallen, kein Fallschaden."),
}

# Special attacks: id -> (German name, description)
ATTACKS = {
    "none": ("Kein Angriff", "Rechtsklick macht nichts."),
    "dash": (
        "Dash",
        "Schleudert dich wie ein Riptide-Dreizack 30 Blöcke in Blickrichtung (auch nach oben oder unten), "
        "ohne Partikel und Sound. Danach kein Fallschaden.",
    ),
    "ring": (
        "Kraftring",
        "Ein Ring aus Netherite-Schwertern fliegt von dir nach außen (bis 10 Blöcke). Jedes getroffene Wesen "
        "bekommt 3 Herzen Schaden – auch durch volle Netherite-Rüstung.",
    ),
    "fortress": (
        "Bollwerk",
        "3 Sekunden Resistenz V (unverwundbar) und Langsamkeit. Eine Explosion so stark wie ein Respawn-Anker "
        "(ohne Feuer) schleudert Gegner weg und zerstört Blöcke – sogar Obsidian und Bedrock. Du selbst bekommst keinen Schaden.",
    ),
    "comets": (
        "Kometenhagel",
        "8 Kometen erscheinen im Ring 10 Blöcke über dir und stürzen herab. Beim Aufprall gibt es eine große "
        "Explosion und fließende Lava. Du selbst bekommst keinen Schaden.",
    ),
    "aegis": (
        "Lebensschild",
        "Stößt Gegner weg und baut 5 Sekunden lang eine Kuppel aus Schilden um dich. Darin bekommst du "
        "Regeneration III, Sättigung und Sofortheilung. Gegner, die das Schild berühren oder schlagen, nehmen "
        "Schaden und fliegen zurück; am Ende werden alle Gegner 20 Blöcke weggeschleudert.",
    ),
    "automace": (
        "Auto-Mace",
        "Schleudert dich 30 Blöcke hoch, dann 5 Sekunden sanfter Fall (am Handy/Tablet mit Fadenkreuz). Schaust "
        "du auf einen Gegner, wirst du genau auf ihn gedasht. Mit Mace in der Hotbar gibt es Smash-Schaden nach "
        "Fallhöhe, ohne Mace normalen Dash-Schaden. Währenddessen kannst du nicht normal zuschlagen. Kein Fallschaden.",
    ),
    "bubble": (
        "Wasserblase",
        "Eine Wasserblase umhüllt 10 Sekunden lang den Gegner, den du anschaust (sonst den nächsten). Er bekommt "
        "jede Sekunde Schaden, kann nicht entkommen, nicht schlagen und nicht essen. Auf die Blase hast du "
        "10 Blöcke mehr Reichweite.",
    ),
}

# Boost-ups (sneak + short right-click): id -> (German name, description)
BOOSTS = {
    "none": ("Kein Boost", "Schleichen + Rechtsklick macht nichts."),
    "effect": ("Wirkungs-Boost", "Gibt kurz eine sehr starke Wirkung."),
    "vein": ("3×3-Abbau", "Jeder abgebaute Block baut die 3×3-Fläche um ihn mit ab (nicht Bedrock)."),
    "lava": (
        "Lavaschwimmer",
        "Ultraschnell in Lava und Feuer, Feuerresistenz, und jeder Gegner im Umkreis von 5 Blöcken brennt.",
    ),
    "rain": ("Regenmacher", "Das Wetter wird auf Regen gestellt."),
}

FRAME = {"G": "minecraft:gold_ingot", "D": "minecraft:diamond"}

# The 7 relics, recipes as on the design sheets (read row by row, top to bottom).
# "amplifiers": effect amplifier per level, when it is not simply level - 1 (-1 = no effect).
# "boost": the boost-up (sneak + right-click), usable from level 1.
RELICS = [
    {
        "key": "speed", "name": "Speedeffect", "effect": "speed", "max_level": 3,
        "attack": "dash", "cooldown": 60, "colour": (90, 230, 230),
        "boost": {"type": "effect", "effect": "speed", "amplifier": 5, "duration": 30, "cooldown": 120},
        "pattern": ["RFR", "NBN", "LTL"],
        "ingredients": {
            "R": "minecraft:firework_rocket", "F": "minecraft:flow_armor_trim_smithing_template",
            "N": "minecraft:nautilus_shell", "B": "minecraft:glass_bottle",
            "L": "minecraft:diamond_leggings", "T": "minecraft:bolt_armor_trim_smithing_template",
        },
    },
    {
        "key": "strength", "name": "Strengtheffect", "effect": "strength", "max_level": 2,
        "attack": "ring", "cooldown": 30, "colour": (200, 40, 40),
        "boost": {"type": "effect", "effect": "strength", "amplifier": 2, "duration": 10, "cooldown": 120},
        "pattern": ["AWS", "TBT", "CDC"],
        "ingredients": {
            "A": "minecraft:diamond_axe", "W": "minecraft:ward_armor_trim_smithing_template",
            "S": "minecraft:diamond_sword", "T": "minecraft:ghast_tear", "B": "minecraft:glass_bottle",
            "C": "minecraft:end_crystal", "D": "minecraft:trident",
        },
    },
    {
        "key": "haste", "name": "Hasteeffect", "effect": "haste", "max_level": 5,
        "attack": "fortress", "cooldown": 60, "colour": (250, 210, 40),
        "boost": {"type": "vein", "duration": 20, "cooldown": 120},
        "pattern": ["POP", "FBF", "XOX"],
        "ingredients": {
            "P": "minecraft:diamond_pickaxe", "O": "minecraft:gold_ore", "F": "minecraft:disc_fragment_5",
            "B": "minecraft:glass_bottle", "X": "minecraft:tnt",
        },
    },
    {
        "key": "fire", "name": "Fireresistanceeffect", "effect": "fire_resistance", "max_level": 2,
        "amplifiers": [0, 0],  # fire resistance has no stronger level; level 2 unlocks the attack
        "attack": "comets", "cooldown": 120, "colour": (255, 120, 20),
        "boost": {"type": "lava", "duration": 20, "cooldown": 120},
        "pattern": ["CRC", "SBS", "LRL"],
        "ingredients": {
            "C": "minecraft:fire_charge", "R": "minecraft:blaze_rod", "S": "minecraft:wither_skeleton_skull",
            "B": "minecraft:glass_bottle", "L": "minecraft:lava_bucket",
        },
    },
    {
        # Up to 30 hearts in 5 levels. Health boost only works in 2-heart steps, so the sheet's
        # 10 -> 15 -> 20 -> 25 -> 30 becomes 10 -> 16 -> 20 -> 26 -> 30 hearts.
        "key": "health", "name": "Healtheffect", "effect": "health_boost", "max_level": 5,
        "amplifiers": [-1, 2, 4, 7, 9],
        "attack": "aegis", "cooldown": 90, "colour": (255, 105, 180),
        "boost": {"type": "effect", "effect": "health_boost", "amplifier": 24, "duration": 20, "cooldown": 120},
        "pattern": ["CPC", "TBT", "AOA"],
        "ingredients": {
            "C": "minecraft:diamond_chestplate", "P": "minecraft:enchanted_book", "T": "minecraft:totem_of_undying",
            "B": "minecraft:glass_bottle", "A": "minecraft:golden_apple", "O": "minecraft:ominous_bottle",
        },
    },
    {
        "key": "jump", "name": "Jumpboosteffect", "effect": "jump_boost", "max_level": 4,
        "attack": "automace", "cooldown": 60, "colour": (120, 200, 255),
        "boost": {"type": "effect", "effect": "jump_boost", "amplifier": 5, "duration": 15, "cooldown": 120},
        "pattern": ["WEW", "RBR", "DED"],
        "ingredients": {
            "W": "minecraft:wind_charge", "E": "minecraft:echo_shard", "R": "minecraft:rabbit_foot",
            "B": "minecraft:glass_bottle", "D": "minecraft:diamond_boots",
        },
    },
    {
        "key": "water", "name": "Waterbreathingeffect", "effect": "water_breathing", "max_level": 3,
        "amplifiers": [0, 0, 0],  # water breathing has no stronger level
        "attack": "bubble", "cooldown": 60, "colour": (40, 110, 230),
        "boost": {"type": "rain", "duration": 30, "cooldown": 120},
        "pattern": ["PSP", "CBC", "OWT"],
        "ingredients": {
            "P": "minecraft:prismarine_shard", "S": "minecraft:sponge", "C": "minecraft:conduit",
            "B": "minecraft:glass_bottle", "O": "minecraft:coast_armor_trim_smithing_template",
            "W": "minecraft:water_bucket", "T": "minecraft:tide_armor_trim_smithing_template",
        },
    },
]

# Weapon that steals the relic of the player it kills. Recipe and texture follow later (sheet).
STEALING = {"name": "Stealing", "damage": 8, "durability": 250}

DIADEM = {
    "name": "Diadem",
    "pattern": ["GHG", "HEH", "GHG"],
    "ingredients": {"G": "minecraft:gold_ingot", "H": "minecraft:player_head", "E": "minecraft:ender_eye"},
}


def hearts(relic, level):
    """Total hearts with a health boost relic at this level (10 normal + 2 per amplifier step)."""
    amplifier = (relic.get("amplifiers") or list(range(relic["max_level"])))[level - 1]
    return 10 + 2 * (amplifier + 1)


def boost_text(relic):
    boost = relic["boost"]
    if boost["type"] == "effect":
        name = EFFECTS[boost["effect"]][0]
        if boost["effect"] == "health_boost":
            label = f"{name} ({10 + 2 * (boost['amplifier'] + 1)} Herzen)"
        else:
            label = f"{name} {roman(boost['amplifier'] + 1)}"
    else:
        label = BOOSTS[boost["type"]][0]
    return f"{label} für {boost['duration']} s"


def relic_id(relic):
    return f"relic_{relic['key']}"


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def recipe_items(pattern, ingredients):
    """All ingredient ids of a recipe, one entry per used slot (for refunds)."""
    return [ingredients[c] for row in pattern for c in row if c != " "]


def roman(number):
    values = [(10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]
    out = ""
    for value, letter in values:
        while number >= value:
            out += letter
            number -= value
    return out


# ---------------------------------------------------------------- textures

def png_bytes(pixels, size=16):
    raw = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in pixels)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def shades(colour):
    r, g, b = colour
    light = (min(255, r + 90), min(255, g + 90), min(255, b + 90), 255)
    return light, (r, g, b, 255), (r * 3 // 5, g * 3 // 5, b * 3 // 5, 255)


def relic_texture(colour):
    """Gold amulet with a coloured gem: chain on top, shaded gem in the middle."""
    clear = (0, 0, 0, 0)
    gold, gold_dark = (255, 215, 80, 255), (170, 120, 30, 255)
    light, mid, dark = shades(colour)
    pixels = [[clear] * 16 for _ in range(16)]
    for x, y in [(5, 0), (10, 0), (5, 1), (10, 1), (6, 2), (9, 2), (6, 3), (9, 3), (7, 4), (8, 4)]:
        pixels[y][x] = gold
    cx, cy = 7.5, 10.0
    for y in range(4, 16):
        for x in range(16):
            dist = abs(x - cx) + abs(y - cy)
            if dist <= 6.0:
                pixels[y][x] = gold_dark if dist > 5.0 else gold
            if dist <= 4.5:
                pixels[y][x] = light if (x - cx) + (y - cy) < -1.5 else mid if (x - cx) + (y - cy) < 1.5 else dark
    pixels[8][6] = (255, 255, 255, 255)
    return png_bytes(pixels)


def diadem_texture():
    """Golden crown with three purple gems."""
    clear = (0, 0, 0, 0)
    gold, gold_light, gold_dark = (255, 205, 60, 255), (255, 240, 150, 255), (175, 120, 25, 255)
    gem_light, gem, gem_dark = shades((150, 60, 210))
    pixels = [[clear] * 16 for _ in range(16)]
    for x in range(1, 15):  # band
        for y in range(9, 14):
            pixels[y][x] = gold_dark if y == 13 or x in (1, 14) else gold
        pixels[9][x] = gold_light
    for peak in (2, 7, 8, 13):  # spikes
        for y in range(4, 9):
            width = (y - 4) // 2
            for x in range(peak - width, peak + width + 1):
                if 0 <= x < 16:
                    pixels[y][x] = gold
        pixels[3][peak] = gold_light
    for gx in (4, 8, 11):  # gems in the band
        pixels[11][gx], pixels[11][gx - 1] = gem, gem_light
        pixels[12][gx], pixels[12][gx - 1] = gem_dark, gem
    return png_bytes(pixels)


def stealing_texture():
    """Dark red-black sword with a golden hilt (placeholder until the Pixelstation one exists)."""
    clear = (0, 0, 0, 0)
    blade_light, blade, blade_dark = (190, 60, 70, 255), (120, 20, 35, 255), (50, 10, 20, 255)
    hilt, grip = (255, 205, 60, 255), (90, 55, 30, 255)
    pixels = [[clear] * 16 for _ in range(16)]
    for i in range(4, 15):  # blade on the diagonal, tip top right
        x, y = i, 15 - i
        pixels[y][x] = blade
        if x - 1 >= 0:
            pixels[y][x - 1] = blade_light
        if y + 1 < 16:
            pixels[y + 1][x] = blade_dark
    for x, y in [(2, 10), (3, 11), (4, 12), (5, 13), (6, 12), (5, 11), (3, 9)]:  # cross guard
        pixels[y][x] = hilt
    for x, y in [(2, 13), (1, 14), (3, 12)]:  # grip
        pixels[y][x] = grip
    pixels[15][0] = hilt
    return png_bytes(pixels)


# ---------------------------------------------------------------- effect entities

def fx_behavior(identifier):
    """Purely visual entity: no gravity, no collision, cannot be hurt; the script moves and removes it."""
    return {
        "format_version": "1.21.90",
        "minecraft:entity": {
            "description": {"identifier": identifier, "is_spawnable": False, "is_summonable": True},
            "components": {
                "minecraft:physics": {"has_gravity": False, "has_collision": False},
                "minecraft:collision_box": {"width": 0.1, "height": 0.1},
                "minecraft:damage_sensor": {"triggers": {"cause": "all", "deals_damage": "no"}},
                "minecraft:pushable": {"is_pushable": False, "is_pushable_by_piston": False},
                "minecraft:knockback_resistance": {"value": 1.0},
                "minecraft:fire_immune": True,
                "minecraft:type_family": {"family": ["inanimate", "craftedeffects_fx"]},
            },
        },
    }


def fx_client(identifier, texture, geometry):
    return {
        "format_version": "1.10.0",
        "minecraft:client_entity": {
            "description": {
                "identifier": identifier,
                "materials": {"default": "entity_alphatest"},
                "textures": {"default": texture},
                "geometry": {"default": geometry},
                "render_controllers": ["controller.render.default"],
            }
        },
    }


def geometry_file(identifier, width, height, bones):
    return {
        "format_version": "1.12.0",
        "minecraft:geometry": [{
            "description": {
                "identifier": identifier, "texture_width": width, "texture_height": height,
                "visible_bounds_width": 8, "visible_bounds_height": 6, "visible_bounds_offset": [0, 2, 0],
            },
            "bones": bones,
        }],
    }


def sword_geometry():
    """One flat netherite sword (16x16 item texture), tip turned forward."""
    return geometry_file("geometry.craftedeffects.sword_fx", 16, 16, [{
        "name": "sword", "pivot": [0, 8, 0], "rotation": [45, 0, 0],
        "cubes": [{
            "origin": [0, 0, -8], "size": [0, 16, 16],
            "uv": {
                "east": {"uv": [0, 0], "uv_size": [16, 16]},
                "west": {"uv": [16, 0], "uv_size": [-16, 16]},
            },
        }],
    }])


def shield_dome_geometry():
    """A dome of vanilla shields (shield entity texture, 64x64) around the player."""
    radius = 40  # pixels = 2.5 blocks
    bones = [{"name": "root", "pivot": [0, 0, 0]}]
    rings = [(0, 12), (32, 10), (60, 6)]  # (elevation in degrees, number of shields)
    index = 0
    for elevation, count in rings:
        for i in range(count):
            yaw = round(360 * i / count + (15 if elevation else 0), 2)
            bones.append({
                "name": f"shield{index}", "parent": "root", "pivot": [0, 12, 0], "rotation": [-elevation, yaw, 0],
                "cubes": [{"origin": [-6, 1, -radius - 1], "size": [12, 22, 1], "uv": [0, 0]}],
            })
            index += 1
    bones.append({
        "name": f"shield{index}", "parent": "root", "pivot": [0, 12, 0], "rotation": [-90, 0, 0],
        "cubes": [{"origin": [-6, 1, -radius - 1], "size": [12, 22, 1], "uv": [0, 0]}],
    })
    return geometry_file("geometry.craftedeffects.shield_dome", 64, 64, bones)


FX_ENTITIES = [
    ("sword_fx", "textures/items/netherite_sword", "geometry.craftedeffects.sword_fx", sword_geometry),
    ("shield_dome", "textures/entity/shield", "geometry.craftedeffects.shield_dome", shield_dome_geometry),
]

# Touch players have no crosshair: during the Auto-Mace the script sends this (invisible) title
# and the HUD shows the vanilla crosshair in the middle of the screen while it is the current title.
CROSSHAIR_TITLE = "§c§e§r"


def hud_screen():
    return {
        "namespace": "hud",
        "root_panel": {
            "modifications": [{
                "array_name": "controls",
                "operation": "insert_back",
                "value": [{"ce_crosshair@hud.ce_crosshair": {}}],
            }],
        },
        "ce_crosshair": {
            "type": "image",
            "texture": "textures/ui/cross_hair",
            "size": [16, 16],
            "layer": 60,
            "anchor_from": "center",
            "anchor_to": "center",
            "bindings": [
                {"binding_name": "#hud_title_text_string"},
                {
                    "binding_type": "view",
                    "source_property_name": f"(#hud_title_text_string = '{CROSSHAIR_TITLE}')",
                    "target_property_name": "#visible",
                },
            ],
        },
    }


# ---------------------------------------------------------------- packs

def item_json(full_id, texture_key, custom_component, stack, glint):
    components = {
        "minecraft:display_name": {"value": f"item.{full_id}.name"},
        "minecraft:icon": {"textures": {"default": texture_key}},
        "minecraft:max_stack_size": stack,
        "minecraft:rarity": "epic",
        f"{NAMESPACE}:{custom_component}": {},
    }
    if glint:
        components["minecraft:glint"] = True
    if custom_component == "relic":
        components["minecraft:allow_off_hand"] = {"value": True}
        # Holding right-click for 5 s (while sneaking) switches the permanent effect on/off.
        components["minecraft:use_modifiers"] = {"use_duration": 5, "movement_modifier": 1.0}
    if custom_component == "stealing":
        components["minecraft:hand_equipped"] = True
        components["minecraft:damage"] = STEALING["damage"]
        components["minecraft:durability"] = {"max_durability": STEALING["durability"]}
        components["minecraft:enchantable"] = {"slot": "sword", "value": 10}
        components["minecraft:can_destroy_in_creative"] = False
    return {
        "format_version": ITEM_FORMAT,
        "minecraft:item": {
            "description": {"identifier": full_id, "menu_category": {"category": "equipment"}},
            "components": components,
        },
    }


def recipe_json(full_id, pattern, ingredients, unlock_item):
    return {
        "format_version": RECIPE_FORMAT,
        "minecraft:recipe_shaped": {
            "description": {"identifier": f"{full_id}_recipe"},
            "tags": ["crafting_table"],
            "pattern": pattern,
            "key": {symbol: {"item": item} for symbol, item in ingredients.items()},
            "unlock": [{"item": unlock_item}],
            "result": {"item": full_id, "count": 1},
        },
    }


def generate_packs():
    for folder in (BP_DIR / "items", BP_DIR / "recipes", BP_DIR / "entities", RP_DIR / "textures" / "items",
                   RP_DIR / "entity", RP_DIR / "models" / "entity"):
        for old in folder.glob("*"):
            if old.is_file():
                old.unlink()

    texture_data = {}
    lang_lines = ["## Generated by scripts/generate_content.py"]

    entries = [(relic_id(r), r["name"], relic_texture(r["colour"]), "relic", 1, True, r) for r in RELICS]
    entries.append(("diadem", DIADEM["name"], diadem_texture(), "diadem", 16, False, DIADEM))
    entries.append(("stealing", STEALING["name"], stealing_texture(), "stealing", 1, True, STEALING))
    for item_name, display, texture, component, stack, glint, source in entries:
        full_id = f"{NAMESPACE}:{item_name}"
        texture_key = f"{NAMESPACE}_{item_name}"
        write_json(BP_DIR / "items" / f"{item_name}.json", item_json(full_id, texture_key, component, stack, glint))
        if "pattern" in source:  # Stealing has no recipe yet (only /ce:stealing)
            unlock = source["ingredients"][source["pattern"][1][1]]  # the centre ingredient unlocks the recipe
            write_json(BP_DIR / "recipes" / f"{item_name}.json",
                       recipe_json(full_id, source["pattern"], source["ingredients"], unlock))
        texture_path = RP_DIR / "textures" / "items" / f"{item_name}.png"
        texture_path.parent.mkdir(parents=True, exist_ok=True)
        custom = ART_DIR / f"{item_name}.png"
        texture_path.write_bytes(custom.read_bytes() if custom.is_file() else texture)
        texture_data[texture_key] = {"textures": f"textures/items/{item_name}"}
        lang_lines.append(f"item.{full_id}.name={display}")

    for name, texture, geometry, build_geometry in FX_ENTITIES:
        identifier = f"{NAMESPACE}:{name}"
        write_json(BP_DIR / "entities" / f"{name}.json", fx_behavior(identifier))
        write_json(RP_DIR / "entity" / f"{name}.entity.json", fx_client(identifier, texture, geometry))
        write_json(RP_DIR / "models" / "entity" / f"{name}.geo.json", build_geometry())
    write_json(RP_DIR / "ui" / "hud_screen.json", hud_screen())

    write_json(RP_DIR / "textures" / "item_texture.json", {
        "resource_pack_name": "CraftedEffects",
        "texture_name": "atlas.items",
        "texture_data": texture_data,
    })
    texts = RP_DIR / "texts"
    texts.mkdir(parents=True, exist_ok=True)
    lang = "\n".join(lang_lines) + "\n"
    for code in ("de_DE", "en_US"):
        (texts / f"{code}.lang").write_text(lang, encoding="utf-8")
    write_json(texts / "languages.json", ["de_DE", "en_US"])


# ---------------------------------------------------------------- script data

def generate_script_data():
    data = {
        "version": CONFIG_VERSION,
        "namespace": NAMESPACE,
        "effects": {key: name for key, (name, _desc) in EFFECTS.items()},
        "attacks": {key: name for key, (name, _desc) in ATTACKS.items()},
        "boosts": {key: name for key, (name, _desc) in BOOSTS.items()},
        "crosshairTitle": CROSSHAIR_TITLE,
        "relicKeys": [r["key"] for r in RELICS],
        "relics": {
            r["key"]: {
                "name": r["name"],
                "effect": r["effect"],
                "level": 1,
                "maxLevel": r["max_level"],
                "amplifiers": r.get("amplifiers"),
                "attack": r["attack"],
                "cooldown": r["cooldown"],
                "boost": r["boost"]["type"],
                "boostEffect": r["boost"].get("effect"),
                "boostAmplifier": r["boost"].get("amplifier", 0),
                "boostDuration": r["boost"]["duration"],
                "boostCooldown": r["boost"]["cooldown"],
                "effectOn": True,
                "enabled": True,
            }
            for r in RELICS
        },
        "refund": {r["key"]: recipe_items(r["pattern"], r["ingredients"]) for r in RELICS},
    }
    body = json.dumps(data, indent=2, ensure_ascii=False)
    (BP_DIR / "scripts" / "data.js").write_text(
        "// Generated by scripts/generate_content.py - do not edit by hand.\n"
        f"export const DATA = {body};\n",
        encoding="utf-8",
    )


# ---------------------------------------------------------------- guide

def crafting_grid(pattern, ingredients):
    rows = ["| | Links | Mitte | Rechts |", "|---|---|---|---|"]
    for label, row in zip(("Oben", "Mitte", "Unten"), pattern):
        cells = [ITEM_NAMES.get(ingredients[c], ingredients[c]) if c != " " else "–" for c in row]
        rows.append(f"| **{label}** | " + " | ".join(cells) + " |")
    totals = Counter(recipe_items(pattern, ingredients))
    shopping = ", ".join(f"{count}× {ITEM_NAMES.get(item, item)}" for item, count in totals.items())
    return "\n".join(rows) + f"\n\nZutaten insgesamt: {shopping}"


def generate_guide():
    lines = [
        "# CraftedEffects – Effekte, Diadem, Stealing und Crafting",
        "",
        "> Automatisch erzeugt von `scripts/generate_content.py`. Für Minecraft **Bedrock 26.3** – normale Welten und Realms.",
        "",
        "## So funktionieren Effekte",
        "",
        f"- Jeder der {len(RELICS)} Effekte existiert **nur einmal pro Welt**. Wer einen bereits existierenden Effekt noch einmal craftet, bekommt die Zutaten zurück.",
        "- **Jeder Spieler kann nur einen Effekt haben.** Wer schon einen trägt und einen zweiten craftet, bekommt die Zutaten zurück. "
        "Hebst du einen zweiten Effekt auf, wird **getauscht**: der neue bleibt, dein alter fällt vor dir auf den Boden.",
        "- Liegt dein Effekt **irgendwo im Inventar, in der Hotbar oder in der Zweithand**, hast du dauerhaft seine Dauerwirkung.",
        "- Ein Effekt startet auf **Level 1**. Mit dem **Diadem** steigt er bis zum Maximallevel. Das Level verstärkt die Dauerwirkung.",
        "",
        "### Steuerung (Effekt in der Hand)",
        "",
        "| Eingabe | Wirkung |",
        "|---|---|",
        "| **Rechtsklick** (am Handy: Tippen) | **Spezialangriff** – erst ab dem **Maximallevel** |",
        "| **Schleichen + kurzer Rechtsklick** | **Boost-Up** – ab Level 1, eigene Abklingzeit |",
        "| **Schleichen + Rechtsklick 5 Sekunden halten** | Dauerwirkung **an/aus** (Boost-Up und Angriff gehen trotzdem) |",
        "",
        "Über der Hotbar stehen die Abklingzeiten von Angriff und Boost getrennt.",
        "",
        "### Verlust",
        "",
        "- Effekte **verbrennen nicht und explodieren nicht** (Lava, Feuer, Kaktus, TNT, Blitz). Nur das **Void** zerstört einen Effekt sofort.",
        "- Liegt ein Effekt **5 Minuten außerhalb eines Spieler-Inventars** (auf dem Boden, in Truhen, Endertruhen, Fässern, Shulkerkisten …), verfällt er.",
        "  Ein Effekt im Inventar eines Spielers, der offline ist, verfällt nicht.",
        "- Beim **Tod** behältst du deinen Effekt – außer dich tötet ein Spieler mit dem **Stealing**: dann bekommt er deinen Effekt.",
        "- Einen verlorenen Effekt meldet der Chat. Er kann **wieder gecraftet** werden und beginnt dann wieder bei Level 1.",
        "- Tötest du einen anderen Spieler, lässt er seinen **Spielerkopf** fallen (für das Diadem).",
        "- ⚠️ **Bollwerk** und **Kometenhagel** zerstören Blöcke, das Bollwerk sogar **Obsidian und Bedrock (auch den Weltboden)**. Die Kometen hinterlassen fließende Lava.",
        "",
        "## Übersicht",
        "",
        "| Effekt | Dauerwirkung | Max. Level (= Spezialangriff frei) | Spezialangriff | Abklingzeit | Boost-Up | Abklingzeit Boost |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in RELICS:
        effect = EFFECTS[r["effect"]][0]
        max_text = f"{r['max_level']} ({roman(r['max_level'])})"
        if r["effect"] == "health_boost":
            max_text += f" = {hearts(r, r['max_level'])} Herzen"
        lines.append(
            f"| {r['name']} | {effect} | {max_text} | {ATTACKS[r['attack']][0]} | {r['cooldown']} s "
            f"| {boost_text(r)} | {r['boost']['cooldown']} s |"
        )
    lines += ["", "## Effekte im Detail", ""]
    for r in RELICS:
        boost = r["boost"]
        boost_line = f"- **Boost-Up (Schleichen + Rechtsklick):** {boost_text(r)}"
        if boost["type"] != "effect":
            boost_line += f" – {BOOSTS[boost['type']][1]}"
        lines += [
            f"### {r['name']}",
            "",
            f"- **Dauerwirkung:** {EFFECTS[r['effect']][0]} (Level 1 bis {r['max_level']})"
            + (" – Herzen insgesamt je Level: " + " → ".join(str(hearts(r, lvl)) for lvl in range(1, r["max_level"] + 1))
               if r["effect"] == "health_boost" else ""),
            f"- **Spezialangriff ab Level {r['max_level']}**",
            f"- **Spezialangriff – {ATTACKS[r['attack']][0]}:** {ATTACKS[r['attack']][1]}",
            f"- **Abklingzeit Angriff:** {r['cooldown']} Sekunden",
            boost_line,
            f"- **Abklingzeit Boost-Up:** {boost['cooldown']} Sekunden",
        ]
        if r["key"] == "water":
            lines.append("- **Ausrüstung:** Solange du es in der Hand hältst, bekommen deine Stiefel Tiefenläufer III und "
                         "dein Helm Wasseraffinität (beides verschwindet beim Weglegen wieder). Beim Sprint-Schwimmen bist du "
                         "zusätzlich schneller – wie Delfinsgnade.")
        lines += [f"- **Item-ID:** `{NAMESPACE}:{relic_id(r)}`", ""]
        lines += [crafting_grid(r["pattern"], r["ingredients"]), ""]
    lines += [
        "> Health-Boost wirkt nur in 2-Herz-Schritten, deshalb 16 und 26 statt 15 und 25 Herzen.",
        "",
        "## Diadem",
        "",
        "Nimm das Diadem in die Hand und mach einen **Rechtsklick**: Dein Effekt (irgendwo im Inventar, in der Hotbar "
        "oder in der Zweithand) steigt um **1 Level** und das Diadem wird verbraucht. Hast du keinen Effekt oder ist er "
        "schon auf dem Maximallevel, passiert nichts und das Diadem bleibt erhalten. Diademe kann man beliebig oft craften.",
        "",
        f"Item-ID: `{NAMESPACE}:diadem`",
        "",
        crafting_grid(DIADEM["pattern"], DIADEM["ingredients"]),
        "",
        "> Spielerköpfe bekommst du, indem du andere Spieler besiegst.",
        "",
        "## Stealing",
        "",
        f"Eine Waffe ({STEALING['damage']} Schaden). Tötest du damit einen Spieler, der einen Effekt trägt, wandert sein "
        "Effekt **direkt in dein Inventar** (hast du schon einen, wird getauscht) und das Stealing ist verbraucht. "
        "Ohne Effekt beim Opfer bleibt das Stealing erhalten.",
        "",
        f"Item-ID: `{NAMESPACE}:stealing` – **Rezept folgt noch.** Bis dahin gibt es das Stealing nur per `/ce:stealing`.",
        "",
        "## Admin-Befehle",
        "",
        "Nur Operatoren (auf Realms: Spieler mit Operator-Rechten) können diese Befehle nutzen. Cheats müssen **nicht** aktiviert sein. "
        f"Effekt-Namen in Befehlen: `{'`, `'.join(r['key'] for r in RELICS)}`.",
        "",
        "| Befehl | Wirkung |",
        "|---|---|",
        "| `/ce:list` | Zeigt alle Effekte mit Einstellungen, Level, Boost, An/Aus und ob sie gerade existieren. |",
        "| `/ce:level <effekt> <level>` | Setzt das Level, z. B. `/ce:level speed 3`. |",
        "| `/ce:effect <effekt> <wirkung> <level>` | Ändert die Dauerwirkung, z. B. `/ce:effect speed night_vision 1`. |",
        "| `/ce:attack <effekt> <angriff> [abklingzeit]` | Ändert den Spezialangriff, z. B. `/ce:attack speed automace 20`. |",
        "| `/ce:boost <effekt> <dauer> <abklingzeit>` | Ändert Dauer und Abklingzeit des Boost-Ups (Sekunden), z. B. `/ce:boost speed 30 120`. |",
        "| `/ce:toggle <effekt> <true\\|false>` | Schaltet die Dauerwirkung eines Effekts an oder aus (wie 5 s Halten). |",
        "| `/ce:name <effekt> <name>` | Benennt einen Effekt um, z. B. `/ce:name speed \"Sturmeffect\"`. |",
        "| `/ce:enable <effekt> <true\\|false>` | Schaltet einen Effekt ganz an oder aus (aus = nicht craftbar, keine Wirkung). |",
        "| `/ce:free <effekt>` | Gibt einen Effekt frei, damit er neu gecraftet werden kann. Die alte Kopie wird ungültig. |",
        "| `/ce:give <effekt> [spieler]` | Gibt einen Effekt direkt (nur wenn er gerade frei ist). |",
        "| `/ce:stealing [spieler]` | Gibt ein Stealing. |",
        "| `/ce:pvp <true\\|false>` | Schaltet Schaden der Effekt-Angriffe gegen Spieler an oder aus. |",
        "| `/ce:reset` | Stellt alle Einstellungen auf die Standardbelegung zurück. |",
        "",
        "### Wirkungen für `/ce:effect`",
        "",
        "| Befehlswert | Wirkung | Beschreibung |",
        "|---|---|---|",
    ]
    lines += [f"| `{key}` | {name} | {desc} |" for key, (name, desc) in EFFECTS.items()]
    lines += ["", "### Angriffe für `/ce:attack`", "", "| Befehlswert | Angriff | Wirkung |", "|---|---|---|"]
    lines += [f"| `{key}` | {name} | {desc} |" for key, (name, desc) in ATTACKS.items()]
    lines.append("")
    (ROOT / "EFFEKTE.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    generate_packs()
    generate_script_data()
    generate_guide()
    print(f"Generated {len(RELICS)} relics + diadem + stealing, {len(EFFECTS) - 1} effects, {len(ATTACKS) - 1} attacks")


if __name__ == "__main__":
    main()
