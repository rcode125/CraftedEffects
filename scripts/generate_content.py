#!/usr/bin/env python3
"""Generate every relic file of the add-on from one table.

Writes item and recipe JSON, item textures, language files, the script data
module (behavior_pack/scripts/data.js) and the player guide RELIKTE.md.
Edit the tables below, then run this script (build_addon.py runs it too).
"""

import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BP_DIR = ROOT / "behavior_pack"
RP_DIR = ROOT / "resource_pack"

NAMESPACE = "craftedeffects"
ITEM_FORMAT = "1.21.90"
RECIPE_FORMAT = "1.20.10"

# Every recipe uses the same frame; only the centre ingredient differs.
RECIPE_PATTERN = ["GDG", "DCD", "GDG"]
FRAME = {"G": "minecraft:gold_ingot", "D": "minecraft:diamond"}

# Effects an admin can assign: id -> (German name, description)
EFFECTS = {
    "none": ("Kein Effekt", "Das Relikt gibt keinen Dauer-Effekt."),
    "speed": ("Schnelligkeit", "Schneller laufen."),
    "haste": ("Eile", "Schneller abbauen."),
    "strength": ("Stärke", "Mehr Nahkampfschaden."),
    "jump_boost": ("Sprungkraft", "Höher springen, weniger Fallschaden."),
    "regeneration": ("Regeneration", "Leben regeneriert sich laufend."),
    "resistance": ("Resistenz", "Weniger Schaden aus allen Quellen."),
    "fire_resistance": ("Feuerresistenz", "Immun gegen Feuer und Lava."),
    "water_breathing": ("Wasseratmung", "Unter Wasser atmen."),
    "invisibility": ("Unsichtbarkeit", "Für andere unsichtbar (Rüstung bleibt sichtbar)."),
    "night_vision": ("Nachtsicht", "Im Dunkeln alles hell sehen."),
    "health_boost": ("Gesundheitsschub", "Mehr maximale Herzen."),
    "absorption": ("Absorption", "Goldene Extra-Herzen."),
    "saturation": ("Sättigung", "Hunger füllt sich auf."),
    "slow_falling": ("Sanfter Fall", "Langsam fallen, kein Fallschaden."),
    "conduit_power": ("Meereskraft", "Unter Wasser sehen, atmen und schneller abbauen."),
    "village_hero": ("Held des Dorfes", "Bessere Handelspreise bei Dorfbewohnern."),
}

# Special attacks: id -> (German name, description, default cooldown in seconds)
ATTACKS = {
    "none": ("Kein Angriff", "Rechtsklick macht nichts.", 0),
    "fireball": ("Feuerball", "Schießt drei Feuerbälle in Blickrichtung.", 8),
    "lightning": ("Blitz", "Lässt einen Blitz am anvisierten Punkt (bis 48 Blöcke) einschlagen.", 15),
    "shockwave": ("Schockwelle", "Schleudert alle Gegner im Umkreis von 6 Blöcken weg (8 Schaden).", 20),
    "dash": ("Dash", "Schneller Sprint nach vorne in Blickrichtung.", 5),
    "teleport": ("Teleport", "Teleportiert dich bis zu 16 Blöcke in Blickrichtung.", 10),
    "heal": ("Heilung", "Heilt dich und Mitspieler im Umkreis von 8 Blöcken.", 30),
    "shield": ("Schild", "8 Sekunden Resistenz III und Absorption II.", 30),
    "automace": (
        "Auto-Mace",
        "Schleudert dich ~20 Blöcke hoch, dann sanfter Fall. Schaust du auf einen Gegner, "
        "wirst du zu ihm gedasht. Liegt eine Mace in der Hotbar, wird automatisch zu ihr "
        "gewechselt und beim Aufprall Smash-Schaden nach Fallhöhe ausgeteilt.",
        25,
    ),
}

