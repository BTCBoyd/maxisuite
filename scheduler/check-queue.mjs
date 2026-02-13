#!/usr/bin/env node
/**
 * MaxiSuite Scheduler - Check queue and post due items
 * Run via cron every 15 minutes
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const QUEUE_FILE = resolve(process.env.HOME, '.openclaw/workspace/maxisuite-queue.json');
const LOG_FILE = resolve(process.env.HOME, '.openclaw/workspace/maxisuite-scheduler.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    console.log(message);
    
    try {
        writeFileSync(LOG_FILE, logLine, { flag: 'a' });
    } catch (err) {
        console.error('Failed to write log:', err.message);
    }
}

function loadQueue() {
    if (!existsSync(QUEUE_FILE)) {
        log('Queue file does not exist, creating empty queue');
        return [];
    }
    
    try {
        const data = readFileSync(QUEUE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        log(`ERROR loading queue: ${err.message}`);
        return [];
    }
}

function saveQueue(queue) {
    try {
        writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
        log('Queue saved successfully');
    } catch (err) {
        log(`ERROR saving queue: ${err.message}`);
    }
}

function shouldPost(scheduledTime) {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    
    // Post if scheduled time is within the last 15 minutes or is now/past
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    return scheduled >= fifteenMinutesAgo && scheduled <= now;
}

function postToX(content) {
    try {
        const result = execSync(
            `node ${resolve(process.env.HOME, '.openclaw/workspace/x-post-library.mjs')} "${content.replace(/"/g, '\\"')}"`,
            { encoding: 'utf-8', timeout: 30000 }
        );
        return { success: true, output: result };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function postToNostr(content) {
    try {
        const result = execSync(
            `node ${resolve(process.env.HOME, '.openclaw/workspace/post-to-nostr.mjs')} "${content.replace(/"/g, '\\"')}"`,
            { encoding: 'utf-8', timeout: 30000 }
        );
        return { success: true, output: result };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function postToLinkedIn(content) {
    try {
        // Read credentials
        const credsPath = resolve(process.env.HOME, '.openclaw/workspace/MAXI-CREDENTIALS.md');
        const creds = readFileSync(credsPath, 'utf-8');
        const tokenMatch = creds.match(/LinkedIn Access Token \(Updated[^)]*\)[^`]*Access Token:\s*`([^`]+)`/);
        const userIdMatch = creds.match(/Boyd's LinkedIn User ID:\s*`([^`]+)`/);
        
        if (!tokenMatch || !userIdMatch) {
            throw new Error('LinkedIn credentials not found');
        }
        
        const token = tokenMatch[1];
        const userId = userIdMatch[1];
        
        // Create post data
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
        writeFileSync(tmpFile, JSON.stringify(postData));
        
        const result = execSync(
            `curl -X POST "https://api.linkedin.com/v2/ugcPosts" \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json" \
            -H "X-Restli-Protocol-Version: 2.0.0" \
            -d @${tmpFile} 2>&1`,
            { encoding: 'utf-8', timeout: 30000 }
        );
        
        const resultJson = JSON.parse(result);
        if (resultJson.id) {
            return { success: true, postId: resultJson.id };
        } else {
            throw new Error(result);
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Main execution
log('=== MaxiSuite Scheduler Check ===');

const queue = loadQueue();
const now = new Date();
const dueNow = queue.filter(post => post.status === 'scheduled' && shouldPost(post.scheduledFor));

log(`Checked queue: ${queue.length} total posts, ${dueNow.length} due now`);

if (dueNow.length === 0) {
    log('No posts due, exiting');
    process.exit(0);
}

// Process each due post
for (const post of dueNow) {
    log(`Processing post ${post.id}: "${post.content.substring(0, 50)}..."`);
    
    const results = {};
    let allSucceeded = true;
    
    // Post to each platform
    if (post.platforms.x) {
        log('  → Posting to X...');
        const result = postToX(post.content);
        results.x = result;
        if (result.success) {
            log('  ✅ X posted successfully');
        } else {
            log(`  ❌ X failed: ${result.error}`);
            allSucceeded = false;
        }
    }
    
    if (post.platforms.nostr) {
        log('  → Posting to Nostr...');
        const result = postToNostr(post.content);
        results.nostr = result;
        if (result.success) {
            log('  ✅ Nostr posted successfully');
        } else {
            log(`  ❌ Nostr failed: ${result.error}`);
            allSucceeded = false;
        }
    }
    
    if (post.platforms.linkedin) {
        log('  → Posting to LinkedIn...');
        const result = postToLinkedIn(post.content);
        results.linkedin = result;
        if (result.success) {
            log('  ✅ LinkedIn posted successfully');
        } else {
            log(`  ❌ LinkedIn failed: ${result.error}`);
            allSucceeded = false;
        }
    }
    
    // Update post status
    post.status = allSucceeded ? 'posted' : 'failed';
    post.postedAt = new Date().toISOString();
    post.results = results;
}

// Save updated queue
saveQueue(queue);

log(`=== Scheduler Complete: ${dueNow.length} posts processed ===`);
