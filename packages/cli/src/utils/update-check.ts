import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import pc from 'picocolors'
import semver from 'semver'

interface UpdateCache {
  lastCheck: number
  latestVersion: string | null
}

const CACHE_DIR = path.join(
  process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'),
  'tinkerise',
)
const CACHE_FILE = path.join(CACHE_DIR, 'update-check.json')
const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

async function readCache(): Promise<UpdateCache | null> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8')
    return JSON.parse(raw) as UpdateCache
  }
  catch {
    return null
  }
}

async function writeCache(cache: UpdateCache): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(cache), 'utf-8')
}

function getCurrentVersion(): string {
  const require = createRequire(import.meta.url)
  const { version } = require('../../package.json')
  return version as string
}

/**
 * Check npm registry for a newer version. Returns the latest version string
 * if newer than current, or null if up-to-date or check skipped/failed.
 * Non-blocking: reads from cache first, only hits registry if cache is stale.
 */
export async function checkForUpdate(): Promise<string | null> {
  // Respect opt-out for CI and scripts
  if (process.env.TINKERISE_NO_UPDATE_CHECK === '1')
    return null

  try {
    const cache = await readCache()
    const now = Date.now()
    const currentVersion = getCurrentVersion()

    // Use cached result if within interval
    if (cache && (now - cache.lastCheck) < CHECK_INTERVAL) {
      if (cache.latestVersion && cache.latestVersion !== currentVersion) {
        if (semver.gt(cache.latestVersion, currentVersion)) {
          return cache.latestVersion
        }
      }
      return null
    }

    // Fetch latest version from npm registry
    // Use AbortController for a 5-second timeout to prevent hanging
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch('https://registry.npmjs.org/@tinkerise/cli/latest', {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok)
      return null
    const data = await res.json() as { version: string }
    const latest = data.version

    await writeCache({ lastCheck: now, latestVersion: latest })

    // Compare with semver
    if (semver.gt(latest, currentVersion)) {
      return latest
    }
    return null
  }
  catch {
    // Never let update check failure affect CLI operation
    return null
  }
}

/**
 * Print a one-line update nudge. Called after command execution completes.
 */
export function printUpdateNudge(latestVersion: string): void {
  const currentVersion = getCurrentVersion()
  console.log()
  console.log(
    pc.dim(`  Update available: ${currentVersion} → ${latestVersion}. Run `)
    + pc.bold('tinkerise update'),
  )
}
