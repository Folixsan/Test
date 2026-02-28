# TempMail

Disposable email service with real-time inbox, admin panel, and multi-domain support.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions + Realtime)
- **Email**: Cloudflare Worker + Email Routing

## Quick Start

```bash
npm install
npm run dev
```

## Setup

Lihat [SETUP.md](./SETUP.md) untuk panduan lengkap, atau jalankan:

```bash
chmod +x setup.sh
./setup.sh
```

## Project Structure

```
src/                  # React frontend
supabase/
  functions/
    tempmail/         # Main API (CRUD, admin, domains)
    email-webhook/    # Receives parsed email from worker
    cleanup-emails/   # Cleanup old messages
  migrations/         # Database schema
cloudflare-worker/    # Email receiving worker
```

## Environment Variables

### Vercel (Frontend)

| Variable | Keterangan |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Project ID dari Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key dari Supabase |
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_ACCESS_PASSWORD` | (Opsional) Password gate |

### Cloudflare Worker

| Variable | Keterangan |
|---|---|
| `WEBHOOK_URL` | URL edge function email-webhook |
| `SUPABASE_ANON_KEY` | Anon key untuk auth |

## License

Private. All rights reserved.
