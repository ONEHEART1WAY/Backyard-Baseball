import { store } from '../core/Store.js';

export class PlayerManager {
    constructor(container) {
        this.container = container;
        this.unsubscribes = [];
        
        this.render();
        this.unsubscribes.push(store.subscribe('playersUpdated', () => this.renderList()));
        this.unsubscribes.push(store.subscribe('teamsUpdated', () => this.renderList()));
        this.unsubscribes.push(store.subscribe('rostersUpdated', () => this.renderList()));
    }

    render() {
        this.container.innerHTML = `
            <div class="split-view">
                <div class="list-panel">
                    <div class="list-header">
                        <h3>Roster</h3>
                    </div>
                    <ul class="item-list" id="player-list"></ul>
                </div>

                <div class="form-panel">
                    <h3>Add New Player</h3>
                    <form id="player-form" style="margin-top: 20px;">
                        <div class="flex-row">
                            <div class="form-group" style="flex: 2;">
                                <label>First Name</label>
                                <input type="text" id="player-first" class="form-control" required>
                            </div>
                            <div class="form-group" style="flex: 2;">
                                <label>Last Name</label>
                                <input type="text" id="player-last" class="form-control" required>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Number</label>
                                <input type="number" id="player-number" class="form-control" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Assign to Team</label>
                            <select id="player-team" class="form-control">
                                <option value="">-- Free Agent --</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">Save Player</button>
                    </form>
                </div>
            </div>
        `;

        this.populateTeamDropdown();
        this.renderList();
        this.attachEventListeners();
    }

    populateTeamDropdown() {
        const select = this.container.querySelector('#player-team');
        const teams = store.getTeams();
        const options = teams.map(t => `<option value="${t.id}">${t.city} ${t.nickname}</option>`).join('');
        select.innerHTML += options;
    }

    renderList() {
        const listEl = this.container.querySelector('#player-list');
        const players = store.getPlayers();
        
        if (players.length === 0) {
            listEl.innerHTML = `<div class="empty-state">No players found.</div>`;
            return;
        }

        listEl.innerHTML = players.map(player => {
            const team = store.getPlayerCurrentTeam(player.id);
            const teamBadge = team ? `<span class="badge" style="background:${team.primaryColor}; color:${team.secondaryColor}">${team.nickname}</span>` : `<span class="badge">Free Agent</span>`;
            
            return `
                <li>
                    <div>
                        <strong>#${player.number} ${player.firstName} ${player.lastName}</strong>
                        <div style="margin-top: 4px;">${teamBadge}</div>
                    </div>
                    <button class="btn btn-sm btn-danger btn-delete-player" data-id="${player.id}">Delete</button>
                </li>
            `;
        }).join('');

        // Attach Delete Listeners
        listEl.querySelectorAll('.btn-delete-player').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm("Are you sure you want to delete this player?")) {
                    store.deletePlayer(e.currentTarget.dataset.id);
                }
            });
        });
    }

    attachEventListeners() {
        const form = this.container.querySelector('#player-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const playerData = {
                firstName: this.container.querySelector('#player-first').value,
                lastName: this.container.querySelector('#player-last').value,
                number: this.container.querySelector('#player-number').value
            };
            
            store.savePlayer(playerData);
            
            // Handle roster assignment
            const newPlayer = store.getPlayers().find(p => p.firstName === playerData.firstName && p.lastName === playerData.lastName);
            const teamId = this.container.querySelector('#player-team').value;
            if (teamId) {
                store.assignPlayerToTeam(newPlayer.id, teamId);
            }

            form.reset();
        });
    }

    destroy() {
        this.unsubscribes.forEach(unsub => unsub());
    }
}