# The 12 relics: (default name, effect, level, attack, colour RGB, core item, core name)
RELICS = [
    ("Relikt des Himmelssturzes", "jump_boost", 2, "automace", (120, 200, 255), "minecraft:breeze_rod", "Breeze-Rute"),
    ("Relikt der Stärke", "strength", 2, "shockwave", (200, 40, 40), "minecraft:blaze_rod", "Lohenrute"),
    ("Relikt des Windes", "speed", 2, "dash", (90, 230, 230), "minecraft:sugar", "Zucker"),
    ("Relikt der Glut", "fire_resistance", 1, "fireball", (255, 120, 20), "minecraft:magma_cream", "Magmacreme"),
    ("Relikt des Lebens", "regeneration", 1, "heal", (255, 105, 180), "minecraft:ghast_tear", "Ghast-Träne"),
    ("Relikt des Bollwerks", "resistance", 1, "shield", (150, 150, 165), "minecraft:iron_block", "Eisenblock"),
    ("Relikt der Nacht", "night_vision", 1, "teleport", (60, 60, 200), "minecraft:ender_pearl", "Enderperle"),
    ("Relikt der Tiefe", "water_breathing", 1, "lightning", (30, 110, 220), "minecraft:heart_of_the_sea", "Herz des Meeres"),
    ("Relikt des Bergmanns", "haste", 2, "shockwave", (40, 200, 80), "minecraft:emerald_block", "Smaragdblock"),
    ("Relikt der Schatten", "invisibility", 1, "teleport", (110, 40, 150), "minecraft:fermented_spider_eye", "Fermentiertes Spinnenauge"),
    ("Relikt des Goldes", "absorption", 1, "shield", (250, 210, 40), "minecraft:golden_apple", "Goldener Apfel"),
    ("Relikt der Unsterblichkeit", "health_boost", 1, "heal", (240, 240, 140), "minecraft:totem_of_undying", "Totem der Unsterblichkeit"),
]

ROMAN = ["", "I", "II", "III", "IV", "V"]


def relic_id(index):
    return f"relic_{index:02d}"


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


# ---------------------------------------------------------------- textures

def png_bytes(pixels, size=16):
    raw = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in pixels)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def relic_texture(colour):
    """Gold amulet with a coloured gem: chain on top, shaded gem in the middle."""
    clear = (0, 0, 0, 0)
    gold, gold_dark = (255, 215, 80, 255), (170, 120, 30, 255)
    r, g, b = colour
    light = (min(255, r + 90), min(255, g + 90), min(255, b + 90), 255)
    mid = (r, g, b, 255)
    dark = (r * 3 // 5, g * 3 // 5, b * 3 // 5, 255)
    pixels = [[clear] * 16 for _ in range(16)]
    # chain
    for x, y in [(5, 0), (10, 0), (5, 1), (10, 1), (6, 2), (9, 2), (6, 3), (9, 3), (7, 4), (8, 4)]:
        pixels[y][x] = gold
    # setting (diamond shape) and gem
    cx, cy = 7.5, 10.0
    for y in range(4, 16):
        for x in range(16):
            dist = abs(x - cx) + abs(y - cy)
            if dist <= 6.0:
                pixels[y][x] = gold_dark if dist > 5.0 else gold
            if dist <= 4.5:
                shade = light if (x - cx) + (y - cy) < -1.5 else mid if (x - cx) + (y - cy) < 1.5 else dark
                pixels[y][x] = shade
    pixels[8][6] = (255, 255, 255, 255)
    return png_bytes(pixels)


# ---------------------------------------------------------------- packs

def generate_packs():
    for old in list((BP_DIR / "items").glob("relic_*.json")) + list((BP_DIR / "recipes").glob("relic_*.json")):
        old.unlink()

    texture_data = {}
    lang_lines = ["## Generated by scripts/generate_content.py"]
    for index, (name, _effect, _level, _attack, colour, core, _core_name) in enumerate(RELICS, start=1):
        rid = relic_id(index)
        full_id = f"{NAMESPACE}:{rid}"
        texture_key = f"{NAMESPACE}_{rid}"
        write_json(BP_DIR / "items" / f"{rid}.json", {
            "format_version": ITEM_FORMAT,
            "minecraft:item": {
                "description": {"identifier": full_id, "menu_category": {"category": "equipment"}},
                "components": {
                    "minecraft:display_name": {"value": f"item.{full_id}.name"},
                    "minecraft:icon": {"textures": {"default": texture_key}},
                    "minecraft:max_stack_size": 1,
                    "minecraft:glint": True,
                    "minecraft:rarity": "epic",
                    f"{NAMESPACE}:relic": {},
                },
            },
        })
        write_json(BP_DIR / "recipes" / f"{rid}.json", {
            "format_version": RECIPE_FORMAT,
            "minecraft:recipe_shaped": {
                "description": {"identifier": f"{NAMESPACE}:{rid}_recipe"},
                "tags": ["crafting_table"],
                "pattern": RECIPE_PATTERN,
                "key": {
                    "G": {"item": FRAME["G"]},
                    "D": {"item": FRAME["D"]},
                    "C": {"item": core},
                },
                "unlock": [{"context": "AlwaysUnlocked"}],
                "result": {"item": full_id, "count": 1},
            },
        })
        texture_path = RP_DIR / "textures" / "items" / f"{rid}.png"
        texture_path.parent.mkdir(parents=True, exist_ok=True)
        texture_path.write_bytes(relic_texture(colour))
        texture_data[texture_key] = {"textures": f"textures/items/{rid}"}
        lang_lines.append(f"item.{full_id}.name={name}")

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
        "namespace": NAMESPACE,
        "effects": {key: name for key, (name, _desc) in EFFECTS.items()},
        "attacks": {key: {"name": name, "cooldown": cd} for key, (name, _desc, cd) in ATTACKS.items()},
        "relics": [
            {
                "name": name,
                "effect": effect,
                "level": level,
                "attack": attack,
                "cooldown": ATTACKS[attack][2],
                "enabled": True,
            }
            for (name, effect, level, attack, *_rest) in RELICS
        ],
        "refund": [FRAME["G"]] * 4 + [FRAME["D"]] * 4,
        "cores": [core for (*_head, core, _core_name) in RELICS],
    }
    body = json.dumps(data, indent=2, ensure_ascii=False)
    (BP_DIR / "scripts" / "data.js").write_text(
        "// Generated by scripts/generate_content.py - do not edit by hand.\n"
        f"export const DATA = {body};\n",
        encoding="utf-8",
    )


