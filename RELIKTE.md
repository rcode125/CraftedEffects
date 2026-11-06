# CraftedEffects – Relikte, Diadem und Crafting

> Automatisch erzeugt von `scripts/generate_content.py`. Für Minecraft **Bedrock 26.3** – normale Welten und Realms.

## So funktionieren Relikte

- Jedes der 6 Relikte existiert **nur einmal pro Welt**. Wer ein bereits existierendes Relikt noch einmal craftet, bekommt die Zutaten zurück.
- Liegt ein Relikt **irgendwo im Inventar, in der Hotbar oder in der Zweithand**, hast du dauerhaft seinen Effekt. Mehrere Relikte wirken gleichzeitig.
- **Rechtsklick** (am Handy: Tippen/Halten) mit dem Relikt in der Hand löst den **Spezialangriff** aus. Danach läuft die Abklingzeit (Anzeige über der Hotbar).
- Ein Relikt startet auf **Level 1**. Mit dem **Diadem** steigt es bis zum Maximallevel. Das Level verstärkt nur den Dauer-Effekt.
- Wird ein Relikt zerstört (Lava, Feuer, Kaktus, Void, Despawn), meldet das der Chat. Es kann **wieder gecraftet** werden und beginnt dann wieder bei Level 1.
- ⚠️ Die Explosionen von **Bollwerk** und **Kometenhagel** zerstören Blöcke und die Kometen hinterlassen Lava – Vorsicht in der Nähe von Bauten.

## Übersicht

| Relikt | Dauer-Effekt | Max. Level | Spezialangriff | Abklingzeit | Rezept |
|---|---|---|---|---|---|
| Relikt des Windes | Schnelligkeit | 3 (III) | Dash | 30 s | fertig |
| Relikt der Stärke | Stärke | 3 (III) | Kraftring | 30 s | vorläufig |
| Relikt des Bergmanns | Eile | 5 (V) | Bollwerk | 90 s | vorläufig |
| Relikt der Glut | Feuerresistenz | 1 (I) | Kometenhagel | 120 s | vorläufig |
| Relikt des Lebens | Gesundheitsschub | 10 (X) = 30 Herzen | Lebensschild | 90 s | vorläufig |
| Relikt des Himmelssturzes | Sprungkraft | 4 (IV) | Auto-Mace | 30 s | vorläufig |

## Relikte im Detail

### Relikt des Windes

- **Dauer-Effekt:** Schnelligkeit (Level 1 bis 3)
- **Spezialangriff – Dash:** Schleudert dich 30 Blöcke in Blickrichtung (auch nach oben oder unten). Danach 5 Sekunden kein Fallschaden.
- **Abklingzeit:** 30 Sekunden
- **Item-ID:** `craftedeffects:relic_speed`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Feuerwerksrakete | Flow-Rüstungsbesatz | Feuerwerksrakete |
| **Mitte** | Nautilusschale | Glasflasche | Nautilusschale |
| **Unten** | Diamanthose | Bolt-Rüstungsbesatz | Diamanthose |

Zutaten insgesamt: 2× Feuerwerksrakete, 1× Flow-Rüstungsbesatz, 2× Nautilusschale, 1× Glasflasche, 2× Diamanthose, 1× Bolt-Rüstungsbesatz

### Relikt der Stärke

- **Dauer-Effekt:** Stärke (Level 1 bis 3)
- **Spezialangriff – Kraftring:** Ein Partikelring breitet sich von dir aus (bis 10 Blöcke). Jedes getroffene Wesen bekommt 3 Herzen Schaden.
- **Abklingzeit:** 30 Sekunden
- **Item-ID:** `craftedeffects:relic_strength`

> ⏳ **Vorläufiges Rezept** – das endgültige Rezept folgt.

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Diamant | Lohenrute | Diamant |
| **Mitte** | Lohenrute | Glasflasche | Lohenrute |
| **Unten** | Diamant | Lohenrute | Diamant |

Zutaten insgesamt: 4× Diamant, 4× Lohenrute, 1× Glasflasche

### Relikt des Bergmanns

