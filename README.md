# CraftedEffects – Einzigartige Relikte

Add-on für Minecraft **Bedrock Edition 26.3**, für **normale Welten und Realms**.

- **6 craftbare Relikte**, jedes existiert **nur einmal pro Welt**
- **Dauer-Effekt**, solange das Relikt irgendwo im Inventar, in der Hotbar oder in der Zweithand liegt
- **Spezialangriff** per Rechtsklick ab dem **Maximallevel**: Dash, Kraftring, Bollwerk, Kometenhagel, Lebensschild, **Auto-Mace**
- **Diadem**: hebt ein Relikt um 1 Level bis zum Maximum
- **Admin-Befehle** (`/ce:…`), um jedes Relikt im Spiel umzukonfigurieren

## ⬇️ Download (ohne GitHub-Konto)

**[Neueste Version herunterladen](https://github.com/rcode125/CraftedEffects/releases/latest)** – dort unter *Assets* die einzige Datei `CraftedEffects-<version>.mcaddon` anklicken. Ältere Versionen gibt es unter [Releases](https://github.com/rcode125/CraftedEffects/releases).

👉 **Alle Rezepte, Effekte, Angriffe und Befehle stehen in [RELIKTE.md](RELIKTE.md).**

## Installation – normale Welt

1. Alte Versionen (Eternal Elixir, 9x Mace) in der Welt deaktivieren und unter *Einstellungen → Speicher* löschen.
2. Die heruntergeladene `CraftedEffects-<version>.mcaddon` öffnen (oder selbst gebaut: `build/CraftedEffects-4.1.0.mcaddon`); Minecraft importiert beide Packs.
3. Welt bearbeiten → **Verhaltenspakete**: *CraftedEffects Behavior Pack v4.1.0* aktivieren (das Ressourcenpaket wird automatisch mit aktiviert).
4. Es werden **keine Experimente** und **keine Cheats** benötigt.

## Installation – Realm

1. Das `.mcaddon` wie oben importieren.
2. *Realm bearbeiten → Verhaltenspakete* → *CraftedEffects Behavior Pack v4.1.0* aktivieren und bestätigen. Alternativ: das Add-on in einer lokalen Welt aktivieren und diese über *Welt ersetzen* hochladen.
3. Admin-Befehle funktionieren für Spieler mit **Operator**-Rechten (Realm-Einstellungen → Mitglieder → Operator).

## Kurzüberblick

| Relikt | Effekt (max. Level) | Spezialangriff | Abklingzeit |
|---|---|---|---|
| Relikt des Windes | Schnelligkeit (3) | Dash 30 Blöcke in Blickrichtung, kein Fallschaden | 30 s |
| Relikt der Stärke | Stärke (3) | Kraftring: 3 Herzen Schaden an allem, was er trifft | 30 s |
| Relikt des Bergmanns | Eile (5) | Bollwerk: 3 s unverwundbar + Explosion um dich | 90 s |
| Relikt der Glut | Feuerresistenz (1) | Kometenhagel: 8 Kometen, Explosionen und Lava | 120 s |
| Relikt des Lebens | Gesundheitsschub (5 = 30 Herzen) | Lebensschild: stößt Gegner weg, heilt und sättigt 5 s | 90 s |
| Relikt des Himmelssturzes | Sprungkraft (4) | Auto-Mace: 30 Blöcke hoch, Dash aufs Ziel, Mace-Smash | 30 s |

Die genauen Rezepte stehen in [RELIKTE.md](RELIKTE.md). Der **Spezialangriff** wird erst freigeschaltet, wenn das Relikt sein **Maximallevel** erreicht hat (Zahl in Klammern). Beim Gesundheitsschub steigen die Herzen pro Level: 20 → 24 → 26 → 28 → 30.

> ⚠️ Bollwerk und Kometenhagel zerstören Blöcke, die Kometen hinterlassen Lava. Der Auslöser selbst bekommt keinen Schaden – andere Spieler und deren Bauten schon.

## Diadem

Relikt in die **Zweithand**, Diadem in die Haupthand, **Rechtsklick** → das Relikt steigt um 1 Level, das Diadem ist verbraucht. Am Maximallevel passiert nichts. Wird ein Relikt zerstört und neu gecraftet, beginnt es wieder bei Level 1.

## So funktioniert die Einzigartigkeit

- Beim Craften bekommt das Relikt eine Seriennummer und wird für die Welt registriert.
- Craftet jemand ein Relikt, das schon existiert, wird die Kopie entfernt und die Zutaten kommen zurück.
- Duplikate (z. B. aus dem Kreativ-Inventar oder durch Glitches) werden automatisch entfernt.
- Verbrennt, despawnt oder fällt ein Relikt in die Leere, wird es freigegeben und im Chat angekündigt.
- Ein Relikt in einer Truhe bleibt registriert. Wer offline ist, behält sein Relikt.
- Notfalls gibt ein Admin ein Relikt mit `/ce:free <relikt>` frei, z. B. `/ce:free speed`.

## Auto-Mace

1. Rechtsklick → du wirst etwa 30 Blöcke hochgeschleudert und bekommst oben 5 Sekunden *Sanfter Fall*.
2. Schaust du einen Spieler oder Mob an (bis 40 Blöcke), wirst du zu ihm gedasht.
3. Liegt eine **Mace in der Hotbar**, wechselt das Add-on automatisch zu ihr und teilt beim Aufprall Smash-Schaden nach Fallhöhe aus (Vanilla-Formel).
4. Während und kurz nach der Auto-Mace bekommst du keinen Fallschaden.

## Spieltest-Checkliste

- [ ] Relikt craften → Name und Beschreibung erscheinen, Chat meldet „… hat … erschaffen!“
- [ ] Effekt ist aktiv, solange das Relikt im Inventar liegt, und verschwindet beim Ablegen in eine Truhe
- [ ] Dasselbe Relikt erneut craften → wird entfernt, Zutaten kommen zurück
- [ ] Relikt in Lava werfen → Chat meldet die Zerstörung, danach ist es wieder craftbar
- [ ] Alle Angriffe testen; Auto-Mace mit und ohne Mace in der Hotbar
- [ ] Diadem: Relikt in der Zweithand steigt um 1 Level, am Maximum wird nichts verbraucht
- [ ] `/ce:list` und `/ce:level speed 3` als Operator → funktioniert; als normaler Spieler → nicht erlaubt
- [ ] Welt bzw. Realm neu starten → Einstellungen und Registrierung bleiben erhalten

Bei Problemen hilft der Content-Log (*Einstellungen → Creator → Content-Log aktivieren*). Alle Meldungen des Add-ons beginnen mit `[CraftedEffects]`.

## Für Entwickler

```bash
python3 scripts/build_addon.py
```

- `scripts/generate_content.py` ist die **einzige Quelle** für Relikte, Effekte und Angriffe. Er erzeugt Items, Rezepte, Texturen, Sprachdateien, `behavior_pack/scripts/data.js` und `RELIKTE.md`.
- `scripts/build_addon.py` ruft den Generator auf, prüft Manifeste, IDs, Texturen und Rezepte (keine doppelten) sowie die JavaScript-Syntax und packt dann `build/CraftedEffects-<version>.mcaddon`.
- Ziel: Engine `[1, 26, 30]` (= Bedrock 26.3), Script-API `@minecraft/server` **2.8.0** (die stabile Version von 26.3; 2.9.0 ist dort nur Beta).

| Script-Datei | Aufgabe |
|---|---|
| `main.js` | Startpunkt: registriert Item-Komponenten und Befehle, startet die Intervalle |
| `config.js` | Admin-Konfiguration, gespeichert in der Welt |
| `registry.js` | Einzigartigkeit: Seriennummern, Duplikate, Verlust-Erkennung |
| `effects.js` | Dauer-Effekte aus dem Inventar |
| `attacks.js` | Spezialangriffe und Abklingzeiten |
| `automace.js` | Auto-Mace-Ablauf |
| `diadem.js` | Diadem: Relikt in der Zweithand +1 Level |
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
3. Ordner zurück auf den PC, darin `python3 zurueck_ins_addon.py` ausführen → geänderte Texturen landen in `art/items/`, das `.mcaddon` wird automatisch gebaut.

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

Getestet wird: Registrierung beim Craften, Dauer-Effekt im Inventar und dessen Entfernen, Entfernen von Duplikaten samt Rückgabe der Zutaten, Freigabe nach Zerstörung in Lava, Schockwelle, Auto-Mace (Flughöhe, Wechsel zur Mace, Treffer, kein Fallschaden) und Admin-Befehle. Die gemessene Auto-Mace-Höhe steht im Log als `[CE-TEST]`. In GitHub Actions läuft dasselbe automatisch als Job `gametests`.
