# 🚀 MailerSend Setup Guide - FIXRED BOT

## ✅ Code sudah diupdate!

Saya sudah modifikasi bot kamu untuk pakai **MailerSend** (12,000 email/bulan GRATIS).

---

## 📋 LANGKAH SETUP:

### **STEP 1: Daftar MailerSend** (5 menit)

1. **Buka:** https://www.mailersend.com/signup
2. **Sign up gratis** (bisa pakai Google/GitHub)
3. **Verify email** yang kamu daftar

---

### **STEP 2: Get API Key** (2 menit)

1. Login ke dashboard MailerSend
2. Klik **Settings** (pojok kanan atas)
3. Pilih **API Tokens**
4. Klik **Create Token**
   - Name: `fixred-bot`
   - Scopes: 
     - ✅ Email send
     - ✅ Token read
5. **COPY** API key yang muncul (format: `mlsn.xxxxxxxxxxxx`)

⚠️ **PENTING:** Save API key ini, gak bisa diliat lagi!

---

### **STEP 3: Configure Bot** (1 menit)

Edit file `/home/lyon/Documents/tools/fixredori/bot-config.json`:

```json
{
  "TELEGRAM_BOT_TOKEN": "8338772881:AAF4SSt_Jc9ljE1vQtlz-PlyWt36hQx7aAM",
  "MAILERSEND_CONFIG": {
    "apiKey": "PASTE_API_KEY_KAMU_DI_SINI",
    "fromEmail": "noreply@trial.mailersend.net",
    "fromName": "WhatsApp Appeal Bot"
  }
}
```

**Note tentang `fromEmail`:**
- Bisa pakai `@trial.mailersend.net` (instant, gak perlu verify)
- Atau verify domain sendiri kalau mau (opsional)

---

### **STEP 4: Test Bot**

1. **Jalankan bot:**
   ```bash
   cd /home/lyon/Documents/tools/fixredori
   node index.js
   ```

2. **Di Telegram, kirim:**
   ```
   /testemail
   ```

3. **Kalau berhasil, output:**
   ```
   ✅ MAILERSEND API CONNECTED!
   🔑 API Key: mlsn.****
   📧 From: noreply@trial.mailersend.net
   ⏱ Response: XXXms
   
   📊 Account Info:
   • Limit: 12,000 emails/month
   • Free tier: 400/day
   
   ✅ Ready to send emails!
   ```

4. **Test kirim appeal:**
   ```
   /fixred +6281234567890
   ```

---

## 🔧 Alternative: Command Via Telegram

Kalau gak mau edit file manual, bisa set API key langsung via Telegram:

```
/setapikey mlsn.xxxxxxxxxxxxxxxxxx
```

Bot akan auto-test & save config kalau valid.

---

## 📊 **Perubahan yang Sudah Dibuat:**

✅ Ganti nodemailer → MailerSend API  
✅ Update sendAppealEmail() function  
✅ Update /testemail command  
✅ Update /stats display  
✅ Update owner panel  
✅ Remove email rotation system (gak perlu lagi)  
✅ Port SMTP TIDAK dipakai (bypass block!)  

---

## 🎯 **Keuntungan MailerSend:**

| Feature | Gmail SMTP | MailerSend |
|---------|------------|------------|
| **Limit/hari** | 500/akun | 400 (gratis) |
| **Limit/bulan** | ~15,000 | 12,000 |
| **SMTP Block** | ❌ Kena block DO | ✅ Gak kena block |
| **Setup** | Butuh App Password | Simple API key |
| **Monitoring** | ❌ Tidak ada | ✅ Dashboard |
| **Reliability** | Medium | High |
| **Rotation** | Manual | Gak perlu |

---

## 🚨 **Troubleshooting:**

### **Error: API key invalid**
- Check API key di dashboard
- Pastikan copy full key (termasuk `mlsn.`)
- Generate new token kalau perlu

### **Error: Network connection**
- Test internet: `ping api.mailersend.com`
- Check firewall VPS

### **Email nggak terkirim**
- Cek quota di dashboard MailerSend
- Verify sender email kalau perlu

---

## 📞 **Need Help?**

Kasih tau kalo ada error! 🚀

Test dulu dengan:
```bash
cd /home/lyon/Documents/tools/fixredori
node index.js
```

Lalu `/testemail` di Telegram.
