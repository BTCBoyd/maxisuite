// Show campaign import status banner
function showCampaignStatus() {
    const queue = JSON.parse(localStorage.getItem('maxisuite-queue') || '[]');
    const imported = localStorage.getItem('maxisuite-campaign-imported');
    
    // Count posts scheduled for Feb 12-16
    const campaignPosts = queue.filter(p => p.scheduledFor >= '2026-02-12' && p.scheduledFor <= '2026-02-16');
    
    const banner = document.createElement('div');
    banner.id = 'campaign-status';
    banner.className = 'max-w-7xl mx-auto px-6 py-3';
    
    if (campaignPosts.length > 0) {
        // Campaign loaded successfully
        banner.innerHTML = `
            <div class="bg-green-900 border border-green-700 rounded-lg p-3 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="text-green-200">✅</span>
                    <span class="text-green-100"><strong>${campaignPosts.length} posts</strong> loaded for Feb 12-16 campaign</span>
                </div>
                <a href="queue.html" class="text-green-200 hover:text-green-100 text-sm underline">View Queue →</a>
            </div>
        `;
    } else {
        // Campaign not loaded - show load button
        banner.innerHTML = `
            <div class="bg-yellow-900 border border-yellow-700 rounded-lg p-3 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="text-yellow-200">⚠️</span>
                    <span class="text-yellow-100">Campaign not loaded yet</span>
                </div>
                <button onclick="manualImportCampaign()" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded text-sm">
                    Load 8 Posts Now
                </button>
            </div>
        `;
    }
    
    // Insert banner after nav
    const nav = document.querySelector('nav');
    if (nav && nav.nextSibling) {
        nav.parentNode.insertBefore(banner, nav.nextSibling);
    }
}

// Manual import function
window.manualImportCampaign = function() {
    // Trigger auto-import manually
    const event = new Event('storage');
    localStorage.removeItem('maxisuite-campaign-imported'); // Reset flag
    location.reload(); // Reload to trigger auto-import
};

// Show status on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showCampaignStatus);
} else {
    showCampaignStatus();
}
