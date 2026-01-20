/**
 * ============================================
 * BREVO EMAIL SENDER (Replacement for Nodemailer)
 * No SMTP needed - API based
 * 300 emails/day FREE
 * ============================================
 */

const axios = require('axios');

class BrevoEmailSender {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.brevo.com/v3/smtp/email';
    }

    async sendEmail(from, to, subject, text) {
        try {
            const response = await axios.post(this.baseURL, {
                sender: {
                    name: from.name || 'WhatsApp Appeal',
                    email: from.email
                },
                to: [{
                    email: to
                }],
                subject: subject,
                textContent: text
            }, {
                headers: {
                    'api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            return { success: true, messageId: response.data.messageId };
        } catch (error) {
            console.error('Brevo send error:', error.response?.data || error.message);
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async verify() {
        try {
            // Test API key validity
            await axios.get('https://api.brevo.com/v3/account', {
                headers: { 'api-key': this.apiKey }
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = BrevoEmailSender;

/**
 * CARA PAKAI:
 * 
 * 1. Daftar di https://www.brevo.com (GRATIS)
 * 2. Get API key dari Settings > SMTP & API
 * 3. Replace di fixred:
 * 
 *    const BrevoEmailSender = require('./brevo-sender');
 *    const sender = new BrevoEmailSender('YOUR_API_KEY');
 * 
 *    await sender.sendEmail(
 *        { email: 'your@gmail.com', name: 'Your Name' },
 *        'support@support.whatsapp.com',
 *        '',
 *        phoneNumber
 *    );
 */
