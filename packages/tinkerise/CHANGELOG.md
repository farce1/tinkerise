# tinkerise

## 0.2.2

### Patch Changes

- [`f6cdf99`](https://github.com/farce1/tinkerise/commit/f6cdf995c668c9b3fa56f3f3658c7a67705eb703) Thanks [@farce1](https://github.com/farce1)! - Make all scaffolders fully non-interactive by auto-injecting prompt suppression flags. Adds `--yes` for Next.js, Astro, Remix, and Expo; `--no-interactive` for Vite. Also adds Next.js v16 flag mappings for `--react-compiler`, `--turbopack`, and `--api`.

- Updated dependencies [[`f6cdf99`](https://github.com/farce1/tinkerise/commit/f6cdf995c668c9b3fa56f3f3658c7a67705eb703)]:
  - @tinkerise/cli@0.2.2

## 0.2.1

### Patch Changes

- Add agent skill for skills.sh integration

- Updated dependencies []:
  - @tinkerise/cli@0.2.1

## 0.2.0

### Minor Changes

- Add new unified flags for web scaffolders

  New flags: `--src-dir`, `--import-alias`, `--biome`, `--empty`, `--overwrite`, `--app-router`, and generalized `--template` support.

  Fixed mapping gaps: TanStack now supports `--no-git`/`--no-install`, Remix supports `--package-manager`, Turborepo supports `--no-git`.

  Next.js v16+ gets version-aware `--biome` support. T3 adds Better Auth and explicit ESLint/Biome linter choice.

### Patch Changes

- Updated dependencies []:
  - @tinkerise/cli@0.2.0

## 0.1.2

### Patch Changes

- Fix documentation URL in README to point to GitHub Pages

- Updated dependencies []:
  - @tinkerise/cli@0.1.2

## 0.1.1

### Patch Changes

- [`37b1ee2`](https://github.com/farce1/tinkerise/commit/37b1ee277845ad717f3f2991d27a6cfa89c9a705) Thanks [@farce1](https://github.com/farce1)! - Add README.md to all published packages

- Updated dependencies []:
  - @tinkerise/cli@0.1.1

## 0.1.0

### Minor Changes

- [`8ba6e24`](https://github.com/farce1/tinkerise/commit/8ba6e24cee67adb698ca9168462476249289ba7d) Thanks [@farce1](https://github.com/farce1)! - Bootstrap the first public release so workspace dependencies are versioned before publish.

### Patch Changes

- Updated dependencies [[`8ba6e24`](https://github.com/farce1/tinkerise/commit/8ba6e24cee67adb698ca9168462476249289ba7d)]:
  - @tinkerise/cli@0.1.0
