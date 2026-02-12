// MaxiSuite - Calendar View
const QUEUE_KEY = 'maxisuite-queue';

let currentDate = new Date(2026, 1, 1); // February 2026

// Load queue
function loadQueue() {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get queue
    const queue = loadQueue();
    
    // Build calendar grid
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'border border-gray-700 p-3 bg-gray-900';
        grid.appendChild(cell);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const postsOnDay = queue.filter(post => post.scheduledFor.startsWith(dateStr));
        
        const cell = document.createElement('div');
        cell.className = 'border border-gray-700 p-3 min-h-[100px] cursor-pointer hover:bg-gray-700 transition';
        cell.onclick = () => showDayDetails(dateStr, postsOnDay);
        
        // Day number
        const dayNum = document.createElement('div');
        dayNum.className = 'font-bold mb-2';
        dayNum.textContent = day;
        cell.appendChild(dayNum);
        
        // Post indicators
        if (postsOnDay.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'text-xs space-y-1';
            
            postsOnDay.slice(0, 3).forEach(post => {
                const badge = document.createElement('div');
                badge.className = 'bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded text-xs truncate';
                badge.textContent = `${formatTime(post.scheduledFor)} - ${getPlatforms(post.platforms)}`;
                indicator.appendChild(badge);
            });
            
            if (postsOnDay.length > 3) {
                const more = document.createElement('div');
                more.className = 'text-gray-400 text-xs';
                more.textContent = `+${postsOnDay.length - 3} more`;
                indicator.appendChild(more);
            }
            
            cell.appendChild(indicator);
        }
        
        grid.appendChild(cell);
    }
}

// Show day details
function showDayDetails(dateStr, posts) {
    const detailsDiv = document.getElementById('day-details');
    const dateTitle = document.getElementById('selected-date');
    const postsDiv = document.getElementById('day-posts');
    
    dateTitle.textContent = new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    if (posts.length === 0) {
        postsDiv.innerHTML = '<p class="text-gray-400">No posts scheduled for this day</p>';
    } else {
        postsDiv.innerHTML = posts.map(post => `
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-yellow-500">${formatTime(post.scheduledFor)}</span>
                    <span class="text-sm text-gray-400">${getPlatforms(post.platforms)}</span>
                </div>
                <p class="text-white">${escapeHtml(post.content).substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
                <div class="mt-3">
                    <a href="queue.html" class="text-yellow-500 text-sm hover:text-yellow-400">View in Queue →</a>
                </div>
            </div>
        `).join('');
    }
    
    detailsDiv.classList.remove('hidden');
}

// Helper functions
function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function getPlatforms(platforms) {
    const badges = [];
    if (platforms.x) badges.push('𝕏');
    if (platforms.linkedin) badges.push('in');
    if (platforms.nostr) badges.push('⚡');
    return badges.join(' ');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Navigation
document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Initial render
renderCalendar();
