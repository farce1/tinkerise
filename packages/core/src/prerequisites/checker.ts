/**
 * Prerequisite checker — validates tool existence and version requirements
 * before scaffolder execution (REG-03).
 *
 * Per user decision: "Fail immediately with clear error and installation
 * instructions when a required tool is missing. Check both tool existence
 * AND minimum version requirements. Run prerequisite checks fresh every
 * time — no caching."
 */

import which from 'which'
import semver from 'semver'
import { execa } from 'execa'
import type { Prerequisite } from '@tinkerise/shared'
import { getInstallInstructions } from './platform.js'

export interface PrereqResult {
  ok: boolean
  command: string
  version?: string
  error?: string
  installInstructions?: string
}

/**
 * Error thrown when one or more prerequisites are not met.
 */
export class PrerequisiteError extends Error {
  constructor(
    public readonly results: PrereqResult[],
  ) {
    const failures = results.filter(r => !r.ok)
    const lines = failures.map(f =>
      `  - ${f.command}: ${f.error}\n    Fix: ${f.installInstructions}`,
    )
    super(`Missing prerequisites:\n${lines.join('\n')}`)
    this.name = 'PrerequisiteError'
  }
}

/**
 * Check a single prerequisite: tool existence + optional version requirement.
 */
export async function checkPrerequisite(prereq: Prerequisite): Promise<PrereqResult> {
  // 1. Check if command exists in PATH
  const resolved = await which(prereq.command, { nothrow: true })
  if (!resolved) {
    return {
      ok: false,
      command: prereq.command,
      error: `'${prereq.command}' not found in PATH`,
      installInstructions: getInstallInstructions(prereq),
    }
  }

  // 2. Check version if range specified
  if (prereq.versionRange) {
    try {
      const { stdout } = await execa(prereq.command, [prereq.versionFlag])
      const version = semver.coerce(stdout.trim())

      if (!version) {
        return {
          ok: false,
          command: prereq.command,
          error: `Could not parse version from: ${stdout.trim()}`,
          installInstructions: getInstallInstructions(prereq),
        }
      }

      if (!semver.satisfies(version, prereq.versionRange)) {
        return {
          ok: false,
          command: prereq.command,
          version: version.version,
          error: `${prereq.command} ${version.version} does not satisfy ${prereq.versionRange}`,
          installInstructions: getInstallInstructions(prereq),
        }
      }

      return { ok: true, command: prereq.command, version: version.version }
    }
    catch {
      return {
        ok: false,
        command: prereq.command,
        error: `Failed to detect ${prereq.command} version`,
        installInstructions: getInstallInstructions(prereq),
      }
    }
  }

  return { ok: true, command: prereq.command }
}

/**
 * Check all prerequisites for a scaffolder. Throws PrerequisiteError if any fail.
 *
 * Per user decision: checks run fresh every time (no caching).
 */
export async function checkPrerequisites(prerequisites: Prerequisite[]): Promise<PrereqResult[]> {
  const results = await Promise.all(prerequisites.map(checkPrerequisite))

  const failures = results.filter(r => !r.ok)
  if (failures.length > 0) {
    throw new PrerequisiteError(results)
  }

  return results
}
