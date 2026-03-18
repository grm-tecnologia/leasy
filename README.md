# Leasy — Plataforma de Leads Inteligentes

**Plataforma SaaS de Gestão e Venda de Leads Segmentados** — versão self-hosted para deploy em VPS (Hetzner, DigitalOcean, etc.).

Leasy é uma plataforma completa para ingestão, organização e comercialização de listas de leads B2B e B2C. O sistema utiliza inteligência artificial para mapear automaticamente colunas de dados de qualquer formato de arquivo, classificar leads em categorias dinâmicas e oferecer filtros avançados combinados para que clientes encontrem exatamente o público que procuram.

---

## Visão Geral

O Leasy resolve um problema comum no mercado de prospecção: a dificuldade de encontrar leads qualificados e segmentados. A plataforma permite que o administrador faça upload de arquivos de leads em múltiplos formatos, e a IA integrada identifica automaticamente os campos (nome, e-mail, telefone, CPF, cidade, etc.), independentemente de como as colunas estejam nomeadas no arquivo original. Os clientes acessam um dashboard intuitivo onde podem explorar categorias, aplicar filtros combinados, visualizar amostras mascaradas e comprar listas com pagamento integrado via Mercado Pago.

---

## Funcionalidades

### Painel Administrativo

| Funcionalidade | Descrição |
|---|---|
| **Dashboard** | Visão geral com métricas de leads, pedidos, receita e usuários |
| **Upload Inteligente** | Upload de CSV, Excel, TXT e JSON com mapeamento automático de colunas via IA (LLM) |
| **Gestão de Leads** | Visualização, busca, exclusão e exportação de leads em CSV |
| **Categorias** | CRUD completo de categorias/nichos com ícones, cores e campos dinâmicos |
| **Preços** | Configuração de faixas de preço por quantidade para cada categoria |
| **Pedidos** | Gestão de todos os pedidos com status de pagamento e exportação CSV |
| **Analytics** | Gráficos de receita, pedidos por período e métricas de desempenho |

### Dashboard do Cliente

| Funcionalidade | Descrição |
|---|---|
| **Explorar Leads** | Navegação por categorias com contagem de leads e descrições |
| **Filtros Avançados** | Filtros dinâmicos combinados baseados nos campos de cada categoria |
| **Amostras Mascaradas** | Visualização de dados parciais (contato mascarado) antes da compra |
| **Busca Global** | Busca por qualquer campo em todas as categorias simultaneamente |
| **Carrinho** | Sistema de carrinho com cálculo automático de preço por faixa |
| **Pagamento** | Checkout integrado com Mercado Pago (redirect + webhook automático) |
| **Meus Pedidos** | Histórico de compras com status e download de listas em CSV |

### Inteligência Artificial

O módulo de ingestão utiliza LLM (OpenAI GPT-4o-mini) para analisar as primeiras linhas de qualquer arquivo enviado e retornar um mapeamento inteligente de colunas. Mesmo que o arquivo tenha colunas nomeadas como "col_1", "telefone_contato" ou "NOME COMPLETO DO LEAD", a IA identifica o significado semântico e sugere o campo correto.

### Segurança e Validação

O sistema valida automaticamente CPFs (algoritmo de dígitos verificadores), e-mails (formato RFC) e telefones brasileiros (DDD + 8-9 dígitos) durante o upload, marcando campos inválidos para garantir a qualidade dos dados vendidos.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui |
| **Backend** | Express 4, tRPC 11, Drizzle ORM, Zod v4 |
| **Banco de Dados** | MySQL / TiDB Cloud |
| **Auth** | Google OAuth 2.0 + JWT (self-hosted) |
| **Pagamento** | Mercado Pago (Checkout Pro + Webhooks) |
| **IA/LLM** | OpenAI API (gpt-4o-mini) |
| **Storage** | Local filesystem ou AWS S3 |
| **Email** | Resend (transacional) |
| **Deploy** | PM2 + Nginx + Let's Encrypt |
| **Testes** | Vitest |

---

## Pré-requisitos

- **Node.js 22+** e **pnpm**
- **MySQL 8+** ou acesso ao **TiDB Cloud**
- **Conta Google Cloud** (para OAuth)
- **Conta Mercado Pago** (para pagamentos)
- **Conta Resend** (para emails transacionais)
- **Chave OpenAI** (para mapeamento IA de colunas CSV)

