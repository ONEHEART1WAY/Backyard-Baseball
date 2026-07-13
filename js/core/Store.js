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
