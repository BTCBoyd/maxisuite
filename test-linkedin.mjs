#!/usr/bin/env node
import https from 'https';

const token = process.argv[2];

if (!token) {
    console.error('Usage: node test-linkedin.mjs <token>');
    process.exit(1);
}

// Test 1: Get user info
console.log('Testing LinkedIn API access...\n');

const options = {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0'
    },
    timeout: 10000
};

const req = https.request('https://api.linkedin.com/v2/me', options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', JSON.parse(data));
    });
});

req.on('error', err => console.error('Error:', err.message));
req.on('timeout', () => {
    console.error('Request timed out');
    req.destroy();
});
req.end();
