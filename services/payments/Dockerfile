FROM node:24-alpine AS base

# ─── 1. Install Dependencies ───────────────────
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# ─── 2. Build Stage ────────────────────────────
FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build

# ─── 3. Production Stage ───────────────────────
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 payments

# Copy dependencies and build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Set user
USER payments

# ─── 4. Expose Port ────────────────────────────
EXPOSE 5004

# ─── 5. Start Server ───────────────────────────
CMD ["node", "dist/server.js"]









