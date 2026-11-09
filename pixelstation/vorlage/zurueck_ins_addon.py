#!/usr/bin/env python3
"""Pixelstation -> Add-on. Am PC ausführen, nachdem der Ordner vom Raspberry Pi zurück ist.

Übernimmt jede geänderte Textur aus texturen/ nach <Add-on>/art/items/, baut
danach automatisch das .mcaddon (scripts/build_addon.py) und committet + pusht
die Texturen (nur art/items/ und resource_pack/textures/items/).

    python3 zurueck_ins_addon.py                   # Add-on-Pfad aus addon_pfad.txt
    python3 zurueck_ins_addon.py ~/CraftedEffects  # anderer Add-on-Ordner
    python3 zurueck_ins_addon.py --ohne-git        # nur bauen, nichts committen
"""

import hashlib
import shutil
import struct
import subprocess
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
TEXTUREN = HIER / "texturen"
ORIGINAL = HIER / "programm" / "original"
OHNE_GIT = "--ohne-git" in sys.argv
ARGUMENTE = [a for a in sys.argv[1:] if a != "--ohne-git"]
# Nur diese Ordner werden committet – andere Änderungen im Add-on bleiben unberührt.
GIT_PFADE = ["art/items", "resource_pack/textures/items"]


def addon_ordner():
    if ARGUMENTE:
        return Path(ARGUMENTE[0]).expanduser().resolve()
    pfad_datei = HIER / "addon_pfad.txt"
    if pfad_datei.is_file():
        return Path(pfad_datei.read_text(encoding="utf-8").strip()).expanduser()
    sys.exit("Add-on-Ordner unbekannt. Aufruf: python3 zurueck_ins_addon.py <Pfad zu CraftedEffects>")


def png_groesse(daten):
    if daten[:8] != b"\x89PNG\r\n\x1a\n" or daten[12:16] != b"IHDR":
        return None
    return struct.unpack(">II", daten[16:24])


def hash_von(daten):
    return hashlib.sha256(daten).hexdigest()


def git(addon, *befehl):
    return subprocess.run(["git", "-C", str(addon), *befehl], capture_output=True, text=True)


def committen_und_pushen(addon, namen):
    """Committet die Texturen und pusht sie. Fehler hier stoppen nichts – das Add-on ist schon gebaut."""
    if OHNE_GIT:
        return
    if git(addon, "rev-parse", "--is-inside-work-tree").returncode != 0:
        print("Hinweis: Add-on-Ordner ist kein Git-Repository – nichts committet.")
        return
    git(addon, "add", "--", *GIT_PFADE)
    if git(addon, "diff", "--cached", "--quiet", "--", *GIT_PFADE).returncode == 0:
        print("Git: Texturen sind schon committet.")
    else:
        nachricht = "Texturen aus der Pixelstation" + (f": {', '.join(namen)}" if namen else "")
        # Pfade angeben, damit nur die Texturen im Commit landen, egal was sonst vorgemerkt ist
        commit = git(addon, "commit", "-m", nachricht, "--", *GIT_PFADE)
        if commit.returncode != 0:
            print("Git: Commit fehlgeschlagen:\n" + (commit.stderr or commit.stdout).strip())
            return
        print(f"Git: committet – {nachricht}")
    status = git(addon, "status", "--porcelain=v2", "--branch").stdout
    if "# branch.upstream" not in status:
        print("Git: Dieser Branch hat kein Ziel auf GitHub – nicht gepusht.")
        return
    if "# branch.ab +0 " in status:
        return  # nichts zu pushen
    push = git(addon, "push")
    if push.returncode == 0:
        print("Git: gepusht.")
    else:
        print("Git: Push fehlgeschlagen (Internet? Anmeldung?). Später nachholen mit: git push\n"
              + push.stderr.strip())


def main():
    addon = addon_ordner()
    build_skript = addon / "scripts" / "build_addon.py"
    if not build_skript.is_file():
        sys.exit(f"Kein CraftedEffects-Add-on gefunden unter {addon}\n"
                 "Aufruf: python3 zurueck_ins_addon.py <Pfad zu CraftedEffects>")
    ziel = addon / "art" / "items"
    bekannte = {p.stem for p in (addon / "resource_pack" / "textures" / "items").glob("*.png")}

    uebernommen, fehler = [], []
    for datei in sorted(TEXTUREN.glob("*.png")):
        daten = datei.read_bytes()
        original = ORIGINAL / datei.name
        if original.is_file() and hash_von(original.read_bytes()) == hash_von(daten):
            continue  # nicht bearbeitet
        groesse = png_groesse(daten)
        if groesse is None:
            fehler.append(f"{datei.name}: keine gültige PNG-Datei")
            continue
        if datei.stem not in bekannte:
            fehler.append(f"{datei.name}: diese Textur gibt es im Add-on nicht")
            continue
        breite, hoehe = groesse
        if breite != hoehe or breite not in (16, 32, 64, 128):
            print(f"Achtung: {datei.name} ist {breite}x{hoehe} – Minecraft erwartet quadratisch, z. B. 16x16.")
        alt = ziel / datei.name
        if alt.is_file() and alt.read_bytes() == daten:
            continue  # schon übernommen
        ziel.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(datei, alt)
        uebernommen.append(datei.stem)
        print(f"Übernommen: {datei.stem} ({breite}x{hoehe})", flush=True)

    for meldung in fehler:
        print("Übersprungen:", meldung, flush=True)
    if not uebernommen:
        print("Keine neuen Änderungen an den Texturen – baue das Add-on trotzdem neu.", flush=True)

    ergebnis = subprocess.run([sys.executable, str(build_skript)], cwd=addon)
    if ergebnis.returncode != 0:
        sys.exit("Das Bauen des Add-ons ist fehlgeschlagen (Meldung siehe oben).")
    pakete = sorted((addon / "build").glob("*.mcaddon"))
    if pakete:
        print(f"\nFertig! Add-on: {pakete[-1]}")
        print("Doppelklick darauf (bzw. in Minecraft importieren) – die neuen Texturen sind drin.\n")
    committen_und_pushen(addon, uebernommen)


if __name__ == "__main__":
    main()
