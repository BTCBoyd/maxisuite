#!/usr/bin/env node
/**
 * MaxiSuite - Post Now API
 * Execute a post immediately to X, LinkedIn, and/or Nostr
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Get post content from command line
const postId = process.argv[2];
const content = process.argv[3];
const platforms = JSON.parse(process.argv[4] || '{}');

if (!content || !platforms) {
    console.error('Usage: node post-now.mjs <postId> "<content>" \'{"x":true,"linkedin":false,"nostr":true}\'');
    process.exit(1);
}

const results = {
    postId: postId,
    timestamp: new Date().toISOString(),
    platforms: {},
    success: true
};

// Post to X (Twitter)
if (platforms.x) {
    try {
        console.log('Posting to X...');
        const xResult = execSync(
            `node ${resolve(__dirname, '../../x-post-library.mjs')} "${content.replace(/"/g, '\\"')}"`,
            { encoding: 'utf-8', cwd: resolve(__dirname, '../..') }
        );
        results.platforms.x = { success: true, response: xResult.trim() };
        console.log('✅ X posted');
    } catch (error) {
        results.platforms.x = { success: false, error: error.message };
        results.success = false;
        console.error('❌ X failed:', error.message);
    }
}

// Post to LinkedIn
if (platforms.linkedin) {
    try {
        console.log('Posting to LinkedIn...');
        
        // Read LinkedIn credentials
        const credsPath = resolve(process.env.HOME, '.openclaw/workspace/MAXI-CREDENTIALS.md');
        const creds = readFileSync(credsPath, 'utf-8');
        const tokenMatch = creds.match(/LinkedIn Access Token \(Updated[^)]*\)[^`]*Access Token:\s*`([^`]+)`/);
        const userIdMatch = creds.match(/Boyd's LinkedIn User ID:\s*`([^`]+)`/);
        
        if (!tokenMatch || !userIdMatch) {
            throw new Error('LinkedIn credentials not found');
        }
        
        const token = tokenMatch[1];
        const userId = userIdMatch[1];
        
        // Create LinkedIn post JSON
        const postData = {
            author: `urn:li:person:${userId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: { text: content },
                    shareMediaCategory: "NONE"
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        };
        
        const tmpFile = '/tmp/linkedin-post.json';
        require('fs').writeFileSync(tmpFile, JSON.stringify(postData));
        
        const linkedinResult = execSync(
            `curl -X POST "https://api.linkedin.com/v2/ugcPosts" \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json" \
            -H "X-Restli-Protocol-Version: 2.0.0" \
            -d @${tmpFile} 2>&1`,
            { encoding: 'utf-8' }
        );
        
        const linkedinJson = JSON.parse(linkedinResult);
        if (linkedinJson.id) {
            results.platforms.linkedin = { success: true, postId: linkedinJson.id };
            console.log('✅ LinkedIn posted');
        } else {
            throw new Error(linkedinResult);
        }
    } catch (error) {
        results.platforms.linkedin = { success: false, error: error.message };
        results.success = false;
        console.error('❌ LinkedIn failed:', error.message);
    }
}

// Post to Nostr
if (platforms.nostr) {
    try {
        console.log('Posting to Nostr...');
        const nostrResult = execSync(
            `node ${resolve(__dirname, '../../post-to-nostr.mjs')} "${content.replace(/"/g, '\\"')}"`,
            { encoding: 'utf-8', cwd: resolve(__dirname, '../..') }
        );
        results.platforms.nostr = { success: true, response: nostrResult.trim() };
        console.log('✅ Nostr posted');
    } catch (error) {
        results.platforms.nostr = { success: false, error: error.message };
        results.success = false;
        console.error('❌ Nostr failed:', error.message);
    }
}

// Output results as JSON
console.log(JSON.stringify(results, null, 2));
