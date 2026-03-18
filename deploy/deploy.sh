#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════
# Leasy — Deploy Script (run on VPS)
# Usage: bash deploy/deploy.sh
# ═══════════════════════════════════════════════════════════════════════

APP_DIR="/var/www/leasy"
BRANCH="${1:-main}"

echo "═══════════════════════════════════════════════════════════"
echo "  Leasy — Deploy (branch: $BRANCH)"
echo "═══════════════════════════════════════════════════════════"

cd "$APP_DIR"

# Pull latest code
echo ""
echo "[1/5] Atualizando código..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Install dependencies
echo ""
echo "[2/5] Instalando dependências..."
pnpm install --frozen-lockfile

# Build
echo ""
echo "[3/5] Construindo aplicação..."
pnpm build

# Run migrations
echo ""
echo "[4/5] Executando migrações..."
pnpm db:push

# Restart app
echo ""
echo "[5/5] Reiniciando aplicação..."
pm2 restart leasy || pm2 start deploy/ecosystem.config.cjs
pm2 save

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Deploy concluído!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Verifique os logs com: pm2 logs leasy"
echo "Status: pm2 status"
echo ""
