# Masterprompt – CraftedEffects 5.0: Boost-Ups, Ein/Aus, ein Relikt pro Spieler, unzerstörbare Relikte, Wasser-Relikt, überarbeitete Angriffe

Du arbeitest im Repo `CraftedEffects` (Minecraft-Bedrock-Add-on, Ziel **Bedrock 26.3** = engine `[1, 26, 30]`, `@minecraft/server` **2.8.0 stable**, normale Welten **und** Realms). Aktueller Stand ist **4.1.0**: 6 Relikte + Diadem, Spezialangriff per Rechtsklick ab Maximallevel, einmal pro Welt, Admin-Befehle `/ce:*`. Lies zuerst `RELIKTE.md`, `scripts/generate_content.py` und `behavior_pack/scripts/*.js`, bevor du etwas änderst.

Grundlage sind **8 Fotos handschriftlicher Blätter** (IMG_4354–4361). Es gibt zwei Runden:
- **Runde A** (Blanko-/Tabellenblätter, IMG_4354–4357): Steuerung, Diadem, Unzerstörbarkeit, Tabelle mit Boost-Ups, Wasser-Relikt.
- **Runde B** (linierte Blätter, IMG_4358–4361, „Verbesserung“): überarbeitet Speed, Sprung, Bergmann, Leben, Stärke, Glut, Wasser und die allgemeinen Regeln.

**Wo sich A und B widersprechen, gilt B** (siehe Abschnitt 8, Frage 1). Setze nur die Abweichungen zum Ist-Stand um; was schon so funktioniert, bleibt.

---

## 0. Arbeitsregeln

- Neuer Branch `feature/relics-5.0`, nicht auf `main` arbeiten.
- **Einzige Quelle der Wahrheit für Relikt-Daten ist `scripts/generate_content.py`.** Items, Rezepte, Sprachdateien, `behavior_pack/scripts/data.js` und `RELIKTE.md` werden daraus erzeugt – nie von Hand editieren. `CONFIG_VERSION` erhöhen (Level bleiben erhalten, gekappt aufs neue Maximum).
- Add-on-Version **5.0.0** (beide Manifeste, Build-Skript, README).
- Keine Beta-APIs im ausgelieferten Pack. Jede neue API (z. B. `itemReleaseUse`, `itemCompleteUse`, `entityItemPickup`, `playerSwingStart`, `beforeEvents.itemUse`) **zuerst** gegen die `@minecraft/server@2.8.0`-Typings im Scratchpad prüfen; was dort nicht stable ist, über Tick-Polling nachbauen.
- Bekannte Fallen: GameTest-Arena-Boden bei relativ y=1 (Spawn y=2); seitliches `applyKnockback` auf Spieler stark gedämpft; `small_fireball`/`fireball` nicht summonbar; Explosion mit `source: player` scheitert bei SimulatedPlayer; Custom Items brauchen `minecraft:allow_off_hand`; `addEnchantment` über dem Vanilla-Maximum wirft.
- Bestehende Regeln bleiben: einmal pro Welt, nach Verlust neu craftbar auf Level 1, eigene Angriffe verletzen nie den Benutzer (`protection.js`), Explosionen/Lava zerstören echte Blöcke, `/ce:pvp` gilt für alle neuen Schadensquellen.
- Alle Texte im Spiel und in `RELIKTE.md` auf Deutsch mit korrekten Umlauten.
- Offene Punkte (Abschnitt 8) vor der Umsetzung mit dem Nutzer klären. Antworten unten in Abschnitt 9 eintragen.
- Am Ende: `gh workflow run build.yml`, GameTest-Log prüfen, PR öffnen. Nicht direkt nach `main` pushen.

---

## 1. Steuerung (neu – gilt für alle Relikte)

| Eingabe (Relikt in der Haupthand) | Wirkung |
|---|---|
| **Rechtsklick** | Spezialangriff (erst ab Maximallevel, eigene Abklingzeit) |
| **Schleichen + Rechtsklick** (kurz) | **Boost-Up** (zeitlich begrenzt, eigene Abklingzeit) |
| **Schleichen + Rechtsklick 5 s gedrückt halten** | Dauer-Effekt **an/aus** |

