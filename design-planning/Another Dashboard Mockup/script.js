// ===========================
// Werkspot Campus Dashboard
// Interactive JavaScript
// ===========================

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');

if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Filter Pills
const filterPills = document.querySelectorAll('.pill');
filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
        // Remove active class from all pills in the same group
        const parentGroup = pill.closest('.filter-pills');
        if (parentGroup) {
            parentGroup.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        }
        // Add active class to clicked pill
        pill.classList.add('active');
        
        // Optional: Filter logic would go here
        const filterValue = pill.textContent.trim();
        console.log('Filter selected:', filterValue);
    });
});

// Tabs Functionality
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs in the same group
        const parentTabs = tab.closest('.tabs');
        if (parentTabs) {
            parentTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        }
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Optional: Switch tab content
        const tabName = tab.textContent.trim().split('\n')[0].trim();
        console.log('Tab selected:', tabName);
    });
});

// Toggle Buttons (Week/Month view)
const toggleButtons = document.querySelectorAll('.toggle-btn');
toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all toggles in the same group
        const parentGroup = btn.closest('.toggle-group');
        if (parentGroup) {
            parentGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        }
        // Add active class to clicked button
        btn.classList.add('active');
        
        const view = btn.textContent.trim();
        console.log('View changed to:', view);
    });
});

// Favorite/Heart Button Toggle
const favoriteButtons = document.querySelectorAll('.favorite-btn');
favoriteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('active');
        
        const companyCard = btn.closest('.company-card');
        const companyName = companyCard ? companyCard.querySelector('h4').textContent : 'Unknown';
        
        if (btn.classList.contains('active')) {
            console.log('Added to favorites:', companyName);
            showToast('Bedrijf toegevoegd aan favorieten', 'success');
        } else {
            console.log('Removed from favorites:', companyName);
            showToast('Bedrijf verwijderd uit favorieten', 'info');
        }
    });
});

// Message Items Click
const messageItems = document.querySelectorAll('.message-item');
messageItems.forEach(item => {
    item.addEventListener('click', () => {
        const companyName = item.querySelector('h4').textContent;
        console.log('Opening message from:', companyName);
        
        // Remove unread status
        item.classList.remove('unread');
        
        // Optional: Navigate to message detail
        showToast('Opening bericht...', 'info');
    });
});

// Application Items - Details button
const applicationDetailsButtons = document.querySelectorAll('.application-item .btn-secondary');
applicationDetailsButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const applicationItem = btn.closest('.application-item');
        const companyName = applicationItem.querySelector('h4').textContent;
        console.log('Opening application details for:', companyName);
        showToast('Details worden geladen...', 'info');
    });
});

// Quick Action Tiles
const quickActionTiles = document.querySelectorAll('.quick-action-tile');
quickActionTiles.forEach(tile => {
    tile.addEventListener('click', () => {
        const actionName = tile.querySelector('span').textContent;
        console.log('Quick action clicked:', actionName);
        showToast(`${actionName}...`, 'info');
    });
});

// Company Card - View Details
const companyViewButtons = document.querySelectorAll('.company-card .btn-primary');
companyViewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const companyCard = btn.closest('.company-card');
        const companyName = companyCard.querySelector('h4').textContent;
        console.log('Viewing company:', companyName);
        showToast(`Opdrachten van ${companyName} worden geladen...`, 'info');
    });
});

// Todo Items Click (Profile Status)
const todoItems = document.querySelectorAll('.todo-item:not(.completed)');
todoItems.forEach(item => {
    item.addEventListener('click', () => {
        const todoText = item.querySelector('span').textContent;
        console.log('Todo clicked:', todoText);
        showToast('Navigeren naar profiel...', 'info');
    });
});

// Search Bar Focus Effect
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('focus', () => {
        console.log('Search activated');
    });
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length > 2) {
            console.log('Searching for:', query);
            // Optional: Implement search functionality
        }
    });
}

// Notification Button
const notificationBtn = document.querySelector('.notification-btn');
if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
        console.log('Opening notifications');
        showToast('Notificaties worden geladen...', 'info');
        
        // Optional: Remove badge after viewing
        const badge = notificationBtn.querySelector('.notification-badge');
        if (badge) {
            setTimeout(() => {
                badge.style.opacity = '0';
                setTimeout(() => badge.remove(), 300);
            }, 1000);
        }
    });
}

// Agenda Items - Add to Calendar
const agendaCalendarButtons = document.querySelectorAll('.agenda-item .icon-btn');
agendaCalendarButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const agendaItem = btn.closest('.agenda-item');
        const eventTitle = agendaItem.querySelector('h4').textContent;
        console.log('Adding to calendar:', eventTitle);
        showToast('Afspraak toegevoegd aan kalender', 'success');
    });
});

