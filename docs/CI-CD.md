# CI/CD Architecture

## Overview

The Rive monorepo CI/CD system is built on **GitHub Actions** + **Turborepo**. The key design principle is **build only what changed** — using Turborepo's affected package detection to keep CI fast even as the monorepo grows.

## Workflows

| File | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Push / PR to main or develop | Full lint, type-check, test, build |
| `pr-affected.yml` | PR opened/updated | Build & test only changed packages |
| `release-web.yml` | `v*` tag push | Build + deploy web editor |
| `release-desktop.yml` | `v*` tag push | macOS + Windows installers |
| `nightly.yml` | Daily at midnight PST | Full suite + golden tests |

## Turborepo Caching

Turborepo caches task outputs (e.g., `dist/`) and skips re-running if inputs haven't changed.

```
Input hash = hash(src/ files + package.json + tsconfig.json)
If hash matches cached run → SKIP (cache hit)
Else → RUN and store output
```

**Remote caching** is enabled via `TURBO_TOKEN` + `TURBO_TEAM` env vars.
Cache hits are shared across all developers and CI machines.

## Affected Package Detection (PRs)

On every PR, `pr-affected.yml` uses:

```bash
pnpm turbo build --filter="...[origin/main]"
```

This means: _"build all packages that have changed since `origin/main`, plus anything that depends on them (transitively)"_.

Example: if you change `packages/core`, Turborepo also rebuilds:
- `packages/canvas-renderer` (depends on core)
- `runtimes/react` (depends on canvas-renderer)
- `apps/web-editor` (depends on runtimes/react)

## Secrets & Environment Variables

| Secret | Used in | Purpose |
|---|---|---|
| `TURBO_TOKEN` | All workflows | Remote cache auth |
| `VERCEL_TOKEN` | `release-web.yml` | Vercel deployment |
| `APPLE_CERTIFICATE_BASE64` | `release-desktop.yml` | macOS signing cert |
| `APPLE_ID` | `release-desktop.yml` | Notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | `release-desktop.yml` | Notarization |
| `WIN_CERTIFICATE_SUBJECT` | `release-desktop.yml` | Windows signing |
| `CODECOV_TOKEN` | `ci.yml` | Coverage upload |
| `SLACK_WEBHOOK_URL` | `nightly.yml` | Failure alerts |

## Build Times (targets)

| Stage | Target | Strategy |
|---|---|---|
| Install deps | < 60s | pnpm frozen lockfile + cache |
| Lint | < 30s | Turborepo cache |
| Tests | < 90s | Parallel jobs + cache |
| Build all | < 2 min | Turborepo parallel + cache |
| Desktop build (macOS) | < 8 min | electron-builder |
| Desktop build (Windows) | < 8 min | electron-builder |
