/**
 * Date utility functions for countdown and progress displays
 */

/**
 * Check if a date value is valid
 * @param {string|Date} date - The date to validate
 * @returns {boolean} True if the date is valid
 */
function isValidDate(date) {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Get countdown text for a deadline date
 * @param {string|Date} endDate - The deadline date
 * @returns {string} Human-readable countdown text in Dutch, or empty string if invalid
 */
export function getCountdownText(endDate) {
    if (!endDate) return '';
    
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return '';  // Invalid date check
    
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Deadline verstreken';
    if (diffDays === 0) return 'Deadline vandaag';
    if (diffDays === 1) return 'nog 1 dag';
    if (diffDays <= 7) return `nog ${diffDays} dagen`;
    if (diffDays <= 14) return 'nog 1-2 weken';
    if (diffDays <= 30) return `nog ${Math.ceil(diffDays / 7)} weken`;
    if (diffDays <= 60) return 'nog 1-2 maanden';
    return `nog ${Math.ceil(diffDays / 30)} maanden`;
}

/**
 * Calculate progress percentage between start and end date
 * @param {string|Date} startDate - The start date
 * @param {string|Date} endDate - The end date
 * @returns {number} Progress percentage (0-100), or 0 if dates are invalid
 */
export function calculateProgress(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const now = new Date();
    
    // If we haven't started yet
    if (now < start) return 0;
    
    // If we're past the deadline
    if (now > end) return 100;
    
    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = (elapsed / totalDuration) * 100;
    
    return Math.max(0, Math.min(100, Math.round(progress)));
}

/**
 * Format a date in Dutch locale
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string, or empty string if invalid
 */
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';  // Invalid date check
    return d.toLocaleDateString('nl-NL', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

/**
 * Format a date in short format (day month)
 * @param {string|Date} date - The date to format
 * @returns {string} Short formatted date string, or empty string if invalid
 */
export function formatDateShort(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';  // Invalid date check
    return d.toLocaleDateString('nl-NL', { 
        day: 'numeric', 
        month: 'short'
    });
}