// Primary Action Buttons
const heroSearchBtn = document.querySelector('.hero-actions .btn-primary');
if (heroSearchBtn) {
    heroSearchBtn.addEventListener('click', () => {
        console.log('Navigate to search');
        showToast('Navigeren naar zoekpagina...', 'info');
    });
}

const heroProfileBtn = document.querySelector('.hero-actions .btn-secondary');
if (heroProfileBtn) {
    heroProfileBtn.addEventListener('click', () => {
        console.log('Navigate to profile');
        showToast('Navigeren naar profiel...', 'info');
    });
}

// Profile Update Button
const profileUpdateBtn = document.querySelector('.profile-status-card .btn-primary');
if (profileUpdateBtn) {
    profileUpdateBtn.addEventListener('click', () => {
        console.log('Navigate to profile update');
        showToast('Navigeren naar profiel...', 'info');
    });
}

// View All Messages Button
const viewAllMessagesBtn = document.querySelector('.messages-card .btn-primary');
if (viewAllMessagesBtn) {
    viewAllMessagesBtn.addEventListener('click', () => {
        console.log('Navigate to all messages');
        showToast('Alle berichten worden geladen...', 'info');
    });
}

// View Full Calendar Button
const viewCalendarBtn = document.querySelector('.agenda-card .btn-secondary');
if (viewCalendarBtn) {
    viewCalendarBtn.addEventListener('click', () => {
        console.log('Navigate to full calendar');
        showToast('Volledige agenda wordt geladen...', 'info');
    });
}

// ===========================
// Toast Notification System
// ===========================
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon based on type
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
        ${icon}
        <span>${message}</span>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add toast styles dynamically
const toastStyles = document.createElement('style');
toastStyles.textContent = `
.toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1000;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s ease;
    border-left: 4px solid #2563EB;
    max-width: 400px;
}

.toast.show {
    transform: translateY(0);
    opacity: 1;
}

.toast svg {
    flex-shrink: 0;
}

.toast-success {
    border-left-color: #10B981;
    color: #10B981;
}

.toast-error {
    border-left-color: #EF4444;
    color: #EF4444;
}

.toast-info {
    border-left-color: #2563EB;
    color: #2563EB;
}

.toast span {
    color: #111827;
    font-size: 14px;
    font-weight: 500;
}

@media (max-width: 768px) {
    .toast {
        left: 16px;
        right: 16px;
        bottom: 16px;
        max-width: none;
    }
}
`;
document.head.appendChild(toastStyles);

// ===========================
// Smooth Scrolling for Links
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===========================
// Lazy Loading for Images (if needed)
// ===========================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===========================
// Update Time Stamps (Real-time)
// ===========================
function updateTimeStamps() {
    const now = new Date();
    
    // This is where you'd update relative time stamps
    // e.g., "2 uur geleden" -> "3 uur geleden"
    // For demo purposes, we'll just log
    console.log('Time stamps updated at:', now.toLocaleTimeString('nl-NL'));
}

// Update every minute
setInterval(updateTimeStamps, 60000);

// ===========================
// Window Resize Handler
// ===========================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Close sidebar on desktop
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('active');
        }
        console.log('Window resized:', window.innerWidth);
    }, 250);
});

// ===========================
// Initialize on Load
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Werkspot Campus Dashboard loaded');
    
    // Optional: Show welcome toast
    setTimeout(() => {
        showToast('Welkom terug, Sophie! 👋', 'success');
    }, 500);
    
    // Add loading animation to cards
    const cards = document.querySelectorAll('.hero-card, .profile-status-card, .recommended-companies-card, .applications-card, .messages-card, .agenda-card, .quick-actions-card, .followed-companies-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
});

// ===========================
// Dropdown Functionality
// ===========================
const dropdownButtons = document.querySelectorAll('.dropdown-btn');
dropdownButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Dropdown clicked');
        // In a real app, this would open a dropdown menu
        showToast('Dropdown functionaliteit komt binnenkort', 'info');
    });
});

// ===========================
// Keyboard Shortcuts
// ===========================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
    }
    
    // Escape to close mobile menu
    if (e.key === 'Escape') {
        sidebar?.classList.remove('active');
    }
});

// ===========================
// Performance Monitoring
// ===========================
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
                console.log('Page load time:', entry.loadEventEnd - entry.fetchStart, 'ms');
            }
        }
    });
    
    perfObserver.observe({ entryTypes: ['navigation'] });
}

// Log when user leaves the page
window.addEventListener('beforeunload', () => {
    console.log('User leaving dashboard');
});

console.log('All event listeners initialized successfully!');


