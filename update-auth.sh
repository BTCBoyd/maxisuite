#!/bin/bash
# Add auth requirement to all pages

for file in index.html queue.html calendar.html import-campaign.html; do
    if [ -f "$file" ]; then
        # Add auth.js script before closing body tag if not already present
        if ! grep -q "auth.js" "$file"; then
            sed -i 's|</body>|    <script src="js/auth.js"></script>\n    <script>requireAuth();</script>\n</body>|' "$file"
            echo "✅ Added auth to $file"
        fi
        
        # Add logout button to nav if not already present
        if ! grep -q "logout()" "$file"; then
            sed -i 's|</nav>|                <button onclick="logout()" class="text-gray-400 hover:text-red-400 text-sm">Logout</button>\n            </div>\n        </div>\n    </nav>|' "$file"
            # Fix the closing div
            sed -i 's|</div>\n        </div>\n    </nav>|</nav>|' "$file"
            echo "✅ Added logout button to $file"
        fi
    fi
done

echo "✅ All pages updated with authentication"
