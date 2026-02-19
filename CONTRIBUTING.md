# Contributing to tinkerise

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- **Node.js** >= 20.11.0
- **Bun** (preferred package manager) — [install](https://bun.sh)
- **Git**

## Setup

```bash
# Clone the repo
git clone https://github.com/farce1/tinkerise.git
cd tinkerise

# Install dependencies
bun install

# Build all packages
bun run build

# Verify everything works
bun run test
```

## Development workflow

### Available scripts

| Script | What it does |
|--------|-------------|
| `bun run build` | Build all packages via Turborepo |
| `bun run dev` | Watch mode for development |
| `bun run test` | Run tests across all packages |
| `bun run lint` | ESLint across all packages |
| `bun run typecheck` | TypeScript type checking |
| `bun run license-check` | Verify dependency licenses |

All scripts run through Turborepo, which caches results. If you change code in `@tinkerise/shared`, running `bun run build` will rebuild shared and its dependents (core, cli) but skip packages that haven't changed.

### Project structure

```
packages/
  cli/      @tinkerise/cli     — CLI entry point, commands, user-facing output
  core/     @tinkerise/core    — Business logic, scaffolder registry, enhancements
  shared/   @tinkerise/shared  — Types, constants, utilities shared across packages
```

- **cli** depends on **core** and **shared**
- **core** depends on **shared**
- **shared** has no internal dependencies

### Making changes

1. Create a feature branch from `main`
2. Make your changes
3. Run `bun run lint` and `bun run test` before committing
4. Commit with a conventional commit message (see below)
5. Push and open a PR

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/). This is enforced by commitlint on every commit.

### Format

```
type(scope): description

[optional body]
[optional footer]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency updates |
| `docs` | Documentation changes |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `ci` | CI/CD changes |

### Examples

```
feat(cli): add web scaffolder command
fix(core): handle missing package.json gracefully
chore: update turbo to v2.5
docs: add scaffolder authoring guide
test(cli): add integration tests for list command
```

## Pull request process

1. Branch from `main`
2. Keep PRs focused — one feature or fix per PR
3. Ensure all CI checks pass (tests, lint, typecheck, license audit)
4. Request review
5. All checks must pass and review must be approved before merging

## Code style

ESLint with [@antfu/eslint-config](https://github.com/antfu/eslint-config) handles formatting and style. No separate Prettier config needed. Just write code and let ESLint handle the rest.

Key style points:
- Single quotes, no semicolons
- TypeScript strict mode
- ESM only (no CommonJS)
