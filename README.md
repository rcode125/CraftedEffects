# CraftedEffects – Einzigartige Relikte

Add-on für Minecraft **Bedrock Edition 26.3**, für **normale Welten und Realms**.

- **12 craftbare Relikte**, jedes existiert **nur einmal pro Welt**
- **Dauer-Effekt**, solange das Relikt irgendwo im Inventar, in der Hotbar oder in der Zweithand liegt
- **Spezialangriff** per Rechtsklick (Feuerball, Blitz, Schockwelle, Dash, Teleport, Heilung, Schild, **Auto-Mace**)
- **Admin-Befehle** (`/ce:…`), um jedes Relikt im Spiel umzukonfigurieren

👉 **Alle Rezepte, Effekte, Angriffe und Befehle stehen in [RELIKTE.md](RELIKTE.md).**

## Installation – normale Welt

1. Alte Versionen (Eternal Elixir, 9x Mace) in der Welt deaktivieren und unter *Einstellungen → Speicher* löschen.
2. `build/CraftedEffects-3.0.0.mcaddon` öffnen; Minecraft importiert beide Packs.
3. Welt bearbeiten → **Verhaltenspakete**: *CraftedEffects Behavior Pack v3.0.0* aktivieren (das Ressourcenpaket wird automatisch mit aktiviert).
4. Es werden **keine Experimente** und **keine Cheats** benötigt.

## Installation – Realm

1. Das `.mcaddon` wie oben importieren.
2. *Realm bearbeiten → Verhaltenspakete* → *CraftedEffects Behavior Pack v3.0.0* aktivieren und bestätigen. Alternativ: das Add-on in einer lokalen Welt aktivieren und diese über *Welt ersetzen* hochladen.
3. Admin-Befehle funktionieren für Spieler mit **Operator**-Rechten (Realm-Einstellungen → Mitglieder → Operator).

## Kurzüberblick

| # | Relikt | Kern im Rezept | Effekt | Angriff |
|---|---|---|---|---|
| 1 | Relikt des Himmelssturzes | Breeze-Rute | Sprungkraft II | Auto-Mace |
| 2 | Relikt der Stärke | Lohenrute | Stärke II | Schockwelle |
| 3 | Relikt des Windes | Zucker | Schnelligkeit II | Dash |
| 4 | Relikt der Glut | Magmacreme | Feuerresistenz | Feuerball |
| 5 | Relikt des Lebens | Ghast-Träne | Regeneration I | Heilung |
| 6 | Relikt des Bollwerks | Eisenblock | Resistenz I | Schild |
| 7 | Relikt der Nacht | Enderperle | Nachtsicht | Teleport |
| 8 | Relikt der Tiefe | Herz des Meeres | Wasseratmung | Blitz |
| 9 | Relikt des Bergmanns | Smaragdblock | Eile II | Schockwelle |
| 10 | Relikt der Schatten | Fermentiertes Spinnenauge | Unsichtbarkeit | Teleport |
| 11 | Relikt des Goldes | Goldener Apfel | Absorption I | Schild |
| 12 | Relikt der Unsterblichkeit | Totem der Unsterblichkeit | Gesundheitsschub I | Heilung |

Jedes Rezept (Werkbank): **Goldbarren in den 4 Ecken, Diamanten an den 4 Seiten, Kern in der Mitte.**

## So funktioniert die Einzigartigkeit

- Beim Craften bekommt das Relikt eine Seriennummer und wird für die Welt registriert.
- Craftet jemand ein Relikt, das schon existiert, wird die Kopie entfernt und die Zutaten kommen zurück.
- Duplikate (z. B. aus dem Kreativ-Inventar oder durch Glitches) werden automatisch entfernt.
- Verbrennt, despawnt oder fällt ein Relikt in die Leere, wird es freigegeben und im Chat angekündigt.
- Ein Relikt in einer Truhe bleibt registriert. Wer offline ist, behält sein Relikt.
- Notfalls gibt ein Admin ein Relikt mit `/ce:free <nummer>` frei.

## Auto-Mace

1. Rechtsklick → du wirst etwa 20 Blöcke hochgeschleudert und bekommst oben *Sanfter Fall*.
2. Schaust du einen Spieler oder Mob an (bis 32 Blöcke), wirst du zu ihm gedasht.
3. Liegt eine **Mace in der Hotbar**, wechselt das Add-on automatisch zu ihr und teilt beim Aufprall Smash-Schaden nach Fallhöhe aus (Vanilla-Formel).
4. Während und kurz nach der Auto-Mace bekommst du keinen Fallschaden.

## Spieltest-Checkliste

- [ ] Relikt craften → Name und Beschreibung erscheinen, Chat meldet „… hat … erschaffen!“
- [ ] Effekt ist aktiv, solange das Relikt im Inventar liegt, und verschwindet beim Ablegen in eine Truhe
- [ ] Dasselbe Relikt erneut craften → wird entfernt, Zutaten kommen zurück
- [ ] Relikt in Lava werfen → Chat meldet die Zerstörung, danach ist es wieder craftbar
- [ ] Alle Angriffe testen; Auto-Mace mit und ohne Mace in der Hotbar
- [ ] `/ce:list` und `/ce:effect 3 speed 3` als Operator → funktioniert; als normaler Spieler → nicht erlaubt
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
| `main.js` | Startpunkt: registriert Item-Komponente und Befehle, startet die Intervalle |
| `config.js` | Admin-Konfiguration, gespeichert in der Welt |
| `registry.js` | Einzigartigkeit: Seriennummern, Duplikate, Verlust-Erkennung |
| `effects.js` | Dauer-Effekte aus dem Inventar |
| `attacks.js` | Spezialangriffe und Abklingzeiten |
| `automace.js` | Auto-Mace-Ablauf |
| `commands.js` | `/ce:`-Befehle |
| `targets.js` | Zielauswahl (PvP-Regel, keine Items/Rüstungsständer) |
| `data.js` | generiert – nicht von Hand bearbeiten |

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

Getestet wird: Registrierung beim Craften, Dauer-Effekt im Inventar und dessen Entfernen, Entfernen von Duplikaten samt Rückgabe der Zutaten, Freigabe nach Zerstörung in Lava, Schockwelle, Auto-Mace (Flughöhe, Wechsel zur Mace, Treffer, kein Fallschaden) und Admin-Befehle. Die gemessene Auto-Mace-Höhe steht im Log als `[CE-TEST]`. In GitHub Actions läuft dasselbe automatisch als Job `gametests`.
