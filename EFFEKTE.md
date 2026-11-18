# CraftedEffects – Effekte, Diadem, Stealing und Crafting

> Automatisch erzeugt von `scripts/generate_content.py`. Für Minecraft **Bedrock 26.3** – normale Welten und Realms.

## So funktionieren Effekte

- Jeder der 7 Effekte existiert **nur einmal pro Welt**. Wer einen bereits existierenden Effekt noch einmal craftet, bekommt die Zutaten zurück.
- **Jeder Spieler kann nur einen Effekt haben.** Wer schon einen trägt und einen zweiten craftet, bekommt die Zutaten zurück. Hebst du einen zweiten Effekt auf, wird **getauscht**: der neue bleibt, dein alter fällt vor dir auf den Boden.
- Liegt dein Effekt **irgendwo im Inventar, in der Hotbar oder in der Zweithand**, hast du dauerhaft seine Dauerwirkung.
- Ein Effekt startet auf **Level 1**. Mit dem **Diadem** steigt er bis zum Maximallevel. Das Level verstärkt die Dauerwirkung.

### Steuerung (Effekt in der Hand)

| Eingabe | Wirkung |
|---|---|
| **Rechtsklick** (am Handy: Tippen) | **Spezialangriff** – erst ab dem **Maximallevel** |
| **Schleichen + kurzer Rechtsklick** | **Boost-Up** – ab Level 1, eigene Abklingzeit |
| **Schleichen + Rechtsklick 5 Sekunden halten** | Dauerwirkung **an/aus** (Boost-Up und Angriff gehen trotzdem) |

Über der Hotbar stehen die Abklingzeiten von Angriff und Boost getrennt.

### Verlust

- Effekte **verbrennen nicht und explodieren nicht** (Lava, Feuer, Kaktus, TNT, Blitz). Nur das **Void** zerstört einen Effekt sofort.
- Liegt ein Effekt **5 Minuten außerhalb eines Spieler-Inventars** (auf dem Boden, in Truhen, Endertruhen, Fässern, Shulkerkisten …), verfällt er.
  Ein Effekt im Inventar eines Spielers, der offline ist, verfällt nicht.
- Beim **Tod** behältst du deinen Effekt – außer dich tötet ein Spieler mit dem **Stealing**: dann bekommt er deinen Effekt.
- Einen verlorenen Effekt meldet der Chat. Er kann **wieder gecraftet** werden und beginnt dann wieder bei Level 1.
- Tötest du einen anderen Spieler, lässt er seinen **Spielerkopf** fallen (für das Diadem).
- ⚠️ **Bollwerk** und **Kometenhagel** zerstören Blöcke, das Bollwerk sogar **Obsidian und Bedrock (auch den Weltboden)**. Die Kometen hinterlassen fließende Lava.

## Übersicht

| Effekt | Dauerwirkung | Max. Level (= Spezialangriff frei) | Spezialangriff | Abklingzeit | Boost-Up | Abklingzeit Boost |
|---|---|---|---|---|---|---|
| Speedeffect | Schnelligkeit | 3 (III) | Dash | 60 s | Schnelligkeit VI für 30 s | 120 s |
| Strengtheffect | Stärke | 2 (II) | Kraftring | 30 s | Stärke III für 10 s | 120 s |
| Hasteeffect | Eile | 5 (V) | Bollwerk | 60 s | 3×3-Abbau für 20 s | 120 s |
| Fireresistanceeffect | Feuerresistenz | 2 (II) | Kometenhagel | 120 s | Lavaschwimmer für 20 s | 120 s |
| Healtheffect | Gesundheitsschub | 5 (V) = 30 Herzen | Lebensschild | 90 s | Gesundheitsschub (60 Herzen) für 20 s | 120 s |
| Jumpboosteffect | Sprungkraft | 4 (IV) | Auto-Mace | 60 s | Sprungkraft VI für 15 s | 120 s |
| Waterbreathingeffect | Wasseratmung | 3 (III) | Wasserblase | 60 s | Regenmacher für 30 s | 120 s |

## Effekte im Detail

### Speedeffect

- **Dauerwirkung:** Schnelligkeit (Level 1 bis 3)
- **Spezialangriff ab Level 3**
- **Spezialangriff – Dash:** Schleudert dich wie ein Riptide-Dreizack 30 Blöcke in Blickrichtung (auch nach oben oder unten), ohne Partikel und Sound. Danach kein Fallschaden.
- **Abklingzeit Angriff:** 60 Sekunden
- **Boost-Up (Schleichen + Rechtsklick):** Schnelligkeit VI für 30 s
- **Abklingzeit Boost-Up:** 120 Sekunden
- **Item-ID:** `craftedeffects:relic_speed`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Feuerwerksrakete | Flow-Rüstungsbesatz | Feuerwerksrakete |
| **Mitte** | Nautilusschale | Glasflasche | Nautilusschale |
| **Unten** | Diamanthose | Bolt-Rüstungsbesatz | Diamanthose |

