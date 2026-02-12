#!/usr/bin/env node
/**
 * Unified posting API for MaxiSuite
 * Handles X, LinkedIn, and Nostr posting
 */

import { execSync } from 'child_process';
import { postToLinkedIn } from './linkedin-oauth.mjs';

// Credentials paths (read from environment or files)
const X_POST_SCRIPT = '/home/futurebit/.openclaw/workspace/x-post-library.mjs';
const NOSTR_POST_SCRIPT = '/home/futurebit/.openclaw/workspace/post-to-nostr.mjs';
const NOSTR_KEY_FILE = '/home/futurebit/.clawstr/secret.key';

/**
 * Post to multiple platforms
 */
export async function postUnified(content, platforms, options = {}) {
    const results = {
        success: true,
        platforms: {}
    };

    // Post to X
    if (platforms.x) {
        try {
            const output = execSync(`node ${X_POST_SCRIPT} "${content.replace(/"/g, '\\"')}"`, {
                encoding: 'utf-8'
            });
            const match = output.match(/id.*?["'](\d+)["']/);
            results.platforms.x = {
                success: true,
                postId: match ? match[1] : null,
                output
            };
        } catch (error) {
            results.success = false;
            results.platforms.x = {
                success: false,
                error: error.message
            };
        }
    }

    // Post to LinkedIn
    if (platforms.linkedin) {
        try {
            if (!options.linkedinToken) {
                throw new Error('LinkedIn access token required');
            }
            const linkedinResult = await postToLinkedIn(options.linkedinToken, content);
            results.platforms.linkedin = {
                success: true,
                postId: linkedinResult.postId
            };
        } catch (error) {
            results.success = false;
            results.platforms.linkedin = {
                success: false,
                error: error.message
            };
        }
    }

    // Post to Nostr
    if (platforms.nostr) {
        try {
            const output = execSync(
                `NOSTR_PRIVATE_KEY=$(cat ${NOSTR_KEY_FILE}) node ${NOSTR_POST_SCRIPT} "${content.replace(/"/g, '\\"')}"`,
                { encoding: 'utf-8', shell: '/bin/bash' }
            );
            const match = output.match(/([a-f0-9]{64})/);
            results.platforms.nostr = {
                success: true,
                eventId: match ? match[1] : null,
                output
            };
        } catch (error) {
            results.success = false;
            results.platforms.nostr = {
                success: false,
                error: error.message
            };
        }
    }

    return results;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const content = process.argv[2];
    const platforms = {
        x: process.argv.includes('--x'),
        linkedin: process.argv.includes('--linkedin'),
        nostr: process.argv.includes('--nostr')
    };

    if (!content) {
        console.error('Usage: node post-unified.mjs "<content>" [--x] [--linkedin] [--nostr]');
        process.exit(1);
    }

    if (!platforms.x && !platforms.linkedin && !platforms.nostr) {
        console.error('Error: Specify at least one platform (--x, --linkedin, --nostr)');
        process.exit(1);
    }

    // LinkedIn token from env if needed
    const linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN;

    postUnified(content, platforms, { linkedinToken })
        .then(results => {
            console.log(JSON.stringify(results, null, 2));
            if (!results.success) {
                process.exit(1);
            }
        })
        .catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
}
