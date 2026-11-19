# CraftedEffects – Einzigartige Effekte

Add-on für Minecraft **Bedrock Edition 26.3**, für **normale Welten und Realms**.

- **7 craftbare Effekte**, jedes existiert **nur einmal pro Welt** – und **jeder Spieler kann nur eins haben**
- **Dauerwirkung**, solange der Effekt irgendwo im Inventar, in der Hotbar oder in der Zweithand liegt (per Schleichen + 5 s Halten an/aus)
- **Spezialangriff** per Rechtsklick ab dem **Maximallevel**: Dash, Kraftring, Bollwerk, Kometenhagel, Lebensschild, **Auto-Mace**, Wasserblase
- **Boost-Up** per Schleichen + Rechtsklick ab Level 1
- Effekte **verbrennen und explodieren nicht**; nur das Void oder 5 Minuten außerhalb eines Inventars zerstören sie
- **Diadem**: hebt deinen Effekt um 1 Level bis zum Maximum
- **Stealing-Flasche** (Unheilvolle Flasche + Amethystscherbe): 2–6 Minuten lang stiehlst du beim Kill den Effekt des Gegners
- **Admin-Befehle** (`/ce:…`), um jeden Effekt im Spiel umzukonfigurieren

## ⬇️ Download (ohne GitHub-Konto)

