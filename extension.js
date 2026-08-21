import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const POLL_INTERVAL_SECONDS = 10;
const SCRIPT_PATH = `${GLib.get_home_dir()}/.local/bin/net-profile`;

function runScriptAsync(args) {
    return new Promise((resolve, reject) => {
        try {
            const argv = [SCRIPT_PATH, ...args];
            const proc = new Gio.Subprocess({
                argv: argv,
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });
            proc.init(null);
            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    if (proc.get_successful()) {
                        resolve(stdout ? stdout.trim() : '');
                    } else {
                        reject(new Error(stderr || `Command failed: ${proc.get_exit_status()}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

const NetProfileIndicator = GObject.registerClass(
class NetProfileIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Network Profile Switcher');

        this._busy = false;

        // Top Panel Layout (Icon + Label)
        const panelBox = new St.BoxLayout({
            style_class: 'net-panel-box'
        });

        this._panelIcon = new St.Icon({
            icon_name: 'network-workgroup-symbolic',
            style_class: 'system-status-icon'
        });
        panelBox.add_child(this._panelIcon);

        this._panelLabel = new St.Label({
            text: 'Net: ...',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'net-panel-label'
        });
        panelBox.add_child(this._panelLabel);

        this.add_child(panelBox);

        this._buildMenu();
        this._startPolling();
        this._refreshStatus();
    }

    _buildMenu() {
        // Status Container
        const container = new St.BoxLayout({
            vertical: true,
            style_class: 'net-menu-container'
        });

        // Header Row
        const headerRow = new St.BoxLayout({
            vertical: false,
            style_class: 'net-detail-row'
        });
        this._headerTitle = new St.Label({
            text: 'Active Profile',
            style_class: 'net-header-title',
            x_expand: true
        });
        this._headerBadge = new St.Label({
            text: 'Checking...',
            style_class: 'net-status-badge'
        });
        headerRow.add_child(this._headerTitle);
        headerRow.add_child(this._headerBadge);
        container.add_child(headerRow);

        // Details Box
        const detailsBox = new St.BoxLayout({
            vertical: true,
            style_class: 'net-details-box'
        });

        this._lblGateway = new St.Label({ text: 'Gateway: ...', style_class: 'net-detail-val' });
        this._lblDNS = new St.Label({ text: 'DNS: ...', style_class: 'net-detail-val' });
        this._lblNord = new St.Label({ text: 'NordVPN: ...', style_class: 'net-detail-val' });
        this._lblTailscale = new St.Label({ text: 'Tailscale: ...', style_class: 'net-detail-val' });
        this._lblTimezone = new St.Label({ text: 'Timezone: ...', style_class: 'net-detail-val' });

        detailsBox.add_child(this._lblGateway);
        detailsBox.add_child(this._lblDNS);
        detailsBox.add_child(this._lblNord);
        detailsBox.add_child(this._lblTailscale);
        detailsBox.add_child(this._lblTimezone);
        container.add_child(detailsBox);

        const customMenuItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false
        });
        customMenuItem.add_child(container);
        this.menu.addMenuItem(customMenuItem);

        // Separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Switch Profiles Section Header
        const switchSectionHeader = new PopupMenu.PopupMenuItem(_('Switch Network Profile'), {
            reactive: false,
            can_focus: false,
            style_class: 'net-section-title'
        });
        this.menu.addMenuItem(switchSectionHeader);

        // 1. Estonia Profile
        const itemEE = new PopupMenu.PopupImageMenuItem(
            _('🇪🇪 Estonia VPN (Route .1 + VPN + EET)'),
            'network-vpn-symbolic'
        );
        itemEE.connect('activate', () => this._switchProfile('estonia'));
        this.menu.addMenuItem(itemEE);

        // 2. Finland Profile
        const itemFI = new PopupMenu.PopupImageMenuItem(
            _('🇫🇮 Finland VPN (Route .1 + VPN + EET)'),
            'network-vpn-symbolic'
        );
        itemFI.connect('activate', () => this._switchProfile('finland'));
        this.menu.addMenuItem(itemFI);

        // 3. Route .1 + Tailscale
        const itemRoute1TS = new PopupMenu.PopupImageMenuItem(
            _('⚡ Direct Route .1 + Tailscale (No VPN)'),
            'network-wireless-symbolic'
        );
        itemRoute1TS.connect('activate', () => this._switchProfile('direct-ts'));
        this.menu.addMenuItem(itemRoute1TS);

        // 4. Route .1 No VPN (Clean)
        const itemRoute1Clean = new PopupMenu.PopupImageMenuItem(
            _('⚡ Direct Route .1 Clean (No VPN, No TS)'),
            'network-wireless-symbolic'
        );
        itemRoute1Clean.connect('activate', () => this._switchProfile('direct-novpn'));
        this.menu.addMenuItem(itemRoute1Clean);

        // 5. Local .100 (Repeater Hop)
        const itemLocal = new PopupMenu.PopupImageMenuItem(
            _('🏠 Local Route .100 (Repeater + Tailscale)'),
            'network-workgroup-symbolic'
        );
        itemLocal.connect('activate', () => this._switchProfile('local'));
        this.menu.addMenuItem(itemLocal);

        // Separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Browser Launch Section Header
        const browserSectionHeader = new PopupMenu.PopupMenuItem(_('Launch Chrome in Timezone'), {
            reactive: false,
            can_focus: false,
            style_class: 'net-section-title'
        });
        this.menu.addMenuItem(browserSectionHeader);

        // Launch Chrome EE
        const itemChromeEE = new PopupMenu.PopupImageMenuItem(
            _('Launch Chrome (Europe/Tallinn)'),
            'web-browser-symbolic'
        );
        itemChromeEE.connect('activate', () => {
            runScriptAsync(['chrome', '--tz', 'Europe/Tallinn']).catch(console.error);
        });
        this.menu.addMenuItem(itemChromeEE);

        // Launch Chrome FI
        const itemChromeFI = new PopupMenu.PopupImageMenuItem(
            _('Launch Chrome (Europe/Helsinki)'),
            'web-browser-symbolic'
        );
        itemChromeFI.connect('activate', () => {
            runScriptAsync(['chrome', '--tz', 'Europe/Helsinki']).catch(console.error);
        });
        this.menu.addMenuItem(itemChromeFI);

        // Launch Chrome Local
        const itemChromeLocal = new PopupMenu.PopupImageMenuItem(
            _('Launch Chrome (Asia/Jakarta)'),
            'web-browser-symbolic'
        );
        itemChromeLocal.connect('activate', () => {
            runScriptAsync(['chrome', '--tz', 'Asia/Jakarta']).catch(console.error);
        });
        this.menu.addMenuItem(itemChromeLocal);

        // Separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Refresh action
        const refreshItem = new PopupMenu.PopupImageMenuItem(
            _('Refresh Status'),
            'view-refresh-symbolic'
        );
        refreshItem.connect('activate', () => this._refreshStatus());
        this.menu.addMenuItem(refreshItem);
    }

    _startPolling() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }
        this._timeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            POLL_INTERVAL_SECONDS,
            () => {
                if (!this._busy) {
                    this._refreshStatus();
                }
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    async _switchProfile(target) {
        this._busy = true;
        this._panelLabel.set_text(`Switching...`);
        this._headerBadge.set_text('Switching...');
        try {
            const raw = await runScriptAsync([target, '--json']);
            const data = JSON.parse(raw);
            this._updateUI(data);
        } catch (e) {
            console.error(`[NetProfile] Failed to switch profile: ${e}`);
            this._panelLabel.set_text('Error switching');
            this._headerBadge.set_text('Error');
        } finally {
            this._busy = false;
        }
    }

    async _refreshStatus() {
        try {
            const raw = await runScriptAsync(['status', '--json']);
            const data = JSON.parse(raw);
            this._updateUI(data);
        } catch (e) {
            console.error(`[NetProfile] Failed to fetch status: ${e}`);
            this._panelLabel.set_text('Net: Unknown');
        }
    }

    _updateUI(data) {
        if (!data) return;

        // Update Panel
        this._panelLabel.set_text(data.short_label || data.label || 'Unknown');
        if (data.icon) {
            this._panelIcon.set_icon_name(data.icon);
        }

        // Update Menu
        this._headerBadge.set_text(data.label || 'Unknown');
        this._lblGateway.set_text(`Gateway:   ${data.route_gateway || 'Unknown'}`);
        this._lblDNS.set_text(`DNS:       ${data.dns || 'Unknown'}`);
        this._lblNord.set_text(`NordVPN:   ${data.nordvpn_status} ${data.nordvpn_server ? `(${data.nordvpn_server})` : ''}`);
        this._lblTailscale.set_text(`Tailscale: ${data.tailscale_up ? 'Connected' : 'Stopped'}`);
        this._lblTimezone.set_text(`Timezone:  ${data.timezone || 'Unknown'}`);
    }

    destroy() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }
        super.destroy();
    }
});

export default class NetProfileExtension extends Extension {
    enable() {
        this._indicator = new NetProfileIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator, 1, 'right');
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
