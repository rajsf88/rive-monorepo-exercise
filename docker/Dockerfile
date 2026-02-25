FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

WORKDIR /app

# Copy manifests first for better cache reuse
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/canvas-renderer/package.json ./packages/canvas-renderer/
COPY packages/state-machine/package.json ./packages/state-machine/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY runtimes/react/package.json ./runtimes/react/
COPY runtimes/vanilla-js/package.json ./runtimes/vanilla-js/
COPY apps/web-editor/package.json ./apps/web-editor/

RUN pnpm install --frozen-lockfile

COPY . .

# Build web app and all required workspace deps.
RUN pnpm turbo build --filter='./packages/*' --filter='./runtimes/*' --filter='@rive-monorepo/web-editor'

FROM nginx:1.27-alpine AS runner

LABEL org.opencontainers.image.title="Rive Web Editor"
LABEL org.opencontainers.image.description="Static web editor container image"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web-editor/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
