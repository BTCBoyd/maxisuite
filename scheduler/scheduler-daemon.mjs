#!/usr/bin/env node
/**
 * MaxiSuite Scheduler Daemon
 * Runs continuously as systemd service
 * Checks queue every 15 minutes
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes
const SCRIPT_PATH = resolve(process.cwd(), 'check-queue.mjs');

function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

async function runScheduler() {
    try {
        log('Running scheduler check...');
        execSync(`node ${SCRIPT_PATH}`, { 
            encoding: 'utf-8',
            stdio: 'inherit'
        });
        log('Scheduler check complete');
    } catch (error) {
        log(`ERROR: Scheduler check failed: ${error.message}`);
    }
}

// Initial run
log('MaxiSuite Scheduler Daemon starting...');
runScheduler();

// Schedule recurring runs
setInterval(runScheduler, CHECK_INTERVAL);

log(`Scheduler running - will check every ${CHECK_INTERVAL / 60000} minutes`);

// Keep process alive
process.on('SIGTERM', () => {
    log('Received SIGTERM - shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('Received SIGINT - shutting down gracefully');
    process.exit(0);
});
