#!/usr/bin/env bash
# scripts/build-all.sh — Full local build of the entire monorepo.
# Usage: bash scripts/build-all.sh [--skip-tests]
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[build-all]${NC} $1"; }
warn()    { echo -e "${YELLOW}[build-all]${NC} $1"; }
error()   { echo -e "${RED}[build-all] ERROR:${NC} $1"; exit 1; }

SKIP_TESTS=false
for arg in "$@"; do [[ "$arg" == "--skip-tests" ]] && SKIP_TESTS=true; done

# ─── Check Prerequisites ──────────────────────────────────────────────────────
info "Checking prerequisites…"

command -v node   >/dev/null 2>&1 || error "node is not installed"
command -v pnpm   >/dev/null 2>&1 || error "pnpm is not installed (npm i -g pnpm)"
command -v python3 >/dev/null 2>&1 || error "python3 is not installed"

NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_NODE="20"
MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
if [[ "$MAJOR" -lt "$REQUIRED_NODE" ]]; then
  error "Node.js v$REQUIRED_NODE+ required (found v$NODE_VERSION). Use nvm: nvm use"
fi
info "✓ Node.js v$NODE_VERSION"

PNPM_VERSION=$(pnpm --version)
info "✓ pnpm v$PNPM_VERSION"

# ─── Install Dependencies ──────────────────────────────────────────────────────
info "Installing dependencies (frozen lockfile)…"
pnpm install --frozen-lockfile

# ─── Build ────────────────────────────────────────────────────────────────────
info "Building all packages and apps via Turborepo…"
START_TIME=$SECONDS
pnpm turbo build --cache-dir=.turbo
ELAPSED=$((SECONDS - START_TIME))
info "✓ Build complete in ${ELAPSED}s"

# ─── Test ─────────────────────────────────────────────────────────────────────
if [[ "$SKIP_TESTS" == true ]]; then
  warn "Skipping tests (--skip-tests flag)"
else
  info "Running all tests…"
  pnpm turbo test --cache-dir=.turbo
  info "✓ All tests passed"
fi

# ─── Lint ─────────────────────────────────────────────────────────────────────
info "Running lint…"
pnpm turbo lint --cache-dir=.turbo
info "✓ Lint passed"

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  Monorepo build successful!       ${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo "  Packages built:"
for dir in packages/*/dist runtimes/*/dist; do
  [[ -d "$dir" ]] && echo "    • $dir"
done
echo ""
