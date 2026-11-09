#!/usr/bin/env python3
"""Stellt den Pixelstation-Ordner für den Raspberry Pi 5 zusammen (am PC, mit Internet).

    python3 pixelstation/vorbereiten.py [ZIELORDNER]     # Standard: ~/Pixelstation

Blockbench gibt es offiziell nicht für Linux auf ARM64. Der Programmcode von Blockbench
(resources/app.asar) ist aber reines JavaScript ohne native Module. Dieses Skript nimmt
ihn aus dem offiziellen Linux-Paket und kombiniert ihn mit der offiziellen Electron-Laufzeit
für ARM64 in genau der Version, mit der Blockbench gebaut wurde. Beide Downloads werden
per Prüfsumme kontrolliert. Es wird kein heruntergeladener Code ausgeführt.
"""

import base64
import hashlib
import io
import lzma
import re
import shutil
import sys
import tarfile
import urllib.request
import zipfile
from pathlib import Path

BLOCKBENCH_VERSION = "5.2.2"
BLOCKBENCH_DEB = f"Blockbench_{BLOCKBENCH_VERSION}.deb"
BLOCKBENCH_URL = f"https://github.com/JannisX11/blockbench/releases/download/v{BLOCKBENCH_VERSION}/{BLOCKBENCH_DEB}"
# sha512 aus latest-linux.yml des Releases
BLOCKBENCH_SHA512 = "SCeg4Ieolbo4fibeJvNMzROTowF5mWP1zvTBMBcIcFiJLJUEET/hii6iFxFWvVs170wRUipiDUIk607RK4M5dQ=="

ELECTRON_VERSION = "43.4.0"  # steht so im offiziellen Blockbench-5.2.2-Programm
ELECTRON_ZIP = f"electron-v{ELECTRON_VERSION}-linux-arm64.zip"
ELECTRON_URL = f"https://github.com/electron/electron/releases/download/v{ELECTRON_VERSION}/{ELECTRON_ZIP}"
# sha256 aus SHASUMS256.txt des Electron-Releases
ELECTRON_SHA256 = "17021d48739857106a26dd95bf749f95b89ae924955c3c7e7ff5a3f06251ac14"

HIER = Path(__file__).resolve().parent
ADDON = HIER.parent
VORLAGE = HIER / "vorlage"
CACHE = Path.home() / ".cache" / "craftedeffects-pixelstation"


def herunterladen(url, datei, pruefen):
    if datei.is_file() and pruefen(datei.read_bytes()):
        print(f"Schon vorhanden: {datei.name}")
        return datei.read_bytes()
    print(f"Lade {datei.name} ...")
    datei.parent.mkdir(parents=True, exist_ok=True)
    teil = datei.with_suffix(datei.suffix + ".teil")
    with urllib.request.urlopen(url) as antwort, teil.open("wb") as ziel:
        shutil.copyfileobj(antwort, ziel, 1 << 20)
    daten = teil.read_bytes()
    if not pruefen(daten):
        teil.unlink()
        sys.exit(f"Prüfsumme von {datei.name} stimmt nicht – Download abgebrochen.")
    teil.replace(datei)
    return daten


def deb_datei(deb, gesucht):
    """Liest eine Datei aus einem .deb (ar-Archiv mit data.tar.xz), ohne etwas zu installieren."""
    if deb[:8] != b"!<arch>\n":
        sys.exit("Unerwartetes .deb-Format")
    pos = 8
    while pos < len(deb):
        name = deb[pos:pos + 16].decode().strip().rstrip("/")
        groesse = int(deb[pos + 48:pos + 58].decode().strip())
        inhalt = deb[pos + 60:pos + 60 + groesse]
        pos += 60 + groesse + (groesse % 2)
        if name == "data.tar.xz":
            with tarfile.open(fileobj=io.BytesIO(lzma.decompress(inhalt))) as tar:
                return {g: tar.extractfile("./" + g).read() for g in gesucht}
    sys.exit("data.tar.xz nicht im .deb gefunden")