Zutaten insgesamt: 2× Feuerwerksrakete, 1× Flow-Rüstungsbesatz, 2× Nautilusschale, 1× Glasflasche, 2× Diamanthose, 1× Bolt-Rüstungsbesatz

### Strengtheffect

- **Dauerwirkung:** Stärke (Level 1 bis 2)
- **Spezialangriff ab Level 2**
- **Spezialangriff – Kraftring:** Ein Ring aus Netherite-Schwertern fliegt von dir nach außen (bis 10 Blöcke). Jedes getroffene Wesen bekommt 3 Herzen Schaden – auch durch volle Netherite-Rüstung.
- **Abklingzeit Angriff:** 30 Sekunden
- **Boost-Up (Schleichen + Rechtsklick):** Stärke III für 10 s
- **Abklingzeit Boost-Up:** 120 Sekunden
- **Item-ID:** `craftedeffects:relic_strength`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Diamantaxt | Ward-Rüstungsbesatz | Diamantschwert |
| **Mitte** | Ghast-Träne | Glasflasche | Ghast-Träne |
| **Unten** | Endkristall | Dreizack | Endkristall |

Zutaten insgesamt: 1× Diamantaxt, 1× Ward-Rüstungsbesatz, 1× Diamantschwert, 2× Ghast-Träne, 1× Glasflasche, 2× Endkristall, 1× Dreizack

### Hasteeffect

- **Dauerwirkung:** Eile (Level 1 bis 5)
- **Spezialangriff ab Level 5**
- **Spezialangriff – Bollwerk:** 3 Sekunden Resistenz V (unverwundbar) und Langsamkeit. Eine Explosion so stark wie ein Respawn-Anker (ohne Feuer) schleudert Gegner weg und zerstört Blöcke – sogar Obsidian und Bedrock. Du selbst bekommst keinen Schaden.
- **Abklingzeit Angriff:** 60 Sekunden
- **Boost-Up (Schleichen + Rechtsklick):** 3×3-Abbau für 20 s – Jeder abgebaute Block baut die 3×3-Fläche um ihn mit ab (nicht Bedrock).
- **Abklingzeit Boost-Up:** 120 Sekunden
- **Item-ID:** `craftedeffects:relic_haste`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Diamant-Spitzhacke | Golderz | Diamant-Spitzhacke |
| **Mitte** | Plattenfragment | Glasflasche | Plattenfragment |
| **Unten** | TNT | Golderz | TNT |

Zutaten insgesamt: 2× Diamant-Spitzhacke, 2× Golderz, 2× Plattenfragment, 1× Glasflasche, 2× TNT

### Fireresistanceeffect

- **Dauerwirkung:** Feuerresistenz (Level 1 bis 2)
- **Spezialangriff ab Level 2**
- **Spezialangriff – Kometenhagel:** 8 Kometen erscheinen im Ring 10 Blöcke über dir und stürzen herab. Beim Aufprall gibt es eine große Explosion und fließende Lava. Du selbst bekommst keinen Schaden.
- **Abklingzeit Angriff:** 120 Sekunden
- **Boost-Up (Schleichen + Rechtsklick):** Lavaschwimmer für 20 s – Ultraschnell in Lava und Feuer, Feuerresistenz, und jeder Gegner im Umkreis von 5 Blöcken brennt.
- **Abklingzeit Boost-Up:** 120 Sekunden
- **Item-ID:** `craftedeffects:relic_fire`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Feuerkugel | Lohenrute | Feuerkugel |
| **Mitte** | Witherskelett-Schädel | Glasflasche | Witherskelett-Schädel |
| **Unten** | Lavaeimer | Lohenrute | Lavaeimer |

Zutaten insgesamt: 2× Feuerkugel, 2× Lohenrute, 2× Witherskelett-Schädel, 1× Glasflasche, 2× Lavaeimer

### Healtheffect

- **Dauerwirkung:** Gesundheitsschub (Level 1 bis 5) – Herzen insgesamt je Level: 10 → 16 → 20 → 26 → 30
- **Spezialangriff ab Level 5**
- **Spezialangriff – Lebensschild:** Stößt Gegner weg und baut 5 Sekunden lang eine Kuppel aus Schilden um dich. Darin bekommst du Regeneration III, Sättigung und Sofortheilung. Gegner, die das Schild berühren oder schlagen, nehmen Schaden und fliegen zurück; am Ende werden alle Gegner 20 Blöcke weggeschleudert.
- **Abklingzeit Angriff:** 90 Sekunden
- **Boost-Up (Schleichen + Rechtsklick):** Gesundheitsschub (60 Herzen) für 20 s
- **Abklingzeit Boost-Up:** 120 Sekunden
- **Item-ID:** `craftedeffects:relic_health`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Diamantbrustpanzer | Verzaubertes Buch (Schutz empfohlen) | Diamantbrustpanzer |
| **Mitte** | Totem der Unsterblichkeit | Glasflasche | Totem der Unsterblichkeit |
| **Unten** | Goldener Apfel | Unheilvolle Flasche | Goldener Apfel |

