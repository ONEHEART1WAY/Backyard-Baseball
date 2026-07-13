import { store } from './core/Store.js';
import { Dashboard } from './views/Dashboard.js';
import { TeamManager } from './views/TeamManager.js';
import { PlayerManager } from './views/PlayerManager.js';

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
        // Setup Routing
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // FIX: Use currentTarget to ensure we always get the <a> tag
                const route = e.currentTarget.dataset.route; 
                this.navigate(route, e.currentTarget);
            });
        });

        // Setup global save indicator
        store.subscribe('systemSaved', () => {
            this.saveIndicator.style.color = 'var(--success)';
            this.saveIndicator.textContent = 'All changes saved';
            setTimeout(() => {
                this.saveIndicator.style.color = 'var(--text-muted)';
            }, 2000);
        });

        // Load default view
        this.navigate('dashboard', this.navLinks[0]);
    }

    navigate(route, activeElement) {
        // Update Active Nav State
        this.navLinks.forEach(l => l.classList.remove('active'));
        activeElement.classList.add('active');

        // Update Title
        this.viewTitle.textContent = activeElement.textContent;

        // FIX: Clean up the old view before destroying its HTML
        if (this.currentView && typeof this.currentView.destroy === 'function') {
            this.currentView.destroy();
        }

        // Clear current view
        this.viewContainer.innerHTML = '';

        // Router
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
            case 'settings':
                this.viewContainer.innerHTML = '<div class="empty-state">Settings Module Loading...</div>';
                break;
        }
    }
}

// Boot the application once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
