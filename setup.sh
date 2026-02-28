#!/usr/bin/env bash
set -euo pipefail

# ============================================
#  TempMail — Automated Setup Script
#  Automates: Supabase DB + Edge Functions + Cloudflare Worker + Vercel .env
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║       TempMail — Auto Setup Script       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Preflight checks ───
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js not installed${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm not installed${NC}"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo -e "${RED}Error: npx not installed${NC}"; exit 1; }

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# ─── Collect Info ───
echo ""
echo -e "${YELLOW}=== Step 1: Supabase Project Info ===${NC}"
echo ""
read -p "Supabase Project ID (contoh: hwioheoxrnbbaqumsjvf): " SUPABASE_PROJECT_ID
read -p "Database password: " -s DB_PASSWORD
echo ""

echo ""
echo -e "${YELLOW}=== Step 2: Cloudflare Worker Info ===${NC}"
echo ""
WEBHOOK_URL="https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/email-webhook"
echo -e "Webhook URL (auto): ${CYAN}${WEBHOOK_URL}${NC}"
read -p "Webhook Secret (random string, bisa kosong untuk skip): " WEBHOOK_SECRET

# ─── Install root dependencies ───
echo ""
echo -e "${YELLOW}=== Step 3: Install Dependencies ===${NC}"
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install --yes
else
  echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# ─── Supabase Login Check ───
echo ""
echo -e "${YELLOW}=== Step 4: Supabase Setup ===${NC}"
echo ""

# Check if supabase CLI is available
if ! npx supabase --version >/dev/null 2>&1; then
  echo "Installing Supabase CLI..."
  npm install -g supabase
fi
echo -e "${GREEN}✓ Supabase CLI ready${NC}"

# Check login status
if ! npx supabase projects list >/dev/null 2>&1; then
  echo -e "${YELLOW}Belum login ke Supabase. Menjalankan login...${NC}"
  npx supabase login
fi
echo -e "${GREEN}✓ Supabase logged in${NC}"

# Link project
echo "Linking to Supabase project ${SUPABASE_PROJECT_ID}..."
echo "${DB_PASSWORD}" | npx supabase link --project-ref "${SUPABASE_PROJECT_ID}" -p "${DB_PASSWORD}" 2>/dev/null || \
  npx supabase link --project-ref "${SUPABASE_PROJECT_ID}" <<< "${DB_PASSWORD}" 2>/dev/null || \
  echo -e "${YELLOW}⚠ Auto-link gagal. Jalankan manual: npx supabase link --project-ref ${SUPABASE_PROJECT_ID}${NC}"

echo -e "${GREEN}✓ Supabase linked${NC}"

# Push database migrations
echo "Pushing database migrations..."
yes | npx supabase db push || {
  echo -e "${RED}✗ DB push gagal. Cek error di atas.${NC}"
  exit 1
}
echo -e "${GREEN}✓ Database migrations applied${NC}"

# Deploy Edge Functions
echo "Deploying Edge Functions..."
npx supabase functions deploy tempmail --project-ref "${SUPABASE_PROJECT_ID}" --no-verify-jwt --use-api || {
  echo -e "${RED}✗ Deploy tempmail gagal${NC}"; exit 1;
}
npx supabase functions deploy email-webhook --project-ref "${SUPABASE_PROJECT_ID}" --no-verify-jwt --use-api || {
  echo -e "${RED}✗ Deploy email-webhook gagal${NC}"; exit 1;
}
npx supabase functions deploy cleanup-emails --project-ref "${SUPABASE_PROJECT_ID}" --no-verify-jwt --use-api || {
  echo -e "${RED}✗ Deploy cleanup-emails gagal${NC}"; exit 1;
}
echo -e "${GREEN}✓ Edge Functions deployed${NC}"

# ─── Get API Keys ───
echo ""
echo -e "${YELLOW}=== Step 5: Fetch API Keys ===${NC}"
echo ""

ANON_KEY=$(npx supabase projects api-keys --project-ref "${SUPABASE_PROJECT_ID}" 2>/dev/null | grep "anon" | awk '{print $4}' | tr -d '[:space:]')

if [ -z "${ANON_KEY}" ]; then
  echo -e "${YELLOW}⚠ Gagal fetch anon key otomatis.${NC}"
  read -p "Paste anon key dari Supabase Dashboard → Settings → API: " ANON_KEY
fi
echo -e "${GREEN}✓ Anon key retrieved${NC}"

# ─── Write .env ───
echo ""
echo -e "${YELLOW}=== Step 6: Generate .env ===${NC}"
cat > .env << EOF
VITE_SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID}"
VITE_SUPABASE_PUBLISHABLE_KEY="${ANON_KEY}"
VITE_SUPABASE_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"
EOF
echo -e "${GREEN}✓ .env created${NC}"
echo ""
cat .env
echo ""

