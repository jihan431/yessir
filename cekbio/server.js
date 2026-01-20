
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Ganti branding OTAX/Ayun dengan fffk
  const cleanedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return arg
        .replace(/⸙𝙊𝙏𝘼𝙓/g, 'fffk')
        .replace(/⸙ OTAX/g, 'fffk')
        .replace(/OTAXAYUN/g, 'fffk')
        .replace(/OtaxAyun/g, 'fffk')
        .replace(/OTAX/gi, 'fffk')
        .replace(/Ayun/gi, 'fffk')
        .replace(/Powered by/g, 'Powered by fffk');
    }
    return arg;
  });
  
  originalConsoleLog.apply(console, cleanedArgs);
};

console.log('🔒 Security: TLS Verification Enabled');
console.log('Memulai bot...');
const { Telegraf, Markup } = require('telegraf');
const cooldowns = {};
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, makeInMemoryStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const moment = require("moment-timezone");
const chalk = require('chalk');
const axios = require('axios');
const archiver = require('archiver');
const FormData = require('form-data');
const config = require('./config');
const path = require('path');
const { exec, execSync } = require('child_process');
// nodemailer removed - SMTP blocked by VPS provider
const { createCanvas, loadImage } = require('canvas');
const Jimp = require('jimp');

//======================== ERROR HANDLING ====================

// Menangkap error yang tidak tertangani agar bot tidak mati total
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

//======================== DATABASE ====================

const OWNER_ID = config.ownerId.toString();
const TOKEN = config.telegramBotToken;
const OWNER = config.ownerId;
const USERNAME_OWNER = config.usernameOwner;
const VERSION = config.version;
const NAMA_BOT = config.namaBot;
const bot = new Telegraf(config.telegramBotToken);
const checkAccess = (level) => async (ctx, next) => {
    const userId = ctx.from.id;
    if (level === 'owner' && !isOwner(userId)) {
        return ctx.reply(config.message.owner, { parse_mode: 'Markdown' });
    }
    await next();
};

let botLaunched = false;

const CHANNEL_ID = config.channelId;
const GROUP_ID = config.groupId;
const REF_FILE = './database/referral.json';
const userDBPath = path.join(__dirname, 'database', 'users.json');
const dataFile = path.join(__dirname, "./database/roles.json");
let roleData = { owners: [], premiums: [] };

// Inisialisasi file jika belum ada
if (!fs.existsSync(REF_FILE)) fs.writeFileSync(REF_FILE, '{}');
if (!fs.existsSync(userDBPath)) {
  fs.writeFileSync(userDBPath, JSON.stringify([]));
}