def blockbench_paket(ziel):
    deb = herunterladen(BLOCKBENCH_URL, CACHE / BLOCKBENCH_DEB,
                        lambda d: base64.b64encode(hashlib.sha512(d).digest()).decode() == BLOCKBENCH_SHA512)
    electron = herunterladen(ELECTRON_URL, CACHE / ELECTRON_ZIP,
                             lambda d: hashlib.sha256(d).hexdigest() == ELECTRON_SHA256)

    dateien = deb_datei(deb, ["opt/Blockbench/resources/app.asar", "opt/Blockbench/blockbench"])
    gefunden = set(re.findall(rb"Electron/(\d+\.\d+\.\d+)", dateien["opt/Blockbench/blockbench"]))
    if gefunden != {ELECTRON_VERSION.encode()}:
        sys.exit(f"Blockbench nutzt Electron {gefunden}, erwartet {ELECTRON_VERSION} – Versionen anpassen.")

    print("Baue Blockbench für den Raspberry Pi (ARM64) ...")
    ziel.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(electron)) as zf, tarfile.open(ziel, "w:gz", compresslevel=6) as tar:
        for eintrag in zf.infolist():
            if eintrag.is_dir() or eintrag.filename == "resources/default_app.asar":
                continue
            name = "blockbench" if eintrag.filename == "electron" else eintrag.filename
            info = tarfile.TarInfo(name)
            daten = zf.read(eintrag)
            info.size = len(daten)
            modus = (eintrag.external_attr >> 16) & 0o777
            info.mode = modus or (0o755 if name in ("blockbench", "chrome_crashpad_handler", "chrome-sandbox") else 0o644)
            tar.addfile(info, io.BytesIO(daten))
        # Absichtlich ohne app-update.yml: Der Auto-Updater würde sonst x64-Pakete anbieten.
        asar = dateien["opt/Blockbench/resources/app.asar"]
        info = tarfile.TarInfo("resources/app.asar")
        info.size, info.mode = len(asar), 0o644
        tar.addfile(info, io.BytesIO(asar))


def aktuelle_texturen():
    """Die Texturen, die gerade im Add-on stecken (handgepixelte haben Vorrang)."""
    texturen = {p.name: p for p in sorted((ADDON / "resource_pack" / "textures" / "items").glob("*.png"))}
    for p in (ADDON / "art" / "items").glob("*.png"):
        if p.name in texturen:
            texturen[p.name] = p
    return texturen


def main():
    ziel = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else Path.home() / "Pixelstation"
    programm = ziel / "programm"
    paket = programm / "blockbench-linux-arm64.tar.gz"
    version_datei = programm / "VERSION"
    version = f"{BLOCKBENCH_VERSION}-electron{ELECTRON_VERSION}"
    if not (paket.is_file() and version_datei.is_file() and version_datei.read_text().strip() == version):
        blockbench_paket(paket)
        version_datei.write_text(version + "\n")

    for datei in (p for p in VORLAGE.iterdir() if p.is_file()):
        shutil.copyfile(datei, ziel / datei.name)
    (ziel / "start.sh").chmod(0o755)
    (ziel / "zurueck_ins_addon.py").chmod(0o755)
    (ziel / "addon_pfad.txt").write_text(str(ADDON) + "\n", encoding="utf-8")

    texturen = ziel / "texturen"
    original = programm / "original"
    texturen.mkdir(exist_ok=True)
    original.mkdir(exist_ok=True)
    neu = []
    for name, quelle in aktuelle_texturen().items():
        if (texturen / name).exists():
            continue  # schon da – eventuell schon bearbeitet, nicht überschreiben
        shutil.copyfile(quelle, texturen / name)
        shutil.copyfile(quelle, original / name)
        neu.append(name)

    groesse = sum(p.stat().st_size for p in ziel.rglob("*") if p.is_file()) / 1e6
    print(f"\nPixelstation bereit: {ziel}  ({groesse:.0f} MB)")
    print(f"Texturen: {len(list(texturen.glob('*.png')))}" + (f" (neu: {len(neu)})" if neu else ""))
    print("Diesen Ordner auf den Raspberry Pi 5 kopieren und dort 'bash start.sh' ausführen.")


if __name__ == "__main__":
    main()
