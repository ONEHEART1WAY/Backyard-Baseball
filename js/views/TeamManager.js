import { store } from '../core/Store.js';

export class TeamManager {
    constructor(container) {
        this.container = container;
        this.unsubscribes = [];
        this.currentLogoBase64 = null; // Holds the image string
        
        this.render();
        this.unsubscribes.push(store.subscribe('teamsUpdated', () => this.renderList()));
    }

    render() {
        this.container.innerHTML = `
            <div class="split-view">
                <div class="list-panel">
                    <div class="list-header">
                        <h3>All Teams</h3>
                    </div>
                    <ul class="item-list" id="team-list"></ul>
                </div>

                <div class="form-panel">
                    <h3>Add New Team</h3>
                    <form id="team-form" style="margin-top: 20px;">
                        <div class="form-group">
                            <label>City / Location</label>
                            <input type="text" id="team-city" class="form-control" placeholder="e.g. Chicago" required>
                        </div>
                        <div class="form-group">
                            <label>Team Nickname</label>
                            <input type="text" id="team-name" class="form-control" placeholder="e.g. Cubs" required>
                        </div>
                        
                        <div class="flex-row" style="margin-bottom: 16px;">
                            <div class="form-group" style="flex: 1;">
                                <label>Primary Color</label>
                                <input type="color" id="primary-color" class="form-control" value="#1a5b92" style="padding: 4px; height: 40px;">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Secondary Color</label>
                                <input type="color" id="secondary-color" class="form-control" value="#cc3433" style="padding: 4px; height: 40px;">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Team Logo</label>
                            <div class="flex-row" style="align-items: center; gap: 16px;">
                                <img id="logo-preview" src="" class="team-logo-preview" style="display: none;">
                                <input type="file" id="team-logo" class="form-control" accept="image/*" style="flex: 1;">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">Save Team</button>
                    </form>
                </div>
            </div>
        `;

        this.renderList();
        this.attachEventListeners();
    }

    renderList() {
        const listEl = this.container.querySelector('#team-list');
        const teams = store.getTeams();
        
        if (teams.length === 0) {
            listEl.innerHTML = `<div class="empty-state">No teams found. Create one to get started.</div>`;
            return;
        }

        listEl.innerHTML = teams.map(team => `
            <li>
                <div class="team-list-info">
                    ${team.logo ? `<img src="${team.logo}" class="team-logo-preview">` : `<div class="team-logo-preview"></div>`}
                    <div>
                        <strong>${team.city} ${team.nickname}</strong>
                        <div style="margin-top: 4px;">
                            <span class="color-dot" style="background-color: ${team.primaryColor || '#000'};"></span>
                            <span class="color-dot" style="background-color: ${team.secondaryColor || '#fff'};"></span>
                        </div>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger btn-delete-team" data-id="${team.id}">Delete</button>
            </li>
        `).join('');

        // Attach Delete Listeners
        listEl.querySelectorAll('.btn-delete-team').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm("Are you sure you want to delete this team?")) {
                    store.deleteTeam(e.currentTarget.dataset.id);
                }
            });
        });
    }

    attachEventListeners() {
        const form = this.container.querySelector('#team-form');
        const logoInput = this.container.querySelector('#team-logo');
        const logoPreview = this.container.querySelector('#logo-preview');

        // Handle Image Upload -> Base64
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.currentLogoBase64 = event.target.result;
                    logoPreview.src = this.currentLogoBase64;
                    logoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            store.saveTeam({
                city: this.container.querySelector('#team-city').value,
                nickname: this.container.querySelector('#team-name').value,
                primaryColor: this.container.querySelector('#primary-color').value,
                secondaryColor: this.container.querySelector('#secondary-color').value,
                logo: this.currentLogoBase64
            });
            form.reset();
            this.currentLogoBase64 = null;
            logoPreview.style.display = 'none';
        });
    }

    destroy() {
        this.unsubscribes.forEach(unsub => unsub());
    }
}
