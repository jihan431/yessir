# 🚀 Quick Setup Guide - Bypass SMTP Block

## 📋 Pilihan yang Sudah Disiapkan:

### Option 1: SMTP2GO (PALING CEPAT!) ⚡
**Kenapa:** Pakai port 2525 (tidak diblock), setup mirip Gmail
**Limit:** 1,000 email/bulan
**Setup time:** 5 menit

#### Step-by-step:
```bash
# 1. Daftar SMTP2GO
https://www.smtp2go.com/pricing/

# 2. Verify email kamu (yang mau dipake kirim)

# 3. Buat SMTP User:
Settings > Users > Create SMTP User
# Simpan: username & password

# 4. Install axios (kalau belum)
cd /home/lyon/Documents/tools/fixredori
npm install axios

# 5. Edit fixredori/index.js
# Ganti bagian nodemailer dengan:
```

```javascript
const SMTP2GO = require('./smtp2go-sender');
const emailSender = new SMTP2GO('YOUR_USERNAME', 'YOUR_PASSWORD');

// Ganti fungsi sendAppealEmail():
async function sendAppealEmail(phoneNumber, userId) {
    // ... kode lain ...
    
    const result = await emailSender.sendEmail(
        'your@verified-email.com',  // Email yang udah di-verify
        config.SUPPORT_EMAIL,
        '',
        phoneNumber
    );
    
    if (result.success) {
        return 'success';
    } else {
        return 'error';
    }
}
```

✅ **DONE!** Langsung bisa jalan di VPS DigitalOcean!

---

### Option 2: MailerSend (LIMIT TERBESAR!) 🏆
**Kenapa:** 12,000 email/bulan (400/hari) GRATIS selamanya
**Limit:** 12,000/bulan
**Setup time:** 10 menit

#### Step-by-step:
```bash
# 1. Daftar MailerSend
https://www.mailersend.com/pricing

# 2. Di dashboard:
Email Verification > Add Domain
# Atau pakai: @trial.mailersend.net (instant!)

# 3. Generate API Token:
Settings > API Tokens > Create Token

# 4. Install axios
cd /home/lyon/Documents/tools/fixredori
npm install axios

# 5. Edit fixredori/index.js - lihat contoh di bawah
```

---

### Option 3: Multi-Provider (ULTIMATE 22K/BULAN!) 🚀
**Kenapa:** Kombinasi semua, auto-failover, 22,000+ email/bulan
**Limit:** 22,000+/bulan
**Setup time:** 20 menit

#### Step-by-step:
```bash
# 1. Setup SMTP2GO (1,000/month)
# 2. Setup MailerSend (12,000/month)  
# 3. Setup Brevo (9,000/month)

# Total: 22,000 emails/month = 733 emails/day!

# 4. Install dependencies
cd /home/lyon/Documents/tools/fixredori
npm install axios

# 5. Use multi-provider-sender.js
```

---

## 🎯 REKOMENDASI BERDASARKAN KEBUTUHAN:

### Kalau Bot Appeal < 30 request/hari:
➡️ **Pakai SMTP2GO** - Simpel, cepat, familiar (SMTP)

### Kalau Bot Appeal 30-400 request/hari:
➡️ **Pakai MailerSend** - Limit gede, gratis selamanya

### Kalau Bot Appeal > 400 request/hari:
➡️ **Pakai Multi-Provider** - Unlimited capacity, auto-failover

---

## 💡 Mana yang Mau Dipilih?

Kasih tau pilihan kamu, nanti saya:
1. ✅ Install dependencies
2. ✅ Modifikasi index.js
3. ✅ Setup config
4. ✅ Test kirim email

Tinggal kamu daftar di website-nya aja! 🚀
