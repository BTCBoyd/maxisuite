#!/bin/bash
# Deploy MaxiSuite to Netlify

echo "📦 Preparing MaxiSuite for deployment..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=. --site=maxisuite

echo "✅ Deployment complete!"
echo "🌐 Live at: https://maxisuite.netlify.app"
