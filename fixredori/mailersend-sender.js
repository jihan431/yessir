/**
 * ============================================
 * MAILERSEND EMAIL SENDER
 * 12,000 emails/month FREE (400/day)
 * ============================================
 */

const axios = require('axios');

class MailerSendEmailSender {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.mailersend.com/v1';
    }

    async sendEmail(from, to, subject, text) {
        try {
            const response = await axios.post(`${this.baseURL}/email`, {
                from: {
                    email: from.email,
                    name: from.name || 'WhatsApp Appeal'
                },
                to: [{
                    email: to
                }],
                subject: subject || ' ',  // MailerSend requires non-empty subject
                text: text
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return { success: true, messageId: response.headers['x-message-id'] };
        } catch (error) {
            console.error('MailerSend error:', error.response?.data || error.message);
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async verify() {
        try {
            await axios.get(`${this.baseURL}/token`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async getStats() {
        try {
            const response = await axios.get(`${this.baseURL}/analytics/date`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
                params: {
                    date_from: new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0],
                    date_to: new Date().toISOString().split('T')[0]
                }
            });
            return response.data;
        } catch (error) {
            return null;
        }
    }
}

module.exports = MailerSendEmailSender;

/**
 * SETUP GUIDE:
 * 
 * 1. Daftar di https://www.mailersend.com (GRATIS)
 * 2. Verify domain ATAU pakai default @trial.mailersend.net
 * 3. Generate API token (Settings > API Tokens)
 * 4. Install axios:
 *    npm install axios
 * 
 * 5. Usage:
 *    const MailerSend = require('./mailersend-sender');
 *    const sender = new MailerSend('YOUR_API_KEY');
 *    
 *    await sender.sendEmail(
 *        { email: 'noreply@trial.mailersend.net', name: 'Appeal Bot' },
 *        'support@support.whatsapp.com',
 *        '',
 *        '+6281234567890'
 *    );
 */
