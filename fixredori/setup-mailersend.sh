#!/bin/bash

# Quick setup script for MailerSend

echo "🚀 MailerSend Quick Setup"
echo "=========================="
echo ""

read -p "📝 Paste MailerSend API Key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ API Key tidak boleh kosong!"
    exit 1
fi

echo ""
echo "⏳ Updating bot-config.json..."

# Update bot-config.json
cat > /home/lyon/Documents/tools/fixredori/bot-config.json <<EOF
{
  "TELEGRAM_BOT_TOKEN": "8338772881:AAF4SSt_Jc9ljE1vQtlz-PlyWt36hQx7aAM",
  "MAILERSEND_CONFIG": {
    "apiKey": "$API_KEY",
    "fromEmail": "noreply@trial.mailersend.net",
    "fromName": "WhatsApp Appeal Bot"
  },
  "OWNER_ID": "6726423168",
  "ADDITIONAL_OWNERS": ["7179899967"],
  "GRUP_ONLY": false,
  "MAINTENANCE": false
}
EOF

echo "✅ Config updated!"
echo ""
echo "📋 Next steps:"
echo "1. cd /home/lyon/Documents/tools/fixredori"
echo "2. node index.js"
echo "3. Test with /testemail di Telegram"
echo ""