Technik:
- Relikt-Items bekommen `minecraft:use_modifiers` (`use_duration` 5 s, `movement_modifier` 1.0 – prüfen).
- Ohne Schleichen: Angriff sofort beim Start der Benutzung (wie bisher).
- Mit Schleichen: Loslassen vor 5 s → Boost; 5 s erreicht → Umschalten (kein zusätzlicher Boost).
- Fortschritt in der Actionbar (`Deaktivieren … 3/5 s`), Bestätigung + Sound.
- Ein/Aus wird **am Relikt** gespeichert (Welt-Konfiguration), Lore zeigt `§8Effekt: aus`.
- Muss am Handy/Tablet mit Schleichen + Tippen/Halten genauso gehen.
- Actionbar zeigt beide Abklingzeiten getrennt: `Angriff 12 s · Boost 45 s`.

---

## 2. Besitz-Regeln (neu, Blatt B „Sonstiges“)

1. **Ein Relikt pro Spieler:** „Pro Person ist nur 1 Effekt craftbar … Man kann nur einen Effekt im Inventar haben.“
   - Craften eines zweiten Relikts → Kopie entfernen, Zutaten zurück, Actionbar-Hinweis.
   - Aufheben eines zweiten Relikts → **Tausch**: das neu aufgehobene bleibt, das alte wird vor dem Spieler fallen gelassen (Actionbar-Hinweis). Fallen gelassene Relikte unterliegen dem Verfall aus Punkt 2.
   - Die Regel „jedes Relikt nur einmal pro Welt“ bleibt zusätzlich bestehen.
2. **Verfall außerhalb des Inventars:** „Befindet sich der Effekt außerhalb eines Inventars oder einer Hotbar, so wird er in 5 min gelöscht (z. B. in Truhen, Endertruhen, Fässern, Shulkern oder auch beim Droppen).“
   - Umsetzung über die Registry: Jeder Tick-Scan merkt sich `lastSeenInInventory` pro Relikt. Ist das Relikt 5 min bei keinem **online** Spieler im Inventar/Hotbar/Zweithand, wird die Seriennummer ungültig → Relikt gilt als verloren (Chat-Meldung, wieder craftbar ab Level 1). Die alte Kopie wird entfernt, sobald sie irgendwo auftaucht (Truhe öffnen, aufheben …).
   - Liegt es als Item-Entity am Boden, wird die Entity nach Ablauf zusätzlich direkt entfernt.
   - **Offline-Spieler:** Relikt im Inventar eines Offline-Spielers bleibt gültig (es ist ja in einem Inventar).
3. **Tod:** „Man droppt den Effekt nur, wenn dich ein Gegner mit **Stealing** killt.“ Bei jedem anderen Tod behält man das Relikt (beim Tod aus dem Drop entfernen, nach dem Respawn zurück ins Inventar).
   - **Neues Item `craftedeffects:stealing`** („Stealing“): Waffe (Schwert-artig, Nahkampfschaden wie Diamantschwert – Wert bestätigen lassen). Tötet man damit einen Spieler, der ein Relikt trägt, wandert das Relikt **direkt ins Inventar des Mörders** (Ein-Relikt-Regel → Tausch wie oben) und das Stealing wird **verbraucht**. Kill ohne Relikt beim Opfer → Stealing bleibt.
   - **Rezept und Textur liefert der Nutzer später nach** – bis dahin Platzhalter-Textur und Platzhalter-Rezept als klar markierter TODO im Generator (oder nur per `/ce:give stealing` erhältlich).
4. **Spielerköpfe:** „Wenn man einen anderen Spieler killt, bekommt man einen Player Head.“ → bei PvP-Kill droppt das Opfer einen `minecraft:skull` (Spielerkopf). Damit wird das Diadem im Überleben craftbar. Hinweis in `RELIKTE.md` anpassen.

---

## 3. Diadem (geändert, Blatt A)

„Man nimmt das Diadem in die Hand, dann rechtsklickt man und der Effekt in deinem Inventar oder Hotbar wird automatisch um 1 Level geupgradet. Hat man keinen Effekt im Inventar oder in der Hotbar, so passiert nichts.“

- Rechtsklick mit Diadem levelt **das** Relikt im Inventar/Hotbar/Zweithand (durch die Ein-Relikt-Regel gibt es nur eines).
- Kein Relikt oder schon Maximum → nichts passiert, Diadem bleibt (nur Actionbar-Info).
- Rezept unverändert.

---

## 4. Unzerstörbar (Blatt A)

„Man kann den Effekt nur durchs ins Void schmeißen zerstören. Das heißt, sie verbrennen nicht und explodieren nicht.“

