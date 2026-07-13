import { generateUUID } from './utils.js';

class Store {
    constructor() {
        this.storageKey = 'diamond_os_v0.1';
        this.listeners = {};
        
        // Default Database Schema
        this.data = {
            teams: [],
            players: [],
            settings: {
                theme: 'dark'
            }
        };

        this.load();
    }
    getPlayers() {
        return this.data.players || [];
    }

    getPlayerById(id) {
        return this.data.players.find(p => p.id === id);
    }

    savePlayer(playerData) {
        if (playerData.id) {
            // Update existing
            const index = this.data.players.findIndex(p => p.id === playerData.id);
            if (index !== -1) {
                this.data.players[index] = { ...this.data.players[index], ...playerData };
            }
        } else {
            // Create new
            const newPlayer = {
                id: generateUUID(),
                createdAt: Date.now(),
                ...playerData
            };
            this.data.players.push(newPlayer);
        }
        this.publish('playersUpdated', this.data.players);
    }

    deletePlayer(id) {
        this.data.players = this.data.players.filter(p => p.id !== id);
        this.publish('playersUpdated', this.data.players);
    }

    // --- ROSTER API (Relational) ---

    assignPlayerToTeam(playerId, teamId) {
        if (!this.data.roster_transactions) this.data.roster_transactions = [];

        // Close out any current active assignment for this player
        const activeAssignment = this.data.roster_transactions.find(
            t => t.playerId === playerId && t.isActive
        );
        
        if (activeAssignment) {
            if (activeAssignment.teamId === teamId) return; // Already on this team
            activeAssignment.isActive = false;
            activeAssignment.endDate = Date.now();
        }

        // Create new assignment if teamId is provided (not just releasing them)
        if (teamId) {
            this.data.roster_transactions.push({
                id: generateUUID(),
                playerId: playerId,
                teamId: teamId,
                startDate: Date.now(),
                endDate: null,
                isActive: true
            });
        }
        
        this.publish('rostersUpdated', this.data.roster_transactions);
    }

    getPlayerCurrentTeam(playerId) {
        if (!this.data.roster_transactions) return null;
        const assignment = this.data.roster_transactions.find(
            t => t.playerId === playerId && t.isActive
        );
        return assignment ? this.getTeamById(assignment.teamId) : null;
    }

    // --- PUB/SUB EVENT SYSTEM ---

    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    publish(event, payload) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(payload));
        }
        this.save();
    }

    // --- PERSISTENCE ---

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            this.publish('systemSaved', Date.now());
        } catch (e) {
            console.error("Failed to save to local storage", e);
        }
    }

    load() {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
            this.data = { ...this.data, ...JSON.parse(savedData) };
        }
    }

    // --- TEAMS API ---

    getTeams() {
        return this.data.teams;
    }

    getTeamById(id) {
        return this.data.teams.find(t => t.id === id);
    }

    saveTeam(teamData) {
        if (teamData.id) {
            // Update existing
            const index = this.data.teams.findIndex(t => t.id === teamData.id);
            if (index !== -1) {
                this.data.teams[index] = { ...this.data.teams[index], ...teamData };
            }
        } else {
            // Create new
            const newTeam = {
                id: generateUUID(),
                createdAt: Date.now(),
                ...teamData
            };
            this.data.teams.push(newTeam);
        }
        this.publish('teamsUpdated', this.data.teams);
    }

    deleteTeam(id) {
        this.data.teams = this.data.teams.filter(t => t.id !== id);
        this.publish('teamsUpdated', this.data.teams);
    }

    // --- PLAYERS API ---

    getPlayers() {
        return this.data.players;
    }

    savePlayer(playerData) {
        if (playerData.id) {
            const index = this.data.players.findIndex(p => p.id === playerData.id);
            if (index !== -1) {
                this.data.players[index] = { ...this.data.players[index], ...playerData };
            }
        } else {
            const newPlayer = {
                id: generateUUID(),
                createdAt: Date.now(),
                ...playerData
            };
            this.data.players.push(newPlayer);
        }
        this.publish('playersUpdated', this.data.players);
    }
}

// Export a single, global instance
export const store = new Store();