---

## Configuração Rápida (Desenvolvimento Local)

```bash
# 1. Clone o repositório
git clone git@github.com:pinochet97/leadhub.git
cd leadhub

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Execute as migrações do banco
pnpm db:push

# 5. Inicie o servidor de desenvolvimento
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`.

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

| Variável | Descrição | Obrigatória |
|----------|-----------|:-----------:|
| `DATABASE_URL` | Connection string MySQL/TiDB | Sim |
| `JWT_SECRET` | Segredo para assinar tokens JWT | Sim |
| `GOOGLE_CLIENT_ID` | Client ID do Google OAuth | Sim |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Google OAuth | Sim |
| `ADMIN_EMAIL` | Email do administrador (notificações) | Sim |
| `APP_URL` | URL pública da aplicação | Sim |
| `OPENAI_API_KEY` | Chave da API OpenAI | Sim |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso Mercado Pago | Sim |
| `VITE_MERCADOPAGO_PUBLIC_KEY` | Chave pública Mercado Pago | Sim |
| `RESEND_API_KEY` | Chave da API Resend | Sim |
| `STORAGE_MODE` | `local` ou `s3` | Não (default: local) |
| `STORAGE_PATH` | Caminho local para arquivos | Não |
| `STORAGE_URL` | URL pública dos arquivos | Não |
| `OWNER_OPEN_ID` | OpenID do admin (auto-promoção) | Não |

---

## Configuração do Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth 2.0 Client IDs**
5. Tipo: **Web application**
6. Adicione em **Authorized redirect URIs**:
   - `https://leasy.app.br/api/auth/google/callback` (produção)
   - `http://localhost:3000/api/auth/google/callback` (desenvolvimento)
7. Copie o **Client ID** e **Client Secret** para o `.env`

---

## Deploy no Hetzner VPS

### 1. Configuração Inicial do Servidor

```bash
# No servidor (como root)
sudo bash deploy/setup-server.sh
```

Este script instala Node.js 22, pnpm, PM2, Nginx e configura o firewall.

### 2. Clone e Configure

```bash
cd /var/www/leasy
git clone git@github.com:pinochet97/leadhub.git .
cp .env.example .env
nano .env  # Configure todas as variáveis
```

### 3. Build e Deploy

```bash
pnpm install
pnpm build
pnpm db:push
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

### 4. Nginx

```bash
sudo cp deploy/nginx/leasy.conf /etc/nginx/sites-available/leasy
sudo ln -sf /etc/nginx/sites-available/leasy /etc/nginx/sites-enabled/leasy
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 5. SSL com Let's Encrypt

```bash
sudo certbot --nginx -d leasy.app.br -d www.leasy.app.br
```

### 6. Atualizações Futuras

```bash
bash deploy/deploy.sh
```

---

## Estrutura do Projeto

```
leasy/
├── client/                        # Frontend React
│   ├── src/
│   │   ├── components/            # Componentes reutilizáveis
│   │   │   ├── DashboardLayout.tsx    # Layout com sidebar role-based
│   │   │   ├── EmptyState.tsx         # Empty states com CTAs
│   │   │   ├── LucideIcon.tsx         # Renderização dinâmica de ícones
│   │   │   ├── Pagination.tsx         # Paginação reutilizável
│   │   │   └── ui/                    # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Landing.tsx            # Landing page pública
│   │   │   ├── Login.tsx              # Login com Google OAuth
│   │   │   ├── admin/                 # Páginas do administrador
│   │   │   └── client/               # Páginas do cliente
│   │   ├── App.tsx                    # Rotas e lazy loading
│   │   └── index.css                  # Design tokens e tema
│   └── index.html
├── server/                        # Backend Express + tRPC
│   ├── _core/                     # Infraestrutura
│   │   ├── sdk.ts                     # Google OAuth + JWT auth
│   │   ├── oauth.ts                   # Rotas de callback OAuth
│   │   ├── env.ts                     # Variáveis de ambiente
│   │   ├── llm.ts                     # OpenAI API integration
│   │   ├── notification.ts            # Notificações via email
│   │   ├── context.ts                 # tRPC context
│   │   └── cookies.ts                 # Cookie management
│   ├── routers.ts                     # Procedures tRPC
│   ├── db.ts                          # Query helpers (Drizzle)
│   ├── storage.ts                     # Local/S3 file storage
│   ├── webhooks.ts                    # Webhook Mercado Pago
│   ├── email.ts                       # Emails transacionais (Resend)
│   └── security.ts                    # Rate limiting, CSP, CORS
├── drizzle/                       # Schema e migrations
│   └── schema.ts                      # Definição das tabelas
├── deploy/                        # Scripts de deploy
│   ├── nginx/leasy.conf               # Configuração Nginx
│   ├── ecosystem.config.cjs           # Configuração PM2
│   ├── setup-server.sh                # Setup inicial do VPS
│   └── deploy.sh                      # Script de atualização
├── shared/                        # Constantes compartilhadas
├── .env.example                   # Template de variáveis
└── README.md
```

