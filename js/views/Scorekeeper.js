import { store } from '../core/Store.js';
import { BaseballEngine } from '../core/BaseballEngine.js';

export class Scorekeeper {
    constructor(container, gameId, isOverlay = false) { // Added isOverlay parameter
        this.container = container;
        this.gameId = gameId;
        this.isOverlay = isOverlay; // Store the mode
        this.game = store.getGameById(gameId);
        this.unsubscribes = [];
        
        this.render();
        this.updateBoard();

        this.unsubscribes.push(store.subscribe(`gameEventAdded_${this.gameId}`, () => {
            this.updateBoard();
        }));
    }

    render() {
        const awayTeam = store.getTeamById(this.game.awayTeamId);
        const homeTeam = store.getTeamById(this.game.homeTeamId);

        const aBg = awayTeam?.primaryColor || '#222222';
        const aText = awayTeam?.secondaryColor || '#ffffff';
        const aLogo = awayTeam?.logo ? `<img src="${awayTeam.logo}" style="height: 40px; margin-right: 15px; z-index: 1;">` : '';

        const hBg = homeTeam?.primaryColor || '#222222';
        const hText = homeTeam?.secondaryColor || '#ffffff';
        const hLogo = homeTeam?.logo ? `<img src="${homeTeam.logo}" style="height: 40px; margin-left: 15px; z-index: 1;">` : '';

        // If it's an overlay, we ONLY render the scorebug
        if (this.isOverlay) {
            this.container.innerHTML = `
                <style>
                    body { background: transparent !important; }
                    .scorebug-container { padding: 20px; }
                </style>
                <div class="scorebug-container">
                    <div class="scorebug">
                        <div class="team-panel away" style="--team-color: ${aBg}; --text-color: ${aText};">
                            ${aLogo}
                            <div class="team-info"><span class="team-name">${awayTeam?.nickname || 'AWAY'}</span></div>
                            <div class="team-score" id="away-score">0</div>
                        </div>
                        <div class="game-info-panel">
                            <div class="inning-display-pro"><span class="inning-text-pro" id="inning-text">TOP 1</span></div>
                            <div class="count-outs-pro"><span class="count-text-pro" id="count-text">0-0</span><span class="outs-text-pro" id="outs-text">0 OUTS</span></div>
                        </div>
                        <div class="diamond-panel">
                            <div class="diamond">
                                <div class="base base-2" id="base-2"></div>
                                <div class="base base-3" id="base-3"></div>
                                <div class="base base-1" id="base-1"></div>
                            </div>
                        </div>
                        <div class="team-panel home" style="--team-color: ${hBg}; --text-color: ${hText};">
                            <div class="team-score" id="home-score">0</div>
                            <div class="team-info" style="text-align: right;"><span class="team-name">${homeTeam?.nickname || 'HOME'}</span></div>
                            ${hLogo}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // ... (Rest of your existing FULL UI render code for the normal view) ...
            this.container.innerHTML = `
                <!-- PASTE YOUR EXISTING FULL UI HTML HERE -->
                <div class="scorebug-container">... (Your full code) ...</div>
            `;
            this.attachEventListeners();
        }
    }

    // ... (Keep your updateBoard and attachEventListeners methods from before) ...
    
    updateBoard() {
        const events = store.getEventsForGame(this.gameId);
        const awayLen = this.game.awayLineup?.length || 1;
        const homeLen = this.game.homeLineup?.length || 1;
        const { state, logs } = BaseballEngine.calculateState(events, awayLen, homeLen);

        // Update basic text
        this.container.querySelector('#away-score').textContent = state.awayScore;
        this.container.querySelector('#home-score').textContent = state.homeScore;
        this.container.querySelector('#inning-text').textContent = `${state.half.toUpperCase()} ${state.inning}`;
        this.container.querySelector('#count-text').textContent = `${state.balls}-${state.strikes}`;
        this.container.querySelector('#outs-text').textContent = state.outs === 1 ? '1 OUT' : `${state.outs} OUTS`;
        this.container.querySelector('#base-1').classList.toggle('occupied', state.bases[1]);
        this.container.querySelector('#base-2').classList.toggle('occupied', state.bases[2]);
        this.container.querySelector('#base-3').classList.toggle('occupied', state.bases[3]);
        
        // If not overlay, update batter and PBP
        if (!this.isOverlay) {
             // ... logic for batter name and PBP ...
        }
    }

    attachEventListeners() { /* ... your existing listeners ... */ }
    destroy() { this.unsubscribes.forEach(unsub => unsub()); }
}
