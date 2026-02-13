#!/usr/bin/env node
/**
 * Sync MaxiSuite localStorage queue to file for cron scheduler
 * This bridges the gap between browser UI and server-side posting
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const QUEUE_FILE = resolve(process.env.HOME, '.openclaw/workspace/maxisuite-queue.json');

// This will be populated by the full campaign data
import { fullCampaignData } from './js/auto-import-full-campaign.js';

function generateQueueFromCampaign() {
    const queue = [];
    const now = new Date();
    
    fullCampaignData.forEach(post => {
        const scheduledFor = `${post.date}T${post.time}:00-06:00`; // CST
        const scheduledDate = new Date(scheduledFor);
        const hoursPast = (now - scheduledDate) / (1000 * 60 * 60);
        
        // Determine status
        const isPosted = hoursPast > 1;
        
        queue.push({
            id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            content: post.content,
            platforms: post.platforms,
            scheduledFor: scheduledFor,
            requiresApproval: false,
            status: isPosted ? 'posted' : 'scheduled',
            createdAt: new Date().toISOString(),
            postedAt: isPosted ? scheduledFor : null,
            account: post.account,
            contentType: post.type
        });
    });
    
    return queue;
}

// Generate and save
const queue = generateQueueFromCampaign();
writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

console.log(`✅ Synced ${queue.length} posts to ${QUEUE_FILE}`);
console.log(`📊 Status breakdown:`);
const statusCounts = {};
queue.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
});
Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
});
