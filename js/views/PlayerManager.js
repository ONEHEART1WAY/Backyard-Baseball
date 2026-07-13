import { store } from '../core/Store.js';

export class PlayerManager {
    constructor(container) {
        this.container = container;
        this.currentEditId = null;
        this.render();
        
        // Bind to store updates
        store.subscribe('playersUpdated', () => this.renderList());
        store.subscribe('teamsUpdated', () => this.populateTeamDropdown());
    }

    render() {
        this.container.innerHTML = `
            <div class="split-view">
                <!-- Left Panel: Player List -->
                <div class="list-panel">
                    <div class="list-header">
                        <h3>Roster Pool</h3>
                        <button class="btn btn-primary" id="btn-new-player">+ New</button>
                    </div>
                    <ul class="item-list" id="player-list"></ul>
                </div>

                <!-- Right Panel: Editor Form -->
                <div class="form-panel" id="player-editor">
                    <h3>Edit Player</h3>
                    <form id="player-form" style="margin-top: 20px;">
                        <input type="hidden" id="player-id">
                        
                        <div class="flex-row">
                            <div class="form-group" style="flex: 1;">
                                <label>First Name</label>
                                <input type="text" id="player-first" class="form-control" required>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Last Name</label>
                                <input type="text" id="player-last" class="form-control" required>
                            </div>
                        </div>

                        <div class="flex-row">
                            <div class="form-group" style="flex: 1;">
                                <label>Uniform Number</label>
                                <input type="number" id="player-number" class="form-control" min="0" max="99">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Current Team</label>
                                <select id="player-team" class="form-control">
                                    <option value="">-- Free Agent --</option>
                                    <!-- Team options injected here -->
                                </select>
                            </div>
                        </div>

                        <div class="flex-row">
                            <div class="form-group" style="flex: 1;">
                                <label>Bats</label>
                                <select id="player-bats" class="form-control">
                                    <option value="R">Right</option>
                                    <option value="L">Left</option>
                                    <option value="S">Switch</option>
                                </select>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Throws</label>
                                <select id="player-throws" class="form-control">
                                    <option value="R">Right</option>
                                    <option value="L">Left</option>
                                </select>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Primary Position</label>
                                <select id="player-position" class="form-control">
                                    <option value="P">Pitcher (P)</option>
                                    <option value="C">Catcher (C)</option>
                                    <option value="1B">First Base (1B)</option>
                                    <option value="2B">Second Base (2B)</option>
                                    <option value="3B">Third Base (3B)</option>
                                    <option value="SS">Shortstop (SS)</option>
                                    <option value="LF">Left Field (LF)</option>
                                    <option value="CF">Center Field (CF)</option>
                                    <option value="RF">Right Field (RF)</option>
                                    <option value="DH">Designated Hitter (DH)</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex-row" style="margin-top: 30px;">
                            <button type="submit" class="btn btn-primary">Save Player</button>
                            <button type="button" class="btn btn-danger" id="btn-delete-player" style="display: none;">Delete</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.populateTeamDropdown();
        this.renderList();
    }

    populateTeamDropdown() {
        const teamSelect = this.container.querySelector('#player-team');
        const teams = store.getTeams();
        
        // Keep the first "Free Agent" option, remove the rest
        teamSelect.innerHTML = '<option value="">-- Free Agent --</option>';
        
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = `${team.city} ${team.nickname}`;
            teamSelect.appendChild(option);
        });
    }

    renderList() {
        const listEl = this.container.querySelector('#player-list');
        const players = store.getPlayers();
        
        if (players.length === 0) {
            listEl.innerHTML = `<div class="empty-state">No players created yet.</div>`;
            return;
        }

        // Sort players alphabetically by last name
        const sortedPlayers = [...players].sort((a, b) => a.lastName.localeCompare(b.lastName));

        listEl.innerHTML = sortedPlayers.map(player => {
            const currentTeam = store.getPlayerCurrentTeam(player.id);
            const teamBadge = currentTeam ? `<span style="font-size: 0.8em; color: var(--text-muted); float: right;">${currentTeam.nickname}</span>` : '';
            
            return `
                <li data-id="${player.id}">
                    <strong>#${player.number || '-'} ${player.lastName}, ${player.firstName}</strong>
                    ${teamBadge}
                </li>
            `;
        }).join('');

        listEl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', (e) => this.loadPlayerIntoForm(e.currentTarget.dataset.id));
        });
    }

    attachEventListeners() {
        const form = this.container.querySelector('#player-form');
        const newBtn = this.container.querySelector('#btn-new-player');
        const deleteBtn = this.container.querySelector('#btn-delete-player');

        newBtn.addEventListener('click', () => this.clearForm());

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const playerId = this.container.querySelector('#player-id').value || null;
            
            const playerData = {
                id: playerId,
                firstName: this.container.querySelector('#player-first').value,
                lastName: this.container.querySelector('#player-last').value,
                number: this.container.querySelector('#player-number').value,
                bats: this.container.querySelector('#player-bats').value,
                throws: this.container.querySelector('#player-throws').value,
                primaryPosition: this.container.querySelector('#player-position').value
            };
            
            // Save the player entity
            store.savePlayer(playerData);

            // Handle the roster assignment relation
            const targetTeamId = this.container.querySelector('#player-team').value;
            
            // We have to grab the newly generated ID if this was a new player
            const savedId = playerId || store.getPlayers()[store.getPlayers().length - 1].id;
            store.assignPlayerToTeam(savedId, targetTeamId || null);

            this.clearForm();
        });

        deleteBtn.addEventListener('click', () => {
            if (this.currentEditId && confirm('Are you sure you want to delete this player?')) {
                store.deletePlayer(this.currentEditId);
                this.clearForm();
            }
        });
    }

    loadPlayerIntoForm(id) {
        const player = store.getPlayerById(id);
        if (!player) return;

        this.currentEditId = player.id;
        this.container.querySelector('#player-id').value = player.id;
        this.container.querySelector('#player-first').value = player.firstName;
        this.container.querySelector('#player-last').value = player.lastName;
        this.container.querySelector('#player-number').value = player.number || '';
        this.container.querySelector('#player-bats').value = player.bats || 'R';
        this.container.querySelector('#player-throws').value = player.throws || 'R';
        this.container.querySelector('#player-position').value = player.primaryPosition || 'P';
        
        const currentTeam = store.getPlayerCurrentTeam(player.id);
        this.container.querySelector('#player-team').value = currentTeam ? currentTeam.id : '';
        
        this.container.querySelector('#btn-delete-player').style.display = 'block';
    }

    clearForm() {
        this.currentEditId = null;
        this.container.querySelector('#player-form').reset();
        this.container.querySelector('#player-id').value = '';
        this.container.querySelector('#btn-delete-player').style.display = 'none';
        
        // Reset dropdowns to defaults
        this.container.querySelector('#player-team').value = '';
        this.container.querySelector('#player-bats').value = 'R';
        this.container.querySelector('#player-throws').value = 'R';
        this.container.querySelector('#player-position').value = 'P';
    }
}