# ─── Update supabase/config.toml ───
echo "project_id = \"${SUPABASE_PROJECT_ID}\"" > supabase/config.toml
echo -e "${GREEN}✓ supabase/config.toml updated${NC}"

# ─── Cloudflare Worker ───
echo ""
echo -e "${YELLOW}=== Step 7: Cloudflare Worker ===${NC}"
echo ""

cd cloudflare-worker

if [ ! -d "node_modules" ]; then
  echo "Installing worker dependencies..."
  npm install --yes
fi
echo -e "${GREEN}✓ Worker dependencies installed${NC}"

# Check wrangler login
if ! npx wrangler whoami >/dev/null 2>&1; then
  echo -e "${YELLOW}Belum login ke Cloudflare. Menjalankan login...${NC}"
  npx wrangler login
fi
echo -e "${GREEN}✓ Cloudflare logged in${NC}"

# Deploy worker
echo "Deploying Cloudflare Worker..."
npx wrangler deploy || {
  echo -e "${RED}✗ Worker deploy gagal${NC}"; exit 1;
}
echo -e "${GREEN}✓ Worker deployed${NC}"

# Set secrets
echo "Setting WEBHOOK_URL..."
echo "${WEBHOOK_URL}" | npx wrangler secret put WEBHOOK_URL 2>/dev/null || \
  echo -e "${YELLOW}⚠ Gagal set WEBHOOK_URL otomatis. Jalankan: npx wrangler secret put WEBHOOK_URL${NC}"

echo "Setting SUPABASE_ANON_KEY..."
echo "${ANON_KEY}" | npx wrangler secret put SUPABASE_ANON_KEY 2>/dev/null || \
  echo -e "${YELLOW}⚠ Gagal set SUPABASE_ANON_KEY otomatis. Jalankan: npx wrangler secret put SUPABASE_ANON_KEY${NC}"

if [ -n "${WEBHOOK_SECRET}" ]; then
  echo "Setting WEBHOOK_SECRET..."
  echo "${WEBHOOK_SECRET}" | npx wrangler secret put WEBHOOK_SECRET 2>/dev/null || \
    echo -e "${YELLOW}⚠ Gagal set WEBHOOK_SECRET otomatis. Jalankan: npx wrangler secret put WEBHOOK_SECRET${NC}"
fi
echo -e "${GREEN}✓ Worker secrets set${NC}"

cd ..

# ─── Build Frontend ───
echo ""
echo -e "${YELLOW}=== Step 8: Build Frontend ===${NC}"
npm run build || {
  echo -e "${RED}✗ Build gagal${NC}"; exit 1;
}
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# ─── Done ───
echo ""
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP SELESAI!                        ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  Frontend:                                                   ║"
echo "║    Deploy ke Vercel, import .env yang sudah di-generate      ║"
echo "║                                                              ║"
echo "║  Admin Panel:                                                ║"
echo "║    Buka https://your-domain.com/admin                       ║"
echo "║    Pertama kali → buat akun admin (username + password)      ║"
echo "║    Lalu → tambah domain di tab Domains                      ║"
echo "║                                                              ║"
echo "║  Yang masih perlu dilakukan MANUAL di Cloudflare Dashboard:  ║"
echo "║    1. Email → Email Routing → Enable (jika belum)            ║"
echo "║    2. Routing Rules → Catch-all → Send to Worker             ║"
echo "║       Pilih worker: tempmail-email-worker                    ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "Supabase URL  : ${GREEN}https://${SUPABASE_PROJECT_ID}.supabase.co${NC}"
echo -e "Webhook URL   : ${GREEN}${WEBHOOK_URL}${NC}"
echo ""
echo -e "${YELLOW}Next: Deploy ke Vercel → Import .env → Buka /admin → Setup admin + domain → Done!${NC}"
