#!/usr/bin/env python3
"""Generate every relic file of the add-on from one table.

Writes item and recipe JSON, item textures, language files, the script data
module (behavior_pack/scripts/data.js) and the player guide RELIKTE.md.
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

NAMESPACE = "craftedeffects"
ITEM_FORMAT = "1.21.90"
RECIPE_FORMAT = "1.20.10"
CONFIG_VERSION = 5  # bump when the relic table changes; old world settings are migrated (levels kept)

# Item ids used in recipes -> German name (for RELIKTE.md)
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
}

# Effects an admin can assign: id -> (German name, description)
EFFECTS = {
    "none": ("Kein Effekt", "Das Relikt gibt keinen Dauer-Effekt."),
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
    "dash": ("Dash", "Schleudert dich 30 Blöcke in Blickrichtung (auch nach oben oder unten). Danach 5 Sekunden kein Fallschaden."),
    "ring": ("Kraftring", "Ein Partikelring breitet sich von dir aus (bis 10 Blöcke). Jedes getroffene Wesen bekommt 3 Herzen Schaden."),
    "fortress": (
        "Bollwerk",
        "3 Sekunden Resistenz V (unverwundbar) und Langsamkeit. Eine Explosion um dich schleudert Gegner weg, "
        "macht Schaden und zerstört Blöcke. Du selbst bekommst keinen Schaden.",
    ),
    "comets": (
        "Kometenhagel",
        "8 Kometen erscheinen im Ring 10 Blöcke über dir und stürzen herab. Beim Aufprall explodieren sie und "
        "hinterlassen Lava. Du selbst bekommst keinen Schaden.",
    ),
    "aegis": (
        "Lebensschild",
        "Stößt Gegner in deiner Nähe weg und erzeugt 5 Sekunden lang ein Schild um dich, das Gegner fernhält. "
        "Im Schild bekommst du jede Sekunde Sättigung und Sofortheilung.",
    ),
    "automace": (
        "Auto-Mace",
        "Schleudert dich 30 Blöcke hoch, dann 5 Sekunden sanfter Fall. Schaust du auf einen Gegner, wirst du zu "
        "ihm gedasht. Liegt eine Mace in der Hotbar, wird zu ihr gewechselt und beim Aufprall Smash-Schaden nach "
        "Fallhöhe ausgeteilt. Kein Fallschaden.",
    ),
}

FRAME = {"G": "minecraft:gold_ingot", "D": "minecraft:diamond"}

# The 6 relics, recipes as on the design sheets (read row by row, top to bottom).
# "amplifiers": effect amplifier per level, when it is not simply level - 1.
RELICS = [
    {
        "key": "speed", "name": "Relikt des Windes", "effect": "speed", "max_level": 3,
        "attack": "dash", "cooldown": 30, "colour": (90, 230, 230),
        "pattern": ["RFR", "NBN", "LTL"],
        "ingredients": {
            "R": "minecraft:firework_rocket", "F": "minecraft:flow_armor_trim_smithing_template",
            "N": "minecraft:nautilus_shell", "B": "minecraft:glass_bottle",
            "L": "minecraft:diamond_leggings", "T": "minecraft:bolt_armor_trim_smithing_template",
        },
    },
    {
        "key": "strength", "name": "Relikt der Stärke", "effect": "strength", "max_level": 3,
        "attack": "ring", "cooldown": 30, "colour": (200, 40, 40),
        "pattern": ["AWS", "TBT", "CDC"],
        "ingredients": {
            "A": "minecraft:diamond_axe", "W": "minecraft:ward_armor_trim_smithing_template",
            "S": "minecraft:diamond_sword", "T": "minecraft:ghast_tear", "B": "minecraft:glass_bottle",
            "C": "minecraft:end_crystal", "D": "minecraft:trident",
        },
    },
    {
        "key": "haste", "name": "Relikt des Bergmanns", "effect": "haste", "max_level": 5,
        "attack": "fortress", "cooldown": 90, "colour": (250, 210, 40),
        "pattern": ["POP", "FBF", "XOX"],
        "ingredients": {
            "P": "minecraft:diamond_pickaxe", "O": "minecraft:gold_ore", "F": "minecraft:disc_fragment_5",
            "B": "minecraft:glass_bottle", "X": "minecraft:tnt",
        },
    },
    {
        "key": "fire", "name": "Relikt der Glut", "effect": "fire_resistance", "max_level": 1,
        "attack": "comets", "cooldown": 120, "colour": (255, 120, 20),
        "pattern": ["CRC", "SBS", "LRL"],
        "ingredients": {
            "C": "minecraft:fire_charge", "R": "minecraft:blaze_rod", "S": "minecraft:wither_skeleton_skull",
            "B": "minecraft:glass_bottle", "L": "minecraft:lava_bucket",
        },
    },
    {
        # 30 hearts at the top: 20 -> 24 -> 26 -> 28 -> 30 hearts in total (health boost works in 2-heart steps)
        "key": "health", "name": "Relikt des Lebens", "effect": "health_boost", "max_level": 5,
        "amplifiers": [4, 6, 7, 8, 9],
        "attack": "aegis", "cooldown": 90, "colour": (255, 105, 180),
        "pattern": ["CPC", "TBT", "AOA"],
        "ingredients": {
            "C": "minecraft:diamond_chestplate", "P": "minecraft:enchanted_book", "T": "minecraft:totem_of_undying",
            "B": "minecraft:glass_bottle", "A": "minecraft:golden_apple", "O": "minecraft:ominous_bottle",
        },
    },
    {
        "key": "jump", "name": "Relikt des Himmelssturzes", "effect": "jump_boost", "max_level": 4,
        "attack": "automace", "cooldown": 30, "colour": (120, 200, 255),
        "pattern": ["WEW", "RBR", "DED"],
        "ingredients": {
            "W": "minecraft:wind_charge", "E": "minecraft:echo_shard", "R": "minecraft:rabbit_foot",
            "B": "minecraft:glass_bottle", "D": "minecraft:diamond_boots",
        },
    },
]

DIADEM = {
    "name": "Diadem",
    "pattern": ["GHG", "HEH", "GHG"],
    "ingredients": {"G": "minecraft:gold_ingot", "H": "minecraft:player_head", "E": "minecraft:ender_eye"},
}


def hearts(relic, level):
    """Total hearts with a health boost relic at this level (10 normal + 2 per amplifier step)."""
    amplifier = (relic.get("amplifiers") or list(range(relic["max_level"])))[level - 1]
    return 10 + 2 * (amplifier + 1)


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
        components["minecraft:allow_off_hand"] = {"value": True}  # needed for the offhand + diadem
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
    for folder in (BP_DIR / "items", BP_DIR / "recipes", RP_DIR / "textures" / "items"):
        for old in folder.glob("*"):
            if old.is_file():
                old.unlink()

    texture_data = {}
    lang_lines = ["## Generated by scripts/generate_content.py"]

    entries = [(relic_id(r), r["name"], relic_texture(r["colour"]), "relic", 1, True, r) for r in RELICS]
    entries.append(("diadem", DIADEM["name"], diadem_texture(), "diadem", 16, False, DIADEM))
    for item_name, display, texture, component, stack, glint, source in entries:
        full_id = f"{NAMESPACE}:{item_name}"
        texture_key = f"{NAMESPACE}_{item_name}"
        write_json(BP_DIR / "items" / f"{item_name}.json", item_json(full_id, texture_key, component, stack, glint))
        unlock = source["ingredients"][source["pattern"][1][1]]  # the centre ingredient unlocks the recipe
        write_json(BP_DIR / "recipes" / f"{item_name}.json",
                   recipe_json(full_id, source["pattern"], source["ingredients"], unlock))
        texture_path = RP_DIR / "textures" / "items" / f"{item_name}.png"
        texture_path.parent.mkdir(parents=True, exist_ok=True)
        texture_path.write_bytes(texture)
        texture_data[texture_key] = {"textures": f"textures/items/{item_name}"}
        lang_lines.append(f"item.{full_id}.name={display}")

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
        "# CraftedEffects – Relikte, Diadem und Crafting",
        "",
        "> Automatisch erzeugt von `scripts/generate_content.py`. Für Minecraft **Bedrock 26.3** – normale Welten und Realms.",
        "",
        "## So funktionieren Relikte",
        "",
        "- Jedes der 6 Relikte existiert **nur einmal pro Welt**. Wer ein bereits existierendes Relikt noch einmal craftet, bekommt die Zutaten zurück.",
        "- Liegt ein Relikt **irgendwo im Inventar, in der Hotbar oder in der Zweithand**, hast du dauerhaft seinen Effekt. Mehrere Relikte wirken gleichzeitig.",
        "- Ein Relikt startet auf **Level 1**. Mit dem **Diadem** steigt es bis zum Maximallevel. Das Level verstärkt den Dauer-Effekt.",
        "- Der **Spezialangriff** wird erst auf dem **Maximallevel** freigeschaltet. Dann löst ein **Rechtsklick** (am Handy: Tippen/Halten) mit dem Relikt in der Hand ihn aus. Danach läuft die Abklingzeit (Anzeige über der Hotbar).",
        "- Wird ein Relikt zerstört (Lava, Feuer, Kaktus, Void, Despawn), meldet das der Chat. Es kann **wieder gecraftet** werden und beginnt dann wieder bei Level 1.",
        "- ⚠️ Die Explosionen von **Bollwerk** und **Kometenhagel** zerstören Blöcke und die Kometen hinterlassen Lava – Vorsicht in der Nähe von Bauten.",
        "",
        "## Übersicht",
        "",
        "| Relikt | Dauer-Effekt | Max. Level (= Spezialangriff frei) | Spezialangriff | Abklingzeit |",
        "|---|---|---|---|---|",
    ]
    for r in RELICS:
        effect = EFFECTS[r["effect"]][0]
        max_text = f"{r['max_level']} ({roman(r['max_level'])})"
        if r["effect"] == "health_boost":
            max_text += f" = {hearts(r, r['max_level'])} Herzen"
        lines.append(f"| {r['name']} | {effect} | {max_text} | {ATTACKS[r['attack']][0]} | {r['cooldown']} s |")
    lines += ["", "## Relikte im Detail", ""]
    for r in RELICS:
        lines += [
            f"### {r['name']}",
            "",
            f"- **Dauer-Effekt:** {EFFECTS[r['effect']][0]} (Level 1 bis {r['max_level']})"
            + (" – Herzen insgesamt je Level: " + " → ".join(str(hearts(r, lvl)) for lvl in range(1, r["max_level"] + 1))
               if r["effect"] == "health_boost" else ""),
            f"- **Spezialangriff ab Level {r['max_level']}**",
            f"- **Spezialangriff – {ATTACKS[r['attack']][0]}:** {ATTACKS[r['attack']][1]}",
            f"- **Abklingzeit:** {r['cooldown']} Sekunden",
            f"- **Item-ID:** `{NAMESPACE}:{relic_id(r)}`",
            "",
        ]
        lines += [crafting_grid(r["pattern"], r["ingredients"]), ""]
    lines += [
        "## Diadem",
        "",
        "Lege ein Relikt in die **Zweithand**, nimm das Diadem in die Haupthand und mach einen **Rechtsklick**: "
        "Das Relikt steigt um **1 Level** (bis zum Maximallevel) und das Diadem wird verbraucht. "
        "Ist das Relikt schon auf dem Maximallevel, passiert nichts und das Diadem bleibt erhalten. "
        "Diademe kann man beliebig oft craften.",
        "",
        f"Item-ID: `{NAMESPACE}:diadem`",
        "",
        crafting_grid(DIADEM["pattern"], DIADEM["ingredients"]),
        "",
        "> Hinweis: Spielerköpfe gibt es in Bedrock nicht im Überlebensmodus – nur per Befehl oder im Kreativmodus.",
        "",
        "## Admin-Befehle",
        "",
        "Nur Operatoren (auf Realms: Spieler mit Operator-Rechten) können diese Befehle nutzen. Cheats müssen **nicht** aktiviert sein. "
        f"Relikt-Namen in Befehlen: `{'`, `'.join(r['key'] for r in RELICS)}`.",
        "",
        "| Befehl | Wirkung |",
        "|---|---|",
        "| `/ce:list` | Zeigt alle Relikte mit Einstellungen, Level und ob sie gerade existieren. |",
        "| `/ce:level <relikt> <level>` | Setzt das Level, z. B. `/ce:level speed 3`. |",
        "| `/ce:effect <relikt> <effekt> <level>` | Ändert den Dauer-Effekt, z. B. `/ce:effect speed night_vision 1`. |",
        "| `/ce:attack <relikt> <angriff> [abklingzeit]` | Ändert den Spezialangriff, z. B. `/ce:attack speed automace 20`. |",
        "| `/ce:name <relikt> <name>` | Benennt ein Relikt um, z. B. `/ce:name speed \"Relikt des Sturms\"`. |",
        "| `/ce:enable <relikt> <true\\|false>` | Schaltet ein Relikt an oder aus (aus = nicht craftbar, keine Wirkung). |",
        "| `/ce:free <relikt>` | Gibt ein Relikt frei, damit es neu gecraftet werden kann. Die alte Kopie wird ungültig. |",
        "| `/ce:give <relikt> [spieler]` | Gibt ein Relikt direkt (nur wenn es gerade frei ist). |",
        "| `/ce:pvp <true\\|false>` | Schaltet Schaden der Relikt-Angriffe gegen Spieler an oder aus. |",
        "| `/ce:reset` | Stellt alle Einstellungen auf die Standardbelegung zurück. |",
        "",
        "### Effekte für `/ce:effect`",
        "",
        "| Befehlswert | Effekt | Wirkung |",
        "|---|---|---|",
    ]
    lines += [f"| `{key}` | {name} | {desc} |" for key, (name, desc) in EFFECTS.items()]
    lines += ["", "### Angriffe für `/ce:attack`", "", "| Befehlswert | Angriff | Wirkung |", "|---|---|---|"]
    lines += [f"| `{key}` | {name} | {desc} |" for key, (name, desc) in ATTACKS.items()]
    lines.append("")
    (ROOT / "RELIKTE.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    generate_packs()
    generate_script_data()
    generate_guide()
    print(f"Generated {len(RELICS)} relics + diadem, {len(EFFECTS) - 1} effects, {len(ATTACKS) - 1} attacks")


if __name__ == "__main__":
    main()