- Gedroppte Relikte überstehen Feuer, Lava, Kaktus, Explosionen, Blitz, Amboss. Erst prüfen, ob Schaden an Item-Entities sauber abgefangen werden kann; sonst Relikt-Entities jeden Tick überwachen und bei Gefahr (Lava/Feuer-Block, Entfernung ohne Void/Verfall) mit gleicher Seriennummer am nächsten sicheren Block neu spawnen.
- **Void** (unter Dimensions-Minimum) → endgültig verloren, Chat-Meldung, wieder craftbar.
- Zusätzlich gilt der 5-min-Verfall aus Abschnitt 2.

---

## 5. Relikte – Soll-Stand (A + B zusammengeführt, B gewinnt)

Rezepte der bestehenden 6 Relikte und des Diadems sind korrekt – **nicht ändern**.

**Item-Namen (Nutzer-Entscheidung): immer `<Effektname>effect`** – Speedeffect, Strengtheffect, Hasteeffect, Fireresistanceeffect, Healtheffect, Jumpboosteffect, Waterbreathingeffect. Die Namen ersetzen „Relikt des …“ in Sprachdateien, Lore, Chat-Meldungen und `RELIKTE.md` (Befehls-Keys `speed`, `strength` … bleiben).

| Relikt (Key) | Name | Max. Level | Spezialangriff | Abkl. Angriff | Boost-Up | Abkl. Boost |
|---|---|---|---|---|---|---|
| Wind (`speed`) | Speedeffect | 3 | Dash 30 Blöcke, **Riptide-Stil** (5.1) | **1 min** (bisher 30 s) | **Schnelligkeit VI, 30 s** | **2 min** |
| Stärke (`strength`) | Strengtheffect | **2** (bisher 3) | Kraftring mit **Netherite-Schwertern** (5.2) | 30 s | **Stärke III** (Dauer laut A: 10 s) | **2 min** |
| Bergmann (`haste`) | Hasteeffect | 5 | Bollwerk, neue Explosion (5.3) | **1 min** (bisher 90 s) | **3×3-Abbau, 20 s** | **2 min** |
| Glut (`fire`) | Fireresistanceeffect | **2** (bisher 1) | Kometenhagel, größer + fließende Lava (5.4) | 2 min | **Ultraschnell in Lava/Feuer + Gegner im 5-Block-Umkreis brennen, 20 s** | **2 min** |
| Leben (`health`) | Healtheffect | 5 | Lebensschild, verstärkt (5.5) | 1:30 min | **60 Herzen, 20 s** | **2 min** |
| Himmelssturz (`jump`) | Jumpboosteffect | 4 | Auto-Mace, verbessert (5.6) | **1 min** (bisher 30 s) | **Sprungkraft VI, 15 s** | **2 min** |
| **NEU** Tiefe (`water`) | Waterbreathingeffect | 3 | Wasserblase (5.7) | 1 min | **Wetter 30 s auf Regen** | **2 min** |

Allgemein:
- **Boost-Up ab Level 1** (nur der Spezialangriff braucht das Maximallevel). Ein **ausgeschaltetes** Relikt sperrt nur den Dauer-Effekt; Boost und Angriff gehen weiter.
- Effekt-Boosts per `addEffect` (Stufe VI = Amplifier 5). `effects.js` darf laufende Boosts nicht überschreiben oder kürzen.
- Admin-Befehle: `/ce:boost <relikt> <boost|none> [dauer] [abklingzeit]`, `/ce:toggle <relikt> <true|false>`; `/ce:list` zeigt Boost + Ein/Aus.

### Boost-Details
- **Bergmann 3×3:** 20 s lang bricht jeder abgebaute Block die 3×3-Fläche senkrecht zur Blickrichtung mit Drops (`playerBreakBlock`). Nie: Bedrock, Barriere, End-Portal-Rahmen, Command-Blöcke, Struktur-Blöcke. Keine Kettenreaktion.
- **Glut Lava-Schwimmen:** 20 s, in Lava **oder Feuer** starker Impuls in Blickrichtung (mit Obergrenze) + Feuerschutz; jeder Gegner im Umkreis von 5 Blöcken wird angezündet (`setOnFire`, PvP-Schalter beachten).
- **Leben 60 Herzen:** Gesundheitsschub auf 60 Herzen + auffüllen, nach 20 s zurück auf Relikt-Wert (Amplifier-Grenze testen).
- **Tiefe Regen:** `world.getDimension("overworld").setWeather(Rain, 600)`; danach wieder vorheriges Wetter? → Vanilla-Verhalten (Regen endet nach 30 s) reicht.

---

## 6. Angriffe – Änderungen

