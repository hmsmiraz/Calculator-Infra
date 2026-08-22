# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build Next.js standalone output
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nextuser -u 1001 -G nodejs
USER nextuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => r.statusCode < 500 ? process.exit(0) : process.exit(1))"

CMD ["node", "server.js"]