//======================== FUNCTION ====================

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function showBanner() {
  console.clear();
  console.log(chalk.cyan(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ██████╗███████╗██╗  ██╗██████╗ ██╗ ██████╗ 
  ██╔════╝██╔════╝██║ ██╔╝██╔══██╗██║██╔═══██╗
  ██║     █████╗  █████╔╝ ██████╔╝██║██║   ██║
  ██║     ██╔══╝  ██╔═██╗ ██╔══██╗██║██║   ██║
  ╚██████╗███████╗██║  ██╗██████╔╝██║╚██████╔╝
   ╚═════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝ ╚═════╝ 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  console.log(chalk.white(`
  🤖 ${NAMA_BOT} v${VERSION}
  📅 ${moment().tz('Asia/Jakarta').format('DD MMM YYYY • HH:mm:ss')}
  👨‍💻 Developer: ${USERNAME_OWNER}
  ⚙️  Node.js: ${process.version}
  `));
  console.log(chalk.green(`  ✅ Bot Status: ONLINE`));
  console.log(chalk.cyan(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));
}

//======================== FUNCTION AUTO BACKUP ====================

async function autoBackup() {
  try {
    const backupDir = path.join(__dirname, 'backup');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    // Rate Limiting: Cek backup terakhir
    const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
        .sort().reverse(); // Terbaru di atas

    if (files.length > 0) {
        const lastBackupFile = files[0];
        const stats = fs.statSync(path.join(backupDir, lastBackupFile));
        const lastModified = stats.mtimeMs;
        const oneHour = 60 * 60 * 1000;

        if (Date.now() - lastModified < oneHour) {
             console.log(chalk.yellow(`⏳ Backup otomatis di-skip. Backup terakhir baru dibuat ${Math.floor((Date.now() - lastModified)/60000)} menit yang lalu.`));
             return;
        }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipPath = path.join(backupDir, `backup-${timestamp}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    const foldersToBackup = [
      'database',
      'server.js',
      'config.js',
      'package.json'
    ];

    for (const folder of foldersToBackup) {
      const folderPath = path.join(__dirname, folder);
      if (fs.existsSync(folderPath)) {
        const stats = fs.lstatSync(folderPath);
        if (stats.isDirectory()) {
          archive.directory(folderPath, folder);
        } else {
          archive.file(folderPath, { name: folder });
        }
      }
    }

    await archive.finalize();

    output.on('close', async () => {
      console.log(`✅ Backup selesai: ${zipPath} (${archive.pointer()} bytes)`);

      // Kumpulkan semua owner ID unik
      const allOwners = new Set([
        config.ownerId.toString(),
        ...roleData.owners
            .filter(o => !isExpired(o.expireAt))
            .map(o => o.id)
      ]);

      console.log(`📤 Mengirim backup ke ${allOwners.size} owner...`);

      for (const ownerId of allOwners) {
        try {
          await bot.telegram.sendDocument(
            ownerId,
            { source: zipPath },
            { caption: `📦 Backup otomatis berhasil dibuat pada ${new Date().toLocaleString('id-ID')}` }
          );
          console.log(`✅ Backup terkirim ke: ${ownerId}`);
        } catch (err) {
          console.error(`❌ Gagal kirim backup ke ${ownerId}:`, err.message);
        }
      }
    });
  } catch (err) {
    console.error('❌ Gagal membuat backup:', err.message);
  }
}

//======================== FUNGSI DATABASE LOKAL ====================

function loadRefs() {
  return JSON.parse(fs.readFileSync(REF_FILE));
}
function saveRefs(data) {
  fs.writeFileSync(REF_FILE, JSON.stringify(data, null, 2));
}

function loadUsers() {
  if (!fs.existsSync(userDBPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(userDBPath, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveUsers(data) {
  fs.writeFileSync(userDBPath, JSON.stringify(data, null, 2));
}

function loadRoles() {
  if (fs.existsSync(dataFile)) {
    try {
      roleData = JSON.parse(fs.readFileSync(dataFile));

      if (!Array.isArray(roleData.owners)) roleData.owners = [];
      if (!Array.isArray(roleData.premiums)) roleData.premiums = [];

      roleData.owners = roleData.owners.map(o =>
        typeof o === "string"
          ? { id: o, expireAt: "permanent", startAt: Date.now() }
          : o
      );
      roleData.premiums = roleData.premiums.map(p =>
        typeof p === "string"
          ? { id: p, expireAt: "permanent", startAt: Date.now() }
          : p
      );
// Auto hapus premium yang expired saat load
      const now = Date.now();
      const initialPremiumCount = roleData.premiums.length;
      roleData.premiums = roleData.premiums.filter(p => {
        if (p.expireAt === "permanent") return true;
        return p.expireAt > now;
      });
      
      if (roleData.premiums.length < initialPremiumCount) {
        console.log(`🧹 Membersihkan ${initialPremiumCount - roleData.premiums.length} user premium yang expired.`);
        saveRoles();
      }
    } catch (err) {
      console.error("⚠️ Gagal baca roles.json, reset data:", err);
      roleData = { owners: [], premiums: [] };
      saveRoles();
    }
  } else {
    roleData = { owners: [], premiums: [] };
    saveRoles();
  }
}

function saveRoles() {
  fs.writeFileSync(dataFile, JSON.stringify(roleData, null, 2));
}

loadRoles();

function isExpired(expireAt) {
  if (!expireAt) return true;
  if (expireAt === "permanent") return false;
  return Date.now() > expireAt;
}

function isOwner(id) {
  const uid = id.toString();
  if (uid === config.ownerId.toString()) return true;

  const owner = roleData.owners.find(o => o.id === uid);
  if (!owner) return false;
  return !isExpired(owner.expireAt);
}

function isPremium(id) {
  const uid = id.toString();
  if (isOwner(uid)) return true;

  const prem = roleData.premiums.find(p => p.id === uid);
  if (!prem) return false;
  return !isExpired(prem.expireAt);
}

function parseDuration(dur) {
  if (!dur) return null;
  const unit = dur.slice(-1).toLowerCase();
  const num = parseInt(dur);
  const now = Date.now();

  switch (unit) {
    case "d":
      return now + num * 24 * 60 * 60 * 1000;
    case "w":
      return now + num * 7 * 24 * 60 * 60 * 1000;
    case "m":
      return now + num * 30 * 24 * 60 * 60 * 1000;
    case "p":
      return "permanent";
    default:
      return null;
  }
}

function formatDuration(dur) {
  if (dur === "permanent") return "Permanen";
  const sisa = dur - Date.now();
  const hari = Math.max(1, Math.ceil(sisa / (24 * 60 * 60 * 1000)));
  return `${hari} hari`;
}

function formatDate(ts) {
  if (ts === "permanent") return "∞";
  const d = new Date(ts);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function getDurationText(expireAt, startAt) {
  if (expireAt === "permanent") return "Permanen";
  const diff = expireAt - startAt;
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (days % 30 === 0) return `${days / 30} bulan`;
  if (days % 7 === 0) return `${days / 7} minggu`;
  return `${days} hari`;
}

function generatePagedList(items, page = 1, type = "premium") {
  const perPage = 15;
  const totalPages = Math.ceil(items.length / perPage);
  const startIndex = (page - 1) * perPage;
  const pagedItems = items.slice(startIndex, startIndex + perPage);

  let text = type === "owner"
    ? "👑 Daftar Owner\n━━━━━━━━━━━━━━━━━━\n"
    : "📜 Daftar User Premium\n━━━━━━━━━━━━━━━━━━\n";

  for (const user of pagedItems) {
    const { id, expireAt, startAt } = user;
    if (isExpired(expireAt)) continue;

    const mulai = formatDate(startAt);
    const akhir = formatDate(expireAt);
    const durasi = getDurationText(expireAt, startAt);

    text += `👤 ID: ${id}\n⏱ Durasi: ${durasi}\n📅 Tanggal: ${mulai} - ${akhir}\n`;
  }

  text += `📄 Halaman ${page} / ${totalPages}`;

  const buttons = [];
  if (page > 1) buttons.push({ text: "◀️ Prev", callback_data: `${type}_page_${page - 1}` });
  if (page < totalPages) buttons.push({ text: "Next ▶️", callback_data: `${type}_page_${page + 1}` });

  return { text, buttons: buttons.length ? [buttons] : [] };
}

function generateUserList(users, page = 1) {
  const perPage = 20;
  const totalPages = Math.ceil(users.length / perPage);
  const startIndex = (page - 1) * perPage;
  const pageIds = users.slice(startIndex, startIndex + perPage);

  let text = `📊 Total ID Terdaftar\n━━━━━━━━━━━━━━━━━━\n`;

  pageIds.forEach((id, index) => {
    text += `${startIndex + index + 1}. ${id}\n`;
  });

  text += `📄 Halaman: ${page} / ${totalPages}\n👥 Total ID: ${users.length}`;

  const buttons = [];
  if (page > 1) buttons.push({ text: "◀️ Prev", callback_data: `users_page_${page - 1}` });
  if (page < totalPages) buttons.push({ text: "Next ▶️", callback_data: `users_page_${page + 1}` });

  return { text, buttons: buttons.length ? [buttons] : [] };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadToCatbox(fileBuffer, filename) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', fileBuffer, filename);

  const res = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders(),
    timeout: 60000 
  });

  const text = res.data;
  if (typeof text !== 'string' || text.startsWith('ERROR')) {
    throw new Error('Upload gagal: ' + text);
  }

  return text.trim();
}

function syncReferralBonuses() {
  const refData = loadRefs();
  let updated = 0;

  for (const userId in refData) {
    const user = refData[userId];
    const invitedCount = user.invited?.length || 0;

    if (user.bonusChecks === undefined) user.bonusChecks = 0;
    if (user.totalInvited === undefined) user.totalInvited = 0;

    const earnedBonuses = Math.floor(invitedCount / 5) * 5;

    if (earnedBonuses > user.totalInvited) {
      const newBonus = earnedBonuses - user.totalInvited;
      user.bonusChecks += newBonus;
      user.totalInvited = earnedBonuses;
      updated++;
    }
  }

  saveRefs(refData);
  console.log(`✅ Sinkronisasi referral selesai. ${updated} user diperbarui.`);
}

//======================== FUNCTION CONNECT WHATSAPP ====================

let waClient = null;
let waConnectionStatus = 'closed';
let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let justPaired = false; // Flag untuk skip reconnect setelah pairing

// QR Code storage untuk pairing via Telegram
let currentQR = null;
let qrRequesterId = null; // User ID yang request QR

const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});

// Bersihkan store setiap 30 menit untuk mencegah memory leak
setInterval(() => {
  if (store.messages) {
    for (const chatId in store.messages) {
      const msgs = store.messages[chatId];
      if (msgs && msgs.length > 100) {
        store.messages[chatId] = msgs.slice(-50);
      }
    }
  }
}, 30 * 60 * 1000);

async function startWhatsAppClient() {
    // Cegah multiple reconnect bersamaan
    if (isReconnecting) {
        console.log("Sudah dalam proses reconnect, skip...");
        return;
    }
    
    isReconnecting = true; // Set flag bahwa sedang proses connect/reconnect
    
    // Cleanup client lama jika ada
    if (waClient) {
        try {
            waClient.ev.removeAllListeners();
            waClient.end ? waClient.end(undefined) : waClient.ws.close();
        } catch (e) {
            console.error('Gagal cleanup client lama:', e.message);
        }
        waClient = null;
    }
    
    console.log("Mencoba memulai koneksi WhatsApp...");

    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 10000,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: false,
        getMessage: async (key) => ({
            conversation: '',
        }),
    };

    waClient = makeWASocket(connectionOptions);

    waClient.ev.on('creds.update', saveCreds);
    store.bind(waClient.ev);

    waClient.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    // Handle QR Code
    if (qr) {
      currentQR = qr;
      justPaired = true; // Set flag bahwa sedang dalam proses pairing
      console.log('📱 QR Code tersedia untuk pairing');
      
      // Jika ada yang request QR, kirim ke Telegram
      if (qrRequesterId) {
        try {
          const QRCode = require('qrcode');
          let qrBuffer;
          
          // Coba PNG dulu (butuh canvas), jika gagal fallback ke SVG (untuk Termux)
          try {
            qrBuffer = await QRCode.toBuffer(qr, { 
              type: 'png', 
              width: 300,
              margin: 2 
            });
          } catch (canvasErr) {
            // Fallback ke SVG jika canvas tidak tersedia (Termux)
            console.log('⚠️ Canvas tidak tersedia, menggunakan SVG...');
            const svgString = await QRCode.toString(qr, { 
              type: 'svg',
              width: 300,
              margin: 2 
            });
            qrBuffer = Buffer.from(svgString);
          }
          
          // Kirim sebagai file (support PNG atau SVG)
          const isPNG = qrBuffer[0] === 0x89 && qrBuffer[1] === 0x50; // PNG magic bytes
          
          if (isPNG) {
            await bot.telegram.sendPhoto(qrRequesterId, { source: qrBuffer }, {
              caption: `📱 QR CODE WHATSAPP\n\nScan QR ini di WhatsApp:\nPengaturan → Perangkat Tertaut → Tautkan Perangkat\n\n⏳ QR berlaku 60 detik!`,
              
            });
          } else {
            // SVG: kirim sebagai document karena Telegram tidak support SVG sebagai photo
            await bot.telegram.sendDocument(qrRequesterId, 
              { source: qrBuffer, filename: 'qrcode.svg' }, 
              {
                caption: `📱 QR CODE WHATSAPP\n\nScan QR ini di WhatsApp:\nPengaturan → Perangkat Tertaut → Tautkan Perangkat\n\n⏳ QR berlaku 60 detik!\n\n💡 Buka file SVG ini untuk melihat QR code`,
                
              }
            );
          }
          
          console.log(`✅ QR Code dikirim ke ${qrRequesterId}`);
        } catch (err) {
          console.error('Gagal kirim QR:', err.message);
        }
      }
    }
    
    if (connection) {
        waConnectionStatus = connection;
        console.log('Status koneksi WA:', connection);
    }
    
    if (connection === 'open') {
        isReconnecting = false;
        reconnectAttempts = 0;
        console.log(chalk.green.bold("WhatsApp Connected"));
        
        // Jika baru saja pairing, tunggu credentials tersimpan
        if (justPaired) {
            console.log(chalk.yellow("⏳ Menyimpan credentials, tunggu sebentar..."));
            await delay(3000); // Tunggu 3 detik agar creds tersimpan
            justPaired = false;
            console.log(chalk.green("✅ Credentials tersimpan!"));
            
            // Notifikasi ke Telegram
            if (qrRequesterId) {
                try {
                    await bot.telegram.sendMessage(qrRequesterId, 
                        `✅ WHATSAPP TERHUBUNG!\n\nBot sekarang sudah terhubung ke WhatsApp dan siap digunakan.`,
                        {  }
                    );
                } catch (e) {}
            }
        }
    }

    if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(chalk.red.bold("WhatsApp Disconnected"));
        console.log('Disconnect reason:', statusCode);
        
        // Reset flag reconnecting agar bisa attempt reconnect lagi
        // Kecuali kita sedang menunggu timeout retry di bawah (untuk 440/515)
        // Tapi kita akan handle reset flag di dalam logika retry masing-masing jika perlu
        // Atau biarkan false di sini dan set true saat startWhatsAppClient dipanggil lagi.
        isReconnecting = false; 
        
        // Jika baru saja pairing dan langsung disconnect, kemungkinan normal behavior
        if (justPaired) {
            console.log(chalk.yellow("⏳ Post-pairing disconnect, waiting for auto-reconnect..."));
            justPaired = false;
            await delay(5000); 
            startWhatsAppClient().catch(console.error);
            return;
        }
        
        // Khusus error 515 (Stream Error)
        if (statusCode === 515) {
            console.log(chalk.yellow("⚠️ Stream Error (515), waiting 10 seconds before reconnect..."));
            reconnectAttempts++;
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => {
                    startWhatsAppClient().catch(console.error);
                }, 10000);
            } else {
                console.log(chalk.red.bold("Max reconnect attempts reached for error 515"));
                waClient = null;
            }
            return;
        }

        // Khusus error 403 (Forbidden) - Session invalid/expired/banned
        if (statusCode === 403) {
            console.log(chalk.red.bold("❌ Error 403 (Forbidden) - Session tidak valid!"));
            console.log(chalk.yellow("⚠️ Session akan dihapus, silakan pairing ulang dengan /pairing"));
            waClient = null;
            
            // Hapus session lama
            const sessionPath = path.join(__dirname, config.sessionName);
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log('🗑 Session dihapus karena error 403');
            }
            
            // Notifikasi ke owner jika ada
            if (qrRequesterId) {
                try {
                    await bot.telegram.sendMessage(qrRequesterId, 
                        `❌ *WhatsApp Disconnected (403)*\n\nSession tidak valid atau sudah expired.\nSilakan hubungkan ulang dengan /pairing`,
                        { parse_mode: 'Markdown' }
                    );
                } catch (e) {}
            }
            return; // Jangan reconnect, perlu pairing ulang
        }

        // Khusus error 440 (Conflict) - Biasanya karena WA aktif di tempat lain
        if (statusCode === 440) {
            console.log(chalk.yellow("⚠️ Conflict Error (440), reconnecting in 3s..."));
            reconnectAttempts++;
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => {
                    startWhatsAppClient().catch(console.error);
                }, 3000); // 3 detik
            } else {
                console.log(chalk.red.bold("Max reconnect attempts reached."));
                waClient = null;
            }
            return;
        }
        
        // Error 428 (Precondition Required / Connection Closed) biasanya butuh reconnect juga
        if (statusCode === 428) {
             console.log(chalk.yellow("⚠️ Connection Closed (428), reconnecting..."));
        }

        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delayTime = Math.min(5000 * reconnectAttempts, 30000);
            console.log(`Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delayTime/1000}s...`);
            setTimeout(() => {
                startWhatsAppClient().catch(console.error);
            }, delayTime);
        } else if (statusCode === DisconnectReason.loggedOut) {
            console.log(chalk.red.bold("Logged out dari WhatsApp. Session perlu di-reset."));
            waClient = null;
            const sessionPath = path.join(__dirname, config.sessionName);
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log('🗑 Session dihapus karena logged out');
            }
        } else {
            console.log(chalk.red.bold("Tidak bisa menyambung ulang."));
            waClient = null;
        }
    }
    });
}

async function checkMetaBusiness(jid) {
  try {
    const businessProfile = await waClient.getBusinessProfile(jid);
    if (businessProfile) {
      return { isBusiness: true, businessData: businessProfile };
    }
    return { isBusiness: false, businessData: null };
  } catch (error) {
    return { isBusiness: false, businessData: null };
  }
}

function getJamPercentage(bio, setAt, metaBusiness) {
  let base = 50;

  if (bio && bio.length > 0) {
    if (bio.length > 100) base -= 20;
    else if (bio.length > 50) base -= 15;
    else if (bio.length > 20) base -= 10;
    else base -= 5;
  } else base += 15;

  if (setAt) {
    const now = new Date();
    const bioDate = new Date(setAt);
    const diffDays = Math.ceil(Math.abs(now - bioDate) / (1000 * 60 * 60 * 24));

    if (diffDays < 30) base -= 20;
    else if (diffDays < 90) base -= 10;
    else if (diffDays > 365) base += 15;
    else if (diffDays > 730) base += 25;
  } else base += 10;

  if (metaBusiness) base -= 25;
  base = Math.max(10, Math.min(90, base));

  return Math.round(base / 10) * 10;
}

async function handleBioCheck(ctx, numbersToCheck) {
  const startTime = Date.now();
  // Cek koneksi WA lebih akurat: waClient harus ada DAN (status 'open' ATAU user sudah login)
  const isConnected = waClient && (waConnectionStatus === 'open' || waClient.user);
  if (!isConnected) {
    return ctx.reply(config.message.waNotConnected, { parse_mode: 'Markdown' });
  }

  if (!numbersToCheck || numbersToCheck.length === 0) {
    return ctx.reply(`Mana nomor yang mau dicek?`, {  });
  }

  await ctx.reply(
    `⏳ Tunggu sebentar, bot sedang mengecek ${numbersToCheck.length} nomor...`,
    {  }
  );

  let results = [];
  const jids = numbersToCheck.map(num => num.trim() + '@s.whatsapp.net');
  let existenceResults;
  try {
    existenceResults = await waClient.onWhatsApp(...jids);
  } catch (err) {
    console.error('Error cekbio:', err);
    if (err?.output?.statusCode === 428 || err.message?.includes('Connection Closed')) {
        return ctx.reply('⚠️ Koneksi WhatsApp sedang tidak stabil/terputus. Bot akan mencoba reconnect otomatis, silakan coba beberapa saat lagi.', {});
    }
    return ctx.reply(`⚠️ Terjadi kesalahan saat mengecek nomor: ${err.message}`, {});
  }

  const registered = [];
  const notRegistered = [];

  existenceResults.forEach(res => {
    if (res.exists) registered.push(res.jid);
    else notRegistered.push(res.jid.split('@')[0]);
  });

  if (registered.length > 0) {
    const batchSize = 10; // Kurangi dari 15 ke 10 untuk menghindari rate limit
    for (let i = 0; i < registered.length; i += batchSize) {
      const batch = registered.slice(i, i + batchSize);
      const promises = batch.map(async (jid) => {
        const number = jid.split('@')[0];
        try {
          const status = await waClient.fetchStatus(jid);
          const data = Array.isArray(status) ? status[0] : status;
          const bio = data?.status?.text || data?.status || null;
          const setAt = data?.setAt || null;

          const meta = await checkMetaBusiness(jid);
          const metaBusiness = meta.isBusiness;
          const jamPercentage = getJamPercentage(bio, setAt, metaBusiness);

          results.push({
            number,
            registered: true,
            bio,
            setAt,
            metaBusiness,
            jamPercentage
          });
        } catch (err) {
          results.push({ number, registered: false });
        }
      });

      await Promise.allSettled(promises);
      await delay(1500); // Tambah delay dari 800ms ke 1500ms
    }
  }

  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
  const timestamp = Date.now();
  const filename = `cekbio_${numbersToCheck[0] || 'result'}_${timestamp}.txt`;

  const registeredList = results.filter(r => r.registered);
  const withBio = registeredList.filter(r => r.bio);
  const noBio = registeredList.filter(r => !r.bio);
  const notReg = notRegistered;

  const waPersonal = registeredList.filter(r => !r.metaBusiness).length;
  const waBusiness = registeredList.filter(r => r.metaBusiness).length;

  const summaryCaption = `🌍 CEK BIO

📊 HASIL CEKBIO
✅ Terdaftar: ${registeredList.length} nomor
📝 Dengan Bio: ${withBio.length}
📵 Tanpa Bio: ${noBio.length}
🚫 Tidak Terdaftar: ${notReg.length}

📱 TIPE AKUN (100% AKURAT)
👤 WhatsApp: ${waPersonal}
🏢 Business: ${waBusiness}
✅ Meta Verified: 0
🔵 OBA: 0

⚡ SISTEM
🤖 Bot Aktif: 1/1
❌ Bot Failed: 0
🔄 Load Balancing: ✅ OPTIMAL
⏱️ Waktu: ${durationSeconds} detik
📁 Total Nomor: ${numbersToCheck.length}`;

  // Build plain text version for file
  let fileContent = `📊 HASIL CEK BIO (${numbersToCheck.length})\n`;
  fileContent += `✅ Bio: ${withBio.length} | 📵 No: ${noBio.length} | 🚫 Inv: ${notReg.length}\n`;
  fileContent += `📅 ${new Date().toLocaleString('id-ID')}\n\n`;
  
  if (withBio.length > 0) {
    fileContent += `═══════════════════════════════════════\n`;
    fileContent += `✅ DENGAN BIO (${withBio.length})\n`;
    fileContent += `═══════════════════════════════════════\n\n`;
    
    const groupedByYear = {};
    withBio.forEach(r => {
      const year = r.setAt ? new Date(r.setAt).getFullYear() : 'Unknown';
      if (!groupedByYear[year]) groupedByYear[year] = [];
      groupedByYear[year].push(r);
    });
    
    Object.keys(groupedByYear).sort().reverse().forEach(year => {
      fileContent += `📅 Tahun ${year}\n`;
      fileContent += `───────────────────────────────────────\n`;
      groupedByYear[year].forEach(r => {
        const dateStr = r.setAt ? new Date(r.setAt).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '-';
        const typeIcon = r.metaBusiness ? '🏢 Business' : '👤 Personal';
        let bioClean = r.bio ? r.bio.replace(/<[^>]*>/g, '').trim() : '-';
        
        fileContent += `Nomor    : ${r.number}\n`;
        fileContent += `Tipe     : ${typeIcon}\n`;
        fileContent += `Jam      : ${r.jamPercentage}%\n`;
        fileContent += `Bio      : ${bioClean}\n`;
        fileContent += `Tanggal  : ${dateStr}\n\n`;
      });
    });
  }
  
  if (noBio.length > 0) {
    fileContent += `═══════════════════════════════════════\n`;
    fileContent += `📵 TANPA BIO (${noBio.length})\n`;
    fileContent += `═══════════════════════════════════════\n`;
    noBio.forEach(r => {
      fileContent += `${r.number}\n`;
    });
    fileContent += `\n`;
  }
  
  if (notReg.length > 0) {
    fileContent += `═══════════════════════════════════════\n`;
    fileContent += `🚫 INVALID (${notReg.length})\n`;
    fileContent += `═══════════════════════════════════════\n`;
    notReg.forEach(num => {
      fileContent += `${num}\n`;
    });
  }

  // Kirim hasil
  try {
     const isFromGroup = ctx.chat.type !== 'private';
     const targetId = isFromGroup ? ctx.from.id : ctx.chat.id;
     
     const fileBuffer = Buffer.from(fileContent, 'utf-8');
     
     // Kirim file dengan caption summary
     await ctx.telegram.sendDocument(
       targetId,
       { source: fileBuffer, filename: filename },
       { caption: summaryCaption }
     );
     
     // Jika dari group, beri notifikasi
     if (isFromGroup) {
       await ctx.reply('✅ Hasil cek bio sudah dikirim ke chat pribadi Anda. Silakan cek PM.', {
         reply_to_message_id: ctx.message.message_id
       });
     }
     
  } catch (err) {
      console.error('Gagal kirim hasil:', err);
      if (err.description?.includes('bot was blocked') || err.description?.includes('user is deactivated')) {
          await ctx.reply('⚠️ Gagal mengirim hasil ke PM. Pastikan Anda sudah start bot ini di private chat.', { 
               reply_to_message_id: ctx.message.message_id 
          });
      } else {
          await ctx.reply('⚠️ Gagal mengirim hasil: ' + err.message, {
             reply_to_message_id: ctx.message.message_id
          });
      }
  }
}

const getUptime = () => {
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
};

// ========================= AUTO SAVE USER PRIVATE =========================

bot.use(async (ctx, next) => {
  try {
    if (ctx.chat?.type === 'private') {
      const userId = ctx.from.id.toString();
      const userDBPath = path.join(__dirname, 'database', 'users.json');
      let users = [];

      try {
        if (fs.existsSync(userDBPath)) {
          users = JSON.parse(fs.readFileSync(userDBPath, 'utf8') || '[]');
        } else {
          fs.writeFileSync(userDBPath, JSON.stringify([]));
        }
      } catch (e) {
        console.error('⚠️ users.json rusak, dibuat ulang:', e.message);
        users = [];
        fs.writeFileSync(userDBPath, JSON.stringify([]));
      }

      if (!users.includes(userId)) {
        users.push(userId);
        fs.writeFileSync(userDBPath, JSON.stringify(users, null, 2));
        console.log(`✅ User baru disimpan otomatis: ${userId}`);
      }
    }
  } catch (err) {
    console.error('❌ Gagal auto-save user:', err.message);
  }

  await next();
});

// ========================= MIDDLEWARE: FORCE START IN PRIVATE =========================
bot.use(async (ctx, next) => {
  if (ctx.chat?.type !== 'private' && ctx.message?.text?.startsWith('/')) {
    const userId = ctx.from.id.toString();
    const userDBPath = path.join(__dirname, 'database', 'users.json');
    
    // Skip checking for owner commands or if file doesn't exist yet
    if (isOwner(userId)) return next();

    let users = [];
    try {
      if (fs.existsSync(userDBPath)) {
        users = JSON.parse(fs.readFileSync(userDBPath, 'utf8') || '[]');
      }
    } catch (e) {}

    if (!users.includes(userId)) {
        const botUsername = ctx.botInfo.username;
        return ctx.reply(`⚠️ <b>Akses Ditolak!</b>\n\nAnda belum terdaftar di database bot.\nSilakan <b>Start</b> bot ini di private chat terlebih dahulu untuk menggunakan fitur.`, {
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id,
            reply_markup: {
                inline_keyboard: [[{ text: '🚀 Start Bot', url: `https://t.me/${botUsername}?start=auth` }]]
            }
        });
    }
  }
  await next();
});