### 5.1 Wind – Dash im Riptide-Stil (Blatt B)
„Spezialattacke überarbeiten, keine Partikel und orientiere dich beim Dash nicht am Teleportieren, sondern am Code von Riptide-Tridents, natürlich ohne Animation und den Sound.“
- Teleport-Schritte durch **Impuls** ersetzen (`applyImpulse` bzw. für Spieler `applyKnockback` mit vertikalem Anteil, über einige Ticks nachgeschoben – Riptide setzt die Geschwindigkeit in Blickrichtung). Die bekannte Seiten-Dämpfung bei Spielern im GameTest messen und ausgleichen; Ziel: ~30 Blöcke.
- Keine Partikel, kein Sound. Kein Fallschaden bleibt.

### 5.2 Stärke – Netherite-Schwerter-Ring (Blatt B)
- „3 Herzen Schaden bei full Netherite-Rüstung“: Rohschaden so wählen, dass ein Ziel in voller Netherite-Rüstung (ohne Verzauberung) 6 HP verliert; per GameTest kalibrieren.
- Optik: Netherite-Schwerter fliegen sternförmig vom Spieler nach außen (Skizze). Umsetzung: eigene Entity `craftedeffects:sword_wave` im Ressourcenpaket (flache Item-Geometrie, Vanilla-Textur `textures/items/netherite_sword`), keine Kollision, lebt ~1 s.

### 5.3 Bergmann – neue Explosion
- A: „sofort eine Endcrystal-Explosion“; B: „soll auch Bedrock und Obsidian zerstören können und so groß wie ein Respawn-Anker sein (ohne Feuer)“. → **Stärke 5 (Respawn-Anker), kein Feuer**.
- Bedrock, Obsidian und weinenden Obsidian im Explosionsradius zusätzlich per Skript entfernen – **ausdrücklich auch Weltboden und Nether-Dach** (Nutzer-Entscheidung, Void-Sturz ist gewollt möglich). Warnung in `RELIKTE.md`. Nur Barriere, Command-/Struktur-Blöcke und End-Portal(-Rahmen) bleiben.
- Resistenz + Langsamkeit wie bisher, Benutzer unverletzt.

### 5.4 Glut – Kometen
- „Explosionen müssen größer sein und die Lava muss fließen.“ → Explosionsstärke 2 → 4; Lava als Quellblock setzen und Block-Update auslösen (bisher bleibt sie offenbar stehen – prüfen, ob `setType` den Fluss verhindert; ggf. per `setblock … lava` mit Update oder `fill … replace air`).
- „Man muss seinen Effekt erst einmal upgraden, um die Spezialattacke zu bekommen.“ → Max. Level 2.

### 5.5 Leben – Lebensschild (Blatt B)
- Im Schild **Regeneration III** statt (bzw. zusätzlich zu) Sofortheilung („3fache Regeneration“).
- Gegner werden stärker weggestoßen und bekommen **Schaden bei Kontakt** oder wenn sie das Schild schlagen.
- Beim Ende („Zerstörung“) des Schildes werden Gegner **20 Blöcke** weggeschleudert.
- Optik: **Kuppel aus Minecraft-Schilden** (Vanilla-Schild-Modell) rund um den Spieler. Umsetzung: eigene Entity `craftedeffects:shield_dome` im Ressourcenpaket mit Kuppel-Geometrie aus vielen Schild-Flächen, Textur = Vanilla-Schild; keine Kollision, nicht angreifbar, folgt dem Spieler 5 s, verschwindet beim „Zerstören“.

### 5.6 Himmelssturz – Auto-Mace (Blatt B)
- **Fadenkreuz** für Tablet/Handy-Spieler während der Attacke (Touch hat keins): JSON-UI-Element im Ressourcenpaket, das über einen Titel-Trigger eingeblendet wird.
- Funktioniert **auch ohne Mace** in der Hotbar (dann normaler Dash-Schaden statt Smash).
- **Genau aufs Ziel dashen**, nicht daneben: Zielposition jeden Tick neu berechnen (Ziel bewegt sich), letzte Ticks auf Trefferbox einrasten.
- **5 s während der Attacke kann der Benutzer nicht normal zuschlagen:** Schaden, den der Benutzer in dieser Zeit per Nahkampf austeilt, wird verhindert (bzw. sofort zurückgeheilt, falls kein stable Before-Event existiert); nur der Dash-/Smash-Treffer zählt.

