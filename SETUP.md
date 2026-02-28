# TempMail — Full Setup Guide

Panduan lengkap setup dari NOL sampai jalan. Berlaku untuk kamu sendiri maupun untuk setup buyer.

---

## Prasyarat

- Akun [Cloudflare](https://dash.cloudflare.com) (gratis)
- Akun [Supabase](https://supabase.com) (gratis)
- Akun [Vercel](https://vercel.com) (gratis)
- Domain aktif yang sudah di-pointing ke Cloudflare (nameserver Cloudflare)
- Node.js v18+ & npm terinstall
- Git terinstall

---

## Arsitektur

```
Email masuk
  → Cloudflare Email Routing (tangkap email)
  → Cloudflare Worker (parse email jadi JSON)
  → Supabase Edge Function /email-webhook (simpan ke database)
  → Supabase Realtime (push ke frontend)
  → Vercel Frontend (tampilkan inbox)
```

---

## Step 1 — Supabase (Database + Backend)

### 1.1 Buat Project Baru

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Klik **New Project**
3. Isi nama project, password database, pilih region terdekat
4. Tunggu project selesai dibuat

### 1.2 Catat Credentials

Buka **Settings → API**, catat:

| Nama | Contoh |
|---|---|
| Project ID | `hwioheoxrnbbaqumsjvf` |
| Project URL | `https://hwioheoxrnbbaqumsjvf.supabase.co` |
| anon (public) key | `eyJhbGci...` |

### 1.3 Push Database Schema

```bash
# Clone repo
git clone <REPO_URL>
cd tempmailmixuz

# Install Supabase CLI (jika belum)
npm install -g supabase

# Login ke Supabase
npx supabase login

# Link ke project
npx supabase link --project-ref <PROJECT_ID>
# Masukkan database password saat diminta

# Push semua migrations
npx supabase db push
# Ketik Y untuk konfirmasi
```

### 1.4 Deploy Edge Functions

```bash
# Deploy semua Edge Functions
npx supabase functions deploy tempmail --project-ref <PROJECT_ID> --no-verify-jwt --use-api
npx supabase functions deploy email-webhook --project-ref <PROJECT_ID> --no-verify-jwt --use-api
npx supabase functions deploy cleanup-emails --project-ref <PROJECT_ID> --no-verify-jwt --use-api
```

### 1.5 Edge Function Secrets

> **Tidak ada secret wajib untuk admin atau domain.** Admin account dibuat via `/admin` (pertama kali buka = setup). Domain dikelola via admin panel.
>
> `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` **sudah otomatis ada**, tidak perlu diisi manual.

---

## Step 2 — Cloudflare (Email Routing + Worker)

### 2.1 Setup Domain di Cloudflare

1. Domain kamu harus sudah aktif di Cloudflare (nameserver pointing ke Cloudflare)
2. Kalau pakai subdomain untuk email (misal `mail.example.com`), pastikan ada DNS record:
   - **MX record**: `mail.example.com` → `route1.mx.cloudflare.net` (priority 10)
   - **MX record**: `mail.example.com` → `route2.mx.cloudflare.net` (priority 20)
   - **MX record**: `mail.example.com` → `route3.mx.cloudflare.net` (priority 30)
   - **TXT record**: `mail.example.com` → `v=spf1 include:_spf.mx.cloudflare.net ~all`

> MX record ini biasanya otomatis dibuat saat enable Email Routing di Cloudflare.

### 2.2 Enable Email Routing

1. Buka **Cloudflare Dashboard** → pilih domain kamu
2. Menu kiri: **Email** → **Email Routing**
3. Klik **Enable Email Routing** (ikuti wizard, akan auto-create DNS records)

### 2.3 Deploy Cloudflare Worker

```bash
cd cloudflare-worker
npm install

# Login ke Cloudflare
npx wrangler login

# Deploy worker
npx wrangler deploy
```

### 2.4 Set Worker Secrets

```bash
# URL webhook Supabase
npx wrangler secret put WEBHOOK_URL
# Paste: https://<PROJECT_ID>.supabase.co/functions/v1/email-webhook

# Supabase anon key (wajib untuk auth)
npx wrangler secret put SUPABASE_ANON_KEY
# Paste: anon key dari Supabase Dashboard

# Secret opsional (untuk validasi webhook)
npx wrangler secret put WEBHOOK_SECRET
# Paste: random string apa saja
```

### 2.5 Hubungkan Email Routing ke Worker

1. Buka **Cloudflare Dashboard** → domain kamu → **Email** → **Email Routing** → **Routing Rules**
2. Klik **Create Rule** atau **Catch-all address**
3. Action: **Send to a Worker**
4. Pilih worker: `tempmail-email-worker`
5. Save

Sekarang semua email ke `*@domain-kamu.com` akan ditangkap worker dan dikirim ke Supabase.

---

## Step 3 — Vercel (Frontend)

### 3.1 Import Project

1. Login ke [Vercel](https://vercel.com)
2. Klik **Add New → Project**
3. Import dari Git repository
4. Framework Preset: **Vite** (harusnya auto-detect)
5. Build Command: `npm run build` (default)
6. Output Directory: `dist` (default)

### 3.2 Set Environment Variables

Di halaman import, atau setelahnya di **Settings → Environment Variables**, tambahkan:

```
VITE_SUPABASE_PROJECT_ID=<PROJECT_ID>
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY>
VITE_SUPABASE_URL=https://<PROJECT_ID>.supabase.co
```

Atau import file `.env` langsung.

### 3.3 Deploy

Klik **Deploy**. Selesai. Vercel akan auto-deploy setiap push ke `main`.

### 3.4 Custom Domain (Opsional)

1. **Settings → Domains** → tambah domain
2. Ikuti instruksi DNS pointing di Vercel

---

## Step 4 — Admin Panel Setup

### 4.1 Buat Akun Admin Pertama

1. Buka `https://your-domain.com/admin`
2. Pertama kali → akan tampil form **Setup Admin**
3. Masukkan username dan password → klik **Create Admin Account**
4. Admin pertama otomatis jadi **Owner** (bisa manage admin lain)

### 4.2 Tambah Domain

1. Di admin panel, klik tab **Domains**
2. Masukkan nama domain (misal `mail.example.com`)
3. Klik **Add Domain**

> Domain harus sudah di-setup di Cloudflare Email Routing (Step 2) agar bisa terima email.

### 4.3 Fitur Admin Panel

| Tab | Fitur |
|---|---|
| **Emails** | Lihat semua email, buat email protected, hapus email, copy/use session token |
| **Domains** | Tambah/hapus domain email |
| **Webhooks** | Tambah/hapus webhook URL, toggle aktif/nonaktif, filter per email |
| **Admins** | Tambah/hapus admin (owner only) |

### 4.4 Multi-Admin

- Admin pertama = **Owner** (bisa manage admin lain)
- Owner bisa menambah admin baru via tab **Admins**
- Setiap admin punya username, password, dan session token sendiri
- Email yang dibuat admin masing-masing terhubung ke session token admin tersebut

### 4.6 Webhooks (Notifikasi Email Masuk)

Webhook memungkinkan kamu mendapat notifikasi otomatis setiap ada email masuk. Berguna untuk integrasi ke WhatsApp, Telegram, atau sistem lain.

1. Di admin panel, klik tab **Webhooks**
2. Masukkan URL webhook (misal endpoint bot Telegram atau WA gateway)
3. Opsional: isi **Email Filter** untuk hanya trigger pada email tertentu (misal `admin@yourdomain.com`)
4. Klik **Add Webhook**

Setiap email masuk, sistem akan POST JSON ke semua webhook aktif yang cocok:

```json
{
  "event": "new_email",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "uuid",
    "from": "sender@example.com",
    "to": "yourmail@yourdomain.com",
    "subject": "Subject line",
    "body_text": "Plain text content",
    "received_at": "2024-01-15T10:30:00Z"
  }
}
```

> Webhook yang error tidak mengganggu penerimaan email. Timeout 10 detik per webhook.

#### Menghubungkan Webhook ke Telegram

Kamu butuh "relay" — server kecil yang terima webhook dari TempMail lalu kirim pesan ke Telegram Bot.

1. **Buat bot Telegram**: Chat ke [@BotFather](https://t.me/BotFather) → `/newbot` → catat **Bot Token**
2. **Dapatkan Chat ID**: Chat ke bot kamu, lalu buka `https://api.telegram.org/bot<TOKEN>/getUpdates` → cari `chat.id`
3. **Buat relay** — contoh pakai Cloudflare Worker (gratis):

```javascript
// wrangler.toml: name = "webhook-relay"
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK");
    }
    const { data } = await request.json();
    const text = `📧 Email baru!
Dari: ${data.from}
Ke: ${data.to}
Subject: ${data.subject}`;
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: "HTML" })
    });
    return new Response("OK");
  }
};
```

4. Deploy worker: `npx wrangler deploy` → catat URL-nya (misal `https://webhook-relay.username.workers.dev`)
5. Set secrets: `npx wrangler secret put TELEGRAM_BOT_TOKEN` dan `npx wrangler secret put TELEGRAM_CHAT_ID`
6. Di admin panel TempMail → Webhooks → Add → paste URL worker relay

#### Menghubungkan Webhook ke WhatsApp

Untuk WhatsApp, kamu butuh WA Gateway (API pihak ketiga). Beberapa opsi populer:

- [Fonnte](https://fonnte.com) — populer di Indonesia, ada paket gratis
- [WAPISender](https://wapisender.com)
- WhatsApp Business API (official, lebih mahal)

Contoh relay ke Fonnte:

```javascript
// Secrets: FONNTE_TOKEN, WA_TARGET_NUMBER

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK");
    }
    const { data } = await request.json();
    const message = `📧 Email baru!
Dari: ${data.from}
Ke: ${data.to}
Subject: ${data.subject}`;
    await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: env.FONNTE_TOKEN },
      body: new URLSearchParams({ target: env.WA_TARGET_NUMBER, message })
    });
    return new Response("OK");
  }
};
```

Alurnya sama: deploy worker relay → paste URL-nya ke webhook di admin panel TempMail.

### 4.7 JSON API Index

GET request ke base URL Edge Function mengembalikan JSON index dengan daftar semua endpoint dan statistik:

```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/tempmail
```

Response berisi: nama service, daftar endpoint, jumlah email aktif, jumlah domain, dan uptime info. Cocok untuk monitoring atau dashboard.

### 4.5 Email Protected vs Auto-delete

| Tipe | Dibuat Oleh | Auto-delete? |
|---|---|---|
| Protected | Admin (via `/admin`) | ❌ Tidak dihapus |
| Auto-delete | User biasa (via halaman utama) | ✅ Dihapus setelah 3 jam |

---

## Step 5 — Verifikasi

### Test Kirim Email

1. Buka website di Vercel
2. Akan auto-generate email temporary, misal `akira5x2k312@mail.example.com`
3. Kirim email ke alamat tersebut dari Gmail/email lain
4. Tunggu 5-15 detik, email harus muncul di inbox

### Troubleshooting

| Masalah | Cek |
|---|---|
| Email tidak masuk | Cloudflare Email Routing aktif? Worker terdeploy? Routing rule sudah pointing ke worker? |
| Worker error | `npx wrangler tail` di folder `cloudflare-worker/` untuk lihat log realtime |
| 404 di Vercel | Pastikan `vercel.json` ada di root repo dengan rewrite rule |
| Edge Function error | Supabase Dashboard → Edge Functions → Logs |

---

## Menambah Domain Email Baru

Setelah setup awal, menambah domain baru cukup 2 langkah:

1. **Cloudflare**: Tambah domain baru → Enable Email Routing → Routing Rule → Worker
2. **Admin Panel**: Tab Domains → Add Domain

Selesai. Frontend otomatis ambil domain list dari database.

---

## Struktur Env Variables — Ringkasan

### Vercel (Frontend)

| Variable | Dari Mana |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Settings → API (anon key) |
| `VITE_SUPABASE_URL` | `https://<PROJECT_ID>.supabase.co` |
| `VITE_ACCESS_PASSWORD` | (Opsional) Password untuk akses website |

### Supabase Edge Functions

| Variable | Dari Mana |
|---|---|
| `SUPABASE_URL` | Otomatis |
| `SUPABASE_SERVICE_ROLE_KEY` | Otomatis |

> Admin dan domain dikelola via admin panel — tidak perlu set secret apapun.

### Cloudflare Worker

| Variable | Dari Mana |
|---|---|
| `WEBHOOK_URL` | `https://<PROJECT_ID>.supabase.co/functions/v1/email-webhook` |
| `SUPABASE_ANON_KEY` | Supabase anon key (wajib untuk auth) |
| `WEBHOOK_SECRET` | Random string buatan sendiri (opsional) |