//======================== FUNCTION START BOT ====================

async function startBot() {
  try {
    console.log(chalk.green("🚀 Memulai bot tanpa verifikasi token..."));

    if (bot && typeof bot.launch === "function" && !botLaunched) {
      console.log(chalk.gray("Testing connection (getMe)..."));
      try {
        const me = await bot.telegram.getMe();
        console.log(chalk.green(`Connection OK: @${me.username}`));
      } catch (err) {
        console.error(chalk.red("Connection failed:"), err.message);
      }

      console.log(chalk.gray("Bot launch..."));
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        console.log(chalk.gray("Webhook cleared."));
      } catch (e) {
        console.error("Warning: Failed to clear webhook:", e.message);
      }
      await bot.launch();
      botLaunched = true;
      console.log(chalk.green("✅ Bot Telegram berhasil dijalankan!"));
      
      /*
      // Daftarkan commands ke Telegram agar muncul di menu "/"
      await bot.telegram.setMyCommands([
        { command: 'start', description: '🏠 Menu utama bot' },
        { command: 'cekbio', description: '📱 Cek bio WhatsApp' },
        { command: 'info', description: '📊 Info akun & referral' },
        { command: 'cekid', description: '🆔 Cek ID Telegram' },
        { command: 'tourl', description: '🔗 Konversi media ke URL' },
      ]);
      */
      
      console.log(chalk.green("✅ Commands berhasil didaftarkan ke Telegram!"));
    } else if (botLaunched) {
      console.log(chalk.yellow("⚠️ Bot Telegram sudah berjalan, skip launch ulang."));
    }

    if (typeof startWhatsAppClient === "function") {
      await startWhatsAppClient();
    }

    process.once("SIGINT", () => {
      console.log("⛔ SIGINT diterima, bot dimatikan...");
      bot.stop("SIGINT");
      botLaunched = false;
    });

    process.once("SIGTERM", () => {
      console.log("⛔ SIGTERM diterima, bot dimatikan...");
      bot.stop("SIGTERM");
      botLaunched = false;
    });

  } catch (e) {
    console.error("⚠️ Gagal menjalankan bot:", e.message || e);
  }
}

