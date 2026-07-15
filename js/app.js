import { store } from './core/Store.js';
import { Dashboard } from './views/Dashboard.js';
import { TeamManager } from './views/TeamManager.js';
import { PlayerManager } from './views/PlayerManager.js';
import { GameManager } from './views/GameManager.js';
import { Scorekeeper } from './views/Scorekeeper.js';

// 1. Get the URL parameters
const urlParams = new URLSearchParams(window.location.search);
const view = urlParams.get('view');
const gameId = urlParams.get('gameId');

// 2. Immediate Check: If this is an overlay request, bypass the dashboard entirely
if (view === 'overlay' && gameId) {
    // Import your Scorekeeper class here if you haven't globally
    // import { Scorekeeper } from './views/Scorekeeper.js'; 
    
    // Clear the document body immediately so the Dashboard HTML never exists
    document.body.innerHTML = '<div id="app"></div>';
    
    // Initialize ONLY the Scorekeeper
    const container = document.getElementById('app');
    new Scorekeeper(container, gameId, true); // 'true' sets isOverlay mode
    
    // Stop the rest of the script from executing
    throw new Error("Overlay mode active: Dashboard loading aborted.");
}

// 3. Otherwise, continue with your normal app startup/router below...
// initMyApp();

class App {
    constructor() {
        // --- OBS OVERLAY INTERCEPTOR ---
        const urlParams = new URLSearchParams(window.location.search);
        const isOverlay = urlParams.get('view') === 'overlay';
        const gameId = urlParams.get('gameId');

        if (isOverlay && gameId) {
            // Wipe the entire page clean and setup the OBS container
            document.body.innerHTML = '<div id="obs-container" style="width: 100vw; height: 100vh;"></div>';
            // Load ONLY the Scorekeeper in overlay mode (the true at the end)
            new Scorekeeper(document.getElementById('obs-container'), gameId, true);
            // Return immediately to stop the rest of the normal app from loading
            return;
        }
        // --- END OBS INTERCEPTOR ---

        // Normal Application Setup (only runs if NOT in overlay mode)
        this.viewContainer = document.getElementById('app-view');
        this.viewTitle = document.getElementById('view-title');
        this.navLinks = document.querySelectorAll('.nav-links a');
        this.saveIndicator = document.getElementById('save-status');
        
        this.currentView = null;
        this.init();
    }

    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.dataset.route; 
                this.navigate(route, null, e.currentTarget);
            });
        });

        store.subscribe('systemSaved', () => {
            if (this.saveIndicator) {
                this.saveIndicator.style.color = 'var(--success)';
                this.saveIndicator.textContent = 'All changes saved';
                setTimeout(() => {
                    this.saveIndicator.style.color = 'var(--text-muted)';
                }, 2000);
            }
        });

        // Load dashboard by default
        this.navigate('dashboard', null, this.navLinks[0]);
    }

    navigate(route, id = null, activeElement = null) {
        if (activeElement) {
            this.navLinks.forEach(l => l.classList.remove('active'));
            activeElement.classList.add('active');
            if (this.viewTitle) {
                this.viewTitle.textContent = activeElement.textContent;
            }
        }

        if (this.currentView && typeof this.currentView.destroy === 'function') {
            this.currentView.destroy();
        }
        
        if (this.viewContainer) {
            this.viewContainer.innerHTML = '';
        }

        // Pass a callback to GameManager so it can trigger navigation to the Scorekeeper
        const routerNav = (r, navId) => this.navigate(r, navId);

        switch(route) {
            case 'dashboard':
                this.currentView = new Dashboard(this.viewContainer);
                break;
            case 'teams':
                this.currentView = new TeamManager(this.viewContainer);
                break;
            case 'players':
                this.currentView = new PlayerManager(this.viewContainer);
                break;
            case 'games':
                this.currentView = new GameManager(this.viewContainer, routerNav);
                break;
            case 'scorekeeper':
                if (this.viewTitle) this.viewTitle.textContent = "Live Scorekeeper";
                this.currentView = new Scorekeeper(this.viewContainer, id);
                break;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { new App(); });
