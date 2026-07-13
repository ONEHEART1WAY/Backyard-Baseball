import { store } from '../core/Store.js';

export class TeamManager {
    constructor(container) {
        this.container = container;
        this.currentEditId = null;
        this.unsubscribes = [];
        
        this.render();
        
        this.unsubscribes.push(store.subscribe('teamsUpdated', () => this.renderList()));
    }

    render() {
        this.container.innerHTML = `
            <div class="split-view">
                <!-- Left Panel: Team List -->
                <div class="list-panel">
                    <div class="list-header">
                        <h3>Teams</h3>
                        <button class="btn btn-primary" id="btn-new-team">+ New</button>
                    </div>
                    <ul class="item-list" id="team-list"></ul>
                </div>

                <!-- Right Panel: Editor Form -->
                <div class="form-panel" id="team-editor">
                    <h3>Edit Team</h3>
                    <form id="team-form" style="margin-top: 20px;">
                        <input type="hidden" id="team-id">
                        
                        <div class="flex-row">
                            <div class="form-group" style="flex: 1;">
                                <label>City / Location</label>
                                <input type="text" id="team-city" class="form-control" required placeholder="e.g. New York">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Nickname</label>
                                <input type="text" id="team-nickname" class="form-control" required placeholder="e.g. Yankees">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Home Field</label>
                            <input type="text" id="team-stadium" class="form-control" placeholder="Stadium Name">
                        </div>

                        <div class="flex-row" style="margin-top: 30px;">
                            <button type="submit" class="btn btn-primary">Save Team</button>
                            <button type="button" class="btn btn-danger" id="btn-delete-team" style="display: none;">Delete</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.renderList();
    }

    renderList() {
        const listEl = this.container.querySelector('#team-list');
        const teams = store.getTeams();
        
        if (teams.length === 0) {
            listEl.innerHTML = `<div class="empty-state">No teams created yet.</div>`;
            return;
        }

        listEl.innerHTML = teams.map(team => `
            <li data-id="${team.id}">
                <strong>${team.city} ${team.nickname}</strong>
            </li>
        `).join('');

        // Attach click handlers to list items
        listEl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', (e) => this.loadTeamIntoForm(e.currentTarget.dataset.id));
        });
    }

    attachEventListeners() {
        const form = this.container.querySelector('#team-form');
        const newBtn = this.container.querySelector('#btn-new-team');
        const deleteBtn = this.container.querySelector('#btn-delete-team');

        newBtn.addEventListener('click', () => this.clearForm());

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const teamData = {
                id: this.container.querySelector('#team-id').value || null,
                city: this.container.querySelector('#team-city').value,
                nickname: this.container.querySelector('#team-nickname').value,
                stadium: this.container.querySelector('#team-stadium').value
            };
            store.saveTeam(teamData);
            this.clearForm();
        });

        deleteBtn.addEventListener('click', () => {
            if (this.currentEditId && confirm('Are you sure you want to delete this team?')) {
                store.deleteTeam(this.currentEditId);
                this.clearForm();
            }
        });
    }

    loadTeamIntoForm(id) {
        const team = store.getTeamById(id);
        if (!team) return;

        this.currentEditId = team.id;
        this.container.querySelector('#team-id').value = team.id;
        this.container.querySelector('#team-city').value = team.city;
        this.container.querySelector('#team-nickname').value = team.nickname;
        this.container.querySelector('#team-stadium').value = team.stadium || '';
        
        this.container.querySelector('#btn-delete-team').style.display = 'block';
    }

    clearForm() {
        this.currentEditId = null;
        this.container.querySelector('#team-form').reset();
        this.container.querySelector('#team-id').value = '';
        this.container.querySelector('#btn-delete-team').style.display = 'none';
    }

    destroy() {
        this.unsubscribes.forEach(unsub => unsub());
    }
}