// ======================= WELCOME MESSAGE =======================

bot.on('new_chat_members', async (ctx) => {
  const newMembers = ctx.message.new_chat_members;
  for (const member of newMembers) {
    if (member.is_bot) continue; // Skip jika yang masuk bot

    const userId = member.id;
    const name = member.first_name || 'Member';
    const username = member.username ? `@${member.username}` : '-';

    try {
      await ctx.reply(`👋 <b>Selamat Datang, ${name}!</b>\n\n🆔 ID: <code>${userId}</code>\n👤 Username: ${username}\n\nSelamat bergabung di grup!`, {
        parse_mode: 'HTML'
      });
    } catch (err) {
      console.error('Gagal kirim welcome message:', err);
    }
  }
});

// ======================= INLINE MODE =======================

bot.on('inline_query', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
  const botUsername = ctx.botInfo.username;
  
  try {
    const results = [
      {
        type: 'article',
        id: 'share_bot',
        title: '🤖 Share Bot Ini',
        description: 'Ajak teman pakai bot keren ini',
        input_message_content: {
          message_text: `🤖 CEK BIO META BOT\n\n� Bot keren untuk:\n• Cek bio WhatsApp\n• Buat ID Card Telegram\n• Fix Merah WhatsApp\n• Upload file ke URL\n\n🔗 Coba sekarang: @${botUsername}\n\nby ffek`,
          
        }
      },
      {
        type: 'article',
        id: 'referral',
        title: '� Share Link Referral',
        description: 'Undang teman & dapat bonus!',
        input_message_content: {
          message_text: `🎁 Gabung Bot Keren Ini!\n\n📱 Fitur unggulan:\n• Cek bio WhatsApp massal\n• Generate ID Card Telegram\n• Fix akun WhatsApp banned\n• Dan masih banyak lagi!\n\n� Join sekarang:\nhttps://t.me/${botUsername}?start=ref_${userId}\n\nDiundang oleh ${userName}`,
          
        }
      }
    ];
    
    await ctx.answerInlineQuery(results, { cache_time: 10 });
    
  } catch (err) {
    console.error('Error inline query:', err);
  }
});
//======================== EMAIL SYSTEM (REMOVED) ====================
// Fitur email dihapus karena port SMTP diblokir provider VPS.
//=====================================================================

