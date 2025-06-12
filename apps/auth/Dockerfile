# ─── 1. Base Image ───────────────────────────────────
FROM node:24-alpine3.21 AS base
WORKDIR /app
# Ensure we run in production mode by default
ENV NODE_ENV=production

# ─── 2. Builder Stage ────────────────────────────────
FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat


RUN npm install -g turbo

COPY . .

# ─── 3. Installer Stage ──────────────────────────────
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=builder /app/out/json/ ./      
RUN npm ci --only=production

COPY --from=builder /app/out/full/ ./     
RUN npx turbo build                      

# ─── 4. Runner Stage ────────────────────────────────
FROM base AS runner
WORKDIR /app

# Create unprivileged user
RUN addgroup --system --gid 1001 soranix \
    && adduser  --system --uid 1001 --ingroup soranix auth-service
USER auth-service

# Copy only runtime bits
COPY --from=installer /app/apps/api/dist/ ./apps/api/dist/
COPY --from=installer /app/node_modules/   ./node_modules/

# Expose port and start
EXPOSE 1990
CMD ["node", "apps/api/dist/index.js"]
