import { execSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'

export type InstallMethod = 'homebrew' | 'npm-global' | 'npx' | 'unknown'

/**
 * Detect whether tinkerise is running from a global npm install.
 * Checks if the module directory is inside npm's global prefix/lib path.
 */
function isGlobalNpmInstall(): boolean {
  try {
    const moduleDir = dirname(import.meta.url).replace('file://', '')
    const npmPrefix = execSync('npm prefix -g', { encoding: 'utf-8' }).trim()
    const globalDir = realpathSync(join(npmPrefix, 'lib', 'node_modules'))
    return moduleDir.startsWith(globalDir)
  }
  catch {
    return false
  }
}

export function detectInstallMethod(): InstallMethod {
  // 1. Check for Homebrew (Cellar path in resolved module location)
  // Handles both Intel (/usr/local/Cellar/) and Apple Silicon (/opt/homebrew/Cellar/)
  const moduleDir = import.meta.dirname
  if (moduleDir.includes('/Cellar/') || moduleDir.includes('/homebrew/')) {
    return 'homebrew'
  }

  // 2. Check for npx (npm_execpath or _npx cache path)
  const npmExecPath = process.env.npm_execpath ?? ''
  if (npmExecPath.includes('npx') || moduleDir.includes('_npx')) {
    return 'npx'
  }

  // 3. Check for npm global install
  if (isGlobalNpmInstall()) {
    return 'npm-global'
  }

  return 'unknown'
}
