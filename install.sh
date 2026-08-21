#!/bin/bash
set -e

UUID="net-profile-switcher@etu"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
BIN_DIR="$HOME/.local/bin"

echo "Installing Network Profile Switcher CLI..."
mkdir -p "$BIN_DIR"
cp net-profile "$BIN_DIR/net-profile"
chmod +x "$BIN_DIR/net-profile"

echo "Installing GNOME Shell Extension to $TARGET_DIR..."
mkdir -p "$TARGET_DIR"
cp metadata.json "$TARGET_DIR/"
cp extension.js "$TARGET_DIR/"
cp stylesheet.css "$TARGET_DIR/"

echo "Ensuring extension is added to gsettings enabled-extensions..."
EXTENSIONS=$(gsettings get org.gnome.shell enabled-extensions)
if [[ ! "$EXTENSIONS" =~ "$UUID" ]]; then
    NEW_EXTENSIONS=$(echo "$EXTENSIONS" | sed "s/]/, '$UUID']/")
    gsettings set org.gnome.shell enabled-extensions "$NEW_EXTENSIONS"
fi

echo "Installation complete!"
echo "Note: Under Wayland, log out and log back in (or restart session) to load the new GNOME extension into the top bar."
