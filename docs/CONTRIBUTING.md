# Contributing to Rive Monorepo

## Development Workflow

1. **Setup**:
   ```bash
   pnpm install
   pnpm turbo build
   ```

2. **Branching**:
   - `main`: Production-ready code.
   - `develop`: Integration branch for new features.
   - `feature/*`: Short-lived feature branches.

3. **Commits**:
   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: ...` for new features
   - `fix: ...` for bug fixes
   - `chore: ...` for build/tooling updates
   - `docs: ...` for documentation changes

## Testing Requirements

- All new functions must have unit tests in `tests/*.test.ts`.
- UI components should have basic rendering tests.
- Run `pnpm turbo test` before submitting a PR.

## Code Style

- **Prettier**: Formatting is enforced on commit.
- **ESLint**: Lints must pass (`pnpm turbo lint`).
- **TypeScript**: Strict mode is enabled. No `any` without justification.
