#!/usr/bin/env bash
# scripts/check-affected.sh — List packages affected since a given git ref.
# Usage:
#   bash scripts/check-affected.sh                    # compare to origin/main
#   bash scripts/check-affected.sh origin/develop     # custom base ref
#   bash scripts/check-affected.sh HEAD~5             # compare to 5 commits ago
set -euo pipefail

BASE_REF="${1:-origin/main}"
echo "🔍 Checking packages affected since: $BASE_REF"
echo ""

# Use Turborepo's built-in affected detection
AFFECTED=$(pnpm turbo run build \
  --dry-run=json \
  --filter="...[${BASE_REF}]" \
  2>/dev/null | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
packages = sorted(set(t['package'] for t in data.get('tasks', [])))
for p in packages:
    print(f'  • {p}')
print()
print(f'Total affected: {len(packages)} package(s)')
")

echo "$AFFECTED"
