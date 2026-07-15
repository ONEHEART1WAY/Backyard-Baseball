import { store } from '../core/Store.js';
import { BaseballEngine } from '../core/BaseballEngine.js';

export class Scorekeeper {
    constructor(container, gameId, isOverlay = false) {
        this.container = container;
        this.gameId = gameId;
        this.isOverlay = isOverlay; // Tracks if we are in pop-out mode
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

        // --- OBS POP-OUT MODE ---
        if (this.isOverlay) {
            this.container.innerHTML = `
                <style>
                    .scorebug-container { padding: 20px; display: flex; justify-content: center; width: 100%; }
                </style>
                <div class="scorebug-container">
                    <div class="scorebug" id="broadcast-scorebug">
                        <div class="team-panel away" style="--team-color: ${aBg}; --text-color: ${aText};">
                            ${aLogo}
                            <div class="team-info"><span class="team-name">${awayTeam ? awayTeam.nickname : 'AWAY'}</span></div>
                            <div class="team-score" id="away-score">0</div>
                        </div>
                        <div class="game-info-panel">
                            <div class="inning-display-pro"><span class="inning-text-pro" id="inning-text">TOP 1</span></div>
                            <div class="count-outs-pro">
                                <span class="count-text-pro" id="count-text">0-0</span>
                                <span class="outs-text-pro" id="outs-text">0 OUTS</span>
                            </div>
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
                            <div class="team-info" style="text-align: right;"><span class="team-name">${homeTeam ? homeTeam.nickname : 'HOME'}</span></div>
                            ${hLogo}
                        </div>
                    </div>
                </div>
            `;
            return; // Stop rendering here for the pop-out window
        }

        // --- FULL SCORING APP MODE ---
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('view', 'overlay');
        currentUrl.searchParams.set('gameId', this.gameId);
        const obsLink = currentUrl.toString();

        this.container.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                
                <div class="scorebug-container">
                    <div class="scorebug" id="broadcast-scorebug">
                        <div class="team-panel away" style="--team-color: ${aBg}; --text-color: ${aText};">
                            ${aLogo}
                            <div class="team-info"><span class="team-name">${awayTeam ? awayTeam.nickname : 'AWAY'}</span></div>
                            <div class="team-score" id="away-score">0</div>
                        </div>
                        <div class="game-info-panel">
                            <div class="inning-display-pro"><span class="inning-text-pro" id="inning-text">TOP 1</span></div>
                            <div class="count-outs-pro">
                                <span class="count-text-pro" id="count-text">0-0</span>
                                <span class="outs-text-pro" id="outs-text">0 OUTS</span>
                            </div>
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
                            <div class="team-info" style="text-align: right;"><span class="team-name">${homeTeam ? homeTeam.nickname : 'HOME'}</span></div>
                            ${hLogo}
                        </div>
                    </div>
                </div>

                <!-- OBS POP-OUT LAUNCHER -->
                <div style="background: #1e1e1e; padding: 10px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #333;">
                    <div>
                        <span style="color: #888; font-size: 0.9rem; margin-right: 10px;">Broadcast Overlay:</span>
                        <span style="color: #ccc; font-size: 0.8rem;">Pop out the scorebug to capture in OBS using Window Capture (Chroma Key Green).</span>
                    </div>
                    <button id="btn-popout-obs" data-link="${obsLink}" style="background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Launch Pop-Out</button>
                </div>
                <!-- END OBS POP-OUT LAUNCHER -->

                <div class="scorekeeper-layout">
                    <div class="scoring-panel">
                        <div class="matchup-panel">
                            <div class="current-batter">
                                <span class="label">Now Batting</span>
                                <div class="batter-name" id="current-batter-name">Loading...</div>
                            </div>
                        </div>

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
        const awayLen = this.game.awayLineup ? this.game.awayLineup.length : 1;
        const homeLen = this.game.homeLineup ? this.game.homeLineup.length : 1;
        
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

        // Only update the batter and play-by-play if NOT in pop-out mode
        if (!this.isOverlay) {
            const lineupArray = state.half === 'Top' ? this.game.awayLineup : this.game.homeLineup;
            const batterIndex = state.half === 'Top' ? state.awayBatterIndex : state.homeBatterIndex;
            let batterDisplay = `Batter ${batterIndex + 1}`; 
            
            if (lineupArray && lineupArray[batterIndex]) {
                const playerId = lineupArray[batterIndex];
                if (!playerId.startsWith('dummy')) {
                    const player = store.getPlayerById(playerId);
                    if (player) batterDisplay = `#${player.number} ${player.firstName} ${player.lastName}`;
                }
            }
            this.container.querySelector('#current-batter-name').textContent = batterDisplay;

            const pbpList = this.container.querySelector('#pbp-list');
            if (logs.length === 0) {
                pbpList.innerHTML = `<div class="empty-state" style="margin-top: 20px;">Awaiting first pitch...</div>`;
            } else {
                const recentLogs = logs.slice(0, 15);
                pbpList.innerHTML = recentLogs.map(log => `<li class="pbp-item ${log.type}">${log.text}</li>`).join('');
            }
        }
    }

    attachEventListeners() {
        this.container.querySelectorAll('.btn-score').forEach(btn => {
            if(btn.id === 'btn-undo') return; 
            btn.addEventListener('click', (e) => {
                store.addGameEvent(this.gameId, e.currentTarget.dataset.type, e.currentTarget.dataset.detail);
            });
        });
        
        this.container.querySelector('#btn-undo').addEventListener('click', () => store.undoLastGameEvent(this.gameId));

        // Pop-out Window Launch Listener
        const popoutBtn = this.container.querySelector('#btn-popout-obs');
        if (popoutBtn) {
            popoutBtn.addEventListener('click', (e) => {
                const link = e.currentTarget.dataset.link;
                // Opens a neat, small window perfect for screen capturing
                window.open(link, 'OBS_Overlay', 'width=1200,height=250,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=1');
            });
        }
    }

    destroy() { this.unsubscribes.forEach(unsub => unsub()); }
}
