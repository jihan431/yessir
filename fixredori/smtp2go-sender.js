/**
 * ============================================
 * SMTP2GO CONFIG - SMTP BYPASS SOLUTION
 * Uses Port 2525 (NOT BLOCKED by DigitalOcean!)
 * 1,000 emails/month FREE
 * ============================================
 */

const nodemailer = require('nodemailer');

class SMTP2GOSender {
    constructor(username, password) {
        this.transporter = nodemailer.createTransport({
            host: 'mail.smtp2go.com',
            port: 2525, // Port alternatif yang TIDAK diblock!
            // Bisa juga pakai: 8025, 80, atau 25
            secure: false, // false untuk port 2525
            auth: {
                user: username,  // SMTP2GO username
                pass: password   // SMTP2GO password
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async sendEmail(from, to, subject, text) {
        try {
            const info = await this.transporter.sendMail({
                from: from,
                to: to,
                subject: subject || '',
                text: text
            });
            
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('SMTP2GO error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async verify() {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = SMTP2GOSender;

/**
 * SETUP GUIDE:
 * 
 * 1. Daftar di https://www.smtp2go.com (GRATIS)
 * 2. Verify email address yang mau dipake
 * 3. Settings > Users > Create SMTP User
 * 4. Catat username & password
 * 
 * 5. Usage:
 *    const SMTP2GO = require('./smtp2go-sender');
 *    const sender = new SMTP2GO('username', 'password');
 *    
 *    await sender.sendEmail(
 *        'your@verified-email.com',
 *        'support@support.whatsapp.com',
 *        '',
 *        '+6281234567890'
 *    );
 * 
 * KEUNGGULAN:
 * ✅ Pakai SMTP (seperti Gmail, gak perlu ubah banyak code)
 * ✅ Port 2525 TIDAK diblock DigitalOcean
 * ✅ Alternative ports: 8025, 80, 25
 * ✅ Bisa langsung jalan di VPS
 */
