#!/usr/bin/env node
import fetch from 'node-fetch';

const token = "AQWEP25c70W5DDWRUwtDz1fn3Q38f5l7Cbb5iJYW8CQpIiA9AFXfjFk9yWF1khwguDMd4COApwcPAtyoWasS4jH4s7YBz6H0zOmz5Gm8gOfjcmzUPryppnfcW-wNMgMnRU-K8yjgSdmIWi_WM4TrKApI5BY15hABfDUSgiVazWhc80Dgojzgze-pjh2rIKIaa8LH6mmMhEiRn3Xd4z0SDSbrzcA29s9hhx7AZXvuEjTmFjrQAUQSmG2OKJ6LrfGhzR7XY91G_YJ1Fby7UJQE5J1xWfrXNQiWMX3_sGPgMgjEDk2qvPlkF-CJ5ALsSpZQBnz0YYD8g4smdDD7fxrRViSAnYHI0w";

console.log('Testing LinkedIn API with fetch (instead of https module)...\n');

// First: Get user ID
async function getUserId() {
    const response = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Restli-Protocol-Version': '2.0.0'
        }
    });
    
    const data = await response.json();
    console.log('User info:', data);
    return data.id;
}

// Second: Post to personal profile
async function testPost(userId) {
    const postData = {
        author: `urn:li:person:${userId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: "🚀 Testing MaxiSuite - LinkedIn integration working!"
                },
                shareMediaCategory: "NONE"
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };
    
    console.log('\nPosting to LinkedIn...');
    
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
    });
    
    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Response:', result);
}

getUserId()
    .then(userId => testPost(userId))
    .catch(err => console.error('Error:', err.message));