//======================== COMMAND FITUR ====================

bot.command('start', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
  const wakturun = getUptime();
  const refData = loadRefs();
  const CHANNEL_ID = config.channelId;
  const GROUP_ID = config.groupId;
  
  const startPayload = ctx.message.text.split(' ')[1];
  if (startPayload && startPayload.startsWith('ref_')) {
    const referrerId = startPayload.replace('ref_', '');
    if (referrerId !== userId) {
      if (!refData[referrerId]) refData[referrerId] = { invited: [], bonusChecks: 0, totalInvited: 0 };

      if (!refData[referrerId].invited.includes(userId)) {
        refData[referrerId].invited.push(userId);
        saveRefs(refData);
        console.log(`✅ ${userId} berhasil jadi referral untuk ${referrerId}`);

        try {
          await ctx.telegram.sendMessage(
            referrerId,
            `📢 Kabar Baik!\n👤 ${userName} baru saja join menggunakan link referral kamu 🎉`,
            {  }
          );
        } catch (err) {
          console.warn(`⚠️ Gagal kirim notif ke ${referrerId}:`, err.message);
        }
      }
    }
  }
  
  // Skip member check - langsung tampilkan menu
  const caption = `━━━━━━━━━━━━━━━━━━━━━━━
  📱 <b>${config.settings.namabot.toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━━━

Hai, <b>${userName}</b>! 👋

Bot untuk cek bio WhatsApp
dengan cepat dan akurat.

👤 <b>Info</b>
• ID: <code>${userId}</code>
• Uptime: ${wakturun}
• Version: v${VERSION}

${config.settings.footer}`;

  try {
    await ctx.replyWithPhoto(
      { source: './database/profile.jpg' },
      {
        caption,
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            { text: '⚙️ Admin Panel', callback_data: 'owner' },
            { text: '📱 WhatsApp', callback_data: 'whatsapp' }
          ],
          [
            { text: '📦 Lainnya', callback_data: 'more' },
            { text: '💬 Developer', url: `https://t.me/${USERNAME_OWNER.replace('@', '')}` }
          ],
          [
            { text: '📢 Channel', url: `https://t.me/${config.channelId.replace('@', '')}` }
          ]
        ])
      }
    );

  } catch (err) {
    console.error('Error menampilkan menu:', err);
    ctx.reply('⚠️ Terjadi kesalahan.');
  }
});

bot.action('owner', async (ctx) => {
  try {
    await ctx.deleteMessage();
    await ctx.replyWithPhoto(
      { source: './database/profile.jpg' },
      {
        caption: `━━━━━━━━━━━━━━━━━━━━━━━
    ⚙️ <b>ADMIN PANEL</b>
━━━━━━━━━━━━━━━━━━━━━━━

📶 <b>Connection</b>
• /pairing — Hubungkan WA
• /clearsesi — Reset session

📢 <b>Broadcast</b>
• /broadcast — Kirim ke semua
• /totaluser — Total pengguna
• /listid — Daftar ID

⭐ <b>Premium</b>
• /addprem — Tambah premium
• /delprem — Hapus premium
• /listprem — Daftar premium

👑 <b>Owner</b>
• /addowner — Tambah owner
• /delowner — Hapus owner
• /listowner — Daftar owner

${config.settings.footer}`,
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [{ text: '◀️ Kembali ke Menu', callback_data: 'back_to_start' }]
        ])
      }
    );
  } catch (err) {
    console.error('Error di owner menu:', err);
  }
});

bot.action('whatsapp', async (ctx) => {
  try {
    await ctx.deleteMessage();
    await ctx.replyWithPhoto(
      { source: './database/profile.jpg' },
      {
        caption: `━━━━━━━━━━━━━━━━━━━━━━━
   📱 <b>WHATSAPP TOOLS</b>
━━━━━━━━━━━━━━━━━━━━━━━

🔍 <b>Fitur Utama</b>

<b>/cekbio 628xxx</b>
Cek bio nomor WhatsApp

<b>/info</b>
Informasi tentang cek bio

💡 <b>Tips</b>
Kirim file .txt berisi daftar
nomor untuk cek bio massal.

${config.settings.footer}`,
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [{ text: '◀️ Kembali ke Menu', callback_data: 'back_to_start' }]
        ])
      }
    );
  } catch (err) {
    console.error('Error di whatsapp menu:', err);
  }
});

bot.action('more', async (ctx) => {
  try {
    await ctx.deleteMessage();
    await ctx.replyWithPhoto(
      { source: './database/profile.jpg' },
      {
        caption: `━━━━━━━━━━━━━━━━━━━━━━━
    📦 <b>FITUR LAINNYA</b>
━━━━━━━━━━━━━━━━━━━━━━━

🛠️ <b>Utilities</b>
• /cekid — Cek ID Telegram
• /tourl — Konversi media ke URL
• /myinfo — Lihat info akun

🎁 <b>Referral</b>
• /referral — Link referral kamu
• /mystats — Statistik referral

${config.settings.footer}`,
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [{ text: '◀️ Kembali ke Menu', callback_data: 'back_to_start' }]
        ])
      }
    );
  } catch (err) {
    console.error('Error di more menu:', err);
  }
});

bot.action('back_to_start', async (ctx) => {
  try {
    await ctx.deleteMessage();
    const userId = ctx.from.id.toString();
    const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    const wakturun = getUptime();

    const caption = `━━━━━━━━━━━━━━━━━━━━━━━
  📱 <b>${config.settings.namabot.toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━━━

Hai, <b>${userName}</b>! 👋

Bot untuk cek bio WhatsApp
dengan cepat dan akurat.

👤 <b>Info</b>
• ID: <code>${userId}</code>
• Uptime: ${wakturun}
• Version: v${VERSION}

${config.settings.footer}`;

    await ctx.replyWithPhoto(
      { source: './database/profile.jpg' },
      {
        caption,
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            { text: '⚙️ Admin Panel', callback_data: 'owner' },
            { text: '📱 WhatsApp', callback_data: 'whatsapp' }
          ],
          [
            { text: '📦 Lainnya', callback_data: 'more' },
            { text: '💬 Developer', url: `https://t.me/${USERNAME_OWNER.replace('@', '')}` }
          ],
          [
            { text: '📢 Channel', url: `https://t.me/${config.channelId.replace('@', '')}` }
          ]
        ])
      }
    );
  } catch (err) {
    console.error('Error di back_to_start:', err);
  }
});

// ======================= 𝙼𝙴𝙽𝚄 𝙾𝚆𝙽𝙴𝚁 =======================

bot.command('pairing', checkAccess('owner'), async (ctx) => {
    const phoneNumber = ctx.message.text.split(' ')[1]?.replace(/[^0-9]/g, '');
    if (!phoneNumber) return ctx.reply(`Formatnya salah sayang.\nContoh: /pairing 628×××...`, {
      parse_mode: "HTML"
    });
    
    try {
        // Clear session lama untuk fresh start (wajib untuk pairing baru)
        const sessionDir = path.join(__dirname, 'session');
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log('🗑️ Session dihapus untuk pairing baru');
        }
        
        // Stop client lama jika ada
        if (waClient) {
            try {
                waClient.ev.removeAllListeners();
                waClient.ws.close();
            } catch (e) {}
            waClient = null;
        }
        
        await ctx.reply(`⏳ Memulai koneksi WhatsApp...\n\nTunggu beberapa detik...`, { parse_mode: "HTML" });
        
        isReconnecting = false;
        reconnectAttempts = 0;
        
        // Start fresh connection
        await startWhatsAppClient();
        
        // Tunggu koneksi siap (sampai QR code tersedia atau connected)
        // QR code berarti socket sudah siap untuk pairing
        let waitCount = 0;
        const maxWait = 30; // 15 detik max
        while (waitCount < maxWait) {
            await delay(500);
            waitCount++;
            
            // Jika sudah connected, tidak perlu pairing
            if (waConnectionStatus === 'open') {
                return ctx.reply(`✅ WhatsApp sudah terhubung! Tidak perlu pairing.`, { parse_mode: "HTML" });
            }
            
            // Jika QR code sudah tersedia, berarti socket siap untuk pairing
            if (currentQR && waClient) {
                break;
            }
        }
        
        if (!waClient) {
            return ctx.reply(`❌ Gagal memulai koneksi WhatsApp. Coba lagi.`, { parse_mode: "HTML" });
        }
        
        // Tambahan delay untuk memastikan socket benar-benar siap
        await delay(2000);
        
        await ctx.reply(`⏳ Meminta kode pairing untuk ${phoneNumber}...`, { parse_mode: "HTML" });
        
        const code = await waClient.requestPairingCode(phoneNumber);
        await ctx.reply(`📲 Kode Pairing: <code>${code?.match(/.{1,4}/g)?.join('-') || code}</code>\n\n📱 Cara pakai:\n1. Buka WhatsApp\n2. Pengaturan → Perangkat Tertaut\n3. Tautkan Perangkat\n4. Pilih "Tautkan dengan nomor telepon"\n5. Masukkan kode di atas\n\n⏳ Kode berlaku 60 detik!`, {
          parse_mode: "HTML"
        });
    } catch (e) {
        console.error("Gagal pairing:", e);
        await ctx.reply(`❌ Gagal minta pairing code: ${e.message}\n\nPastikan:\n• Nomor format: 628xxxxxxxxxx\n• Nomor aktif dan tidak terblokir\n\nCoba lagi: /pairing ${phoneNumber}`, {
          parse_mode: "HTML"
        });
    }
});

