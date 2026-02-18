// Welcome message for global installs only.
// Skipped in CI, npx, and local installs.
// This is purely informational -- the CLI works fine if postinstall is skipped.

const isGlobal = Boolean(
  process.env.npm_config_global === 'true' ||
  process.env.npm_config_location === 'global'
)

if (isGlobal && !process.env.CI) {
  console.log()
  console.log('  tinkerise installed successfully')
  console.log()
  console.log('  Get started:  tinkerise')
  console.log('  Short alias:  tk')
  console.log('  Docs:         https://github.com/tinkerise/tinkerise')
  console.log()
}
