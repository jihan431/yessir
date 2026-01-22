# Fix untuk Bot Sering Mati/Disconnect

## Masalah yang Ditemukan:
1. **Promise Timeout 90 detik** - Bot hang saat WhatsApp client gagal connect
2. **Error 403** - WhatsApp session tidak valid (sudah dihapus otomatis)
3. **Error 503** - Service Unavailable dari WhatsApp server
4. **Reconnect Loop** - Bot stuck mencoba reconnect tanpa henti

## Solusi yang Diterapkan:

### 1. **Timeout Protection untuk Startup**
- Bot Telegram sekarang start terlebih dahulu (prioritas utama)
- WhatsApp client start di background dengan delay 1 detik
- Jika WhatsApp gagal, Bot Telegram tetap jalan

### 2. **Auto-Recovery untuk WhatsApp**
- Tambah handling untuk error 503 (Service Unavailable)
- Exponential backoff: delay reconnect bertambah otomatis (5s, 10s, 15s, ...)
- Setelah max attempts, reset counter dan coba lagi setelah 1-2 menit
- Tidak akan berhenti mencoba reconnect

### 3. **Better Error Handling**
- Semua error di wrap dengan try-catch
- Error tidak akan membuat bot crash
- Log lebih detail untuk debugging

### 4. **Healthcheck**
- Bot akan terus mencoba reconnect otomatis
- Notifikasi ke owner jika ada masalah session

## Cara Restart Bot:

```bash
cd ~/cekbio
pm2 restart cekbio
pm2 log cekbio --lines 50
```

## Untuk Pairing Ulang WhatsApp:

Jika WhatsApp disconnect dengan error 403, session sudah dihapus otomatis.
Untuk pairing ulang:

1. Di Telegram, kirim: `/pairing` (untuk pairing code)
   ATAU `/pairingqr` (untuk QR code)
2. Follow instruksi yang diberikan bot

## Monitoring:

Cek status bot:
```bash
pm2 status
pm2 log cekbio --lines 100
```

Jika masih ada masalah, cek:
- Memory usage: `pm2 status` (pastikan tidak full)
- Network: `ping -c 5 8.8.8.8`
- PM2 auto-restart: `pm2 save && pm2 startup`

## Tips Pencegahan:

1. **Jangan pakai 2 device** - Logout WhatsApp dari device lain
2. **Stable network** - Pastikan VPS networknya stabil
3. **Update dependencies** - `npm update` secara berkala
4. **Monitoring** - Set up monitoring via PM2 Plus (opsional)