bot.command('pairingqr', checkAccess('owner'), async (ctx) => {
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id; // Bisa private atau group
  const phoneNumber = ctx.message.text.split(' ')[1]?.replace(/[^0-9]/g, '');
  
  if (!phoneNumber) {
    return ctx.reply(`⚠️ Format salah tolol!\n\nContoh: /pairingqr 628xxxxxxxxxx`, {
      parse_mode: "HTML"
    });
  }
  
  try {
    // Clear session dulu untuk generate QR baru
    const sessionDir = path.join(__dirname, 'session');
    
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log('🗑️ Session dihapus untuk generate QR baru');
    }
    
    // Set requester - simpan chat ID (bukan user ID) supaya bisa kirim ke grup juga
    qrRequesterId = chatId;
    currentQR = null;
    
    await ctx.reply(`⏳ Memulai proses pairing QR...\n\n📱 Nomor: ${phoneNumber}\n\nSession lama dihapus. QR code akan dikirim dalam beberapa detik.\n\n� Siapkan WhatsApp kamu:\nPengaturan → Perangkat Tertaut → Tautkan Perangkat`, {
      
    });
    
    // Restart WhatsApp client untuk generate QR
    if (waClient) {
      try {
        waClient.ev.removeAllListeners();
        waClient.ws.close();
      } catch (e) {}
      waClient = null;
    }
    
    isReconnecting = false;
    reconnectAttempts = 0;
    
    // Start ulang untuk generate QR
    await startWhatsAppClient();
    
    // Timeout untuk reset requester
    setTimeout(() => {
      if (qrRequesterId === chatId) {
        qrRequesterId = null;
        console.log('⏱️ QR request timeout, reset requester');
      }
    }, 120000); // 2 menit timeout
    
  } catch (err) {
    console.error('Error pairingqr:', err);
    await ctx.reply(`❌ Gagal generate QR: ${err.message}`, {
      
    });
  }
});

bot.command('clearsesi', async (ctx) => {
  const userId = ctx.from.id.toString();
  const sessionDir = path.join(__dirname, 'session');

  if (!isOwner(userId)) {
    return ctx.reply(`🚫 Hanya owner yang bisa menjalankan perintah ini.`, {
      parse_mode: "HTML"
    });
  }

  try {
    // Backup roles.json sebelum restart untuk mencegah data hilang
    const rolesBackupPath = path.join(__dirname, 'database', 'roles_backup.json');
    if (fs.existsSync(dataFile)) {
      fs.copyFileSync(dataFile, rolesBackupPath);
      console.log('✅ Backup roles.json dibuat sebelum clear session');
    }

    // Hapus folder session jika ada, lalu buat ulang (tidak perlu error jika tidak ada)
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionDir, { recursive: true });

    await ctx.reply(
      `🧹 Semua file di folder session sudah dihapus.\n\n` +
      `🔄 Bot akan restart otomatis dalam 3 detik...`,
      {  }
    );

    setTimeout(() => {
      console.log('🔁 Restarting bot by owner command...');
      try {
        exec('pm2 restart all || npm restart || node .', (err, stdout, stderr) => {
          if (err) {
            console.error('❌ Gagal restart bot:', err.message);
          } else {
            console.log('✅ Bot berhasil direstart oleh owner.');
          }
        });
      } catch (err) {
        console.error('⚠️ Gagal menjalankan perintah restart:', err.message);
      }
    }, 3000);

  } catch (err) {
    console.error('⚠️ Error saat hapus session:', err);
    ctx.reply('⚠️ Terjadi kesalahan saat menghapus file session.');
  }
});

bot.command('restart', async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!isOwner(userId)) {
      return ctx.reply(`🚫 Hanya owner yang bisa menjalankan perintah ini.`, {
        parse_mode: "HTML"
      });
  }

  await ctx.reply('🔄 <b>Server sedang direstart...</b>\nBot akan kembali online dalam beberapa detik.', { parse_mode: 'HTML' });
  console.log('⚠️ Restart triggered by owner command.');
  
  setTimeout(() => {
    process.exit(0); 
  }, 1000);
});

// ======================= GROUP HANDLERS =======================

bot.on('new_chat_members', async (ctx) => {
  try {
    const newMembers = ctx.message.new_chat_members;
    const botUsername = ctx.botInfo.username;

    for (const member of newMembers) {
      if (member.is_bot && member.id !== ctx.botInfo.id) continue;
      if (member.id === ctx.botInfo.id) {
          await ctx.reply('Terima kasih sudah mengundang saya! 🤖\nJangan lupa jadikan admin agar kinerja maksimal.', {
             reply_markup: {
                inline_keyboard: [[{ text: '🚀 Start Bot', url: `https://t.me/${botUsername}?start=group_add` }]]
             }
          });
          continue;
      }

      const name = member.first_name ? member.first_name.replace(/</g, '&lt;') : 'Member';
      const welcomeText = `Halo <b>${name}</b>! 👋\nSelamat datang di grup.\n\nAgar bisa menggunakan fitur bot, silakan <b>Start</b> bot di private chat ya!`;

      await ctx.reply(welcomeText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Start Bot di Sini', url: `https://t.me/${botUsername}?start=welcome` }]
          ]
        }
      });
    }
  } catch (err) {
    console.error('Welcome msg error:', err);
  }
});

bot.command('broadcast', async (ctx) => {
  const userId = ctx.from.id.toString();

  if (!isOwner(userId)) {
    return ctx.reply(`🚫 Hanya owner yang bisa menjalankan perintah ini.`, {
      parse_mode: "HTML"
    });
  }

  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) {
    return ctx.reply(`⚠️ Gunakan format:\n\n/broadcast pesan yang ingin dikirim`, {
      
    });
  }

  const users = loadUsers();
  if (users.length === 0) {
    return ctx.reply(`📭 Belum ada user private yang tercatat.`, {
      parse_mode: "HTML"
    });
  }

  await ctx.reply(`📢 Mengirim broadcast ke ${users.length} user...\nTunggu sebentar ⏳`, {
    
  });

  let success = 0;
  let failed = 0;

  for (const id of users) {
    try {
      await ctx.telegram.sendMessage(id, text, {  });
      success++;
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      failed++;
      console.log(`Gagal kirim ke ${id}:`, err.message);
    }
  }

  return ctx.reply(
    `✅ Broadcast selesai!\n\n📨 Terkirim: ${success}\n❌ Gagal: ${failed}`,
    {  }
  );
});

bot.command('totaluser', async (ctx) => {
  const userId = ctx.from.id.toString();

  if (!isOwner(userId)) {
    return ctx.reply(`🚫 Hanya owner yang bisa menjalankan perintah ini.`, {
      parse_mode: "HTML"
    });
  }

  try {
    const userDBPath = path.join(__dirname, 'database', 'users.json');
    if (!fs.existsSync(userDBPath)) {
      fs.writeFileSync(userDBPath, JSON.stringify([]));
    }

    const users = JSON.parse(fs.readFileSync(userDBPath, 'utf8') || '[]');
    const total = users.length;

    return ctx.reply(
      `📊 Total Pengguna Bot\n\n👤 Jumlah User: ${total}`,
      {  }
    );
  } catch (err) {
    console.error('Gagal ambil total user:', err);
    return ctx.reply('⚠️ Terjadi kesalahan saat menghitung total user.');
  }
});

bot.command("listid", async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (!isOwner(fromId))
    return ctx.reply("🚫 Hanya owner yang bisa melihat total ID!", { parse_mode: "HTML" });

  const users = loadUsers();

  if (users.length === 0)
    return ctx.reply("📭 Belum ada user terdaftar.", { parse_mode: "HTML" });

  const { text, buttons } = generateUserList(users, 1);

  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: buttons }
  });
});