Zutaten insgesamt: 2× Diamantbrustpanzer, 1× Verzaubertes Buch (Schutz empfohlen), 2× Totem der Unsterblichkeit, 1× Glasflasche, 2× Goldener Apfel, 1× Unheilvolle Flasche

### Jumpboosteffect

- **Dauerwirkung:** Sprungkraft (Level 1 bis 4)
- **Spezialangriff ab Level 4**
- **Spezialangriff – Auto-Mace:** Schleudert dich 30 Blöcke hoch, dann 5 Sekunden sanfter Fall (am Handy/Tablet mit Fadenkreuz). Schaust du auf einen Gegner, wirst du genau auf ihn gedasht. Mit Mace in der Hotbar gibt es Smash-Schaden nach Fallhöhe, ohne Mace normalen Dash-Schaden. Währenddessen kannst du nicht normal zuschlagen. Kein Fallschaden.
- **Abklingzeit Angriff:** 60 Sekunden
- **Boost-Up (Schleichen + Rechtsklick):** Sprungkraft VI für 15 s
- **Abklingzeit Boost-Up:** 120 Sekunden
- **Item-ID:** `craftedeffects:relic_jump`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Windkugel | Echoscherbe | Windkugel |
| **Mitte** | Hasenpfote | Glasflasche | Hasenpfote |
| **Unten** | Diamantstiefel | Echoscherbe | Diamantstiefel |

Zutaten insgesamt: 2× Windkugel, 2× Echoscherbe, 2× Hasenpfote, 1× Glasflasche, 2× Diamantstiefel

### Waterbreathingeffect

- **Dauerwirkung:** Wasseratmung (Level 1 bis 3)
- **Spezialangriff ab Level 3**
- **Spezialangriff – Wasserblase:** Eine Wasserblase umhüllt 10 Sekunden lang den Gegner, den du anschaust (sonst den nächsten). Er bekommt jede Sekunde Schaden, kann nicht entkommen, nicht schlagen und nicht essen. Auf die Blase hast du 10 Blöcke mehr Reichweite.
- **Abklingzeit Angriff:** 60 Sekunden
- **Boost-Up (Schleichen + Rechtsklick):** Regenmacher für 30 s – Das Wetter wird auf Regen gestellt.
- **Abklingzeit Boost-Up:** 120 Sekunden
- **Ausrüstung:** Solange du es in der Hand hältst, bekommen deine Stiefel Tiefenläufer III und dein Helm Wasseraffinität (beides verschwindet beim Weglegen wieder). Beim Sprint-Schwimmen bist du zusätzlich schneller – wie Delfinsgnade.
- **Item-ID:** `craftedeffects:relic_water`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Prismarinscherbe | Schwamm | Prismarinscherbe |
| **Mitte** | Aquisitor | Glasflasche | Aquisitor |
| **Unten** | Coast-Rüstungsbesatz | Wassereimer | Tide-Rüstungsbesatz |

Zutaten insgesamt: 2× Prismarinscherbe, 1× Schwamm, 2× Aquisitor, 1× Glasflasche, 1× Coast-Rüstungsbesatz, 1× Wassereimer, 1× Tide-Rüstungsbesatz

> Health-Boost wirkt nur in 2-Herz-Schritten, deshalb 16 und 26 statt 15 und 25 Herzen.

## Diadem

Nimm das Diadem in die Hand und mach einen **Rechtsklick**: Dein Effekt (irgendwo im Inventar, in der Hotbar oder in der Zweithand) steigt um **1 Level** und das Diadem wird verbraucht. Hast du keinen Effekt oder ist er schon auf dem Maximallevel, passiert nichts und das Diadem bleibt erhalten. Diademe kann man beliebig oft craften.

Item-ID: `craftedeffects:diadem`

| | Links | Mitte | Rechts |
|---|---|---|---|
| **Oben** | Goldbarren | Spielerkopf | Goldbarren |
| **Mitte** | Spielerkopf | Enderauge | Spielerkopf |
| **Unten** | Goldbarren | Spielerkopf | Goldbarren |

Zutaten insgesamt: 4× Goldbarren, 4× Spielerkopf, 1× Enderauge

> Spielerköpfe bekommst du, indem du andere Spieler besiegst.

## Stealing

Eine Waffe (8 Schaden). Tötest du damit einen Spieler, der einen Effekt trägt, wandert sein Effekt **direkt in dein Inventar** (hast du schon einen, wird getauscht) und das Stealing ist verbraucht. Ohne Effekt beim Opfer bleibt das Stealing erhalten.

