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
│   ├── release.yml             # CI-gated release orchestration (semantic-release + web + desktop)
│   ├── release-web.yml         # Legacy tag-based web release workflow
│   ├── release-desktop.yml     # Legacy tag-based desktop release workflow
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

### Containerized Web App

```bash
# Build web editor container image (serves static export)
pnpm docker:build:web

# Run locally
pnpm docker:run:web
# open http://localhost:3000
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
# Recommended: preflight (lint, type-check, test, build) + start web
./scripts/dev.sh --web

# Recommended: preflight + start desktop (auto-starts web first)
./scripts/dev.sh --desktop

# Recommended: preflight + start both
./scripts/dev.sh --both
```

Direct package commands are still available:

```bash
pnpm --filter @rive-monorepo/web-editor dev
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
| Push / PR (`main`, `master`, `develop`) | `ci.yml` | lint + type-check + test + build |
| PR | `pr-affected.yml` | Only affected packages via Turborepo filters |
| CI success on `main` / `master` | `release.yml` | semantic-release + web release + desktop release matrix |
| Midnight PST | `nightly.yml` | Full suite + golden tests + Slack alert on failure |

## Release Process

```bash
# Commit with conventional commits:
#   feat: ...  -> minor
#   fix: ...   -> patch
#   BREAKING CHANGE: ... -> major
git commit -m "feat: add xyz"
git push origin master
```

What happens automatically:
1. `ci.yml` runs on push.
2. `release.yml` runs only if CI succeeds.
3. `semantic-release` computes and publishes the version/tag.
4. Same workflow runs:
   - web build/test/deploy (if Vercel secrets are set),
   - desktop build matrix (macOS + Windows),
   - desktop artifact publishing to the release.

`scripts/release.py` is optional for manual/version-forced releases.

## Infrastructure

AWS resources managed by Terraform in `infra/terraform/`:

- **S3** — CI build artifacts (versioned, lifecycle: 30 days for nightly)
- **CloudFront** — Web editor CDN (HTTPS, SPA routing)
- **ECR** — Docker image registry

### Deploying Container Image (Optional)

The Docker image in `docker/Dockerfile` packages `apps/web-editor/out` and serves it via NGINX on port `3000`.

#### Azure Container Apps (example)

```bash
# Build and push image to Azure Container Registry (ACR)
az acr build \
  --registry <acr-name> \
  --image rive-web-editor:latest \
  --file docker/Dockerfile .

# Deploy to Azure Container Apps
az containerapp create \
  --name rive-web-editor \
  --resource-group <resource-group> \
  --environment <container-app-env> \
  --image <acr-name>.azurecr.io/rive-web-editor:latest \
  --target-port 3000 \
  --ingress external
```

#### AWS (ECR + App Runner example)

```bash
# Build image locally
pnpm docker:build:web

# Tag and push to ECR
aws ecr get-login-password --region <region> | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker tag rive-web-editor:local <account-id>.dkr.ecr.<region>.amazonaws.com/rive-web-editor:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/rive-web-editor:latest

# Create/update App Runner service from the ECR image (console or CLI)
```

### Optional Web Deploy Secrets

Web deploy step in `release.yml` is optional and is skipped when secrets are missing.
Set these if you want production web deploys from CI:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Optional AWS OIDC Deploy (No Access Keys)

`release.yml` also supports AWS deployment using GitHub OIDC (recommended over IAM access keys).

Required GitHub secret:
- `AWS_DEPLOY_ROLE_ARN` (IAM role ARN trusted by GitHub OIDC)

Optional GitHub secret (required only on first App Runner service creation):
- `AWS_APPRUNNER_ECR_ACCESS_ROLE_ARN`

Required GitHub repository variables:
- `AWS_REGION` (for example, `us-east-1`)
- `AWS_ECR_REPOSITORY` (for example, `rive-web-editor`)

Optional GitHub repository variable:
- `AWS_APPRUNNER_SERVICE` (if set, workflow will create/start deployment for this App Runner service)

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
