#!/bin/bash
# Show MaxiSuite scheduler status

QUEUE_FILE="/home/futurebit/.openclaw/workspace/maxisuite-queue.json"
LOG_FILE="/home/futurebit/.openclaw/workspace/maxisuite-scheduler.log"

echo "=== MaxiSuite Scheduler Status ==="
echo ""

# Check if queue exists
if [ ! -f "$QUEUE_FILE" ]; then
    echo "❌ Queue file not found"
    exit 1
fi

# Show queue stats
total=$(cat "$QUEUE_FILE" | jq 'length')
scheduled=$(cat "$QUEUE_FILE" | jq '[.[] | select(.status == "scheduled")] | length')
posted=$(cat "$QUEUE_FILE" | jq '[.[] | select(.status == "posted")] | length')
failed=$(cat "$QUEUE_FILE" | jq '[.[] | select(.status == "failed")] | length')

echo "📊 Queue Stats:"
echo "   Total posts: $total"
echo "   Scheduled: $scheduled"
echo "   Posted: $posted"
echo "   Failed: $failed"
echo ""

# Show upcoming posts
echo "📅 Next 5 Scheduled Posts:"
cat "$QUEUE_FILE" | jq -r '.[] | select(.status == "scheduled") | "\(.scheduledFor) - \(.platforms | to_entries | map(select(.value == true) | .key) | join(", ")) - \(.content[0:60])..."' | head -5
echo ""

# Show recent log entries
if [ -f "$LOG_FILE" ]; then
    echo "📝 Recent Log (last 10 lines):"
    tail -10 "$LOG_FILE"
else
    echo "📝 No log file yet"
fi