Item-ID: `craftedeffects:stealing` – **Rezept folgt noch.** Bis dahin gibt es das Stealing nur per `/ce:stealing`.

## Admin-Befehle

Nur Operatoren (auf Realms: Spieler mit Operator-Rechten) können diese Befehle nutzen. Cheats müssen **nicht** aktiviert sein. Effekt-Namen in Befehlen: `speed`, `strength`, `haste`, `fire`, `health`, `jump`, `water`.

| Befehl | Wirkung |
|---|---|
| `/ce:list` | Zeigt alle Effekte mit Einstellungen, Level, Boost, An/Aus und ob sie gerade existieren. |
| `/ce:level <effekt> <level>` | Setzt das Level, z. B. `/ce:level speed 3`. |
| `/ce:effect <effekt> <wirkung> <level>` | Ändert die Dauerwirkung, z. B. `/ce:effect speed night_vision 1`. |
| `/ce:attack <effekt> <angriff> [abklingzeit]` | Ändert den Spezialangriff, z. B. `/ce:attack speed automace 20`. |
| `/ce:boost <effekt> <dauer> <abklingzeit>` | Ändert Dauer und Abklingzeit des Boost-Ups (Sekunden), z. B. `/ce:boost speed 30 120`. |
| `/ce:toggle <effekt> <true\|false>` | Schaltet die Dauerwirkung eines Effekts an oder aus (wie 5 s Halten). |
| `/ce:name <effekt> <name>` | Benennt einen Effekt um, z. B. `/ce:name speed "Sturmeffect"`. |
| `/ce:enable <effekt> <true\|false>` | Schaltet einen Effekt ganz an oder aus (aus = nicht craftbar, keine Wirkung). |
| `/ce:free <effekt>` | Gibt einen Effekt frei, damit er neu gecraftet werden kann. Die alte Kopie wird ungültig. |
| `/ce:give <effekt> [spieler]` | Gibt einen Effekt direkt (nur wenn er gerade frei ist). |
| `/ce:stealing [spieler]` | Gibt ein Stealing. |
| `/ce:pvp <true\|false>` | Schaltet Schaden der Effekt-Angriffe gegen Spieler an oder aus. |
| `/ce:reset` | Stellt alle Einstellungen auf die Standardbelegung zurück. |

### Wirkungen für `/ce:effect`

| Befehlswert | Wirkung | Beschreibung |
|---|---|---|
| `none` | Keine Wirkung | Der Effekt gibt keine Dauerwirkung. |
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
| `dash` | Dash | Schleudert dich wie ein Riptide-Dreizack 30 Blöcke in Blickrichtung (auch nach oben oder unten), ohne Partikel und Sound. Danach kein Fallschaden. |
| `ring` | Kraftring | Ein Ring aus Netherite-Schwertern fliegt von dir nach außen (bis 10 Blöcke). Jedes getroffene Wesen bekommt 3 Herzen Schaden – auch durch volle Netherite-Rüstung. |
| `fortress` | Bollwerk | 3 Sekunden Resistenz V (unverwundbar) und Langsamkeit. Eine Explosion so stark wie ein Respawn-Anker (ohne Feuer) schleudert Gegner weg und zerstört Blöcke – sogar Obsidian und Bedrock. Du selbst bekommst keinen Schaden. |
| `comets` | Kometenhagel | 8 Kometen erscheinen im Ring 10 Blöcke über dir und stürzen herab. Beim Aufprall gibt es eine große Explosion und fließende Lava. Du selbst bekommst keinen Schaden. |
| `aegis` | Lebensschild | Stößt Gegner weg und baut 5 Sekunden lang eine Kuppel aus Schilden um dich. Darin bekommst du Regeneration III, Sättigung und Sofortheilung. Gegner, die das Schild berühren oder schlagen, nehmen Schaden und fliegen zurück; am Ende werden alle Gegner 20 Blöcke weggeschleudert. |
| `automace` | Auto-Mace | Schleudert dich 30 Blöcke hoch, dann 5 Sekunden sanfter Fall (am Handy/Tablet mit Fadenkreuz). Schaust du auf einen Gegner, wirst du genau auf ihn gedasht. Mit Mace in der Hotbar gibt es Smash-Schaden nach Fallhöhe, ohne Mace normalen Dash-Schaden. Währenddessen kannst du nicht normal zuschlagen. Kein Fallschaden. |
| `bubble` | Wasserblase | Eine Wasserblase umhüllt 10 Sekunden lang den Gegner, den du anschaust (sonst den nächsten). Er bekommt jede Sekunde Schaden, kann nicht entkommen, nicht schlagen und nicht essen. Auf die Blase hast du 10 Blöcke mehr Reichweite. |
