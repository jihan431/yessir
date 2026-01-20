/**
 * ============================================
 * MULTI-PROVIDER EMAIL ROTATION
 * Rotate between multiple email services
 * TOTAL: 20,000+ emails/month FREE!
 * ============================================
 */

const MailerSend = require('./mailersend-sender');
const Brevo = require('./brevo-sender');
const SMTP2GO = require('./smtp2go-sender');

class MultiProviderEmailSender {
    constructor(config) {
        this.providers = [];
        this.currentIndex = 0;
        this.stats = new Map();

        // Initialize providers
        if (config.mailersend) {
            this.providers.push({
                name: 'MailerSend',
                sender: new MailerSend(config.mailersend.apiKey),
                from: config.mailersend.from,
                limit: 12000 // per month
            });
        }

        if (config.brevo) {
            this.providers.push({
                name: 'Brevo',
                sender: new Brevo(config.brevo.apiKey),
                from: config.brevo.from,
                limit: 9000 // 300/day × 30
            });
        }

        if (config.smtp2go) {
            this.providers.push({
                name: 'SMTP2GO',
                sender: new SMTP2GO(config.smtp2go.username, config.smtp2go.password),
                from: config.smtp2go.from,
                limit: 1000
            });
        }

        // Initialize stats
        this.providers.forEach(p => {
            this.stats.set(p.name, { sent: 0, failed: 0 });
        });
    }

    getNextProvider() {
        if (this.providers.length === 0) return null;
        
        const provider = this.providers[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.providers.length;
        
        return provider;
    }

    async sendEmail(to, subject, text) {
        const maxRetries = this.providers.length;
        let lastError = null;

        for (let i = 0; i < maxRetries; i++) {
            const provider = this.getNextProvider();
            
            if (!provider) {
                return { success: false, error: 'No providers configured' };
            }

            console.log(`[MultiProvider] Trying ${provider.name}...`);

            try {
                const result = await provider.sender.sendEmail(
                    provider.from,
                    to,
                    subject,
                    text
                );

                if (result.success) {
                    const stats = this.stats.get(provider.name);
                    stats.sent++;
                    this.stats.set(provider.name, stats);
                    
                    console.log(`[MultiProvider] ✅ Sent via ${provider.name}`);
                    return { success: true, provider: provider.name, messageId: result.messageId };
                }

                lastError = result.error;
                const stats = this.stats.get(provider.name);
                stats.failed++;
                this.stats.set(provider.name, stats);
            } catch (error) {
                lastError = error.message;
                console.error(`[MultiProvider] ❌ ${provider.name} failed:`, error.message);
            }
        }

        return { success: false, error: lastError || 'All providers failed' };
    }

    async verifyAllProviders() {
        const results = [];
        
        for (const provider of this.providers) {
            const isValid = await provider.sender.verify();
            results.push({
                name: provider.name,
                valid: isValid,
                limit: provider.limit
            });
        }

        return results;
    }

    getStats() {
        const totalStats = {
            total: 0,
            sent: 0,
            failed: 0,
            providers: []
        };

        this.stats.forEach((stats, name) => {
            totalStats.sent += stats.sent;
            totalStats.failed += stats.failed;
            totalStats.total += stats.sent + stats.failed;
            
            totalStats.providers.push({
                name,
                ...stats
            });
        });

        return totalStats;
    }
}

module.exports = MultiProviderEmailSender;

/**
 * SETUP GUIDE:
 * 
 * 1. Setup semua provider (MailerSend, Brevo, SMTP2GO)
 * 2. Configure:
 * 
 * const MultiProvider = require('./multi-provider-sender');
 * 
 * const sender = new MultiProvider({
 *     mailersend: {
 *         apiKey: 'YOUR_MAILERSEND_KEY',
 *         from: { email: 'noreply@trial.mailersend.net', name: 'Appeal Bot' }
 *     },
 *     brevo: {
 *         apiKey: 'YOUR_BREVO_KEY',
 *         from: { email: 'your@email.com', name: 'Appeal Bot' }
 *     },
 *     smtp2go: {
 *         username: 'YOUR_USERNAME',
 *         password: 'YOUR_PASSWORD',
 *         from: 'your@email.com'
 *     }
 * });
 * 
 * 3. Send email:
 * const result = await sender.sendEmail(
 *     'support@support.whatsapp.com',
 *     '',
 *     '+6281234567890'
 * );
 * 
 * 4. View stats:
 * console.log(sender.getStats());
 * 
 * BENEFITS:
 * ✅ Auto failover jika satu provider down
 * ✅ Distribute load across providers
 * ✅ Total: 22,000 emails/month FREE
 * ✅ Track stats per provider
 */
