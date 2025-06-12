# ──────────────── 1. Base Image ────────────────
FROM node:24-alpine3.21 AS base

# ───────────── 2. Builder Stage ──────────────
FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat

WORKDIR /app

RUN npm install -g turbo

# Copy everything in, then prune down to only ‘web’
COPY . .
RUN turbo prune client --docker

# ──────────── 3. Installer Stage ────────────
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Copy only lockfile + package.json for minimal install
COPY --from=builder /app/out/json/ .
# Use npm CI to install exactly what's in package-lock.json
RUN npm ci --production=false

# Now bring in the full workspace for building
COPY --from=builder /app/out/full/ .

# (Optional) build args for remote cache
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

# Run the actual Turborepo build
RUN npx turbo build

# ───────────── 4. Runner Stage ─────────────
FROM base AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs
USER nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static   ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public         ./apps/web/public

EXPOSE 3000


CMD ["node", "apps/web/server.js"]