# ---------------------------------------------------------------- guide

def crafting_grid(core_name):
    names = {"G": "Goldbarren", "D": "Diamant", "C": core_name}
    rows = ["| | Links | Mitte | Rechts |", "|---|---|---|---|"]
    for label, row in zip(("Oben", "Mitte", "Unten"), RECIPE_PATTERN):
        cells = [f"**{names[c]}**" if c == "C" else names[c] for c in row]
        rows.append(f"| **{label}** | " + " | ".join(cells) + " |")
    return "\n".join(rows)


def generate_guide():
    lines = [
        "# CraftedEffects – Relikte, Effekte und Crafting",
        "",
        "> Automatisch erzeugt von `scripts/generate_content.py`. Für Minecraft **Bedrock 26.3** – normale Welten und Realms.",
        "",
        "## So funktionieren Relikte",
        "",
        "- Jedes der 12 Relikte existiert **nur einmal pro Welt**. Wer ein bereits existierendes Relikt noch einmal craftet, bekommt die Zutaten zurück.",
        "- Liegt ein Relikt **irgendwo im Inventar, in der Hotbar oder in der Zweithand**, hast du dauerhaft seinen Effekt. Mehrere Relikte wirken gleichzeitig.",
        "- **Rechtsklick** (am Handy: Tippen/Halten) mit dem Relikt in der Hand löst den **Spezialangriff** aus. Danach läuft eine Abklingzeit (Anzeige über der Hotbar).",
        "- Wird ein Relikt zerstört (Lava, Feuer, Kaktus, Void, Despawn), meldet das der Chat und es kann **wieder gecraftet** werden.",
        "- Admins (Operatoren) können Effekt, Stufe, Angriff, Abklingzeit und Namen jedes Relikts ändern – siehe Befehle unten.",
        "",
        "## Alle Relikte und ihre Rezepte",
        "",
        f"Alle Rezepte werden an der **Werkbank (Crafting Table)** gelegt und haben denselben Rahmen: "
        "4 Goldbarren in den Ecken, 4 Diamanten an den Seiten. **Nur die Mitte** bestimmt, welches Relikt entsteht. "
        "Die Rezepte sind von Anfang an im Rezeptbuch freigeschaltet.",
        "",
        "```text",
        "+-----------+-----------+-----------+",
        "| Gold      | Diamant   | Gold      |",
        "+-----------+-----------+-----------+",
        "| Diamant   |  KERN     | Diamant   |",
        "+-----------+-----------+-----------+",
        "| Gold      | Diamant   | Gold      |",
        "+-----------+-----------+-----------+",
        "```",
        "",
        "| # | Relikt (Standard) | Kern in der Mitte | Dauer-Effekt | Spezialangriff | Abklingzeit |",
        "|---|---|---|---|---|---|",
    ]
    for index, (name, effect, level, attack, _colour, core, core_name) in enumerate(RELICS, start=1):
        lines.append(
            f"| {index} | {name} | {core_name} (`{core}`) | {EFFECTS[effect][0]} {ROMAN[level]} "
            f"| {ATTACKS[attack][0]} | {ATTACKS[attack][2]} s |"
        )
    lines.append("")
    for index, (name, effect, level, attack, _colour, core, core_name) in enumerate(RELICS, start=1):
        lines += [
            f"### {index}. {name}",
            "",
            f"Effekt: **{EFFECTS[effect][0]} {ROMAN[level]}** · Angriff: **{ATTACKS[attack][0]}** · "
            f"Item-ID: `{NAMESPACE}:{relic_id(index)}`",
            "",
            crafting_grid(core_name),
            "",
        ]
    lines += [
        "## Alle verfügbaren Effekte",
        "",
        "Diese Effekte kann ein Admin mit `/ce:effect` vergeben. Stufe 1–5 (I–V).",
        "",
        "| Befehlswert | Effekt | Wirkung |",
        "|---|---|---|",
    ]
    lines += [f"| `{key}` | {name} | {desc} |" for key, (name, desc) in EFFECTS.items()]
    lines += [
        "",
        "## Alle Spezialangriffe",
        "",
        "Diese Angriffe kann ein Admin mit `/ce:attack` vergeben. Angriffe treffen Mobs und – wenn PvP an ist – andere Spieler, nie dich selbst.",
        "",
        "| Befehlswert | Angriff | Wirkung | Standard-Abklingzeit |",
        "|---|---|---|---|",
    ]
    lines += [f"| `{key}` | {name} | {desc} | {cd} s |" for key, (name, desc, cd) in ATTACKS.items()]
    lines += [
        "",
        "## Admin-Befehle",
        "",
        "Nur Operatoren (auf Realms: Spieler mit Operator-Rechten) können diese Befehle nutzen. Cheats müssen **nicht** aktiviert sein.",
        "",
        "| Befehl | Wirkung |",
        "|---|---|",
        "| `/ce:list` | Zeigt alle Relikte mit Einstellungen und ob sie gerade existieren. |",
        "| `/ce:effect <relikt> <effekt> <stufe>` | Setzt den Dauer-Effekt, z. B. `/ce:effect 3 speed 3`. |",
        "| `/ce:attack <relikt> <angriff> [abklingzeit]` | Setzt den Spezialangriff, z. B. `/ce:attack 3 automace 20`. |",
        "| `/ce:name <relikt> <name>` | Benennt ein Relikt um, z. B. `/ce:name 3 \"Relikt des Blitzes\"`. |",
        "| `/ce:enable <relikt> <true\\|false>` | Schaltet ein Relikt an oder aus (aus = nicht craftbar, keine Wirkung). |",
        "| `/ce:free <relikt>` | Gibt ein Relikt frei, damit es neu gecraftet werden kann. Die alte Kopie wird ungültig. |",
        "| `/ce:give <relikt> [spieler]` | Gibt ein Relikt direkt (nur wenn es gerade frei ist). |",
        "| `/ce:pvp <true\\|false>` | Schaltet Schaden der Relikt-Angriffe gegen Spieler an oder aus. |",
        "| `/ce:reset` | Stellt alle Einstellungen auf die Standardbelegung zurück. |",
        "",
    ]
    (ROOT / "RELIKTE.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    generate_packs()
    generate_script_data()
    generate_guide()
    print(f"Generated {len(RELICS)} relics, {len(EFFECTS) - 1} effects, {len(ATTACKS) - 1} attacks")


if __name__ == "__main__":
    main()
