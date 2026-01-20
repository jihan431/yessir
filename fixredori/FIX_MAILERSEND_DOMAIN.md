# 🔧 Fix MailerSend Domain Verification

## ❌ Current Error:
```
The from.email domain must be verified in your account to send emails. #MS42207
```

---

## ✅ SOLUSI CEPAT (Pilih Salah Satu):

### **Option 1: Verify Email Personal (Termudah - 2 menit)** ⭐

1. **Login:** https://www.mailersend.com/verify
2. **Klik:** Email Verification
3. **Add email:** Masukkan email personal kamu (misal: `youremail@gmail.com`)
4. **Check inbox** → Klik link verifikasi
5. **Update config di VPS:**

```bash
nano ~/yessir/fixredori/bot-config.json
```

Ganti:
```json
"fromEmail": "youremail@gmail.com"
```

Save: `Ctrl+O` → Enter → `Ctrl+X`

6. **Restart bot:**
```bash
pm2 restart fixredori
```

---

### **Option 2: Pakai Domain Sendiri (Opsional)**

Kalau punya domain (misal: `example.com`):

1. **Login:** https://www.mailersend.com/domains
2. **Add Domain:** `example.com`
3. **Add DNS Records** (TXT, CNAME) di domain provider
4. **Wait verification** (5-30 menit)
5. **Update config:**
```json
"fromEmail": "noreply@example.com"
```

---

### **Option 3: Pakai Verified Trial Domain**

MailerSend kadang kasih verified trial domain. Check:

1. **Login:** https://www.mailersend.com/domains
2. **Lihat** list domains
3. **Cari** domain dengan status ✅ **Verified**
4. **Copy** domain itu (misal: `trial-xxx.mailersend.net`)
5. **Update config:**
```json
"fromEmail": "noreply@trial-xxx.mailersend.net"
```

---

## 🚀 After Verification:

```bash
# Restart bot
pm2 restart fixredori

# Test
# Di Telegram: /fixred +628xxx
```

---

## ✅ Code Fix (Subject Issue) - SUDAH DIUPDATE!

Subject field sekarang gak kosong lagi (pakai space).

**Next: Pull code update dari GitHub + verify email!**
