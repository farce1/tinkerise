/**
 * Shared helpers for enhancement modules.
 *
 * installPackages — runs the correct devDep install command per PM.
 * writeConfigFile — writes a config file to the project root.
 * addScript — adds a script to package.json (reads fresh each call).
 * readPackageJson — reads and parses package.json from disk.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { execa } from 'execa'
import type { PackageManager } from '../../pm/detect.js'

/** PM-specific install command maps */
const INSTALL_CMD_MAP: Record<PackageManager, { cmd: string; args: string[] }> = {
  npm: { cmd: 'npm', args: ['install', '--save-dev'] },
  pnpm: { cmd: 'pnpm', args: ['add', '--save-dev'] },
  yarn: { cmd: 'yarn', args: ['add', '--dev'] },
  bun: { cmd: 'bun', args: ['add', '--dev'] },
}

/**
 * Install packages as devDependencies using the detected package manager.
 *
 * @param packages — package names (optionally with @version)
 * @param opts — cwd, packageManager, verbose
 * @returns The package list passed in (for chaining)
 */
export async function installPackages(
  packages: string[],
  opts: { cwd: string; packageManager: PackageManager; verbose?: boolean },
): Promise<string[]> {
  if (packages.length === 0) return []

  const { cmd, args } = INSTALL_CMD_MAP[opts.packageManager]
  await execa(cmd, [...args, ...packages], {
    cwd: opts.cwd,
    stdio: opts.verbose ? 'inherit' : 'pipe',
  })

  return packages
}

/**
 * Write a config file to the project root (or nested path).
 *
 * Creates intermediate directories if needed.
 *
 * @returns The absolute path of the written file
 */
export async function writeConfigFile(
  rootDir: string,
  filename: string,
  content: string,
): Promise<string> {
  const fullPath = join(rootDir, filename)
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, content, 'utf-8')
  return fullPath
}

/**
 * Add a script to package.json if not already present.
 *
 * Reads package.json FRESH each call to avoid stale writes
 * when multiple modules modify it sequentially.
 *
 * @returns true if added, false if already exists
 */
export async function addScript(
  rootDir: string,
  name: string,
  command: string,
): Promise<boolean> {
  const pkgPath = join(rootDir, 'package.json')
  const raw = await readFile(pkgPath, 'utf-8')
  const pkg = JSON.parse(raw) as Record<string, unknown>

  const scripts = (pkg.scripts ?? {}) as Record<string, string>
  if (scripts[name]) return false

  scripts[name] = command
  pkg.scripts = scripts
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  return true
}

/**
 * Read and parse package.json fresh from disk.
 *
 * Useful for modules that need to check current state after
 * prior modules may have modified package.json.
 */
export async function readPackageJson(
  rootDir: string,
): Promise<Record<string, unknown>> {
  const raw = await readFile(join(rootDir, 'package.json'), 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}
