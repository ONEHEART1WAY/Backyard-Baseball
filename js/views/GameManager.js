import { store } from '../core/Store.js';
import { Scorekeeper } from './Scorekeeper.js';

export class GameManager {
    constructor(container, routerNavigateCallback) {
        this.container = container;
        this.unsubscribes = [];
        this.routerNavigateCallback = routerNavigateCallback; // To programmatically launch scorekeeper
        
        this.render();
        this.unsubscribes.push(store.subscribe('gamesUpdated', () => this.renderList()));
    }

    render() {
        this.container.innerHTML = `
            <div class="split-view">
                <div class="list-panel">
                    <div class="list-header">
                        <h3>Games</h3>
                        <button class="btn btn-primary" id="btn-new-game">+ New Game</button>
                    </div>
                    <ul class="item-list" id="game-list"></ul>
                </div>

                <div class="form-panel" id="game-editor">
                    <h3>Setup New Game</h3>
                    <form id="game-form" style="margin-top: 20px;">
                        <div class="flex-row">
                            <div class="form-group" style="flex: 1;">
                                <label>Away Team</label>
                                <select id="away-team" class="form-control" required></select>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Home Team</label>
                                <select id="home-team" class="form-control" required></select>
                            </div>
                        </div>
                        <div class="flex-row" style="margin-top: 30px;">
                            <button type="submit" class="btn btn-primary">Create & Score Game</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.populateTeams();
        this.renderList();
        this.attachEventListeners();
    }

    populateTeams() {
        const teams = store.getTeams();
        const options = teams.map(t => `<option value="${t.id}">${t.city} ${t.nickname}</option>`).join('');
        this.container.querySelector('#away-team').innerHTML = options;
        this.container.querySelector('#home-team').innerHTML = options;
    }

    renderList() {
        const listEl = this.container.querySelector('#game-list');
        const games = store.getGames();
        
        if (games.length === 0) {
            listEl.innerHTML = `<div class="empty-state">No games played yet.</div>`;
            return;
        }

        listEl.innerHTML = games.map(game => {
            const away = store.getTeamById(game.awayTeamId);
            const home = store.getTeamById(game.homeTeamId);
            const date = new Date(game.createdAt).toLocaleDateString();
            return `
                <li data-id="${game.id}">
                    <strong>${away ? away.nickname : 'Unknown'} @ ${home ? home.nickname : 'Unknown'}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${date}</div>
                </li>
            `;
        }).join('');

        listEl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', (e) => this.routerNavigateCallback('scorekeeper', e.currentTarget.dataset.id));
        });
    }

    attachEventListeners() {
        const form = this.container.querySelector('#game-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const gameId = store.saveGame({
                awayTeamId: this.container.querySelector('#away-team').value,
                homeTeamId: this.container.querySelector('#home-team').value
            });
            this.routerNavigateCallback('scorekeeper', gameId);
        });
    }

    destroy() {
        this.unsubscribes.forEach(unsub => unsub());
    }
}
