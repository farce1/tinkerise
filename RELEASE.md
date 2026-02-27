# Release Guide

tinkerise uses [Changesets](https://github.com/changesets/changesets) for versioning and a GitHub Actions workflow for publishing to npm. After a successful publish, the workflow also triggers a Homebrew formula update.

## Prerequisites

- **npm account** with publish access to the `@tinkerise` scope and the unscoped `tinkerise` package
- **GitHub repo admin access** to configure repository secrets
- **GitHub PAT** (for Homebrew) with access to the `farce1/homebrew-tap` repo

## Secret Configuration

Two secrets must be configured in the `farce1/tinkerise` GitHub repository for the release workflow to function.

### NPM_TOKEN

Used by the release workflow to publish packages to npm.

1. Log into [npmjs.com](https://www.npmjs.com/)
2. Click your profile avatar (top right) and select **Access Tokens**
3. Click **Generate New Token** and select **Automation** type
   - Automation tokens work in CI without 2FA prompts (unlike Granular tokens)
4. Copy the token immediately — it is shown only once
5. In the GitHub repo (`farce1/tinkerise`), go to **Settings > Secrets and variables > Actions**
6. Click **New repository secret**
7. Name: `NPM_TOKEN`
8. Value: paste the token from step 4
9. Click **Add secret**

The release workflow uses this token as both `NPM_TOKEN` and `NODE_AUTH_TOKEN` environment variables for the `changesets/action` step.

### HOMEBREW_TAP_TOKEN

Used to trigger the formula update workflow in the `farce1/homebrew-tap` repository after a successful npm publish.

1. Go to [GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)
2. Click **Generate new token**
3. Token name: `tinkerise-homebrew-tap` (or any descriptive name)
4. Expiration: choose an appropriate duration (e.g., 90 days, 1 year)
5. Resource owner: select the account that owns `farce1/homebrew-tap`
6. Repository access: **Only select repositories** and choose `farce1/homebrew-tap`
7. Permissions:
   - **Contents**: Read and write
   - **Actions**: Read and write (required to trigger `workflow_dispatch`)
8. Click **Generate token** and copy it immediately — it is shown only once
9. In the GitHub repo (`farce1/tinkerise`), go to **Settings > Secrets and variables > Actions**
10. Click **New repository secret**
11. Name: `HOMEBREW_TAP_TOKEN`
12. Value: paste the token from step 8
13. Click **Add secret**

After a successful npm publish, the release workflow triggers `update-formula.yml` in `farce1/homebrew-tap` using this token via `gh workflow run`.

## How Releases Work

1. **Create a changeset**: Run `bun changeset` in the repo root. Describe the change, select the affected packages, and choose the semver bump type (patch, minor, major).
2. **Commit the changeset**: The command creates a markdown file in `.changeset/`. Commit it alongside your code changes.
3. **Push to main**: The release workflow runs automatically on every push to `main`.
4. **Changesets action decides what to do**:
   - If pending changesets exist, it creates (or updates) a **"chore: version packages"** PR that bumps versions in all `package.json` files.
   - If versions were just bumped (the version PR was merged), it **publishes to npm** and then triggers the Homebrew tap update.
5. **Fixed versioning**: All 4 packages (`@tinkerise/cli`, `@tinkerise/core`, `@tinkerise/shared`, `tinkerise`) are versioned in lockstep — a changeset bumping any package bumps all of them to the same version.

### Workflow Steps

The release workflow (`.github/workflows/release.yml`) runs these steps:

1. Checkout code
2. Setup Bun (with dependency caching)
3. Setup Node.js 22 (with npm registry configured)
4. Install dependencies (`bun install --frozen-lockfile`)
5. Build all packages (`bun run build`)
6. Run changesets/action (version or publish)
7. If published: trigger Homebrew tap update via `gh workflow run`

## Troubleshooting

### Pre-release versions appearing

If `changeset version` produces versions like `1.0.1-beta.0` instead of `1.0.1`, check for `.changeset/pre.json`. This file locks changesets into pre-release mode. Delete it and commit:

```bash
rm .changeset/pre.json
git add .changeset/pre.json
git commit -m "fix: exit changeset pre-release mode"
```

### npm 403 errors during publish

The NPM_TOKEN may have expired or lack publish access to the required packages. Generate a new Automation token on npmjs.com and update the repository secret.

### Homebrew tap not updating after publish

- Verify `HOMEBREW_TAP_TOKEN` hasn't expired (fine-grained tokens have expiration dates)
- Verify the token has **Contents** and **Actions** write permissions on `farce1/homebrew-tap`
- Check the Actions tab in `farce1/homebrew-tap` for failed workflow runs

### Changesets action not creating a PR

- Ensure there are pending changeset files in `.changeset/` (markdown files, not `config.json` or `README.md`)
- Verify `GH_PAT` secret has `contents: write` and `pull-requests: write` permissions (configured in the workflow)

### Build failures before publish

The `ci:publish` script runs `changeset publish` only (no build step). The build happens earlier in the workflow. If builds are failing, check `bun run build` locally first.
