export class BaseballEngine {
    static calculateState(events) {
        // Initial Game State
        let state = {
            inning: 1,
            half: 'Top',
            outs: 0,
            balls: 0,
            strikes: 0,
            awayScore: 0,
            homeScore: 0,
            bases: { 1: false, 2: false, 3: false }
        };

        // Replay every event in chronological order
        events.forEach(event => {
            if (event.type === 'pitch') {
                if (event.detail === 'ball') {
                    state.balls++;
                    if (state.balls === 4) {
                        this.handleWalk(state);
                        state.balls = 0;
                        state.strikes = 0;
                    }
                } 
                else if (event.detail === 'strike') {
                    state.strikes++;
                    if (state.strikes === 3) {
                        this.handleOut(state);
                        state.balls = 0;
                        state.strikes = 0;
                    }
                }
                else if (event.detail === 'foul') {
                    if (state.strikes < 2) state.strikes++;
                }
            } 
            else if (event.type === 'play') {
                if (event.detail === 'out') {
                    this.handleOut(state);
                    state.balls = 0;
                    state.strikes = 0;
                }
                else if (event.detail === 'single') {
                    this.handleHit(state, 1);
                    state.balls = 0;
                    state.strikes = 0;
                }
            }
        });

        return state;
    }

    static handleOut(state) {
        state.outs++;
        if (state.outs >= 3) {
            // Half inning over
            state.outs = 0;
            state.bases = { 1: false, 2: false, 3: false };
            if (state.half === 'Top') {
                state.half = 'Bot';
            } else {
                state.half = 'Top';
                state.inning++;
            }
        }
    }

    static handleWalk(state) {
        // Simplified runner logic for version 0.1
        if (state.bases[1]) {
            if (state.bases[2]) {
                if (state.bases[3]) {
                    this.scoreRun(state);
                }
                state.bases[3] = true;
            }
            state.bases[2] = true;
        }
        state.bases[1] = true;
    }

    static handleHit(state, bases) {
        // Highly simplified for 0.1 (Single pushes everyone up 1 base)
        if (bases === 1) {
            if (state.bases[3]) { this.scoreRun(state); state.bases[3] = false; }
            if (state.bases[2]) { state.bases[3] = true; state.bases[2] = false; }
            if (state.bases[1]) { state.bases[2] = true; }
            state.bases[1] = true;
        }
    }

    static scoreRun(state) {
        if (state.half === 'Top') state.awayScore++;
        else state.homeScore++;
    }
}
