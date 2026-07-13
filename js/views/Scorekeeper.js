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

        this.unsubscribes.push(store.subscribe(`gameEventAdded_${this.gameId}`, () => {
            this.updateBoard();
        }));
    }

    render() {
        const awayTeam = store.getTeamById(this.game.awayTeamId);
        const homeTeam = store.getTeamById(this.game.homeTeamId);

        // Fallbacks if team data is missing
        const aBg = awayTeam?.primaryColor || '#222222';
        const aText = awayTeam?.secondaryColor || '#ffffff';
        const aLogo = awayTeam?.logo ? `<img src="${awayTeam.logo}" class="team-logo-board">` : '';

        const hBg = homeTeam?.primaryColor || '#222222';
        const hText = homeTeam?.secondaryColor || '#ffffff';
        const hLogo = homeTeam?.logo ? `<img src="${homeTeam.logo}" class="team-logo-board">` : '';

        this.container.innerHTML = `
            <div style="max-width: 1000px; margin: 0 auto;">
                
                <div class="scoreboard">
                    <div class="score-team" style="background-color: ${aBg}; border: 2px solid ${aText};">
                        ${aLogo}
                        <h3 style="color: ${aText};">${awayTeam ? awayTeam.nickname : 'Away'}</h3>
                        <div class="score-number" id="away-score" style="color: ${aText};">0</div>
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
                    
                    <div class="score-team" style="background-color: ${hBg}; border: 2px solid ${hText};">
                        ${hLogo}
                        <h3 style="color: ${hText};">${homeTeam ? homeTeam.nickname : 'Home'}</h3>
                        <div class="score-number" id="home-score" style="color: ${hText};">0</div>
                    </div>
                </div>

                <div class="scorekeeper-layout">
                    <div class="scoring-panel">
                        <div class="scoring-grid advanced">
                            <button class="btn-score btn-pitch" data-type="pitch" data-detail="ball">Ball</button>
                            <button class="btn-score btn-pitch" data-type="pitch" data-detail="strike">Strike</button>
                            <button class="btn-score btn-pitch" data-type="pitch" data-detail="foul">Foul</button>
                            
                            <button class="btn-score btn-hit" data-type="play" data-detail="single">1B (Single)</button>
                            <button class="btn-score btn-hit" data-type="play" data-detail="double">2B (Double)</button>
                            <button class="btn-score btn-hit" data-type="play" data-detail="triple">3B (Triple)</button>
                            <button class="btn-score btn-hit" style="grid-column: span 3;" data-type="play" data-detail="hr">Home Run</button>

                            <button class="btn-score btn-out" data-type="play" data-detail="out">Out in Play</button>
                            <button class="btn-score btn-out" data-type="play" data-detail="dp">Double Play</button>
                            <button class="btn-score btn-action" data-type="play" data-detail="error">Error</button>
                            
                            <button class="btn-score btn-action" data-type="play" data-detail="steal">Steal</button>
                            <button class="btn-score btn-action" data-type="pitch" data-detail="wp">Wild Pitch</button>
                            <button class="btn-score btn-undo" id="btn-undo">Undo Last</button>
                        </div>
                    </div>

                    <div class="pbp-panel">
                        <h4>Play-by-Play</h4>
                        <ul id="pbp-list" class="pbp-list">
                            <div class="empty-state" style="margin-top: 20px;">Awaiting first pitch...</div>
                        </ul>
                    </div>
                </div>

            </div>
        `;

        this.attachEventListeners();
    }

    updateBoard() {
        const events = store.getEventsForGame(this.gameId);
        const { state, logs } = BaseballEngine.calculateState(events);

        this.container.querySelector('#away-score').textContent = state.awayScore;
        this.container.querySelector('#home-score').textContent = state.homeScore;
        this.container.querySelector('#inning-text').textContent = `${state.half} ${state.inning}`;
        this.container.querySelector('#count-text').textContent = `${state.balls}-${state.strikes}`;
        this.container.querySelector('#outs-text').textContent = `${state.outs} Outs`;

        this.container.querySelector('#base-1').classList.toggle('occupied', state.bases[1]);
        this.container.querySelector('#base-2').classList.toggle('occupied', state.bases[2]);
        this.container.querySelector('#base-3').classList.toggle('occupied', state.bases[3]);

        const pbpList = this.container.querySelector('#pbp-list');
        if (logs.length === 0) {
            pbpList.innerHTML = `<div class="empty-state" style="margin-top: 20px;">Awaiting first pitch...</div>`;
        } else {
            pbpList.innerHTML = logs.map(log => `<li class="pbp-item ${log.type}">${log.text}</li>`).join('');
        }
    }

    attachEventListeners() {
        this.container.querySelectorAll('.btn-score').forEach(btn => {
            if(btn.id === 'btn-undo') return; 
            
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
