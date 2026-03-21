#!/bin/bash
set -e

# ─── Leasy Deploy Script ─────────────────────────────────────────────────────
# Executa no servidor Hetzner via SSH
# Uso: ssh root@178.104.80.62 'bash -s' < scripts/deploy.sh

APP_DIR="/opt/leasy"
REPO_URL="https://github.com/pinochet97/leasy.git"
BRANCH="main"

echo "═══════════════════════════════════════════════"
echo "  Leasy — Deploy Script"
echo "═══════════════════════════════════════════════"

# 1. Garantir dependências
echo "→ Verificando dependências..."
if ! command -v docker &> /dev/null; then
    echo "  Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "  Instalando Docker Compose plugin..."
    apt-get update -qq && apt-get install -y -qq docker-compose-plugin
fi

if ! command -v nginx &> /dev/null; then
    echo "  Instalando Nginx..."
    apt-get update -qq && apt-get install -y -qq nginx
    systemctl enable nginx
fi

if ! command -v git &> /dev/null; then
    echo "  Instalando Git..."
    apt-get update -qq && apt-get install -y -qq git
fi

# 2. Clonar ou atualizar repositório
echo "→ Atualizando código..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 3. Verificar .env
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️  Arquivo .env não encontrado! Criando a partir do .env.example..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo "⚠️  EDITE o arquivo $APP_DIR/.env com suas credenciais antes de continuar!"
    exit 1
fi

# 4. Build e deploy com Docker
echo "→ Construindo imagem Docker..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# 5. Configurar Nginx
echo "→ Configurando Nginx..."
cp "$APP_DIR/docker/nginx.conf" /etc/nginx/sites-available/leasy
ln -sf /etc/nginx/sites-available/leasy /etc/nginx/sites-enabled/leasy
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar Nginx
nginx -t && systemctl reload nginx

# 6. Verificar saúde
echo "→ Aguardando aplicação iniciar..."
sleep 5
if curl -sf http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Leasy está rodando em http://localhost:3000"
else
    echo "⚠️  Aplicação pode ainda estar iniciando. Verifique com: docker compose logs -f"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  Deploy concluído!"
echo "  App: http://$(hostname -I | awk '{print $1}')"
echo "═══════════════════════════════════════════════"