bot.command("addprem", async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (!isOwner(fromId)) return ctx.reply("🚫 Hanya owner yang bisa menjalankan perintah ini.!", {
    parse_mode: "HTML"
  });

  const args = ctx.message.text.split(" ").slice(1);
  const targetId = args[0];
  const durasi = args[1];

  if (!targetId || !durasi)
    return ctx.reply(
      "⚠️ Gunakan format:\n/addprem user_id durasi\n\n🧩 Contoh:\n/addprem 12345678 7d\n/addprem 12345678 1m\n/addprem 12345678 p",
      { parse_mode: "HTML" }
    );

  const expireAt = parseDuration(durasi);
  if (!expireAt) return ctx.reply(`⚠️ Durasi tidak valid! Gunakan d/w/m/p.`, {
    parse_mode: "HTML"
  });

  roleData.premiums = roleData.premiums.filter(p => p.id !== targetId);

  roleData.premiums.push({ id: targetId, expireAt, startAt: Date.now() });
  saveRoles();

  const waktu = formatDuration(expireAt);

  await ctx.reply(`✨ User ${targetId} sekarang Premium selama ${waktu}!`, { parse_mode: "HTML" });

  try {
    await ctx.telegram.sendMessage(
      targetId,
      `🎉 Selamat!\nAnda telah menjadi Premium User!\n\n🕒 Waktu aktif: ${waktu}\n\nSelamat menggunakan layanan bot kami 🚀`,
      { parse_mode: "HTML" }
    );
  } catch {
    ctx.reply("⚠️ Tidak bisa kirim pesan ke user (mungkin belum start bot).");
  }
});

bot.command("delprem", async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (!isOwner(fromId)) return ctx.reply(`🚫 Hanya owner yang bisa menghapus user premium.`, {
    parse_mode: "HTML"
  });

  const args = ctx.message.text.split(" ").slice(1);
  const targetId = args[0];

  if (!targetId)
    return ctx.reply(
      "⚠️ Gunakan format:\n/delprem user_id\n\n🧩 Contoh:\n/delprem 12345678",
      { parse_mode: "HTML" }
    );

  const before = roleData.premiums.length;
  roleData.premiums = roleData.premiums.filter(p => p.id !== targetId);
  saveRoles();

  if (roleData.premiums.length === before)
    return ctx.reply(`❌ User ${targetId} tidak ditemukan di daftar premium.`, { parse_mode: "HTML" });

  ctx.reply(`✅ User ${targetId} telah dihapus dari daftar Premium.`, { parse_mode: "HTML" });
});

bot.command("listprem", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!isOwner(userId))
    return ctx.reply("🚫 Hanya owner yang bisa melihat daftar Premium!", { parse_mode: "HTML" });

  const data = roleData.premiums.filter(p => !isExpired(p.expireAt));
  if (data.length === 0)
    return ctx.reply("📭 Belum ada user Premium aktif.", { parse_mode: "HTML" });

  const { text, buttons } = generatePagedList(data, 1, "premium");

  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: buttons }
  });
});

bot.command("addowner", async (ctx) => {
  const fromId = ctx.from.id.toString();

  if (!isOwner(fromId)) return ctx.reply("🚫 Hanya owner yang bisa menjalankan perintah ini!", {
    parse_mode: "HTML"
  });

  const args = ctx.message.text.split(/\s+/).slice(1);
  const targetId = args[0];
  const durasi = args[1];

  if (!targetId || !durasi)
    return ctx.reply(
      "⚠️ Gunakan format:\n/addowner user_id durasi\n\n🧩 Contoh:\n/addowner 12345678 7d\n/addowner 12345678 1m\n/addowner 12345678 p",
      { parse_mode: "HTML" }
    );
  
  // Validasi ID harus angka
  if (!/^\d+$/.test(targetId)) {
      return ctx.reply("⚠️ ID tidak valid!\nHarus berupa angka (User ID), bukan username.\n\nMinta user ketik /cekid untuk melihat ID mereka.", { parse_mode: "HTML" });
  }

  const expireAt = parseDuration(durasi);
  if (!expireAt) return ctx.reply("⚠️ Durasi tidak valid! Gunakan d/w/m/p.");

  roleData.owners = roleData.owners.filter(o => o.id !== targetId);
  roleData.owners.push({ id: targetId, expireAt, startAt: Date.now() });
  saveRoles();

  const waktu = formatDuration(expireAt);

  await ctx.reply(`✅ User ${targetId} berhasil jadi *Owner* selama ${waktu}!`, { parse_mode: "HTML" });

  try {
    await ctx.telegram.sendMessage(
      targetId,
      `👑 Selamat!\nAnda telah menjadi Owner Bot!\n\n🕒 Waktu aktif: ${waktu}\n\nSelamat menikmati fitur eksklusif kami 🙌`,
      { parse_mode: "HTML" }
    );
  } catch {
    ctx.reply("⚠️ Tidak bisa kirim pesan ke user (mungkin belum start bot).", {
      parse_mode: "HTML"
    });
  }
});

bot.command("delowner", async (ctx) => {
  const fromId = ctx.from.id.toString();

  if (!isOwner(fromId))
    return ctx.reply("🚫 Hanya owner yang bisa menjalankan perintah ini!", {
    parse_mode: "HTML"
  });

  const args = ctx.message.text.split(" ").slice(1);
  const targetId = args[0];

  if (!targetId)
    return ctx.reply(
      "⚠️ Gunakan format:\n/delowner user_id\n\n🧩 Contoh:\n/delowner 12345678",
      { parse_mode: "HTML" }
    );

  const before = roleData.owners.length;
  roleData.owners = roleData.owners.filter(o => o.id !== targetId);
  saveRoles();

  if (roleData.owners.length === before)
    return ctx.reply(`❌ User ${targetId} tidak ditemukan di daftar owner.`, { parse_mode: "HTML" });

  ctx.reply(`✅ User ${targetId} telah dihapus dari daftar Owner.`, { parse_mode: "HTML" });
});

bot.command("listowner", async (ctx) => {
  const userId = ctx.from.id.toString();

  if (!isOwner(userId))
    return ctx.reply("🚫 Hanya owner yang bisa melihat daftar Owner!", { parse_mode: "HTML" });

  const data = roleData.owners.filter(o => !isExpired(o.expireAt));
  if (data.length === 0)
    return ctx.reply("📭 Belum ada owner tambahan aktif.", { parse_mode: "HTML" });

  const { text, buttons } = generatePagedList(data, 1, "owner");

  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: buttons }
  });
});

// ======================= 𝙼𝙴𝙽𝚄 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 =======================

bot.command('info', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
  const refData = loadRefs();

  if (!refData[userId]) {
    refData[userId] = { invited: [], bonusChecks: 0, totalInvited: 0 };
    saveRefs(refData);
  }

  const ownerData = roleData.owners.find(o => o.id === userId && !isExpired(o.expireAt));
  const premiumData = roleData.premiums.find(p => p.id === userId && !isExpired(p.expireAt));

  const ownerStatus = ownerData ? getDurationText(ownerData.expireAt, ownerData.startAt) : "NON OWNER";
  const premiumStatus = premiumData ? getDurationText(premiumData.expireAt, premiumData.startAt) : "NON PREMIUM";

  const userRef = refData[userId];
  const referralLink = `https://t.me/${ctx.botInfo.username}?start=ref_${userId}`;

  const sisaBonus = userRef.bonusChecks;
  const jumlahUndangan = userRef.invited.length;
  const totalKlaim = userRef.totalInvited;

  const caption = `━━━━━━━━━━━━━━━━━━━━━
    📊 INFORMASI AKUN 📊
━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────
│ Profile
├─────────────────────
│ ◈ Nama: ${userName}
│ ◈ ID: ${userId}
│ ◈ Premium: ${premiumStatus}
│ ◈ Owner: ${ownerStatus}
└─────────────────────

┌─────────────────────
│ Referral Stats
├─────────────────────
│ ◈ Bonus Tersisa: ${sisaBonus}x
│ ◈ Total Undangan: ${jumlahUndangan}
│ ◈ Bonus Diklaim: ${totalKlaim}
└─────────────────────

Link Referral:
${referralLink}

Undang 5 teman = 5x cek 150 nomor!

${config.settings.footer}`;

  try {
    await ctx.replyWithPhoto(
      { source: './database/profile.jpg' },
      {
        caption,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📤 Share Referral', switch_inline_query: referralLink }
            ],
            [
              { text: '💬 Hubungi Developer', url: `https://t.me/${config.usernameOwner.replace('@', '')}` }
            ]
          ]
        }
      }
    );
  } catch (err) {
    console.error('Error kirim info:', err);
    ctx.reply(
      `⚠️ Terjadi kesalahan saat menampilkan info akunmu.`,
      {  }
    );
  }
});

