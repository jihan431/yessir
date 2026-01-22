#!/bin/bash

# Deploy Script untuk Update Bot di VPS

echo "🚀 Deploy Bot Update ke VPS..."
echo "================================"

# Server details
SERVER="root@188.166.234.77"
BOT_DIR="/root/cekbio"

# Upload file yang sudah di-update
echo "📤 Uploading server.js..."
scp server.js $SERVER:$BOT_DIR/

echo "📤 Uploading FIX_DISCONNECT.md..."
scp FIX_DISCONNECT.md $SERVER:$BOT_DIR/

# Restart bot di VPS
echo "🔄 Restarting bot..."
ssh $SERVER << 'ENDSSH'
cd /root/cekbio
pm2 restart cekbio
sleep 2
pm2 log cekbio --lines 30 --nostream
ENDSSH

echo ""
echo "✅ Deploy selesai!"
echo ""
echo "Untuk monitoring, jalankan:"
echo "  ssh $SERVER"
echo "  pm2 log cekbio"
