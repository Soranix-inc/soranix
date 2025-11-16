# ─── 1. Base & Metadata ─────────────────────────────
FROM node:24-alpine3.21

LABEL name="soranix-users-service"
LABEL description="Production image for soranix users service (Node.js v24)"

# Set production mode
ENV NODE_ENV=production
WORKDIR /app

# Create non-root user
RUN addgroup --system soranix \
    && adduser --system --ingroup soranix soranix

# ─── 2. Install Global Tools ────────────────────────
# Install Turborepo CLI and any other global tools
RUN npm install -g turbo

# ─── 3. Dependency Caching & Install ─────────────────
COPY package.json package-lock.json turbo.json ./
# Cache your npm cache to speed up repeated installs
RUN --mount=type=cache,target=/app/.npm \
    npm set cache /app/.npm && \
    npm ci --only=production

# ─── 4. Copy Source & Build ─────────────────────────
# Copy everything (code, workspaces, configs)
COPY --chown=soranix:soranix . .

# Build the application
RUN npm run build

# ─── 5. Switch to Non-Root User ─────────────────────
USER soranix

# ─── 6. Expose Port ──────────────────────────────────
EXPOSE 5002

# ─── 7. Production Entrypoint ───────────────────────
CMD ["node", "dist/server.js"]