- **Dauer-Effekt:** Eile (Level 1 bis 5)
- **Spezialangriff – Bollwerk:** 3 Sekunden Resistenz V (unverwundbar) und Langsamkeit. Eine Explosion um dich schleudert Gegner weg, macht Schaden und zerstört Blöcke. Du selbst bekommst keinen Schaden.
- **Abklingzeit:** 90 Sekunden
- **Item-ID:** `craftedeffects:relic_haste`

> ⏳ **Vorläufiges Rezept** – das endgültige Rezept folgt.

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Diamant-Spitzhacke | Smaragd | Diamant-Spitzhacke |
| **Mitte** | Smaragd | Glasflasche | Smaragd |
| **Unten** | Smaragd | Smaragd | Smaragd |

Zutaten insgesamt: 2× Diamant-Spitzhacke, 6× Smaragd, 1× Glasflasche

### Relikt der Glut

- **Dauer-Effekt:** Feuerresistenz (Level 1 bis 1)
- **Spezialangriff – Kometenhagel:** 8 Kometen erscheinen im Ring 10 Blöcke über dir und stürzen herab. Beim Aufprall explodieren sie und hinterlassen Lava. Du selbst bekommst keinen Schaden.
- **Abklingzeit:** 120 Sekunden
- **Item-ID:** `craftedeffects:relic_fire`

> ⏳ **Vorläufiges Rezept** – das endgültige Rezept folgt.

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | Magmacreme | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

Zutaten insgesamt: 4× Goldbarren, 4× Diamant, 1× Magmacreme

### Relikt des Lebens

- **Dauer-Effekt:** Gesundheitsschub (Level 1 bis 10)
- **Spezialangriff – Lebensschild:** Stößt Gegner in deiner Nähe weg und erzeugt 5 Sekunden lang ein Schild um dich, das Gegner fernhält. Im Schild bekommst du jede Sekunde Sättigung und Sofortheilung.
- **Abklingzeit:** 90 Sekunden
- **Item-ID:** `craftedeffects:relic_health`

> ⏳ **Vorläufiges Rezept** – das endgültige Rezept folgt.

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | Goldener Apfel | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

Zutaten insgesamt: 4× Goldbarren, 4× Diamant, 1× Goldener Apfel

### Relikt des Himmelssturzes

- **Dauer-Effekt:** Sprungkraft (Level 1 bis 4)
- **Spezialangriff – Auto-Mace:** Schleudert dich 30 Blöcke hoch, dann 5 Sekunden sanfter Fall. Schaust du auf einen Gegner, wirst du zu ihm gedasht. Liegt eine Mace in der Hotbar, wird zu ihr gewechselt und beim Aufprall Smash-Schaden nach Fallhöhe ausgeteilt. Kein Fallschaden.
- **Abklingzeit:** 30 Sekunden
- **Item-ID:** `craftedeffects:relic_jump`

> ⏳ **Vorläufiges Rezept** – das endgültige Rezept folgt.

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Diamant | Goldbarren |
| **Mitte** | Diamant | Breeze-Rute | Diamant |
| **Unten** | Goldbarren | Diamant | Goldbarren |

Zutaten insgesamt: 4× Goldbarren, 4× Diamant, 1× Breeze-Rute

## Diadem

Lege ein Relikt in die **Zweithand**, nimm das Diadem in die Haupthand und mach einen **Rechtsklick**: Das Relikt steigt um **1 Level** (bis zum Maximallevel) und das Diadem wird verbraucht. Ist das Relikt schon auf dem Maximallevel, passiert nichts und das Diadem bleibt erhalten. Diademe kann man beliebig oft craften.

Item-ID: `craftedeffects:diadem`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Spielerkopf | Goldbarren |
| **Mitte** | Spielerkopf | Enderauge | Spielerkopf |
| **Unten** | Goldbarren | Spielerkopf | Goldbarren |

Zutaten insgesamt: 4× Goldbarren, 4× Spielerkopf, 1× Enderauge

> Hinweis: Spielerköpfe gibt es in Bedrock nicht im Überlebensmodus – nur per Befehl oder im Kreativmodus.

## Admin-Befehle

Nur Operatoren (auf Realms: Spieler mit Operator-Rechten) können diese Befehle nutzen. Cheats müssen **nicht** aktiviert sein. Relikt-Namen in Befehlen: `speed`, `strength`, `haste`, `fire`, `health`, `jump`.

