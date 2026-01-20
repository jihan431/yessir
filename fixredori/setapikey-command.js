// Command untuk set MailerSend API Key
bot.onText(/\/setapikey(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (!isOwner(userId)) return bot.sendMessage(chatId, '❌ Khusus Owner!');

    const apiKey = match[1] ? match[1].trim() : null;

    if (!apiKey) {
        return bot.sendMessage(chatId,
`❌ <b>Format salah!</b>

📝 Usage:
<code>/setapikey YOUR_API_KEY_HERE</code>

💡 Cara dapet API key:
1. Login ke https://www.mailersend.com
2. Settings > API Tokens
3. Create new token
4. Copy & paste di sini`,
            { parse_mode: 'HTML' }
        );
    }

    log('info', `Owner setting MailerSend API key...`);
    
    const testingMsg = await bot.sendMessage(chatId, '⏳ Testing API key...');

    try {
        // Test API key validity
        const sender = new MailerSendEmailSender(apiKey);
        const isValid = await sender.verify();

        if (isValid) {
            // Save to config
            config.MAILERSEND_CONFIG = {
                apiKey: apiKey,
                fromEmail: config.MAILERSEND_CONFIG?.fromEmail || 'noreply@trial.mailersend.net',
                fromName: config.MAILERSEND_CONFIG?.fromName || 'WhatsApp Appeal Bot'
            };
            
            configManager.updateConfig(config);
            
            bot.editMessageText(
`✅ <b>API KEY BERHASIL DISIMPAN!</b>
━━━━━━━━━━━━━━━━━━━━━

🔑 Key: <code>${apiKey.substring(0, 8)}****</code>
📧 From: <code>${config.MAILERSEND_CONFIG.fromEmail}</code>
👤 Name: ${config.MAILERSEND_CONFIG.fromName}

📊 <b>Account Info:</b>
• Limit: 12,000 emails/month
• Free tier: 400 emails/day

✅ Bot ready to send emails!

💡 Gunakan /testemail untuk test kirim`,
                { chat_id: chatId, message_id: testingMsg.message_id, parse_mode: 'HTML' }
            );
            
            log('success', 'MailerSend API key saved successfully');
        } else {
            bot.editMessageText(
`❌ <b>API KEY TIDAK VALID!</b>
━━━━━━━━━━━━━━━━━━━━━

🔴 API key tidak bisa diverifikasi

💡 Solusi:
1. Check API key di dashboard MailerSend
2. Pastikan token belum expired
3. Generate new token kalau perlu

Dashboard: https://www.mailersend.com/settings`,
                { chat_id: chatId, message_id: testingMsg.message_id, parse_mode: 'HTML' }
            );
            
            log('error', 'Invalid MailerSend API key provided');
        }
    } catch (error) {
        bot.editMessageText(
`❌ <b>ERROR TESTING API KEY!</b>
━━━━━━━━━━━━━━━━━━━━━

🔴 ${error.message}

💡 Check network connection & API key format`,
            { chat_id: chatId, message_id: testingMsg.message_id, parse_mode: 'HTML' }
        );
        
        log('error', `MailerSend API test error: ${error.message}`);
    }
});
