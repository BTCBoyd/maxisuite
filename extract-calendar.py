#!/usr/bin/env python3
import re
import json

# Read approved calendar
with open('../ARCADIAB-STRATEGY-FEB12-25-FINAL.md', 'r') as f:
    lines = f.readlines()

posts = []
current_date = None

i = 0
while i < len(lines):
    line = lines[i].strip()
    
    # Detect date headers
    if re.match(r'###\s+(WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MONDAY|TUESDAY),\s+FEB\s+\d+', line):
        # Extract date
        match = re.search(r'FEB\s+(\d+)', line)
        if match:
            day = int(match.group(1))
            current_date = f'2026-02-{day:02d}'
            print(f"Found date: {current_date}")
    
    # Detect posts (Maxi X and Maxi Nostr only - accounts we have)
    if line.startswith('**Maxi X -') or line.startswith('**Maxi Nostr -'):
        platform = 'Maxi X' if 'Maxi X' in line else 'Maxi Nostr'
        time_match = re.search(r'(\d+(?::\d+)?)\s*(AM|PM)', line)
        
        if time_match and current_date:
            hour = time_match.group(1)
            period = time_match.group(2)
            
            # Convert to 24-hour
            if ':' in hour:
                h, m = hour.split(':')
            else:
                h = hour
                m = '00'
            
            h = int(h)
            if period == 'PM' and h != 12:
                h += 12
            elif period == 'AM' and h == 12:
                h = 0
            
            time_24 = f"{h:02d}:{m}"
            
            # Extract content (next non-empty line after the header, usually starts with quote)
            content_lines = []
            j = i + 1
            in_content = False
            
            while j < len(lines):
                l = lines[j].strip()
                
                # Skip empty lines until we find content
                if not l:
                    if in_content:
                        break  # End of content
                    j += 1
                    continue
                
                # Stop at next header or separator
                if l.startswith('**') or l.startswith('---') or l.startswith('###'):
                    break
                
                # Content line
                content_lines.append(l.strip('"'))
                in_content = True
                j += 1
            
            content = '\n\n'.join(content_lines).strip()
            
            # Skip placeholder or thread markers for now
            if content and not content.startswith('[PLACEHOLDER') and not content.startswith('🧵'):
                posts.append({
                    'date': current_date,
                    'time': time_24,
                    'platform': 'x' if platform == 'Maxi X' else 'nostr',
                    'account': '@Maxibtc2009' if platform == 'Maxi X' else 'Maxi Nostr',
                    'content': content
                })
                print(f"  → {platform} at {time_24}: {content[:60]}...")
    
    i += 1

# Filter only Feb 12-16 (through launch day)
launch_posts = [p for p in posts if p['date'] <= '2026-02-16']

print(f"\nTotal posts extracted (Feb 12-16): {len(launch_posts)}")

# Write to JSON for import
with open('campaign-data-feb12-16.json', 'w') as f:
    json.dump(launch_posts, f, indent=2, ensure_ascii=False)

print("✅ Saved to campaign-data-feb12-16.json")