| Befehl | Wirkung |
|---|---|
| `/ce:list` | Zeigt alle Relikte mit Einstellungen, Level und ob sie gerade existieren. |
| `/ce:level <relikt> <level>` | Setzt das Level, z. B. `/ce:level speed 3`. |
| `/ce:effect <relikt> <effekt> <level>` | Ändert den Dauer-Effekt, z. B. `/ce:effect speed night_vision 1`. |
| `/ce:attack <relikt> <angriff> [abklingzeit]` | Ändert den Spezialangriff, z. B. `/ce:attack speed automace 20`. |
| `/ce:name <relikt> <name>` | Benennt ein Relikt um, z. B. `/ce:name speed "Relikt des Sturms"`. |
| `/ce:enable <relikt> <true\|false>` | Schaltet ein Relikt an oder aus (aus = nicht craftbar, keine Wirkung). |
| `/ce:free <relikt>` | Gibt ein Relikt frei, damit es neu gecraftet werden kann. Die alte Kopie wird ungültig. |
| `/ce:give <relikt> [spieler]` | Gibt ein Relikt direkt (nur wenn es gerade frei ist). |
| `/ce:pvp <true\|false>` | Schaltet Schaden der Relikt-Angriffe gegen Spieler an oder aus. |
| `/ce:reset` | Stellt alle Einstellungen auf die Standardbelegung zurück. |

### Effekte für `/ce:effect`

| Befehlswert | Effekt | Wirkung |
|---|---|---|
| `none` | Kein Effekt | Das Relikt gibt keinen Dauer-Effekt. |
| `speed` | Schnelligkeit | Schneller laufen. |
| `haste` | Eile | Schneller abbauen. |
| `strength` | Stärke | Mehr Nahkampfschaden. |
| `jump_boost` | Sprungkraft | Höher springen, weniger Fallschaden. |
| `fire_resistance` | Feuerresistenz | Immun gegen Feuer und Lava. |
| `health_boost` | Gesundheitsschub | Mehr maximale Herzen (+2 Herzen pro Level). |
| `regeneration` | Regeneration | Leben regeneriert sich laufend. |
| `resistance` | Resistenz | Weniger Schaden aus allen Quellen. |
| `water_breathing` | Wasseratmung | Unter Wasser atmen. |
| `night_vision` | Nachtsicht | Im Dunkeln alles hell sehen. |
| `absorption` | Absorption | Goldene Extra-Herzen. |
| `slow_falling` | Sanfter Fall | Langsam fallen, kein Fallschaden. |

### Angriffe für `/ce:attack`

| Befehlswert | Angriff | Wirkung |
|---|---|---|
| `none` | Kein Angriff | Rechtsklick macht nichts. |
| `dash` | Dash | Schleudert dich 30 Blöcke in Blickrichtung (auch nach oben oder unten). Danach 5 Sekunden kein Fallschaden. |
| `ring` | Kraftring | Ein Partikelring breitet sich von dir aus (bis 10 Blöcke). Jedes getroffene Wesen bekommt 3 Herzen Schaden. |
| `fortress` | Bollwerk | 3 Sekunden Resistenz V (unverwundbar) und Langsamkeit. Eine Explosion um dich schleudert Gegner weg, macht Schaden und zerstört Blöcke. Du selbst bekommst keinen Schaden. |
| `comets` | Kometenhagel | 8 Kometen erscheinen im Ring 10 Blöcke über dir und stürzen herab. Beim Aufprall explodieren sie und hinterlassen Lava. Du selbst bekommst keinen Schaden. |
| `aegis` | Lebensschild | Stößt Gegner in deiner Nähe weg und erzeugt 5 Sekunden lang ein Schild um dich, das Gegner fernhält. Im Schild bekommst du jede Sekunde Sättigung und Sofortheilung. |
| `automace` | Auto-Mace | Schleudert dich 30 Blöcke hoch, dann 5 Sekunden sanfter Fall. Schaust du auf einen Gegner, wirst du zu ihm gedasht. Liegt eine Mace in der Hotbar, wird zu ihr gewechselt und beim Aufprall Smash-Schaden nach Fallhöhe ausgeteilt. Kein Fallschaden. |
