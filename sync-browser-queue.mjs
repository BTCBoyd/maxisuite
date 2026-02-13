#!/usr/bin/env node
/**
 * Sync file-based queue to browser auto-import script
 * Run this whenever file queue is updated
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const queueFile = resolve(process.env.HOME, '.openclaw/workspace/maxisuite-queue.json');
const outputFile = resolve(process.env.HOME, '.openclaw/workspace/maxisuite/js/auto-import-full-campaign.js');

// Read current queue
const queue = JSON.parse(readFileSync(queueFile, 'utf-8'));

// Extract only scheduled posts
const scheduled = queue.filter(p => p.status === 'scheduled' || p.status === 'posted');

// Convert to campaign data format
const campaignData = scheduled.map(post => {
  const date = post.scheduledFor.split('T')[0];
  const time = post.scheduledFor.split('T')[1].split(':').slice(0, 2).join(':');
  
  return {
    date,
    time,
    platforms: post.platforms,
    account: post.account,
    content: post.content,
    type: post.contentType || 'general'
  };
});

// Generate JavaScript file
const jsContent = `// MaxiSuite - Full Campaign Auto-Import (Feb 13 - Mar 6, 2026)
// Auto-synced from file-based queue
const QUEUE_KEY = 'maxisuite-queue';
const IMPORT_FLAG_KEY = 'maxisuite-campaign-imported-full';

const fullCampaignData = ${JSON.stringify(campaignData, null, 2)};

// Auto-import if not already done
function autoImportFullCampaign() {
    const alreadyImported = localStorage.getItem(IMPORT_FLAG_KEY);
    
    if (!alreadyImported) {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        
        if (queue.length === 0) {
            console.log('Auto-importing campaign...');
            
            fullCampaignData.forEach((post, i) => {
                const scheduledFor = \`\${post.date}T\${post.time}:00-06:00\`; // CST
                const now = new Date();
                const scheduledDate = new Date(scheduledFor);
                const hoursPast = (now - scheduledDate) / (1000 * 60 * 60);
                
                queue.push({
                    id: 'post_' + Date.now() + '_' + i,
                    content: post.content,
                    platforms: post.platforms,
                    scheduledFor: scheduledFor,
                    requiresApproval: false,
                    status: hoursPast > 1 ? 'posted' : 'scheduled',
                    createdAt: new Date().toISOString(),
                    postedAt: hoursPast > 1 ? scheduledFor : null,
                    account: post.account,
                    contentType: post.type
                });
            });
            
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            localStorage.setItem(IMPORT_FLAG_KEY, 'true');
            
            console.log(\`✅ Auto-imported \${fullCampaignData.length} posts\`);
        }
    }
}

// Run on page load
autoImportFullCampaign();
`;

writeFileSync(outputFile, jsContent);

console.log(`✅ Synced ${campaignData.length} posts to browser import script`);
console.log(`LinkedIn-enabled: ${campaignData.filter(p => p.platforms.linkedin).length}`);
console.log(`File: ${outputFile}`);