---

## Modelo de Dados

| Tabela | Descrição |
|---|---|
| `users` | Usuários com roles (admin/user), Google OAuth e sessão |
| `categories` | Nichos de leads com campos dinâmicos (fieldDefinitions em JSON) |
| `leads` | Leads com dados flexíveis em JSON, vinculados a categorias |
| `upload_batches` | Registro de uploads com mapeamento de colunas da IA |
| `orders` | Pedidos com status de pagamento e integração Mercado Pago |
| `order_items` | Itens de cada pedido com filtros aplicados e link de download |
| `lead_pricing` | Faixas de preço por quantidade para cada categoria |

---

## Fluxo de Upload com IA

1. **Upload** — O admin seleciona a categoria e envia um arquivo (CSV, Excel, TXT ou JSON).
2. **Análise IA** — O sistema envia as primeiras linhas para o OpenAI GPT-4o-mini, que retorna um mapeamento de colunas.
3. **Revisão** — O admin revisa e ajusta o mapeamento sugerido pela IA.
4. **Processamento** — O sistema processa todas as linhas, valida CPFs/e-mails/telefones, e insere os leads.
5. **Conclusão** — O contador de leads é atualizado e os novos filtros ficam disponíveis.

---

## Fluxo de Compra

1. O cliente explora categorias e aplica filtros combinados.
2. Visualiza amostras com dados de contato mascarados.
3. Adiciona ao carrinho a quantidade desejada de leads.
4. No checkout, o sistema calcula o preço pela faixa de quantidade.
5. O cliente é redirecionado ao Mercado Pago para pagamento.
6. Após confirmação (webhook), o sistema gera um CSV e disponibiliza para download.
7. O proprietário recebe uma notificação automática da venda por email.

---

## Primeiro Admin

Após o primeiro login via Google, o sistema cria o usuário com role `user`. Para promover a admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'kaio@leasy.app.br';
```

Ou configure `OWNER_OPEN_ID` no `.env` com o `openId` do seu usuário Google (formato: `google_XXXXX`). Usuários com esse `openId` são automaticamente promovidos a admin no primeiro login.

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção (Vite + esbuild) |
| `pnpm start` | Inicia em modo produção |
| `pnpm test` | Executa todos os testes (Vitest) |
| `pnpm db:push` | Gera e aplica migrações do banco |
| `pnpm check` | Verificação TypeScript |
| `pnpm format` | Formatação com Prettier |

---

## Migração do Manus

Esta versão foi adaptada para funcionar de forma totalmente independente:

| Componente | Antes (Manus) | Agora (Self-hosted) |
|---|---|---|
| **Auth** | Manus OAuth SDK | Google OAuth 2.0 direto |
| **LLM** | Manus Forge API proxy | OpenAI API direto |
| **Storage** | Manus S3 proxy | Local filesystem / AWS S3 direto |
| **Notificações** | Manus Forge notification | Email via Resend |
| **Analytics** | Manus analytics script | Removido (adicionar Plausible/Umami se desejado) |
| **Vite plugins** | vite-plugin-manus-runtime, builder.io jsx-loc | Removidos |
| **Deploy** | Manus hosting | PM2 + Nginx + Let's Encrypt |

---

## Licença

Projeto privado. Todos os direitos reservados.
