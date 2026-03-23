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
echo "[1/7] Atualizando código..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Install dependencies
echo ""
echo "[2/7] Instalando dependências..."
pnpm install --frozen-lockfile

# Build
echo ""
echo "[3/7] Construindo aplicação..."
pnpm build

# Run Drizzle migrations (schema push)
echo ""
echo "[4/7] Executando migrações do schema..."
pnpm db:push

# Run SQL migrations (generated columns, etc.)
echo ""
echo "[5/7] Executando migrações SQL adicionais..."
for migration in drizzle/0003_*.sql; do
  if [ -f "$migration" ]; then
    echo "  Aplicando: $migration"
    # Extract DB credentials from DATABASE_URL
    if [ -n "$DATABASE_URL" ]; then
      mysql_cmd=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+).*|mysql -u\1 -p\2 -h\3 -P\4 \5|')
      $mysql_cmd < "$migration" 2>/dev/null || echo "  (já aplicada ou erro ignorado)"
    else
      echo "  AVISO: DATABASE_URL não definida, pulando migração SQL"
    fi
  fi
done

# Verify Redis is running
echo ""
echo "[6/7] Verificando Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo "Redis: OK"
else
    echo "AVISO: Redis não está rodando. Background jobs não funcionarão."
    echo "Instale com: apt install -y redis-server && systemctl enable redis-server && systemctl start redis-server"
fi

# Restart app
echo ""
echo "[7/7] Reiniciando aplicação..."
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