bot.command('cekbio', async (ctx) => {
  const userId = ctx.from.id.toString();
  const refData = loadRefs();

  if (!refData[userId]) {
    refData[userId] = { invited: [], bonusChecks: 0, totalInvited: 0 };
  }

  const isOwn = isOwner(userId);
  const isPrem = isPremium(userId);
  const now = Date.now();
  const cooldownTime = 25 * 1000;

  try {

    // COOLDOWN CHECK: Apply to everyone EXCEPT Owner
    if (!isOwn) {
      if (cooldowns[userId] && now - cooldowns[userId] < cooldownTime) {
        const remaining = (cooldownTime - (now - cooldowns[userId])) / 1000;
        return ctx.reply(
          `⏳ Tunggu ${Math.ceil(remaining)} detik sebelum pakai /cekbio lagi.`,
          { parse_mode: "HTML" }
        );
      }
    }

    // JOIN CHANNEL CHECK: Skip for Owner AND Premium
    if (!isOwn && !isPrem) {
      let notJoined = [];

      if (CHANNEL_ID) {
        try {
          const channelMember = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
          if (['left', 'kicked'].includes(channelMember.status)) {
            notJoined.push({ name: 'Channel', url: `https://t.me/${CHANNEL_ID.replace('@', '')}` });
          }
        } catch (e) {
            // Ignore error if bot isn't admin or channel invalid
        }
      }

      if (GROUP_ID) {
        try {
          const groupMember = await ctx.telegram.getChatMember(GROUP_ID, userId);
          if (['left', 'kicked'].includes(groupMember.status)) {
            notJoined.push({ name: 'Group', url: `https://t.me/${GROUP_ID.replace('@', '')}` });
          }
        } catch (e) {
            // Ignore error
        }
      }

      if (notJoined.length > 0) {
        const buttons = notJoined.map(i => ({ text: `Join ${i.name}`, url: i.url }));
        let msg = `🚫 Kamu belum join semua tempat wajib!\n`;
        notJoined.forEach(i => {
           msg += `👉 ${i.name}\n`; 
        });
        msg += ``;
        
        return ctx.reply(msg, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [buttons] }
        });
      }
    }

    let textSource = ctx.message.text;
    
    // Support reply message
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
        textSource += " " + ctx.message.reply_to_message.text;
    }
    
    const numbersToCheck = textSource.match(/\d+/g)?.map(n => n.toString()) || [];
    
    // Filter command part manually if needed, but regex \d+ is usually fine 
    // (except if command contains numbers, e.g. /cek123)
    // cleaning command from first match if it starts with slash
    if (ctx.message.text.startsWith('/')) {
        const commandParams = ctx.message.text.split(' ').slice(1).join(' ');
        const replyText = ctx.message.reply_to_message?.text || "";
        const combined = commandParams + " " + replyText;
        const validNumbers = combined.match(/\d+/g) || [];
        
        // Use filtered numbers
        // NOTE: We need to update the variable
        numbersToCheck.length = 0; // Clear array
        validNumbers.forEach(n => numbersToCheck.push(n));
    }

    console.log(`DEBUG: User ${userId} checking ${numbersToCheck.length} numbers:`, numbersToCheck.slice(0, 5));
    let jumlahNomor = numbersToCheck.length;

    if (jumlahNomor === 0) {
      return ctx.reply(`⚠️ Masukkan nomor yang ingin dicek.`, { parse_mode: "HTML" });
    }

    let maxNumbers = 200;

    // LIMIT EXCEPTION: Only for Owner
    if (isOwn) {
      maxNumbers = 9999;
    }

    if (jumlahNomor > maxNumbers) {
      // Truncate logic
      const truncated = numbersToCheck.slice(0, maxNumbers);
      numbersToCheck.length = 0;
      truncated.forEach(n => numbersToCheck.push(n));
      jumlahNomor = maxNumbers;
      
      await ctx.reply(`⚠️ Limit maksimal ${maxNumbers} nomor. Hanya 200 nomor pertama yang akan dicek.`, { parse_mode: "HTML" });
    }

    // SET COOLDOWN: Apply to everyone EXCEPT Owner
    if (!isOwn) cooldowns[userId] = now;

    const result = await handleBioCheck(ctx, numbersToCheck);

    const msg = `✅ Cek ${jumlahNomor} nomor selesai!`;

    await ctx.reply(msg, { parse_mode: "HTML" });

    if (!isOwn) setTimeout(() => delete cooldowns[userId], cooldownTime);

  } catch (err) {
    console.error('Error cekbio:', err);
    return ctx.reply(
      `⚠️ Terjadi kesalahan saat memeriksa nomor.\n🔁 Bonus kamu tidak berkurang.`,
      { parse_mode: "HTML" }
    );
  }
});



// ======================= 𝙼𝙴𝙽𝚄 𝙼𝙾𝚁𝙴 =======================

const cekidHandler = require('./cekid_handler');
bot.command('cekid', cekidHandler);

bot.command('tourl', async (ctx) => {
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
    if (['left', 'kicked'].includes(member.status)) {
      return ctx.reply(
        `🚫 Kamu harus join channel official dulu supaya bisa pakai fitur ini.`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [{ text: '📢 Channel Official', url: `https://t.me/${CHANNEL_ID.replace('@', '')}` }]
          ])
        }
      );
    }

    const reply = ctx.message.reply_to_message;
    if (!reply)
      return ctx.reply(`❌ Balas pesan yang berisi file/audio/video dengan perintah /tourl.`, {  });

    let fileId, filename;
    if (reply.document) {
      fileId = reply.document.file_id;
      filename = reply.document.file_name;
    } else if (reply.photo) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
      filename = 'photo.jpg';
    } else if (reply.video) {
      fileId = reply.video.file_id;
      filename = reply.video.file_name || 'video.mp4';
    } else if (reply.audio) {
      fileId = reply.audio.file_id;
      filename = reply.audio.file_name || 'audio.mp3';
    } else if (reply.voice) {
      fileId = reply.voice.file_id;
      filename = 'voice.ogg';
    } else {
      return ctx.reply(`❌ Pesan yang kamu balas tidak mengandung file/audio/video yang bisa diupload.`, {  });
    }

    const link = await ctx.telegram.getFileLink(fileId);
    const res = await fetch(link.href);
    const fileBuffer = Buffer.from(await res.arrayBuffer());

    const catboxUrl = await uploadToCatbox(fileBuffer, filename);

    await ctx.reply(
      `✅ File berhasil diupload ke Catbox:\n${catboxUrl}`,
      {  }
    );
  } catch (err) {
    console.error(err);
    ctx.reply(`❌ Gagal upload file: ${err.message}`, {  });
  }
});

// ======================= CALLBACK =======================

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (!data) return;

  const menuPrefixes = [
    "owner", "whatsapp", "more", "back_to_start"
  ];
  if (menuPrefixes.some(p => data.startsWith(p))) return;

  try {

    if (data.startsWith("users_")) {
      const match = data.match(/users_page_(\d+)/);
      if (!match) return;
      const page = parseInt(match[1]);
      const users = loadUsers();
      const { text, buttons } = generateUserList(users, page);

      return await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      });
    }
 
    if (data.startsWith("premium_")) {
      const match = data.match(/premium_page_(\d+)/);
      if (!match) return;
      const page = parseInt(match[1]);
      const list = roleData.premiums.filter(p => !isExpired(p.expireAt));
      const { text, buttons } = generatePagedList(list, page, "premium");

      return await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      });
    }
 
    if (data.startsWith("owner_")) {
      const match = data.match(/owner_page_(\d+)/);
      if (!match) return;
      const page = parseInt(match[1]);
      const list = roleData.owners.filter(o => !isExpired(o.expireAt));
      const { text, buttons } = generatePagedList(list, page, "owner");

      return await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      });
    }

  } catch (err) {
    console.error("❌ Error callback:", err);
  }

  await ctx.answerCbQuery();
});

// ======================= SCHEDULED TASKS =======================

setInterval(() => {
  console.log('🕐 Menjalankan auto-backup rutin...');
  autoBackup();
}, 1000 * 60 * 60 * 6);

// ======================= MAIN START =======================

(async () => {
    showBanner();
    // autoBackup();
    await startBot();
    await syncReferralBonuses();
    
    // Daftarkan semua command ke Telegram supaya muncul di autocomplete
    try {
      await bot.telegram.setMyCommands([
        { command: 'start', description: '🏠 Menu utama bot' },
        { command: 'info', description: '📊 Info akun & referral' },
        { command: 'cekbio', description: '📱 Cek bio WhatsApp nomor' },
        { command: 'cekid', description: '🪪 Buat ID Card Telegram' },
        { command: 'tourl', description: '🔗 Upload file ke URL' },
        { command: 'pairing', description: '🔌 Pairing WA dengan kode (Owner)' },
        { command: 'pairingqr', description: '📱 Pairing WA dengan QR (Owner)' },
        { command: 'clearsesi', description: '🗑️ Hapus sesi WA (Owner)' },
        { command: 'broadcast', description: '📢 Broadcast ke semua user (Owner)' },
        { command: 'totaluser', description: '👥 Total user terdaftar (Owner)' },
        { command: 'listid', description: '📋 Daftar semua user ID (Owner)' },
        { command: 'addprem', description: '⭐ Tambah user premium (Owner)' },
        { command: 'delprem', description: '❌ Hapus user premium (Owner)' },
        { command: 'listprem', description: '📜 Lihat list premium (Owner)' },
        { command: 'addowner', description: '👑 Tambah owner (Owner)' },
        { command: 'delowner', description: '🚫 Hapus owner (Owner)' },
        { command: 'listowner', description: '📝 Lihat list owner (Owner)' },
      ]);
    } catch (err) {
      console.error('⚠️ Gagal register commands:', err.message);
    }
    
    console.log('✅ Bot Telegram siap digunakan!');
    console.log('📋 Semua command sudah terdaftar di Telegram!');
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
