// MaxiSuite - Main Application
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Character counter
const contentTextarea = document.getElementById('post-content');
const charCount = document.getElementById('char-count');

if (contentTextarea) {
    contentTextarea.addEventListener('input', () => {
        charCount.textContent = contentTextarea.value.length;
    });
}

// Schedule picker toggle
const scheduleRadios = document.querySelectorAll('input[name="schedule-type"]');
const schedulePicker = document.getElementById('schedule-picker');
const postButton = document.getElementById('btn-post');

scheduleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'schedule') {
            schedulePicker.classList.remove('hidden');
            postButton.textContent = 'Schedule Post';
        } else {
            schedulePicker.classList.add('hidden');
            postButton.textContent = 'Post Now';
        }
    });
});

// Post submission
document.getElementById('btn-post')?.addEventListener('click', async () => {
    const content = contentTextarea.value.trim();
    if (!content) {
        showStatus('Please enter post content', 'error');
        return;
    }

    const platforms = {
        x: document.getElementById('platform-x').checked,
        linkedin: document.getElementById('platform-linkedin').checked,
        nostr: document.getElementById('platform-nostr').checked
    };

    if (!platforms.x && !platforms.linkedin && !platforms.nostr) {
        showStatus('Please select at least one platform', 'error');
        return;
    }

    const scheduleType = document.querySelector('input[name="schedule-type"]:checked').value;
    const scheduleTime = scheduleType === 'schedule' 
        ? document.getElementById('schedule-time').value 
        : null;

    const requireApproval = document.getElementById('require-approval').checked;

    const postData = {
        content,
        platforms,
        scheduleTime,
        requireApproval
    };

    try {
        showStatus('Posting...', 'info');
        
        // For MVP, call backend API
        const response = await fetch(`${API_BASE}/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        const result = await response.json();
        
        if (result.success) {
            showStatus(
                scheduleType === 'now' 
                    ? 'Posted successfully!' 
                    : 'Post scheduled successfully!',
                'success'
            );
            contentTextarea.value = '';
            charCount.textContent = '0';
        } else {
            showStatus(result.error || 'Failed to post', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
});

// Save draft
document.getElementById('btn-save-draft')?.addEventListener('click', () => {
    const content = contentTextarea.value.trim();
    if (!content) {
        showStatus('Please enter post content', 'error');
        return;
    }

    // Save to localStorage for now (MVP)
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]');
    drafts.push({
        id: Date.now(),
        content,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('drafts', JSON.stringify(drafts));

    showStatus('Draft saved!', 'success');
    contentTextarea.value = '';
    charCount.textContent = '0';
});

// Status message helper
function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.className = `mt-6 p-4 rounded-lg ${
        type === 'success' ? 'bg-green-900 text-green-200' :
        type === 'error' ? 'bg-red-900 text-red-200' :
        'bg-blue-900 text-blue-200'
    }`;
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');

    if (type !== 'info') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);
    }
}
