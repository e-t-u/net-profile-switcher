# Network Profile Switcher (GNOME Shell Extension & CLI)

GNOME Shell top-bar extension and CLI tool for instant switching and live monitoring of network profiles on Fedora Linux.

---

## Features

- **Top Bar Status Indicator**: Displays live active profile (`🏠 Local`, `🇪🇪 Estonia`, `🇫🇮 Finland`, or `🛡️ VPN`) with dedicated icons.
- **One-Click Profile Switching**:
  - **Estonia Profile**: Sets default gateway via direct fiber (`192.168.123.1`), brings Tailscale down, connects NordVPN to Estonia, and syncs timezone to `Europe/Tallinn` (EET/EEST).
  - **Finland Profile**: Sets direct gateway, brings Tailscale down, connects NordVPN to Finland, and syncs timezone to `Europe/Helsinki` (EET/EEST).
  - **Local Profile**: Disconnects NordVPN, restores local repeater gateway (`192.168.123.100`), reverts timezone to `Asia/Jakarta` (WIB), and brings Tailscale up.
- **One-Click Browser Launchers**: Launch Chrome Flatpak with matching environment timezone (`TZ=Europe/Tallinn`, `TZ=Europe/Helsinki`, or `Asia/Jakarta`).
- **Live Diagnostics Dropdown**: Shows default gateway IP, NordVPN server/status, Tailscale state, and active system timezone.
- **Asynchronous & Non-Blocking**: Runs all network operations in background sub-processes without freezing the GNOME Shell UI.
- **CLI Backend (`net-profile`)**: Fully operable via command line or scripts.

---

## CLI Usage

The extension includes a standalone command-line tool installed at `~/.local/bin/net-profile`:

```fish
# Check status
net-profile status

# Switch to Estonia profile
net-profile estonia

# Switch to Finland profile
net-profile finland

# Revert to Local (Jakarta) profile
net-profile local

# Launch Chrome with Estonian timezone
net-profile chrome --tz Europe/Tallinn
```

---

## Installation & Activation

```bash
cd ~/git/net-profile-switcher
make install
```

> **Note on GNOME Shell Wayland Sessions:**
> Because GNOME Shell under Wayland indexes new extensions during session initialization, log out and log back in (or restart the session) after first installing to load the extension onto the top bar.