### 5.7 NEUES Relikt der Tiefe (`relic_water`, Dauer-Effekt Wasseratmung)
- **Wasserblase:** umhüllt den anvisierten Gegner (≈20 Blöcke, Fallback: nächster Gegner) **10 s**: konstanter Schaden (1 Herz/s), kann nicht entkommen (jeden Tick zurück in die Mitte), **kann nicht schlagen und nicht essen** (Schaden vom Eingeschlossenen abbrechen, `beforeEvents.itemUse` für Essen abbrechen). Blasen-/Wasserpartikel-Kugel, Blubber-Sounds, keine echten Wasserblöcke. Spieler nur bei `/ce:pvp true`.
- **+10 Blöcke Reichweite** auf die Blase: Schlägt der Benutzer in Richtung der Blase (Raycast bis 13 Blöcke, Schwung-Event bzw. Polling), bekommt der Eingeschlossene Nahkampfschaden des gehaltenen Items.
- **Ausrüstung:** „Sobald du den Effekt in der Hand hältst, werden deine Schuhe automatisch auf Wasserläufer (Tiefenläufer) 5, dein Helm auf Wasseraffinität verzaubert.“ Vanilla-Maximum ist Tiefenläufer III / Wasseraffinität I → diese temporär auf die getragene Rüstung setzen und beim Weglegen exakt wieder entfernen (vorherige Stufe merken); die fehlenden Stufen IV–V per Bewegungs-Impuls im Wasser nachbilden. A nennt zusätzlich Delfinsgnade → per Schwimm-Impuls nachbilden.
- **Rezept (A):** Prismarinscherbe | Schwamm | Prismarinscherbe / Aquisitor | Glasflasche | Aquisitor / Coast-Besatz | Wassereimer | Tide-Besatz.
- Textur: Platzhalter vom Generator; in `pixelstation/vorbereiten.py` ergänzen, echte Textur kommt aus der Pixelstation.
- `/ce:attack`-Wert `bubble`, Relikt-Name `water`.

---

## 7. Tests (GameTest)

1. Schleichen + kurzer Rechtsklick → Boost, kein Angriff; getrennte Abklingzeiten.
2. 5 s Halten schaltet Dauer-Effekt aus/an, ohne Boost.
3. Diadem levelt Relikt in der Hotbar; ohne Relikt bleibt es erhalten.
4. Zweites Relikt craften → Zutaten zurück; zweites aufheben → Tausch, altes liegt am Boden.
5. Relikt in Lava/Feuer/TNT überlebt; unter Void-Grenze → verloren; Verfall nach (im Test verkürzter) Zeit außerhalb des Inventars.
6. Tod durch Mob/Spieler ohne Stealing → Relikt bleibt; Kill mit Stealing → Relikt beim Mörder, Stealing verbraucht; PvP-Kill → Spielerkopf droppt.
7. Dash ohne Teleport erreicht ~30 Blöcke; Bergmann-Explosion entfernt Obsidian und Bedrock; 3×3-Boost lässt Bedrock stehen.
8. Kraftring macht an Netherite-Zombie 6 HP Schaden.
9. Wasserblase hält Zombie 10 s fest, macht Schaden; Benutzer bekommt keinen Schaden von ihm.
10. Stärke alt Level 3 → auf 2 gekappt; Glut Level 1 → Angriff gesperrt.

---

## 8. Entscheidungen des Nutzers (2026-11-18)

1. Bei Widersprüchen gelten die **linierten Blätter** (Runde B).
2. Leben: **10 → 15 → 20 → 25 → 30 Herzen** (Level 1 = keine Extra-Herzen).
3. Zweites Relikt aufheben → **Tausch** (neues bleibt, altes fällt heraus).
4. Relikt geht beim Tod nur verloren, wenn man mit dem neuen Item **Stealing** getötet wird; Stealing = Waffe, wird beim Stehlen verbraucht; Rezept/Textur folgen später.
5. Auto-Mace: 5 s lang **kein normales Zuschlagen** während der Attacke.
6. Lebensschild-Optik: **Kuppel aus Minecraft-Schilden**.
7. Relikt der Tiefe max. Level **3**; **Boost-Up ab Level 1**; „Aus“ sperrt **nur den Dauer-Effekt**.
8. Namen immer **`<Effektname>effect`**; Bergmann-Explosion zerstört **jeden** Bedrock, auch Weltboden/Nether-Dach.

## 9. Noch offen (blockiert die Umsetzung nicht)

- Rezept, Textur und Schaden des **Stealing** (Platzhalter bis dahin).
- Echte Texturen für Waterbreathingeffect und Stealing (Pixelstation).
