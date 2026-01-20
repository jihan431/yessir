#!/bin/bash

# ============================================
# NGROK SMTP TUNNEL SETUP
# Bypass DigitalOcean SMTP block
# ============================================

echo "🚀 Setting up Ngrok SMTP Tunnel..."

# Check if ngrok installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok not installed!"
    echo ""
    echo "Install ngrok:"
    echo "1. Download: https://ngrok.com/download"
    echo "2. Or install via snap:"
    echo "   sudo snap install ngrok"
    exit 1
fi

# Check if authenticated
if ! ngrok config check &> /dev/null; then
    echo "⚠️  Ngrok not authenticated!"
    echo ""
    echo "Steps:"
    echo "1. Sign up di https://ngrok.com (GRATIS)"
    echo "2. Get auth token dari dashboard"
    echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

echo "✅ Ngrok sudah ready!"
echo ""
echo "🔧 Starting SMTP tunnel..."
echo "   Gmail SMTP: smtp.gmail.com:587"
echo ""

# Start tunnel
ngrok tcp smtp.gmail.com:587
