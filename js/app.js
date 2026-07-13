import { store } from './core/Store.js';
import { Dashboard } from './views/Dashboard.js';
import { TeamManager } from './views/TeamManager.js';
import { PlayerManager } from './views/PlayerManager.js';
import { GameManager } from './views/GameManager.js';
import { Scorekeeper } from './views/Scorekeeper.js';

class App {
    constructor() {
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
            this.saveIndicator.style.color = 'var(--success)';
            this.saveIndicator.textContent = 'All changes saved';
            setTimeout(() => {
                this.saveIndicator.style.color = 'var(--text-muted)';
            }, 2000);
        });

        this.navigate('dashboard', null, this.navLinks[0]);
    }

    navigate(route, id = null, activeElement = null) {
        if (activeElement) {
            this.navLinks.forEach(l => l.classList.remove('active'));
            activeElement.classList.add('active');
            this.viewTitle.textContent = activeElement.textContent;
        }

        if (this.currentView && typeof this.currentView.destroy === 'function') {
            this.currentView.destroy();
        }
        this.viewContainer.innerHTML = '';

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
                this.viewTitle.textContent = "Live Scorekeeper"; // Override title
                this.currentView = new Scorekeeper(this.viewContainer, id);
                break;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { new App(); });