**[Neueste Version herunterladen](https://github.com/rcode125/CraftedEffects/releases/latest)** – dort unter *Assets* die einzige Datei `CraftedEffects-<version>.mcaddon` anklicken. Ältere Versionen gibt es unter [Releases](https://github.com/rcode125/CraftedEffects/releases).

👉 **Alle Rezepte, Effekte, Angriffe und Befehle stehen in [EFFEKTE.md](EFFEKTE.md).**

## Installation – normale Welt

1. Alte Versionen (Eternal Elixir, 9x Mace) in der Welt deaktivieren und unter *Einstellungen → Speicher* löschen.
2. Die heruntergeladene `CraftedEffects-<version>.mcaddon` öffnen (oder selbst gebaut: `build/CraftedEffects-5.0.0.mcaddon`); Minecraft importiert beide Packs.
3. Welt bearbeiten → **Verhaltenspakete**: *CraftedEffects Behavior Pack v5.0.0* aktivieren (das Ressourcenpaket wird automatisch mit aktiviert).
4. Es werden **keine Experimente** und **keine Cheats** benötigt.

## Installation – Realm

1. Das `.mcaddon` wie oben importieren.
2. *Realm bearbeiten → Verhaltenspakete* → *CraftedEffects Behavior Pack v5.0.0* aktivieren und bestätigen. Alternativ: das Add-on in einer lokalen Welt aktivieren und diese über *Welt ersetzen* hochladen.
3. Admin-Befehle funktionieren für Spieler mit **Operator**-Rechten (Realm-Einstellungen → Mitglieder → Operator).

## Kurzüberblick

| Effekt | Effekt (max. Level) | Spezialangriff | Abkl. | Boost-Up (Schleichen + Klick) | Abkl. |
|---|---|---|---|---|---|
| Speedeffect | Schnelligkeit (3) | Dash 30 Blöcke wie ein Riptide-Dreizack | 60 s | Schnelligkeit VI, 30 s | 120 s |
| Strengtheffect | Stärke (2) | Ring aus Netherite-Schwertern, 3 Herzen Schaden (auch durch Netherite) | 30 s | Stärke III, 10 s | 120 s |
| Hasteeffect | Eile (5) | Bollwerk: 3 s unverwundbar + Explosion wie ein Endkristall (zerstört auch Obsidian und Bedrock) | 60 s | 3×3-Abbau, 20 s | 120 s |
| Fireresistanceeffect | Feuerresistenz (2) | Kometenhagel: 8 Kometen, große Explosionen, fließende Lava | 120 s | Ultraschnell in Lava/Feuer, Gegner im 5-Block-Umkreis brennen, 20 s | 120 s |
| Healtheffect | Gesundheitsschub (5 = 30 Herzen) | Lebensschild: Kuppel aus Schilden, Regeneration III, Gegner fliegen 20 Blöcke weg | 90 s | 60 Herzen, 20 s | 120 s |
| Jumpboosteffect | Sprungkraft (4) | Auto-Mace: 30 Blöcke hoch, genauer Dash aufs Ziel, Mace-Smash | 60 s | Sprungkraft VI, 15 s | 120 s |
| Waterbreathingeffect | Wasseratmung (3) | Wasserblase: hält den Gegner 10 s fest und macht Schaden | 60 s | Regen, 30 s | 120 s |

Die genauen Rezepte stehen in [EFFEKTE.md](EFFEKTE.md). Der **Spezialangriff** wird erst freigeschaltet, wenn der Effekt sein **Maximallevel** erreicht hat (Zahl in Klammern); der **Boost-Up** geht ab Level 1. Beim Gesundheitsschub steigen die Herzen pro Level: 10 → 16 → 20 → 26 → 30 (Gesundheitsschub geht nur in 2-Herz-Schritten).

> ⚠️ Bollwerk und Kometenhagel zerstören Blöcke, das Bollwerk sogar Bedrock (auch den Weltboden – Void-Gefahr!). Die Kometen hinterlassen fließende Lava. Der Auslöser selbst bekommt keinen Schaden – andere Spieler und deren Bauten schon.

## Steuerung

| Effekt in der Hand | Wirkung |
|---|---|
| Rechtsklick (Handy: Tippen) | Spezialangriff |
| Schleichen + kurzer Rechtsklick | Boost-Up |
| Schleichen + Rechtsklick 5 s halten | Dauerwirkung an/aus |

## Diadem

Diadem in die Hand, **Rechtsklick** → dein Effekt (irgendwo im Inventar, in der Hotbar oder Zweithand) steigt um 1 Level, das Diadem ist verbraucht. Ohne Effekt oder am Maximallevel passiert nichts. Spielerköpfe für das Rezept lässt jeder Spieler fallen, den ein anderer Spieler besiegt.

## Besitz, Verlust und Stealing

- Beim Craften bekommt der Effekt eine Seriennummer und wird für die Welt registriert. Duplikate werden automatisch entfernt.
- Jeder Spieler kann **nur einen Effekt** haben. Einen zweiten zu craften gibt die Zutaten zurück; hebst du einen zweiten auf, wird getauscht (dein alter fällt auf den Boden).
- Effekte **verbrennen und explodieren nicht** – aus Lava, Feuer, Kaktus oder Explosionen tauchen sie auf sicherem Boden wieder auf. Nur das **Void** zerstört sie sofort.
- Liegt ein Effekt **5 Minuten außerhalb eines Spieler-Inventars** (Boden, Truhe, Endertruhe, Fass, Shulkerkiste …), verfällt er und kann neu gecraftet werden. Wer offline ist, behält seinen Effekt.
- Beim **Tod** behältst du deinen Effekt. Nur wer dich mit aktivem **Stealing** tötet, bekommt ihn (das Stealing ist danach verbraucht).
- **Stealing-Flasche:** Unheilvolle Flasche + Amethystscherbe (formlos an der Werkbank), dann trinken. Die Stufe der Unheilvollen Flasche bestimmt die Dauer: I = 2 min, II = 3 min, III = 4 min, IV = 5 min, V = 6 min. Stirbst du, ist das Stealing weg.

## Chat-Meldungen

Im Chat steht nur noch, wenn ein Effekt **erschaffen** oder **zerstört/freigegeben** wurde, wenn ein Spezialangriff **freigeschaltet** wurde oder wenn die **Abklingzeit** eines Spezialangriffs oder Boost-Ups **abgelaufen** ist. Alles andere (Angriffe, Boosts, An/Aus, Diadem-Level, Stealing) erscheint nur kurz über der Hotbar.
- Notfalls gibt ein Admin einen Effekt mit `/ce:free <effekt>` frei, z. B. `/ce:free speed`.

## Auto-Mace

1. Rechtsklick → du wirst etwa 30 Blöcke hochgeschleudert und bekommst oben 5 Sekunden *Sanfter Fall*. Am Handy/Tablet erscheint ein Fadenkreuz.
2. Schaust du einen Spieler oder Mob an (bis 40 Blöcke), wirst du genau zu ihm gedasht.
3. Liegt eine **Mace in der Hotbar**, wechselt das Add-on automatisch zu ihr und teilt beim Aufprall Smash-Schaden nach Fallhöhe aus (Vanilla-Formel). Ohne Mace gibt es normalen Dash-Schaden.
4. Während der Auto-Mace kannst du nicht normal zuschlagen und bekommst keinen Fallschaden.

## Spieltest-Checkliste

- [ ] Effekt craften → Name und Beschreibung erscheinen, Chat meldet „… hat … erschaffen!“
- [ ] Dauerwirkung ist aktiv, solange der Effekt im Inventar liegt, und verschwindet beim Ablegen in eine Truhe
- [ ] Schleichen + kurzer Klick → Boost; Schleichen + 5 s Halten → Effekt aus/an
- [ ] Denselben Effekt erneut craften → wird entfernt, Zutaten kommen zurück; zweiten Effekt aufheben → Tausch
- [ ] Effekt in Lava werfen → taucht daneben wieder auf; ins Void werfen → Chat meldet die Zerstörung
- [ ] Effekt 5 Minuten in eine Truhe legen → verfällt
- [ ] Sterben → Effekt kommt nach dem Respawn zurück; Stealing-Flasche getrunken und dann getötet → Effekt beim Mörder
- [ ] Unheilvolle Flasche (Stufe I–V) + Amethystscherbe → passende Stealing-Flasche (2–6 min)
- [ ] Abklingzeit von Angriff/Boost abgelaufen → Meldung im Chat; Angriff selbst → nichts im Chat
- [ ] Alle Angriffe testen; Auto-Mace mit und ohne Mace in der Hotbar, am Tablet mit Fadenkreuz
- [ ] Diadem: Effekt im Inventar steigt um 1 Level, am Maximum wird nichts verbraucht
- [ ] `/ce:list` und `/ce:level speed 3` als Operator → funktioniert; als normaler Spieler → nicht erlaubt
- [ ] Welt bzw. Realm neu starten → Einstellungen und Registrierung bleiben erhalten

Bei Problemen hilft der Content-Log (*Einstellungen → Creator → Content-Log aktivieren*). Alle Meldungen des Add-ons beginnen mit `[CraftedEffects]`.

## Für Entwickler

```bash
python3 scripts/build_addon.py
```

- `scripts/generate_content.py` ist die **einzige Quelle** für Effekte, Effekte und Angriffe. Er erzeugt Items, Rezepte, Texturen, Sprachdateien, `behavior_pack/scripts/data.js` und `EFFEKTE.md`.
- `scripts/build_addon.py` ruft den Generator auf, prüft Manifeste, IDs, Texturen und Rezepte (keine doppelten) sowie die JavaScript-Syntax und packt dann `build/CraftedEffects-<version>.mcaddon`.
- Ziel: Engine `[1, 26, 30]` (= Bedrock 26.3), Script-API `@minecraft/server` **2.8.0** (die stabile Version von 26.3; 2.9.0 ist dort nur Beta).

| Script-Datei | Aufgabe |
|---|---|
| `main.js` | Startpunkt: registriert Item-Komponenten und Befehle, startet die Intervalle |
| `config.js` | Admin-Konfiguration, gespeichert in der Welt |
| `registry.js` | Einzigartigkeit, ein Effekt pro Spieler, Unzerstörbarkeit, 5-Minuten-Verfall, Tod und Stealing |
| `effects.js` | Dauerwirkungen aus dem Inventar |
| `attacks.js` | Spezialangriffe und Abklingzeiten |
| `stealing.js` | Stealing-Flasche: Trinken, Restzeit, Ablauf |
| `boosts.js` | Steuerung (Klick, Schleichen + Klick, 5 s Halten), Boost-Ups, Abklingzeit-Anzeige |
| `automace.js` | Auto-Mace-Ablauf |
| `diadem.js` | Diadem: Effekt im Inventar +1 Level |
| `fx.js` | Effekt-Entities (Schwert-Ring, Schild-Kuppel) |
| `water.js` | Waterbreathingeffect: Verzauberungen beim Halten, schnelleres Schwimmen |
| `protection.js` | Kein Schaden durch eigene Angriffe (Fall, Explosion, Lava) |
| `commands.js` | `/ce:`-Befehle |
| `targets.js` | Zielauswahl (PvP-Regel, keine Items/Rüstungsständer) |
| `data.js` | generiert – nicht von Hand bearbeiten |

## Texturen auf dem Raspberry Pi 5 pixeln (Pixelstation)

Ein tragbarer Ordner, mit dem du die Item-Texturen **offline** auf einem Raspberry Pi 5 in Blockbench zeichnest:

```bash
python3 pixelstation/vorbereiten.py            # am PC mit Internet -> ~/Pixelstation (ca. 120 MB)
```

1. Ordner `~/Pixelstation` auf den Pi kopieren, dort `bash start.sh` ausführen.
2. Blockbench öffnet die Texturen nacheinander: pixeln, **Strg+S**, Fenster schließen → nächste Textur.
3. Ordner zurück auf den PC, darin `python3 zurueck_ins_addon.py` ausführen → geänderte Texturen landen in `art/items/`, das `.mcaddon` wird automatisch gebaut und die Texturen werden automatisch committet und gepusht (`--ohne-git` schaltet das ab).

PNGs in `art/items/` haben Vorrang vor den generierten Texturen. Blockbench gibt es offiziell nicht für Linux-ARM64; `vorbereiten.py` kombiniert den offiziellen Blockbench-Programmcode mit der offiziellen Electron-ARM64-Laufzeit (beide per Prüfsumme kontrolliert). Details und Fehlerhilfe: `pixelstation/vorlage/LIESMICH.txt`.

## Automatische Tests (echter Bedrock-Server)

Die GameTests in `tests/` laufen mit [bds-runner](https://github.com/bedrock-core/bds-runner) auf einem echten Bedrock Dedicated Server **1.26.30.5** (= Bedrock 26.3, festgelegt in `tests/bds-runner.json`). Das Test-Pack `tests/gametest_pack` wird nie mit dem Add-on ausgeliefert. Nur in der Testwelt werden die Beta-APIs eingeschaltet.

```bash
cd tests
npm install        # einmalig
npm test           # baut das Add-on, lädt den Server (einmalig ca. 100 MB) und führt alle Tests aus
npm run test:inspect   # wie oben, danach bleibt der Server offen: im Spiel mit 127.0.0.1:19140 verbinden
```

Schlägt der automatische Download fehl (Firewall/Proxy), die Server-ZIP für Linux im Browser laden ([bedrock-server-1.26.30.5.zip](https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.26.30.5.zip); mit dem Download akzeptierst du die Minecraft-EULA) und einmalig einspielen:

```bash
python3 tests/tools/install_server.py ~/Downloads/bedrock-server-1.26.30.5.zip
```

`npm test` macht zwei Läufe: `test:shipped` lädt das **ausgelieferte** Pack (API 2.8.0) und prüft per Smoke-Test, dass es fehlerfrei lädt. `test:gametests` nutzt eine Testkopie mit `2.9.0-beta`, weil nur Beta-Packs die simulierten Testspieler sehen können. Beide Läufe schlagen auch fehl, wenn der Server beim Laden Fehler meldet (Rezepte, Items, Scripts).

Getestet wird: Registrierung beim Craften, Dauerwirkung im Inventar und dessen Entfernen, Entfernen von Duplikaten samt Rückgabe der Zutaten, Freigabe nach Zerstörung in Lava, Schockwelle, Auto-Mace (Flughöhe, Wechsel zur Mace, Treffer, kein Fallschaden) und Admin-Befehle. Die gemessene Auto-Mace-Höhe steht im Log als `[CE-TEST]`. In GitHub Actions läuft dasselbe automatisch als Job `gametests`.
