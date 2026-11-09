# CraftedEffects – Relikte, Diadem und Crafting

> Automatisch erzeugt von `scripts/generate_content.py`. Für Minecraft **Bedrock 26.3** – normale Welten und Realms.

## So funktionieren Relikte

- Jedes der 6 Relikte existiert **nur einmal pro Welt**. Wer ein bereits existierendes Relikt noch einmal craftet, bekommt die Zutaten zurück.
- Liegt ein Relikt **irgendwo im Inventar, in der Hotbar oder in der Zweithand**, hast du dauerhaft seinen Effekt. Mehrere Relikte wirken gleichzeitig.
- Ein Relikt startet auf **Level 1**. Mit dem **Diadem** steigt es bis zum Maximallevel. Das Level verstärkt den Dauer-Effekt.
- Der **Spezialangriff** wird erst auf dem **Maximallevel** freigeschaltet. Dann löst ein **Rechtsklick** (am Handy: Tippen/Halten) mit dem Relikt in der Hand ihn aus. Danach läuft die Abklingzeit (Anzeige über der Hotbar).
- Wird ein Relikt zerstört (Lava, Feuer, Kaktus, Void, Despawn), meldet das der Chat. Es kann **wieder gecraftet** werden und beginnt dann wieder bei Level 1.
- ⚠️ Die Explosionen von **Bollwerk** und **Kometenhagel** zerstören Blöcke und die Kometen hinterlassen Lava – Vorsicht in der Nähe von Bauten.

## Übersicht

| Relikt | Dauer-Effekt | Max. Level (= Spezialangriff frei) | Spezialangriff | Abklingzeit |
|---|---|---|---|---|
| Relikt des Windes | Schnelligkeit | 3 (III) | Dash | 30 s |
| Relikt der Stärke | Stärke | 3 (III) | Kraftring | 30 s |
| Relikt des Bergmanns | Eile | 5 (V) | Bollwerk | 90 s |
| Relikt der Glut | Feuerresistenz | 1 (I) | Kometenhagel | 120 s |
| Relikt des Lebens | Gesundheitsschub | 5 (V) = 30 Herzen | Lebensschild | 90 s |
| Relikt des Himmelssturzes | Sprungkraft | 4 (IV) | Auto-Mace | 30 s |

## Relikte im Detail

### Relikt des Windes

- **Dauer-Effekt:** Schnelligkeit (Level 1 bis 3)
- **Spezialangriff ab Level 3**
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
- **Spezialangriff ab Level 3**
- **Spezialangriff – Kraftring:** Ein Partikelring breitet sich von dir aus (bis 10 Blöcke). Jedes getroffene Wesen bekommt 3 Herzen Schaden.
- **Abklingzeit:** 30 Sekunden
- **Item-ID:** `craftedeffects:relic_strength`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Diamantaxt | Ward-Rüstungsbesatz | Diamantschwert |
| **Mitte** | Ghast-Träne | Glasflasche | Ghast-Träne |
| **Unten** | Endkristall | Dreizack | Endkristall |

Zutaten insgesamt: 1× Diamantaxt, 1× Ward-Rüstungsbesatz, 1× Diamantschwert, 2× Ghast-Träne, 1× Glasflasche, 2× Endkristall, 1× Dreizack

### Relikt des Bergmanns

- **Dauer-Effekt:** Eile (Level 1 bis 5)
- **Spezialangriff ab Level 5**
- **Spezialangriff – Bollwerk:** 3 Sekunden Resistenz V (unverwundbar) und Langsamkeit. Eine Explosion um dich schleudert Gegner weg, macht Schaden und zerstört Blöcke. Du selbst bekommst keinen Schaden.
- **Abklingzeit:** 90 Sekunden
- **Item-ID:** `craftedeffects:relic_haste`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Diamant-Spitzhacke | Golderz | Diamant-Spitzhacke |
| **Mitte** | Plattenfragment | Glasflasche | Plattenfragment |
| **Unten** | TNT | Golderz | TNT |

Zutaten insgesamt: 2× Diamant-Spitzhacke, 2× Golderz, 2× Plattenfragment, 1× Glasflasche, 2× TNT

### Relikt der Glut

- **Dauer-Effekt:** Feuerresistenz (Level 1 bis 1)
- **Spezialangriff ab Level 1**
- **Spezialangriff – Kometenhagel:** 8 Kometen erscheinen im Ring 10 Blöcke über dir und stürzen herab. Beim Aufprall explodieren sie und hinterlassen Lava. Du selbst bekommst keinen Schaden.
- **Abklingzeit:** 120 Sekunden
- **Item-ID:** `craftedeffects:relic_fire`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Feuerkugel | Lohenrute | Feuerkugel |
| **Mitte** | Witherskelett-Schädel | Glasflasche | Witherskelett-Schädel |
| **Unten** | Lavaeimer | Lohenrute | Lavaeimer |

Zutaten insgesamt: 2× Feuerkugel, 2× Lohenrute, 2× Witherskelett-Schädel, 1× Glasflasche, 2× Lavaeimer

### Relikt des Lebens

- **Dauer-Effekt:** Gesundheitsschub (Level 1 bis 5) – Herzen insgesamt je Level: 20 → 24 → 26 → 28 → 30
- **Spezialangriff ab Level 5**
- **Spezialangriff – Lebensschild:** Stößt Gegner in deiner Nähe weg und erzeugt 5 Sekunden lang ein Schild um dich, das Gegner fernhält. Im Schild bekommst du jede Sekunde Sättigung und Sofortheilung.
- **Abklingzeit:** 90 Sekunden
- **Item-ID:** `craftedeffects:relic_health`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Diamantbrustpanzer | Verzaubertes Buch (Schutz empfohlen) | Diamantbrustpanzer |
| **Mitte** | Totem der Unsterblichkeit | Glasflasche | Totem der Unsterblichkeit |
| **Unten** | Goldener Apfel | Unheilvolle Flasche | Goldener Apfel |

Zutaten insgesamt: 2× Diamantbrustpanzer, 1× Verzaubertes Buch (Schutz empfohlen), 2× Totem der Unsterblichkeit, 1× Glasflasche, 2× Goldener Apfel, 1× Unheilvolle Flasche

### Relikt des Himmelssturzes

- **Dauer-Effekt:** Sprungkraft (Level 1 bis 4)
- **Spezialangriff ab Level 4**
- **Spezialangriff – Auto-Mace:** Schleudert dich 30 Blöcke hoch, dann 5 Sekunden sanfter Fall. Schaust du auf einen Gegner, wirst du zu ihm gedasht. Liegt eine Mace in der Hotbar, wird zu ihr gewechselt und beim Aufprall Smash-Schaden nach Fallhöhe ausgeteilt. Kein Fallschaden.
- **Abklingzeit:** 30 Sekunden
- **Item-ID:** `craftedeffects:relic_jump`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Windkugel | Echoscherbe | Windkugel |
| **Mitte** | Hasenpfote | Glasflasche | Hasenpfote |
| **Unten** | Diamantstiefel | Echoscherbe | Diamantstiefel |

Zutaten insgesamt: 2× Windkugel, 2× Echoscherbe, 2× Hasenpfote, 1× Glasflasche, 2× Diamantstiefel

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
| `health_boost` | Gesundheitsschub | Mehr maximale Herzen. |
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
