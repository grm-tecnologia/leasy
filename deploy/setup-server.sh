#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════
# Leasy — Hetzner VPS Setup Script
# Run as root on a fresh Ubuntu 22.04/24.04 VPS
# Usage: sudo bash setup-server.sh
# ═══════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════"
echo "  Leasy — Configuração do Servidor Hetzner"
echo "═══════════════════════════════════════════════════════════"

# ─── System Update ───────────────────────────────────────────────────
echo ""
echo "[1/8] Atualizando sistema..."
apt update && apt upgrade -y
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw

# ─── Node.js 22 ─────────────────────────────────────────────────────
echo ""
echo "[2/8] Instalando Node.js 22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
fi
echo "Node.js: $(node --version)"

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
echo "pnpm: $(pnpm --version)"

# Install PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo "PM2: $(pm2 --version)"

# ─── Create App User ────────────────────────────────────────────────
echo ""
echo "[3/8] Configurando usuário e diretórios..."
if ! id "leasy" &>/dev/null; then
    useradd -m -s /bin/bash leasy
fi
mkdir -p /var/www/leasy
mkdir -p /var/www/leasy/storage
mkdir -p /var/log/leasy
mkdir -p /var/www/certbot
chown -R leasy:leasy /var/www/leasy
chown -R leasy:leasy /var/log/leasy

# ─── Firewall ───────────────────────────────────────────────────────
echo ""
echo "[4/8] Configurando firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
echo "Firewall configurado."

# ─── Nginx ──────────────────────────────────────────────────────────
echo ""
echo "[5/8] Configurando Nginx..."
# Copy nginx config
if [ -f "/var/www/leasy/deploy/nginx/leasy.conf" ]; then
    cp /var/www/leasy/deploy/nginx/leasy.conf /etc/nginx/sites-available/leasy
    ln -sf /etc/nginx/sites-available/leasy /etc/nginx/sites-enabled/leasy
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo "Nginx configurado."
else
    echo "AVISO: Arquivo de configuração Nginx não encontrado."
    echo "Copie deploy/nginx/leasy.conf para /etc/nginx/sites-available/leasy"
fi

# ─── SSL Certificate ────────────────────────────────────────────────
echo ""
echo "[6/8] Certificado SSL..."
echo "Para obter o certificado SSL, execute:"
echo "  certbot --nginx -d leasy.app.br -d www.leasy.app.br"
echo ""
echo "Certbot será configurado para renovação automática."

# ─── MySQL (Opcional) ───────────────────────────────────────────────
echo ""
echo "[7/8] Banco de dados..."
echo "O Leasy usa TiDB Cloud por padrão."
echo "Se quiser usar MySQL local, instale com:"
echo "  apt install -y mysql-server"
echo "  mysql_secure_installation"
echo ""
echo "Depois crie o banco:"
echo "  mysql -u root -p -e 'CREATE DATABASE leasy;'"
echo "  mysql -u root -p -e \"CREATE USER 'leasy'@'localhost' IDENTIFIED BY 'SUA_SENHA';\""
echo "  mysql -u root -p -e \"GRANT ALL PRIVILEGES ON leasy.* TO 'leasy'@'localhost';\""

# ─── PM2 Startup ────────────────────────────────────────────────────
echo ""
echo "[8/8] Configurando PM2 para iniciar no boot..."
pm2 startup systemd -u leasy --hp /home/leasy
echo "PM2 configurado para iniciar automaticamente."

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Setup concluído!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Próximos passos:"
echo "  1. Clone o repositório em /var/www/leasy"
echo "  2. Copie .env.example para .env e configure as variáveis"
echo "  3. Execute: cd /var/www/leasy && pnpm install"
echo "  4. Execute: pnpm build"
echo "  5. Execute: pnpm db:push"
echo "  6. Execute: pm2 start deploy/ecosystem.config.cjs"
echo "  7. Execute: pm2 save"
echo "  8. Configure SSL: certbot --nginx -d leasy.app.br"
echo ""
