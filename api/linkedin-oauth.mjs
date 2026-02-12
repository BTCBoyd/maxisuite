#!/usr/bin/env node
/**
 * LinkedIn OAuth 2.0 Implementation for MaxiSuite
 */

import https from 'https';
import { URL, URLSearchParams } from 'url';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// LinkedIn API Credentials (from environment or credentials file)
const getCredentials = () => {
    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
        return {
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'https://maxisuite.netlify.app/callback/linkedin'
        };
    }
    
    // Fallback: read from credentials file (Solo Node only)
    try {
        const credsPath = resolve(process.env.HOME, '.openclaw/workspace/MAXI-CREDENTIALS.md');
        const content = readFileSync(credsPath, 'utf-8');
        const clientIdMatch = content.match(/Client ID:\s*`?([^`\n]+)`?/);
        const clientSecretMatch = content.match(/Client Secret:\s*`?([^`\n]+)`?/);
        const redirectUriMatch = content.match(/Redirect URI:\s*`?([^`\n]+)`?/);
        
        if (!clientIdMatch || !clientSecretMatch) {
            throw new Error('LinkedIn credentials not found');
        }
        
        return {
            clientId: clientIdMatch[1].trim(),
            clientSecret: clientSecretMatch[1].trim(),
            redirectUri: redirectUriMatch ? redirectUriMatch[1].trim() : 'https://maxisuite.netlify.app/callback/linkedin'
        };
    } catch (error) {
        throw new Error('LinkedIn credentials not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET env vars.');
    }
};

// OAuth endpoints
const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API_BASE = 'https://api.linkedin.com/v2';

/**
 * Step 1: Generate authorization URL
 */
export function getAuthorizationUrl(state = Math.random().toString(36).substring(7)) {
    const { clientId, redirectUri } = getCredentials();
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        state: state,
        scope: 'w_member_social'
    });

    return `${AUTH_URL}?${params.toString()}`;
}

/**
 * Step 2: Exchange authorization code for access token
 */
export function exchangeCodeForToken(authCode) {
    const { clientId, clientSecret, redirectUri } = getCredentials();
    
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': params.toString().length
            }
        };

        const req = https.request(TOKEN_URL, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Token exchange failed: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(params.toString());
        req.end();
    });
}

/**
 * Step 3: Post to LinkedIn
 */
export function postToLinkedIn(accessToken, content, options = {}) {
    return new Promise((resolve, reject) => {
        getUserInfo(accessToken).then(userInfo => {
            const postData = {
                author: `urn:li:person:${userInfo.id}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: content
                        },
                        shareMediaCategory: options.media ? 'IMAGE' : 'NONE'
                    }
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                }
            };

            const postDataString = JSON.stringify(postData);

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Content-Length': Buffer.byteLength(postDataString)
                }
            };

            const req = https.request(`${API_BASE}/ugcPosts`, requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 201) {
                        const response = JSON.parse(data);
                        resolve({
                            success: true,
                            postId: response.id,
                            url: response.id
                        });
                    } else {
                        reject(new Error(`LinkedIn post failed (${res.statusCode}): ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postDataString);
            req.end();
        }).catch(reject);
    });
}

/**
 * Helper: Get user info
 */
function getUserInfo(accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        };

        const req = https.request(`${API_BASE}/me`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Failed to get user info: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];

    if (command === 'auth-url') {
        console.log('Visit this URL to authorize:');
        console.log(getAuthorizationUrl());
    } else if (command === 'exchange-token') {
        const code = process.argv[3];
        if (!code) {
            console.error('Usage: node linkedin-oauth.mjs exchange-token <code>');
            process.exit(1);
        }
        exchangeCodeForToken(code)
            .then(result => console.log(JSON.stringify(result, null, 2)))
            .catch(err => console.error('Error:', err.message));
    } else if (command === 'post') {
        const token = process.argv[3];
        const content = process.argv[4];
        if (!token || !content) {
            console.error('Usage: node linkedin-oauth.mjs post <token> "<content>"');
            process.exit(1);
        }
        postToLinkedIn(token, content)
            .then(result => console.log('✅ Posted:', result))
            .catch(err => console.error('❌ Error:', err.message));
    } else {
        console.log('Commands:');
        console.log('  auth-url              Generate authorization URL');
        console.log('  exchange-token <code> Exchange auth code for access token');
        console.log('  post <token> <text>   Post to LinkedIn');
    }
}
