import { store } from '../core/Store.js';

export class Dashboard {
    constructor(container) {
        this.container = container;
        this.render();
        store.subscribe('teamsUpdated', () => this.render());
        store.subscribe('playersUpdated', () => this.render());
    }

    render() {
        const teamCount = store.getTeams().length;
        const playerCount = store.getPlayers().length;

        this.container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                <div class="form-panel" style="text-align: center;">
                    <h2 style="font-size: 3rem; color: var(--accent-primary);">${teamCount}</h2>
                    <p style="color: var(--text-muted); margin-top: 8px;">Active Teams</p>
                </div>
                <div class="form-panel" style="text-align: center;">
                    <h2 style="font-size: 3rem; color: var(--accent-primary);">${playerCount}</h2>
                    <p style="color: var(--text-muted); margin-top: 8px;">Active Players</p>
                </div>
            </div>
            <div class="form-panel" style="margin-top: 24px;">
                <h3>System Status</h3>
                <p style="color: var(--text-muted); margin-top: 12px;">Storage Engine: Active</p>
                <p style="color: var(--text-muted);">Event Bus: Active</p>
            </div>
        `;
    }
}
