export class BaseballEngine {
    static calculateState(events) {
        let state = {
            inning: 1, half: 'Top', outs: 0, balls: 0, strikes: 0,
            awayScore: 0, homeScore: 0, bases: { 1: false, 2: false, 3: false }
        };
        let logs = [];

        events.forEach(event => {
            const prefix = `${state.half} ${state.inning}:`;
            
            if (event.type === 'pitch') {
                if (event.detail === 'ball') {
                    state.balls++;
                    if (state.balls === 4) {
                        logs.unshift({ type: 'hit', text: `${prefix} Walk.` });
                        this.handleWalk(state);
                        state.balls = 0; state.strikes = 0;
                    } else {
                        logs.unshift({ type: 'pitch', text: `${prefix} Ball (${state.balls}-${state.strikes})` });
                    }
                } 
                else if (event.detail === 'strike') {
                    state.strikes++;
                    if (state.strikes === 3) {
                        logs.unshift({ type: 'out', text: `${prefix} Strikeout.` });
                        this.handleOut(state);
                        state.balls = 0; state.strikes = 0;
                    } else {
                        logs.unshift({ type: 'pitch', text: `${prefix} Strike (${state.balls}-${state.strikes})` });
                    }
                }
                else if (event.detail === 'foul') {
                    if (state.strikes < 2) state.strikes++;
                    logs.unshift({ type: 'pitch', text: `${prefix} Foul Ball.` });
                }
                else if (event.detail === 'wp') {
                    this.handleAdvance(state);
                    logs.unshift({ type: 'action', text: `${prefix} Wild Pitch / Passed Ball. Runners advance.` });
                }
            } 
            else if (event.type === 'play') {
                if (event.detail === 'out') {
                    logs.unshift({ type: 'out', text: `${prefix} Batter grounded/flied out.` });
                    this.handleOut(state);
                }
                else if (event.detail === 'dp') {
                    logs.unshift({ type: 'out', text: `${prefix} Double Play!` });
                    this.handleDoublePlay(state);
                }
                else if (event.detail === 'single') {
                    logs.unshift({ type: 'hit', text: `${prefix} Single.` });
                    this.handleHit(state, 1);
                }
                else if (event.detail === 'double') {
                    logs.unshift({ type: 'hit', text: `${prefix} Double!` });
                    this.handleHit(state, 2);
                }
                else if (event.detail === 'triple') {
                    logs.unshift({ type: 'hit', text: `${prefix} Triple!!` });
                    this.handleHit(state, 3);
                }
                else if (event.detail === 'hr') {
                    logs.unshift({ type: 'hit', text: `${prefix} HOME RUN!!!` });
                    this.handleHit(state, 4);
                }
                else if (event.detail === 'error') {
                    logs.unshift({ type: 'action', text: `${prefix} Reached on Error.` });
                    this.handleHit(state, 1); // Simplification: treats error like a single for advancement
                }
                else if (event.detail === 'steal') {
                    logs.unshift({ type: 'action', text: `${prefix} Stolen Base.` });
                    this.handleAdvance(state, true);
                }

                // Reset count on any ball in play
                if (['out', 'dp', 'single', 'double', 'triple', 'hr', 'error'].includes(event.detail)) {
                    state.balls = 0;
                    state.strikes = 0;
                }
            }
        });

        return { state, logs };
    }

    static handleOut(state) {
        state.outs++;
        if (state.outs >= 3) {
            state.outs = 0;
            state.bases = { 1: false, 2: false, 3: false };
            if (state.half === 'Top') state.half = 'Bot';
            else { state.half = 'Top'; state.inning++; }
        }
    }

    static handleDoublePlay(state) {
        this.handleOut(state);
        if (state.outs > 0) this.handleOut(state); // Ensure inning didn't end on first out
        // Clear lead runner as a basic rule for DP
        if (state.bases[1]) state.bases[1] = false;
        else if (state.bases[2]) state.bases[2] = false;
        else if (state.bases[3]) state.bases[3] = false;
    }

    static handleWalk(state) {
        if (state.bases[1]) {
            if (state.bases[2]) {
                if (state.bases[3]) this.scoreRun(state);
                state.bases[3] = true;
            }
            state.bases[2] = true;
        }
        state.bases[1] = true;
    }

    static handleHit(state, bases) {
        if (bases === 4) { // Home Run
            if(state.bases[3]) this.scoreRun(state);
            if(state.bases[2]) this.scoreRun(state);
            if(state.bases[1]) this.scoreRun(state);
            this.scoreRun(state); // Batter
            state.bases = {1:false, 2:false, 3:false};
        }
        else if (bases === 3) { // Triple
            if(state.bases[3]) this.scoreRun(state);
            if(state.bases[2]) this.scoreRun(state);
            if(state.bases[1]) this.scoreRun(state);
            state.bases = {1:false, 2:false, 3:true};
        }
        else if (bases === 2) { // Double
            if(state.bases[3]) this.scoreRun(state);
            if(state.bases[2]) this.scoreRun(state);
            if(state.bases[1]) { state.bases[3] = true; state.bases[1] = false; }
            state.bases[2] = true;
        }
        else if (bases === 1) { // Single / Error
            if(state.bases[3]) { this.scoreRun(state); state.bases[3] = false; }
            if(state.bases[2]) { state.bases[3] = true; state.bases[2] = false; }
            if(state.bases[1]) { state.bases[2] = true; }
            state.bases[1] = true;
        }
    }

    static handleAdvance(state, isSteal = false) {
        // Moves the lead runner up one base.
        if (state.bases[3]) { 
            this.scoreRun(state); 
            state.bases[3] = false; 
        } else if (state.bases[2]) { 
            state.bases[3] = true; 
            state.bases[2] = false; 
        } else if (state.bases[1]) { 
            state.bases[2] = true; 
            if(isSteal) state.bases[1] = false; // Steal removes them from previous base
        }
    }

    static scoreRun(state) {
        if (state.half === 'Top') state.awayScore++;
        else state.homeScore++;
    }
}
