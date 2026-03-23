# ─── Stage 1: Install dependencies ────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ──────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build frontend (Vite) and backend (esbuild)
RUN pnpm build

# ─── Stage 3: Production ─────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 leasy && \
    adduser --system --uid 1001 leasy

# Install pnpm for production dependencies
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/drizzle ./drizzle

# Create storage directory for local file storage
RUN mkdir -p /app/storage && chown leasy:leasy /app/storage

# Switch to non-root user
USER leasy

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/webhooks/mercadopago || exit 1

# Start server
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
