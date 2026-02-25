# Release Process

## Versioning

We use **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`.
All packages in the monorepo are versioned in sync using the root version.

## How to Release

1. **Prepare**:
   Ensure you are on `main` and all tests pass.
   ```bash
   pnpm turbo test
   ```

2. **Bump & Tag**:
   Use the Python release script:
   ```bash
   # For a bug fix
   python3 scripts/release.py --bump patch
   
   # For a new feature
   python3 scripts/release.py --bump minor
   ```
   The script will:
   - Update `package.json` across all workspaces
   - Update `CHANGELOG.md`
   - Create a git tag (e.g., `v0.1.1`)
   - Push to origin

3. **Automated Deploy**:
   GitHub Actions will detect the new tag and trigger:
   - `release-web.yml`: Deploys to Vercel/S3.
   - `release-desktop.yml`: Builds and signs Electron apps.

4. **Verify**:
   Check the [GitHub Releases](https://github.com/rive-app/rive/releases) page for build artifacts.
