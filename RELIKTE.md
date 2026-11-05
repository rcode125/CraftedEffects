# CraftedEffects – Relikte, Effekte und Crafting

> Automatisch erzeugt von `scripts/generate_content.py`. Für Minecraft **Bedrock 26.3** – normale Welten und Realms.

## So funktionieren Relikte

- Jedes der 12 Relikte existiert **nur einmal pro Welt**. Wer ein bereits existierendes Relikt noch einmal craftet, bekommt die Zutaten zurück.
- Liegt ein Relikt **irgendwo im Inventar, in der Hotbar oder in der Zweithand**, hast du dauerhaft seinen Effekt. Mehrere Relikte wirken gleichzeitig.
- **Rechtsklick** (am Handy: Tippen/Halten) mit dem Relikt in der Hand löst den **Spezialangriff** aus. Danach läuft eine Abklingzeit (Anzeige über der Hotbar).
- Wird ein Relikt zerstört (Lava, Feuer, Kaktus, Void, Despawn), meldet das der Chat und es kann **wieder gecraftet** werden.
- Admins (Operatoren) können Effekt, Stufe, Angriff, Abklingzeit und Namen jedes Relikts ändern – siehe Befehle unten.

## Alle Relikte und ihre Rezepte

Alle Rezepte werden an der **Werkbank (Crafting Table)** gelegt und haben denselben Rahmen: 4 Goldbarren in den Ecken, 4 Diamanten an den Seiten. **Nur die Mitte** bestimmt, welches Relikt entsteht. Die Rezepte sind von Anfang an im Rezeptbuch freigeschaltet.

```text
+-----------+-----------+-----------+
| Gold      | Diamant   | Gold      |
+-----------+-----------+-----------+
| Diamant   |  KERN     | Diamant   |
+-----------+-----------+-----------+
| Gold      | Diamant   | Gold      |
+-----------+-----------+-----------+
```

| # | Relikt (Standard) | Kern in der Mitte | Dauer-Effekt | Spezialangriff | Abklingzeit |
|---|---|---|---|---|---|
| 1 | Relikt des Himmelssturzes | Breeze-Rute (`minecraft:breeze_rod`) | Sprungkraft II | Auto-Mace | 25 s |
| 2 | Relikt der Stärke | Lohenrute (`minecraft:blaze_rod`) | Stärke II | Schockwelle | 20 s |
| 3 | Relikt des Windes | Zucker (`minecraft:sugar`) | Schnelligkeit II | Dash | 5 s |
| 4 | Relikt der Glut | Magmacreme (`minecraft:magma_cream`) | Feuerresistenz I | Feuerball | 8 s |
| 5 | Relikt des Lebens | Ghast-Träne (`minecraft:ghast_tear`) | Regeneration I | Heilung | 30 s |
| 6 | Relikt des Bollwerks | Eisenblock (`minecraft:iron_block`) | Resistenz I | Schild | 30 s |
| 7 | Relikt der Nacht | Enderperle (`minecraft:ender_pearl`) | Nachtsicht I | Teleport | 10 s |
| 8 | Relikt der Tiefe | Herz des Meeres (`minecraft:heart_of_the_sea`) | Wasseratmung I | Blitz | 15 s |
| 9 | Relikt des Bergmanns | Smaragdblock (`minecraft:emerald_block`) | Eile II | Schockwelle | 20 s |
| 10 | Relikt der Schatten | Fermentiertes Spinnenauge (`minecraft:fermented_spider_eye`) | Unsichtbarkeit I | Teleport | 10 s |
| 11 | Relikt des Goldes | Goldener Apfel (`minecraft:golden_apple`) | Absorption I | Schild | 30 s |
| 12 | Relikt der Unsterblichkeit | Totem der Unsterblichkeit (`minecraft:totem_of_undying`) | Gesundheitsschub I | Heilung | 30 s |

### 1. Relikt des Himmelssturzes

Effekt: **Sprungkraft II** · Angriff: **Auto-Mace** · Item-ID: `craftedeffects:relic_01`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Breeze-Rute** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 2. Relikt der Stärke

Effekt: **Stärke II** · Angriff: **Schockwelle** · Item-ID: `craftedeffects:relic_02`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Lohenrute** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 3. Relikt des Windes

Effekt: **Schnelligkeit II** · Angriff: **Dash** · Item-ID: `craftedeffects:relic_03`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Zucker** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 4. Relikt der Glut

Effekt: **Feuerresistenz I** · Angriff: **Feuerball** · Item-ID: `craftedeffects:relic_04`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Magmacreme** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 5. Relikt des Lebens

Effekt: **Regeneration I** · Angriff: **Heilung** · Item-ID: `craftedeffects:relic_05`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Ghast-Träne** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 6. Relikt des Bollwerks

Effekt: **Resistenz I** · Angriff: **Schild** · Item-ID: `craftedeffects:relic_06`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Eisenblock** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 7. Relikt der Nacht

Effekt: **Nachtsicht I** · Angriff: **Teleport** · Item-ID: `craftedeffects:relic_07`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Enderperle** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 8. Relikt der Tiefe

Effekt: **Wasseratmung I** · Angriff: **Blitz** · Item-ID: `craftedeffects:relic_08`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Herz des Meeres** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 9. Relikt des Bergmanns

