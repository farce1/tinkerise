---
'@tinkerise/cli': patch
'@tinkerise/core': patch
'tinkerise': patch
---

Make all scaffolders fully non-interactive by auto-injecting prompt suppression flags. Adds `--yes` for Next.js, Astro, Remix, and Expo; `--no-interactive` for Vite. Also adds Next.js v16 flag mappings for `--react-compiler`, `--turbopack`, and `--api`.
