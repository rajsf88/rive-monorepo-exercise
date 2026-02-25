#!/usr/bin/env python3
"""
scripts/release.py — Rive Monorepo Release Automation
Usage:
  python3 scripts/release.py --bump patch   # 0.1.0 → 0.1.1
  python3 scripts/release.py --bump minor   # 0.1.0 → 0.2.0
  python3 scripts/release.py --bump major   # 0.1.0 → 1.0.0
  python3 scripts/release.py --version 1.2.3  # explicit version
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CHANGELOG = ROOT / "CHANGELOG.md"

# Packages that get version bumps (private apps are excluded)
VERSIONED_PACKAGES = [
    ROOT / "packages" / "core" / "package.json",
    ROOT / "packages" / "canvas-renderer" / "package.json",
    ROOT / "packages" / "state-machine" / "package.json",
    ROOT / "packages" / "test-utils" / "package.json",
    ROOT / "runtimes" / "react" / "package.json",
    ROOT / "runtimes" / "vanilla-js" / "package.json",
    ROOT / "package.json",
]


def run(cmd: list[str], check=True) -> subprocess.CompletedProcess:
    print(f"  $ {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=ROOT, check=check, capture_output=False)


def read_json(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def write_json(path: Path, data: dict) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def bump_version(current: str, bump: str) -> str:
    major, minor, patch = map(int, current.split("."))
    if bump == "major":
        return f"{major + 1}.0.0"
    elif bump == "minor":
        return f"{major}.{minor + 1}.0"
    elif bump == "patch":
        return f"{major}.{minor}.{patch + 1}"
    raise ValueError(f"Unknown bump type: {bump}")


def get_current_version() -> str:
    pkg = read_json(ROOT / "package.json")
    return pkg["version"]


def update_versions(new_version: str) -> None:
    print(f"\n📦 Updating package versions to {new_version}…")
    for pkg_path in VERSIONED_PACKAGES:
        if not pkg_path.exists():
            print(f"  ⚠ Skipping {pkg_path} (not found)")
            continue
        data = read_json(pkg_path)
        old = data.get("version", "?")
        data["version"] = new_version
        # Also update workspace dependencies that reference the old version
        for dep_section in ("dependencies", "devDependencies", "peerDependencies"):
            if dep_section in data:
                for dep_name, dep_ver in data[dep_section].items():
                    if dep_name.startswith("@rive-monorepo/") and dep_ver == f"^{old}":
                        data[dep_section][dep_name] = f"^{new_version}"
        write_json(pkg_path, data)
        print(f"  ✓ {pkg_path.relative_to(ROOT)}: {old} → {new_version}")


def update_changelog(new_version: str) -> None:
    print(f"\n📝 Updating CHANGELOG.md…")
    date = datetime.now().strftime("%Y-%m-%d")

    # Get commits since last tag
    result = subprocess.run(
        ["git", "log", "--oneline", "HEAD...$(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~20)"],
        cwd=ROOT, capture_output=True, text=True
    )
    commits = result.stdout.strip() or "- No previous tag found; initial release"

    new_entry = f"""## [{new_version}] - {date}

### Added
- Monorepo v{new_version} release

### Changes
{chr(10).join(f'- {line}' for line in commits.splitlines()[:20])}

"""
    if CHANGELOG.exists():
        existing = CHANGELOG.read_text()
        CHANGELOG.write_text(new_entry + existing)
    else:
        CHANGELOG.write_text(f"# Changelog\n\nAll notable changes to this project will be documented here.\n\n{new_entry}")
    print(f"  ✓ CHANGELOG.md updated")


def git_tag_and_push(version: str, dry_run: bool) -> None:
    tag = f"v{version}"
    print(f"\n🏷  Creating git tag {tag}…")
    if dry_run:
        print("  [DRY RUN] Would run:")
        print(f"    git add -A")
        print(f"    git commit -m 'chore: release {tag}'")
        print(f"    git tag -a {tag} -m 'Release {tag}'")
        print(f"    git push --follow-tags")
        return
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", f"chore: release {tag}"])
    run(["git", "tag", "-a", tag, "-m", f"Release {tag}"])
    run(["git", "push", "--follow-tags"])
    print(f"  ✓ Tagged and pushed {tag}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Rive Monorepo Release Script")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--bump", choices=["patch", "minor", "major"])
    group.add_argument("--version", help="Explicit version (e.g. 1.2.3)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen without making changes")
    args = parser.parse_args()

    current = get_current_version()
    new_version = args.version if args.version else bump_version(current, args.bump)

    if not re.match(r"^\d+\.\d+\.\d+$", new_version):
        print(f"❌ Invalid version: {new_version}", file=sys.stderr)
        sys.exit(1)

    print(f"\n🚀 Rive Monorepo Release")
    print(f"   Current version : {current}")
    print(f"   New version     : {new_version}")
    print(f"   Dry run         : {args.dry_run}")
    print()

    if not args.dry_run:
        # Verify clean working tree
        result = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True)
        if result.stdout.strip():
            print("❌ Working tree is not clean. Commit or stash changes first.", file=sys.stderr)
            sys.exit(1)

    update_versions(new_version)
    update_changelog(new_version)
    git_tag_and_push(new_version, args.dry_run)

    print(f"\n✅ Release {new_version} complete!")
    print(f"   GitHub Actions will now build and deploy automatically.\n")


if __name__ == "__main__":
    main()