Effekt: **Eile II** · Angriff: **Schockwelle** · Item-ID: `craftedeffects:relic_09`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Smaragdblock** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 10. Relikt der Schatten

Effekt: **Unsichtbarkeit I** · Angriff: **Teleport** · Item-ID: `craftedeffects:relic_10`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Fermentiertes Spinnenauge** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 11. Relikt des Goldes

Effekt: **Absorption I** · Angriff: **Schild** · Item-ID: `craftedeffects:relic_11`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Goldener Apfel** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

### 12. Relikt der Unsterblichkeit

Effekt: **Gesundheitsschub I** · Angriff: **Heilung** · Item-ID: `craftedeffects:relic_12`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | **Totem der Unsterblichkeit** | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

## Alle verfügbaren Effekte

Diese Effekte kann ein Admin mit `/ce:effect` vergeben. Stufe 1–5 (I–V).

| Befehlswert | Effekt | Wirkung |
|---|---|---|
| `none` | Kein Effekt | Das Relikt gibt keinen Dauer-Effekt. |
| `speed` | Schnelligkeit | Schneller laufen. |
| `haste` | Eile | Schneller abbauen. |
| `strength` | Stärke | Mehr Nahkampfschaden. |
| `jump_boost` | Sprungkraft | Höher springen, weniger Fallschaden. |
| `regeneration` | Regeneration | Leben regeneriert sich laufend. |
| `resistance` | Resistenz | Weniger Schaden aus allen Quellen. |
| `fire_resistance` | Feuerresistenz | Immun gegen Feuer und Lava. |
| `water_breathing` | Wasseratmung | Unter Wasser atmen. |
| `invisibility` | Unsichtbarkeit | Für andere unsichtbar (Rüstung bleibt sichtbar). |
| `night_vision` | Nachtsicht | Im Dunkeln alles hell sehen. |
| `health_boost` | Gesundheitsschub | Mehr maximale Herzen. |
| `absorption` | Absorption | Goldene Extra-Herzen. |
| `saturation` | Sättigung | Hunger füllt sich auf. |
| `slow_falling` | Sanfter Fall | Langsam fallen, kein Fallschaden. |
| `conduit_power` | Meereskraft | Unter Wasser sehen, atmen und schneller abbauen. |
| `village_hero` | Held des Dorfes | Bessere Handelspreise bei Dorfbewohnern. |

## Alle Spezialangriffe

Diese Angriffe kann ein Admin mit `/ce:attack` vergeben. Angriffe treffen Mobs und – wenn PvP an ist – andere Spieler, nie dich selbst.

| Befehlswert | Angriff | Wirkung | Standard-Abklingzeit |
|---|---|---|---|
| `none` | Kein Angriff | Rechtsklick macht nichts. | 0 s |
| `fireball` | Feuerball | Schießt drei Feuerbälle in Blickrichtung. | 8 s |
| `lightning` | Blitz | Lässt einen Blitz am anvisierten Punkt (bis 48 Blöcke) einschlagen. | 15 s |
| `shockwave` | Schockwelle | Schleudert alle Gegner im Umkreis von 6 Blöcken weg (8 Schaden). | 20 s |
| `dash` | Dash | Schneller Sprint nach vorne in Blickrichtung. | 5 s |
| `teleport` | Teleport | Teleportiert dich bis zu 16 Blöcke in Blickrichtung. | 10 s |
| `heal` | Heilung | Heilt dich und Mitspieler im Umkreis von 8 Blöcken. | 30 s |
| `shield` | Schild | 8 Sekunden Resistenz III und Absorption II. | 30 s |
| `automace` | Auto-Mace | Schleudert dich ~20 Blöcke hoch, dann sanfter Fall. Schaust du auf einen Gegner, wirst du zu ihm gedasht. Liegt eine Mace in der Hotbar, wird automatisch zu ihr gewechselt und beim Aufprall Smash-Schaden nach Fallhöhe ausgeteilt. | 25 s |

## Admin-Befehle

Nur Operatoren (auf Realms: Spieler mit Operator-Rechten) können diese Befehle nutzen. Cheats müssen **nicht** aktiviert sein.

| Befehl | Wirkung |
|---|---|
| `/ce:list` | Zeigt alle Relikte mit Einstellungen und ob sie gerade existieren. |
| `/ce:effect <relikt> <effekt> <stufe>` | Setzt den Dauer-Effekt, z. B. `/ce:effect 3 speed 3`. |
| `/ce:attack <relikt> <angriff> [abklingzeit]` | Setzt den Spezialangriff, z. B. `/ce:attack 3 automace 20`. |
| `/ce:name <relikt> <name>` | Benennt ein Relikt um, z. B. `/ce:name 3 "Relikt des Blitzes"`. |
| `/ce:enable <relikt> <true\|false>` | Schaltet ein Relikt an oder aus (aus = nicht craftbar, keine Wirkung). |
| `/ce:free <relikt>` | Gibt ein Relikt frei, damit es neu gecraftet werden kann. Die alte Kopie wird ungültig. |
| `/ce:give <relikt> [spieler]` | Gibt ein Relikt direkt (nur wenn es gerade frei ist). |
| `/ce:pvp <true\|false>` | Schaltet Schaden der Relikt-Angriffe gegen Spieler an oder aus. |
| `/ce:reset` | Stellt alle Einstellungen auf die Standardbelegung zurück. |
