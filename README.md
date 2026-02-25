# Rive Monorepo

> Production-ready monorepo inspired by [rive-app](https://github.com/rive-app) — built to demonstrate Build & Release DevOps engineering at scale.

## What's Inside

```
rive/
├── packages/                   # Shared libraries (built first)
│   ├── core/                   # Types, constants, enums (@rive-monorepo/core)
│   ├── canvas-renderer/        # WASM canvas abstraction (@rive-monorepo/canvas-renderer)
│   ├── state-machine/          # State machine engine (@rive-monorepo/state-machine)
│   └── test-utils/             # Shared test helpers (@rive-monorepo/test-utils)
│
├── runtimes/                   # Language runtimes (depend on packages/)
│   ├── react/                  # React runtime — mirrors @rive-app/react-canvas
│   └── vanilla-js/             # Pure JS runtime — mirrors @rive-app/canvas
│
├── apps/                       # Applications (depend on runtimes/ + packages/)
│   ├── web-editor/             # Next.js web editor (mirrors rive.app editor)
│   ├── desktop-editor/         # Electron desktop app (macOS + Windows)
│   └── docs-site/              # Documentation site
│
├── .github/workflows/          # GitHub Actions CI/CD
│   ├── ci.yml                  # Main CI (lint, type-check, test, build)
│   ├── pr-affected.yml         # PR: build/test only affected packages
│   ├── release-web.yml         # Web editor deploy to Vercel
│   ├── release-desktop.yml     # Desktop: macOS + Windows builds
│   └── nightly.yml             # Nightly: full suite + golden tests
│
├── docker/                     # Containerization
│   └── Dockerfile              # Multi-stage build
│
├── infra/terraform/            # Infrastructure as Code (AWS)
│   ├── main.tf                 # S3, CloudFront, ECR
│   ├── variables.tf
│   └── outputs.tf
│
├── device-lab/                 # Physical device testing lab
│   ├── README.md               # Lab setup & operations guide
│   └── device-inventory.yml    # All devices + runner labels
│
├── scripts/                    # Automation scripts
│   ├── build-all.sh            # Full local build (Bash)
│   ├── release.py              # Version bump + git tag (Python)
│   └── check-affected.sh       # Compute affected packages (Bash)
│
└── docs/                       # Documentation
    ├── CONTRIBUTING.md
    ├── CI-CD.md
    ├── RELEASE.md
    └── DEVICE-LAB.md
```

## Quick Start

### Prerequisites

- Node.js 20+ (`nvm use` — reads `.nvmrc`)
- pnpm 9+ (`npm i -g pnpm`)
- Python 3.10+ (for `scripts/release.py`)

### Install & Build

```bash
# Install all dependencies across workspaces
pnpm install

# Build everything (Turborepo handles dependency order automatically)
pnpm turbo build

# Or use the convenience script
bash scripts/build-all.sh
```

### Run Tests

```bash
# All packages
pnpm turbo test

# Specific package
pnpm --filter @rive-monorepo/state-machine test

# With coverage
pnpm turbo test -- --coverage
```

### Development

```bash
# Start web editor dev server
pnpm --filter @rive-monorepo/web-editor dev

# Start Electron desktop editor
pnpm --filter @rive-monorepo/desktop-editor dev
```

## Monorepo Architecture

Built with **[Turborepo](https://turbo.build/)** + **pnpm workspaces**:

```
pnpm-workspace.yaml  →  declares packages/*, apps/*, runtimes/*
turbo.json           →  build pipeline (build → test, lint independent)
```

**Key principle**: packages build in dependency order automatically.
`apps/web-editor` depends on `runtimes/react` which depends on `packages/canvas-renderer`
which depends on `packages/core`. Turborepo resolves this DAG so you never build in the wrong order.

## CI/CD Overview

| Trigger | Workflow | What it does |
|---|---|---|
| Push / PR | `ci.yml` | lint + test + build all |
| PR | `pr-affected.yml` | Only affected packages via `--filter=[origin/main]` |
| `v*.*.*` tag | `release-web.yml` | Build + deploy web editor to Vercel |
| `v*.*.*` tag | `release-desktop.yml` | macOS DMG + Windows NSIS/MSIX with code signing |
| Midnight PST | `nightly.yml` | Full suite + golden tests + Slack alert on failure |

## Release Process

```bash
# Bump patch: 0.1.0 → 0.1.1
python3 scripts/release.py --bump patch

# Preview what will happen (no changes made)
python3 scripts/release.py --bump minor --dry-run
```

The script: bumps all `package.json` versions, updates `CHANGELOG.md`, creates a git tag, and pushes.
GitHub Actions then automatically triggers the deploy workflows.

## Infrastructure

AWS resources managed by Terraform in `infra/terraform/`:

- **S3** — CI build artifacts (versioned, lifecycle: 30 days for nightly)
- **CloudFront** — Web editor CDN (HTTPS, SPA routing)
- **ECR** — Docker image registry

```bash
cd infra/terraform
terraform init
terraform plan -var="environment=staging"
terraform apply -var="environment=staging"
```

## Device Lab

Physical test lab managed in `device-lab/`. See [`device-lab/README.md`](device-lab/README.md) for setup.

Devices are registered as GitHub Actions self-hosted runners with labels:
`lab-macos`, `lab-windows`, `lab-hub`.

## Documentation

| Doc | Description |
|---|---|
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Branching, PRs, commit conventions |
| [CI-CD.md](docs/CI-CD.md) | CI architecture, caching, secrets |
| [RELEASE.md](docs/RELEASE.md) | Release process, versioning strategy |
| [DEVICE-LAB.md](docs/DEVICE-LAB.md) | Device lab operations |
