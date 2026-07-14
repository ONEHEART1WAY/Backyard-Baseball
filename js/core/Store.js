import { generateUUID } from './utils.js';

class Store {
    constructor() {
        this.storageKey = 'diamond_os_v0.1';
        this.listeners = {};
        
        this.data = {
            teams: [], players: [], roster_transactions: [],
            games: [], game_events: [], settings: { theme: 'dark' }
        };
        this.saveTimeout = null; // NEW: Timer for debouncing saves
        this.load();
    }

    subscribe(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
        return () => { this.listeners[event] = this.listeners[event].filter(cb => cb !== callback); };
    }

    publish(event, payload) {
        if (this.listeners[event]) this.listeners[event].forEach(callback => callback(payload));
        this.save();
    }

    // --- UPDATED: Background Save (Debounce) ---
    // This stops the browser from freezing when the database gets large!
    save() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        
        this.saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            } catch (e) { console.error("Failed to save", e); }
        }, 50); // Waits 50ms after your last click before writing to the hard drive
    }

    load() {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) this.data = { ...this.data, ...JSON.parse(savedData) };
    }

    getTeams() { return this.data.teams || []; }
    getTeamById(id) { return this.data.teams.find(t => t.id === id); }
    saveTeam(teamData) {
        if (teamData.id) {
            const index = this.data.teams.findIndex(t => t.id === teamData.id);
            if (index !== -1) this.data.teams[index] = { ...this.data.teams[index], ...teamData };
        } else { this.data.teams.push({ id: generateUUID(), createdAt: Date.now(), ...teamData }); }
        this.publish('teamsUpdated', this.data.teams);
    }
    deleteTeam(id) {
        this.data.teams = this.data.teams.filter(t => t.id !== id);
        this.publish('teamsUpdated', this.data.teams);
    }

    getPlayers() { return this.data.players || []; }
    getPlayerById(id) { return this.data.players.find(p => p.id === id); }
    getPlayersByTeam(teamId) {
        if (!this.data.roster_transactions) return [];
        return this.data.players.filter(p => {
            const assignment = this.data.roster_transactions.find(t => t.playerId === p.id && t.isActive);
            return assignment && assignment.teamId === teamId;
        });
    }

    savePlayer(playerData) {
        if (playerData.id) {
            const index = this.data.players.findIndex(p => p.id === playerData.id);
            if (index !== -1) this.data.players[index] = { ...this.data.players[index], ...playerData };
        } else { this.data.players.push({ id: generateUUID(), createdAt: Date.now(), ...playerData }); }
        this.publish('playersUpdated', this.data.players);
    }
    deletePlayer(id) {
        this.data.players = this.data.players.filter(p => p.id !== id);
        this.publish('playersUpdated', this.data.players);
    }
    assignPlayerToTeam(playerId, teamId) {
        if (!this.data.roster_transactions) this.data.roster_transactions = [];
        const activeAssignment = this.data.roster_transactions.find(t => t.playerId === playerId && t.isActive);
        if (activeAssignment) {
            if (activeAssignment.teamId === teamId) return; 
            activeAssignment.isActive = false; activeAssignment.endDate = Date.now();
        }
        if (teamId) {
            this.data.roster_transactions.push({
                id: generateUUID(), playerId, teamId, startDate: Date.now(), endDate: null, isActive: true
            });
        }
        this.publish('rostersUpdated', this.data.roster_transactions);
    }
    getPlayerCurrentTeam(playerId) {
        if (!this.data.roster_transactions) return null;
        const assignment = this.data.roster_transactions.find(t => t.playerId === playerId && t.isActive);
        return assignment ? this.getTeamById(assignment.teamId) : null;
    }

    getGames() { return this.data.games || []; }
    getGameById(id) { return this.data.games.find(g => g.id === id); }
    saveGame(gameData) {
        if (!this.data.games) this.data.games = [];
        const newGame = { id: generateUUID(), createdAt: Date.now(), status: 'active', ...gameData };
        this.data.games.push(newGame);
        this.publish('gamesUpdated', this.data.games);
        return newGame.id;
    }

    getEventsForGame(gameId) {
        if (!this.data.game_events) this.data.game_events = [];
        return this.data.game_events.filter(e => e.gameId === gameId).sort((a, b) => a.timestamp - b.timestamp);
    }
    addGameEvent(gameId, eventType, detail = null) {
        if (!this.data.game_events) this.data.game_events = [];
        this.data.game_events.push({ id: generateUUID(), gameId: gameId, timestamp: Date.now(), type: eventType, detail: detail });
        this.publish(`gameEventAdded_${gameId}`, this.getEventsForGame(gameId));
    }
    undoLastGameEvent(gameId) {
        if (!this.data.game_events) return;
        const events = this.getEventsForGame(gameId);
        if (events.length === 0) return;
        const lastEvent = events[events.length - 1];
        this.data.game_events = this.data.game_events.filter(e => e.id !== lastEvent.id);
        this.publish(`gameEventAdded_${gameId}`, this.getEventsForGame(gameId));
    }
}
export const store = new Store();
