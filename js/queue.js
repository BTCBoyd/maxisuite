// MaxiSuite - Queue Management
const QUEUE_KEY = 'maxisuite-queue';

// Load queue from localStorage
function loadQueue() {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Save queue to localStorage
function saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Render queue
function renderQueue() {
    const queue = loadQueue();
    const container = document.getElementById('post-queue');
    
    // Update post count
    const countEl = document.getElementById('post-count');
    if (countEl) {
        const statusCounts = {};
        queue.forEach(p => {
            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });
        const countText = Object.entries(statusCounts)
            .map(([status, count]) => `${count} ${status}`)
            .join(', ');
        countEl.textContent = `Total: ${queue.length} posts (${countText})`;
    }
    
    // Filter by status and platform
    const statusFilter = document.getElementById('filter-status').value;
    const platformFilter = document.getElementById('filter-platform').value;
    
    const filtered = queue.filter(post => {
        if (statusFilter !== 'all' && post.status !== statusFilter) return false;
        if (platformFilter !== 'all') {
            const hasPlatform = post.platforms[platformFilter];
            if (!hasPlatform) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p class="text-lg">No posts match your filters</p>
                <p class="text-sm mt-2">Try changing the status or platform filter above</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(post => `
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <!-- Status Badge -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                    ${getStatusBadge(post.status)}
                    ${getPlatformBadges(post.platforms)}
                </div>
                <div class="text-sm text-gray-400">
                    ${formatDate(post.scheduledFor)}
                </div>
            </div>

            <!-- Content -->
            <p class="text-white mb-4">${escapeHtml(post.content)}</p>

            <!-- Actions -->
            <div class="flex space-x-3">
                ${post.status === 'pending' ? `
                    <button onclick="approvePost('${post.id}')" class="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium">
                        Approve
                    </button>
                    <button onclick="rejectPost('${post.id}')" class="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium">
                        Reject
                    </button>
                ` : ''}
                ${post.status === 'scheduled' ? `
                    <button onclick="postNow('${post.id}')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded text-sm font-medium">
                        Post Now
                    </button>
                ` : ''}
                <button onclick="editPost('${post.id}')" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium">
                    Edit
                </button>
                <button onclick="deletePost('${post.id}')" class="bg-red-900 hover:bg-red-800 text-red-200 px-4 py-2 rounded text-sm font-medium">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Status badge
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="bg-yellow-900 text-yellow-200 px-3 py-1 rounded-full text-xs font-medium">🟡 PENDING APPROVAL</span>',
        scheduled: '<span class="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-xs font-medium">🔵 SCHEDULED</span>',
        posted: '<span class="bg-green-900 text-green-200 px-3 py-1 rounded-full text-xs font-medium">✅ POSTED</span>',
        failed: '<span class="bg-red-900 text-red-200 px-3 py-1 rounded-full text-xs font-medium">❌ FAILED</span>'
    };
    return badges[status] || '';
}

// Platform badges
function getPlatformBadges(platforms) {
    const badges = [];
    if (platforms.x) badges.push('<span class="text-blue-400 text-sm">𝕏</span>');
    if (platforms.linkedin) badges.push('<span class="text-blue-500 text-sm">in</span>');
    if (platforms.nostr) badges.push('<span class="text-purple-400 text-sm">⚡</span>');
    return badges.join(' ');
}

// Format date
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Actions
window.approvePost = function(id) {
    const queue = loadQueue();
    const post = queue.find(p => p.id === id);
    if (post) {
        post.status = 'scheduled';
        saveQueue(queue);
        renderQueue();
        alert('Post approved and scheduled!');
    }
};

window.rejectPost = function(id) {
    const queue = loadQueue();
    const post = queue.find(p => p.id === id);
    if (post) {
        post.status = 'draft';
        saveQueue(queue);
        renderQueue();
        alert('Post rejected. Moved to drafts.');
    }
};

window.postNow = function(id) {
    if (confirm('Post this immediately?')) {
        // TODO: Call posting API
        alert('Posting now... (API integration coming)');
    }
};

window.editPost = function(id) {
    alert('Edit functionality coming soon!');
};

window.deletePost = function(id) {
    if (confirm('Delete this post permanently?')) {
        const queue = loadQueue();
        const updated = queue.filter(p => p.id !== id);
        saveQueue(updated);
        renderQueue();
    }
};

// Reset campaign
window.resetCampaign = function() {
    if (confirm('This will reload all campaign posts from scratch. Any manual edits will be lost. Continue?')) {
        localStorage.removeItem('maxisuite-queue');
        localStorage.removeItem('maxisuite-campaign-imported-full');
        alert('Campaign reset! Reloading page...');
        location.reload();
    }
};

// Event listeners
document.getElementById('filter-status')?.addEventListener('change', renderQueue);
document.getElementById('filter-platform')?.addEventListener('change', renderQueue);

// Auto-update past posts to "posted" status
function updatePastPosts() {
    const queue = loadQueue();
    const now = new Date();
    let updated = false;
    
    queue.forEach(post => {
        const scheduledDate = new Date(post.scheduledFor);
        const hoursPast = (now - scheduledDate) / (1000 * 60 * 60);
        
        // If post is more than 1 hour past scheduled time and still marked "scheduled"
        if (hoursPast > 1 && post.status === 'scheduled') {
            post.status = 'posted';
            post.postedAt = post.scheduledFor; // Mark posted at scheduled time
            updated = true;
        }
    });
    
    if (updated) {
        saveQueue(queue);
        console.log('✅ Updated past posts to "posted" status');
    }
}

// Run on page load
updatePastPosts();

// Initial render
renderQueue();
