// ===========================
// Werkspot Campus v2.0
// Modern Dashboard JavaScript
// ===========================

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Add animation
    themeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 300);
});

// Mobile Menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');

mobileMenuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
        if (sidebar && !sidebar.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Checklist Items
const checklistItems = document.querySelectorAll('.checklist-item:not(.completed)');
checklistItems.forEach(item => {
    item.addEventListener('click', () => {
        item.classList.add('completed');
        showToast('Taak voltooid! 🎉', 'success');
        
        // Update progress circle
        updateProgressCircle();
    });
});

function updateProgressCircle() {
    const total = document.querySelectorAll('.checklist-item').length;
    const completed = document.querySelectorAll('.checklist-item.completed').length;
    const percentage = Math.round((completed / total) * 100);
    
    const circle = document.querySelector('.progress-circle-fill');
    const text = document.querySelector('.progress-percentage');
    
    if (circle && text) {
        const circumference = 2 * Math.PI * 70;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        text.textContent = `${percentage}%`;
    }
}

// Filter Tabs
const tabsMini = document.querySelectorAll('.tab-mini');
tabsMini.forEach(tab => {
    tab.addEventListener('click', () => {
        const parent = tab.closest('.filter-tabs-mini');
        parent?.querySelectorAll('.tab-mini').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// Application Items
const appItems = document.querySelectorAll('.app-item-v2');
appItems.forEach(item => {
    item.addEventListener('click', (e) => {
        if (!e.target.closest('.status-pill')) {
            const company = item.querySelector('.app-company-name')?.textContent;
            showToast(`Details van ${company} worden geladen...`, 'info');
        }
    });
});

// Event Actions
const eventActions = document.querySelectorAll('.event-action');
eventActions.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showToast('Openen in externe app...', 'info');
    });
});

const eventItems = document.querySelectorAll('.event-item');
eventItems.forEach(item => {
    item.addEventListener('click', () => {
        const title = item.querySelector('.event-title')?.textContent;
        showToast(`${title} - Details bekijken`, 'info');
    });
});

// Quick Actions
const quickActions = document.querySelectorAll('.quick-action-v2');
quickActions.forEach(action => {
    action.addEventListener('click', () => {
        const text = action.querySelector('span')?.textContent;
        showToast(`${text}...`, 'info');
    });
});

// Timeline Items
const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach(item => {
    item.addEventListener('click', () => {
        const title = item.querySelector('strong')?.textContent;
        showToast(`${title} - Meer details`, 'info');
    });
    
    item.style.cursor = 'pointer';
});

// Search Bar
const searchInput = document.querySelector('.search-bar-v2 input');
if (searchInput) {
    searchInput.addEventListener('focus', () => {
        searchInput.closest('.search-bar-v2')?.classList.add('focused');
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.closest('.search-bar-v2')?.classList.remove('focused');
    });
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length > 2) {
            console.log('Searching for:', query);
        }
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K for search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
    }
    
    // Escape to close sidebar
    if (e.key === 'Escape') {
        sidebar?.classList.remove('active');
    }
    
    // Cmd/Ctrl + D for theme toggle
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        themeToggle?.click();
    }
});

// Notification Button
const notificationBtn = document.querySelector('.topbar-icon-btn');
if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
        showToast('Notificaties worden geladen...', 'info');
        
        // Animate the dot
        const dot = notificationBtn.querySelector('.notification-dot');
        if (dot) {
            dot.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                dot.style.animation = '';
            }, 500);
        }
    });
}

// ===========================
// Toast Notification System
// ===========================
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-v2');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-v2 toast-${type}`;
    
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
            break;
        case 'error':
            icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
            break;
        default:
            icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <span>${message}</span>
        <button class="toast-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
.toast-v2 {
    position: fixed;
    bottom: 24px;
    right: 24px;
    min-width: 300px;
    max-width: 400px;
    background: var(--color-glass);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 16px 20px;
    border-radius: 16px;
    border: 1px solid var(--color-glass-border);
    box-shadow: var(--shadow-xl);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-v2.show {
    transform: translateY(0);
    opacity: 1;
}

.toast-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.toast-success .toast-icon {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
}

.toast-error .toast-icon {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
}

.toast-info .toast-icon {
    background: rgba(37, 99, 235, 0.1);
    color: var(--color-primary);
}

.toast-v2 span {
    flex: 1;
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
}

.toast-close {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.toast-close:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

@media (max-width: 768px) {
    .toast-v2 {
        left: 16px;
        right: 16px;
        bottom: 80px;
        min-width: auto;
    }
}
`;
document.head.appendChild(toastStyles);

// ===========================
// Animate Stats on Scroll
// ===========================
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const value = entry.target.querySelector('.stat-value');
            if (value && !entry.target.dataset.animated) {
                animateNumber(value);
                entry.target.dataset.animated = 'true';
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.stat-card').forEach(card => {
    statsObserver.observe(card);
});

function animateNumber(element) {
    const target = parseInt(element.textContent);
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(progress * target);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(update);
}

// ===========================
// Animate Progress Circle
// ===========================
const progressCircle = document.querySelector('.progress-circle-fill');
if (progressCircle) {
    const circumference = 2 * Math.PI * 70;
    progressCircle.style.strokeDasharray = circumference;
    
    // Set initial value
    setTimeout(() => {
        updateProgressCircle();
    }, 500);
}

// Add SVG gradient
const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svgDefs.style.width = '0';
svgDefs.style.height = '0';
svgDefs.style.position = 'absolute';
svgDefs.innerHTML = `
    <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2563EB;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FBBF24;stop-opacity:1" />
        </linearGradient>
    </defs>
`;
document.body.appendChild(svgDefs);

// ===========================
// Card Entrance Animations
// ===========================
const cardsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 50);
            cardsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.glass-card, .stat-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    cardsObserver.observe(card);
});

// ===========================
// Window Resize Handler
// ===========================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (window.innerWidth > 1024) {
            sidebar?.classList.remove('active');
        }
    }, 250);
});

// ===========================
// Initialize
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Werkspot Campus v2.0 loaded');
    console.log('Theme:', html.getAttribute('data-theme'));
    
    // Welcome toast
    setTimeout(() => {
        showToast('Welkom terug bij Werkspot Campus! 🚀', 'success');
    }, 800);
    
    // Add gradient to progress circle
    const progressCircleFill = document.querySelector('.progress-circle-fill');
    if (progressCircleFill) {
        progressCircleFill.setAttribute('stroke', 'url(#progressGradient)');
    }
});

// ===========================
// Performance Monitoring
// ===========================
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
                console.log('⚡ Page load time:', Math.round(entry.loadEventEnd - entry.fetchStart), 'ms');
            }
        }
    });
    
    try {
        perfObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
        console.log('Performance observer not supported');
    }
}

// Log shortcuts info
console.log('%c⌨️  Keyboard Shortcuts:', 'font-weight: bold; font-size: 14px;');
console.log('Cmd/Ctrl + K: Open search');
console.log('Cmd/Ctrl + D: Toggle theme');
console.log('Escape: Close sidebar');


