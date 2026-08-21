# Network Profile Switcher (GNOME Shell Extension & CLI)

GNOME Shell top-bar extension and CLI tool for instant switching and live monitoring of network profiles, routing gateways, DNS servers, and Tailscale on Fedora Linux.

---

## Features

- **Top Bar Status Indicator**: Displays live active profile (`🏠 Local`, `🇪🇪 EE`, `🇫🇮 FI`, `⚡ .1 + TS`, `⚡ .1 Clean`) with dedicated icons and live polling.
- **One-Click Profile Switching**:
  - **🇪🇪 Estonia VPN**: Direct fiber gateway (`192.168.123.1`), Tailscale down, NordVPN to Estonia, and timezone `Europe/Tallinn` (EET/EEST).
  - **🇫🇮 Finland VPN**: Direct fiber gateway (`192.168.123.1`), Tailscale down, NordVPN to Finland, and timezone `Europe/Helsinki` (EET/EEST).
  - **⚡ Direct Route .1 + Tailscale**: Direct fiber gateway (`192.168.123.1`), NordVPN disconnected, Tailscale up, timezone `Asia/Jakarta` (WIB).
  - **⚡ Direct Route .1 Clean**: Direct fiber gateway (`192.168.123.1`), NordVPN disconnected, Tailscale down, timezone `Asia/Jakarta` (WIB).
  - **🏠 Local Route .100**: Repeater gateway (`192.168.123.100`), NordVPN disconnected, Tailscale up, timezone `Asia/Jakarta` (WIB).
- **Live Diagnostics Dropdown**:
  - Active Profile Badge
  - Default Gateway (`192.168.123.1` direct vs `192.168.123.100` repeater)
  - DNS Server Addresses (queried via `resolvectl dns`)
  - NordVPN Status and Server IP
  - Tailscale Status (Connected vs Stopped)
  - System Timezone
- **One-Click Browser Launchers**: Launch Google Chrome Flatpak with matching environment timezone (`TZ=Europe/Tallinn`, `TZ=Europe/Helsinki`, or `Asia/Jakarta`).
- **Asynchronous & Non-Blocking**: Runs all network operations in background sub-processes without freezing the GNOME Shell UI.
- **CLI Backend (`net-profile`)**: Fully operable via command line or scripts.

---

## CLI Usage

The backend tool [`~/.local/bin/net-profile`](file:///home/etu/.local/bin/net-profile) is directly available in your terminal:

```fish
# Check status (text or JSON)
net-profile status
net-profile status --json

# Switch profiles
net-profile estonia        # 🇪🇪 Route .1 + NordVPN + EET
net-profile finland        # 🇫🇮 Route .1 + NordVPN + EET
net-profile direct-ts      # ⚡ Route .1 + Tailscale (No VPN)
net-profile direct-novpn   # ⚡ Route .1 Clean (No VPN, No TS)
net-profile local          # 🏠 Route .100 + Tailscale (Repeater)

# Launch Chrome in Estonian timezone
net-profile chrome --tz Europe/Tallinn
```

---

## Installation & Updates

```bash
cd ~/git/net-profile-switcher
make install
```
