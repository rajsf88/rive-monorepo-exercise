# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/canvas-renderer/package.json ./packages/canvas-renderer/
COPY packages/state-machine/package.json ./packages/state-machine/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY runtimes/react/package.json ./runtimes/react/
COPY runtimes/vanilla-js/package.json ./runtimes/vanilla-js/
COPY apps/web-editor/package.json ./apps/web-editor/

# Install dependencies (frozen for reproducible builds)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages via Turborepo
RUN pnpm turbo build --filter='./packages/*' --filter='./runtimes/*' --filter='@rive-monorepo/web-editor'

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

LABEL org.opencontainers.image.title="Rive Web Editor"
LABEL org.opencontainers.image.description="Production container for the Rive web editor"
LABEL org.opencontainers.image.source="https://github.com/rive-app/rive"

# Security: do not run as root
RUN addgroup --system --gid 1001 rive && \
    adduser --system --uid 1001 rive

WORKDIR /app

# Copy only the Next.js standalone output (minimal footprint)
COPY --from=builder --chown=rive:rive /app/apps/web-editor/.next/standalone ./
COPY --from=builder --chown=rive:rive /app/apps/web-editor/.next/static ./.next/static
COPY --from=builder --chown=rive:rive /app/apps/web-editor/public ./public

USER rive

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
