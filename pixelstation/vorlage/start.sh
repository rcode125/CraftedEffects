#!/usr/bin/env bash
# Pixelstation – auf dem Raspberry Pi 5 ausführen (komplett offline).
# Öffnet jede Textur aus texturen/ nacheinander in Blockbench.
# Pixeln, Strg+S drücken, Fenster schließen -> die nächste Textur öffnet sich.
#
#   bash start.sh         macht dort weiter, wo du aufgehört hast
#   bash start.sh neu     fängt wieder bei der ersten Textur an
#   bash start.sh relic_fire   öffnet nur diese eine Textur

set -u
HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEXTUREN="$HIER/texturen"
FORTSCHRITT="$HIER/.fortschritt"
PAKET="$HIER/programm/blockbench-linux-arm64.tar.gz"
VERSION="$(cat "$HIER/programm/VERSION" 2>/dev/null || echo unbekannt)"
# Programme von einem USB-Stick (FAT32) dürfen oft nicht starten,
# deshalb wird Blockbench einmalig ins Home-Verzeichnis entpackt.
INSTALL="$HOME/.local/share/pixelstation/blockbench-$VERSION"
EINSTELLUNGEN="$HOME/.local/share/pixelstation/einstellungen"

if [ "$(uname -m)" != "aarch64" ]; then
    echo "Hinweis: Dieses Blockbench ist für den Raspberry Pi (ARM64) gebaut, dieser Rechner ist $(uname -m)."
    echo "Am PC bitte stattdessen zurueck_ins_addon.py ausführen."
    exit 1
fi

if [ ! -x "$INSTALL/blockbench" ]; then
    echo "Erster Start: Blockbench $VERSION wird eingerichtet (dauert etwa eine Minute) ..."
    rm -rf "$INSTALL.tmp"
    mkdir -p "$INSTALL.tmp"
    if ! tar -xzf "$PAKET" -C "$INSTALL.tmp"; then
        echo "Fehler: $PAKET konnte nicht entpackt werden."
        exit 1
    fi
    rm -rf "$INSTALL"
    mv "$INSTALL.tmp" "$INSTALL"
    echo "Fertig."
fi
mkdir -p "$EINSTELLUNGEN"

if [ "${1:-}" = "neu" ]; then
    rm -f "$FORTSCHRITT"
    shift
fi
touch "$FORTSCHRITT"

if [ -n "${1:-}" ]; then
    LISTE=("$TEXTUREN/${1%.png}.png")
else
    mapfile -t LISTE < <(ls "$TEXTUREN"/*.png | sort)
fi

pruefsumme() { md5sum "$1" | cut -d' ' -f1; }

GESAMT=${#LISTE[@]}
NUMMER=0
for DATEI in "${LISTE[@]}"; do
    NUMMER=$((NUMMER + 1))
    NAME="$(basename "$DATEI" .png)"
    if [ ! -f "$DATEI" ]; then
        echo "Nicht gefunden: $DATEI"
        continue
    fi
    if [ $# -eq 0 ] && grep -qx "$NAME" "$FORTSCHRITT"; then
        continue
    fi

    echo
    echo "[$NUMMER/$GESAMT] $NAME  –  pixeln, Strg+S, Fenster schließen"
    VORHER="$(pruefsumme "$DATEI")"
    START=$(date +%s)
    # --userData: eigene Einstellungen, läuft unabhängig von anderen Blockbench-Fenstern.
    # Die Datei muss das letzte Argument sein.
    "$INSTALL/blockbench" --no-sandbox --ozone-platform-hint=auto \
        --userData "$EINSTELLUNGEN" "$DATEI" >>"$HIER/.blockbench.log" 2>&1
    DAUER=$(( $(date +%s) - START ))

    if [ "$(pruefsumme "$DATEI")" != "$VORHER" ]; then
        echo "   ✔ gespeichert"
    elif [ "$DAUER" -lt 4 ]; then
        echo "   ✘ Blockbench hat sich sofort wieder beendet. Details: $HIER/.blockbench.log"
        echo "     Siehe LIESMICH.txt, Abschnitt \"Blockbench startet nicht\"."
        exit 1
    else
        echo "   – nicht geändert (ohne Strg+S geschlossen)"
    fi
    echo "$NAME" >>"$FORTSCHRITT"
done

echo
echo "Alle Texturen sind durch. Ordner auf den PC kopieren und dort ausführen:"
echo "   python3 zurueck_ins_addon.py"
echo "(Noch eine Runde von vorn: bash start.sh neu)"
