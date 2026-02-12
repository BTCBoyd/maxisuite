// MaxiSuite - Authentication
const AUTH_KEY = 'maxisuite-auth';

// Password hash (SHA-256 of the actual password)
// Set by Boyd on Feb 12, 2026
const VALID_PASSWORD_HASH = 'c04165d7efcb7f8929b91450e994bed228fdc6cfa64adc96811dfbe759ac9967';

// Hash password using SHA-256
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if user is authenticated
function isAuthenticated() {
    const auth = localStorage.getItem(AUTH_KEY);
    if (!auth) return false;
    
    try {
        const data = JSON.parse(auth);
        // Session expires after 24 hours
        if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(AUTH_KEY);
            return false;
        }
        return data.authenticated === true;
    } catch {
        return false;
    }
}

// Require authentication (call at top of every page)
function requireAuth() {
    if (!isAuthenticated() && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// Handle login form
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const hash = await hashPassword(password);
    
    if (hash === VALID_PASSWORD_HASH) {
        // Store authentication
        localStorage.setItem(AUTH_KEY, JSON.stringify({
            authenticated: true,
            timestamp: Date.now()
        }));
        
        // Redirect to dashboard
        window.location.href = 'index.html';
    } else {
        // Show error
        document.getElementById('error').classList.remove('hidden');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
});

// Logout function
window.logout = function() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
};
