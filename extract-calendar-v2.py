#!/usr/bin/env python3
import re
import json

with open('../ARCADIAB-STRATEGY-FEB12-25-FINAL.md', 'r') as f:
    content = f.read()

# Split by section headers to get each day
sections = re.split(r'(###\s+(?:WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MONDAY|TUESDAY),\s+FEB\s+\d+)', content)

posts = []

for i in range(1, len(sections), 2):
    header = sections[i]
    body = sections[i+1] if i+1 < len(sections) else ""
    
    # Extract date from header
    date_match = re.search(r'FEB\s+(\d+)', header)
    if not date_match:
        continue
    
    day = int(date_match.group(1))
    current_date = f'2026-02-{day:02d}'
    
    # Find all Maxi X and Maxi Nostr posts in this section
    post_blocks = re.findall(
        r'\*\*(Maxi X|Maxi Nostr)\s+-\s+(\d+(?::\d+)?)\s+(AM|PM)\s+\([^)]+\)\*\*\s*\n\n"([^"]+)"',
        body,
        re.DOTALL
    )
    
    for platform, hour, period, text in post_blocks:
        # Convert time to 24-hour
        h = int(hour.split(':')[0] if ':' in hour else hour)
        m = hour.split(':')[1] if ':' in hour else '00'
        
        if period == 'PM' and h != 12:
            h += 12
        elif period == 'AM' and h == 12:
            h = 0
        
        time_24 = f"{h:02d}:{m}"
        
        # Clean up text
        clean_text = text.strip().replace('\n\n', '\n\n')
        
        # Skip placeholders
        if '[PLACEHOLDER' in clean_text:
            continue
        
        posts.append({
            'date': current_date,
            'time': time_24,
            'platforms': {
                'x': platform == 'Maxi X',
                'nostr': platform == 'Maxi Nostr',
                'linkedin': False
            },
            'account': '@Maxibtc2009' if platform == 'Maxi X' else 'Maxi Nostr',
            'content': clean_text
        })

# Filter Feb 12-16
launch_posts = [p for p in posts if p['date'] <= '2026-02-16']

print(f"Extracted {len(launch_posts)} posts for Feb 12-16:")
for p in launch_posts:
    print(f"  {p['date']} {p['time']} - {p['account']}: {p['content'][:60]}...")

with open('campaign-feb12-16.json', 'w') as f:
    json.dump(launch_posts, f, indent=2, ensure_ascii=False)

print(f"\n✅ Saved {len(launch_posts)} posts to campaign-feb12-16.json")
