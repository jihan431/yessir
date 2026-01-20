# Bot Tools Collection 🛠️

Koleksi alat dan bot otomasi untuk memanajemen berbagai kebutuhan Telegram dan WhatsApp. Repositori ini berisi beberapa *service* yang saling terintegrasi.

## 📂 Daftar Projek

### 1. Bot Manager (`/bot-manager`)
Panel berbasis web untuk memantau dan mengelola status bot yang berjalan menggunakan PM2.
- **Teknologi**: Express.js, Socket.io, PM2 API.
- **Fitur**:
  - Live Log monitoring.
  - Start/Stop/Restart bot.
  - Dashboard minimalis dan responsif.

### 2. Cek Bio / Archive Bot (`/cekbio`)
Bot multifungsi untuk keperluan arsip dan pengecekan biografi (profil), mendukung integrasi WhatsApp dan Telegram.
- **Teknologi**: Baileys (WA), Telegraf (Telegram), Firebase Admin.
- **Fitur**:
  - Pengecekan Bio.
  - Arsip data.
  - Integrasi Multi-platform.

### 3. WhatsApp Banding / Unban Bot (`/fixredori`)
Bot Telegram khusus untuk membantu proses pengajuan banding (unban) akun WhatsApp secara otomatis melalui Email.
- **Teknologi**: Node-Telegram-Bot-API, Nodemailer.
- **Fitur**:
  - Rotasi Email otomatis.
  - Template pesan banding.
  - Limit & Cooldown user.

---

## 🚀 Cara Menjalankan

### Persyaratan Utama
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (v16+)
- [PM2](https://pm2.keymetrics.io/) (`npm install pm2 -g`)

### Instalasi Dependensi
Cukup jalankan script instalasi manual di setiap folder, atau masuk ke masing-masing direktori:

```bash
# Contoh untuk Bot Manager
cd bot-manager
npm install

# Contoh untuk Bot FixRed
cd ../fixredori
npm install
```

### Menjalankan Semua Bot
Telah disediakan script shell untuk menjalankan semua layanan sekaligus menggunakan PM2:

```bash
./start_bots.sh
```

Atau jalankan secara manual:

```bash
# Jalankan Bot Manager
cd bot-manager
npm start

# Jalankan Bot Lainnya
# (Disarankan menggunakan PM2 untuk production)
```

## 📝 Konfigurasi
Setiap folder memiliki konfigurasi masing-masing. Pastikan untuk menyesuaikan file berikut sebelum menjalankan:
- `bot-manager/config.js` (jika ada)
- `cekbio/config.js` atau `.env`
- `fixredori/bot-config.json` & `email.json`

## 👤 Author
- **Owner**: Jihan Nugraha (Jihan431)
