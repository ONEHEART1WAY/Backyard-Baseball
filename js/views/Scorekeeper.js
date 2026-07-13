import { store } from '../core/Store.js';
import { BaseballEngine } from '../core/BaseballEngine.js';

export class Scorekeeper {
    constructor(container, gameId) {
        this.container = container;
        this.gameId = gameId;
        this.game = store.getGameById(gameId);
        this.unsubscribes = [];
        
        this.render();
        this.updateBoard();

        // Listen ONLY to events for this specific game
        this.unsubscribes.push(store.subscribe(`gameEventAdded_${this.gameId}`, () => {
            this.updateBoard();
        }));
    }

    render() {
        const awayTeam = store.getTeamById(this.game.awayTeamId);
        const homeTeam = store.getTeamById(this.game.homeTeamId);

        this.container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <!-- SCOREBOARD -->
                <div class="scoreboard">
                    <div class="score-team">
                        <h3>${awayTeam ? awayTeam.nickname : 'Away'}</h3>
                        <div class="score-number" id="away-score">0</div>
                    </div>
                    <div class="score-center">
                        <div class="inning-display" id="inning-text">Top 1</div>
                        <div class="count-outs-display">
                            <span id="count-text">0-0</span>
                            <span id="outs-text">0 Outs</span>
                        </div>
                        <div class="bases-display">
                            <div class="base base-1" id="base-1"></div>
                            <div class="base base-2" id="base-2"></div>
                            <div class="base base-3" id="base-3"></div>
                        </div>
                    </div>
                    <div class="score-team">
                        <h3>${homeTeam ? homeTeam.nickname : 'Home'}</h3>
                        <div class="score-number" id="home-score">0</div>
                    </div>
                </div>

                <!-- CONTROLS -->
                <div class="scoring-grid">
                    <button class="btn-score btn-pitch" data-type="pitch" data-detail="ball">Ball</button>
                    <button class="btn-score btn-pitch" data-type="pitch" data-detail="strike">Strike</button>
                    <button class="btn-score btn-pitch" data-type="pitch" data-detail="foul">Foul</button>
                    <button class="btn-score btn-hit" data-type="play" data-detail="single">Single</button>
                    <button class="btn-score btn-out" data-type="play" data-detail="out">Out</button>
                    <button class="btn-score btn-undo" id="btn-undo">Undo Last</button>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    updateBoard() {
        // 1. Get all events
        const events = store.getEventsForGame(this.gameId);
        // 2. Calculate State via Engine
        const state = BaseballEngine.calculateState(events);

        // 3. Update DOM
        this.container.querySelector('#away-score').textContent = state.awayScore;
        this.container.querySelector('#home-score').textContent = state.homeScore;
        this.container.querySelector('#inning-text').textContent = `${state.half} ${state.inning}`;
        this.container.querySelector('#count-text').textContent = `${state.balls}-${state.strikes}`;
        this.container.querySelector('#outs-text').textContent = `${state.outs} Outs`;

        // Update Bases
        this.container.querySelector('#base-1').classList.toggle('occupied', state.bases[1]);
        this.container.querySelector('#base-2').classList.toggle('occupied', state.bases[2]);
        this.container.querySelector('#base-3').classList.toggle('occupied', state.bases[3]);
    }

    attachEventListeners() {
        this.container.querySelectorAll('.btn-score').forEach(btn => {
            if(btn.id === 'btn-undo') return; // Handled separately
            
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                const detail = e.currentTarget.dataset.detail;
                store.addGameEvent(this.gameId, type, detail);
            });
        });

        this.container.querySelector('#btn-undo').addEventListener('click', () => {
            store.undoLastGameEvent(this.gameId);
        });
    }

    destroy() {
        this.unsubscribes.forEach(unsub => unsub());
    }
}
