/**
 * Doctor command -- validates all required ecosystem tools are installed
 * with correct versions.
 *
 * Runs checkPrerequisite() from @tinkerise/core against every known tool
 * and formats results as a table with per-platform install instructions
 * for failures.
 */

import type { PrereqResult } from '@tinkerise/core'
import { checkPrerequisite } from '@tinkerise/core'
import { DoctorEnvelopeV1Schema } from '@tinkerise/shared'
import pc from 'picocolors'
import { emitJson, isJsonMode } from '../utils/output-mode.js'

export interface DoctorCheck {
  tool: string
  command: string
  versionFlag: string
  versionRange?: string
  category: string
  /**
   * Whether this check is mandatory for tinkerise to function (D-11/D-24).
   * Currently only Node.js is required; every other tool is informational.
   * The JSON branch routes summary.requiredFailed > 0 to exit code 1.
   */
  required: boolean
  installInstructions: Record<string, string>
}

/**
 * All tool checks grouped by category.
 * Exported for test assertions.
 */
export const DOCTOR_CHECKS: DoctorCheck[] = [
  // --- Runtimes ---
  {
    tool: 'Node.js',
    command: 'node',
    versionFlag: '--version',
    versionRange: '>=20.11.0',
    category: 'Runtimes',
    required: true,
    installInstructions: {
      darwin: 'brew install node',
      linux: 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs',
      win32: 'winget install OpenJS.NodeJS.LTS',
    },
  },
  {
    tool: 'Python',
    command: 'python3',
    versionFlag: '--version',
    versionRange: '>=3.10',
    category: 'Runtimes',
    required: false,
    installInstructions: {
      darwin: 'brew install python@3.12',
      linux: 'sudo apt-get install python3',
      win32: 'winget install Python.Python.3.12',
    },
  },
  {
    tool: 'Go',
    command: 'go',
    versionFlag: 'version',
    versionRange: '>=1.22',
    category: 'Runtimes',
    required: false,
    installInstructions: {
      darwin: 'brew install go',
      linux: 'sudo apt-get install golang-go  # or download from https://go.dev/dl/',
      win32: 'winget install GoLang.Go',
    },
  },
  {
    tool: 'Rust',
    command: 'rustc',
    versionFlag: '--version',
    versionRange: '>=1.78',
    category: 'Runtimes',
    required: false,
    installInstructions: {
      darwin: 'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      linux: 'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      win32: 'winget install Rustlang.Rustup',
    },
  },
  {
    tool: 'Flutter',
    command: 'flutter',
    versionFlag: '--version',
    versionRange: '>=3.10.0',
    category: 'Runtimes',
    required: false,
    installInstructions: {
      darwin: 'brew install --cask flutter',
      linux: 'snap install flutter --classic  # or https://docs.flutter.dev/get-started/install',
      win32: 'winget install Google.Flutter',
    },
  },
  {
    tool: 'Dart',
    command: 'dart',
    versionFlag: '--version',
    category: 'Runtimes',
    required: false,
    installInstructions: {
      darwin: 'brew install dart  # or bundled with Flutter',
      linux: 'sudo apt-get install dart  # or bundled with Flutter',
      win32: 'winget install Google.Dart  # or bundled with Flutter',
    },
  },
  // --- Scaffolder Tools ---
  {
    tool: 'django-admin',
    command: 'django-admin',
    versionFlag: '--version',
    category: 'Scaffolder Tools',
    required: false,
    installInstructions: {
      darwin: 'pip install django',
      linux: 'pip install django',
      win32: 'pip install django',
    },
  },
  {
    tool: 'fastapi-admin',
    command: 'fastapi-admin',
    versionFlag: '--version',
    category: 'Scaffolder Tools',
    required: false,
    installInstructions: {
      darwin: 'pip install fastapi-admin-cli',
      linux: 'pip install fastapi-admin-cli',
      win32: 'pip install fastapi-admin-cli',
    },
  },
  {
    tool: 'go-blueprint',
    command: 'go-blueprint',
    versionFlag: '--version',
    category: 'Scaffolder Tools',
    required: false,
    installInstructions: {
      darwin: 'go install github.com/melkeydev/go-blueprint@latest',
      linux: 'go install github.com/melkeydev/go-blueprint@latest',
      win32: 'go install github.com/melkeydev/go-blueprint@latest',
    },
  },
  {
    tool: 'cargo-generate',
    command: 'cargo-generate',
    versionFlag: '--version',
    category: 'Scaffolder Tools',
    required: false,
    installInstructions: {
      darwin: 'cargo install cargo-generate',
      linux: 'cargo install cargo-generate',
      win32: 'cargo install cargo-generate',
    },
  },
]

interface CheckResult {
  check: DoctorCheck
  result: PrereqResult
}

/**
 * Run the doctor checks. Exported so conformance tests can inject a
 * deterministic overrides array (Phase 33 I-09 option a). Production
 * callers MUST omit the parameter to use the canonical DOCTOR_CHECKS list.
 */
export async function runDoctorChecks(overrides?: DoctorCheck[]): Promise<CheckResult[]> {
  const checks = overrides ?? DOCTOR_CHECKS
  return Promise.all(checks.map(async (check) => {
    const result = await checkPrerequisite({
      command: check.command,
      versionFlag: check.versionFlag,
      versionRange: check.versionRange,
      installInstructions: check.installInstructions,
    })
    return { check, result }
  }))
}

/**
 * Build the JSON envelope payload for `tinkerise doctor --json` (CLI-13).
 *
 * - D-22: optional fields (versionRange, version, error, installInstructions)
 *   are conditionally added so absent keys are omitted from the emitted JSON
 * - D-24: summary uses snake_case requiredFailed + optionalFailed; both
 *   fields are always present (schema rejects payloads missing either)
 * - Returns the payload alongside a flag indicating whether at least one
 *   `required: true` check failed (drives the exit-1 gate in runDoctor)
 */
async function runDoctorChecksForJson(overrides?: DoctorCheck[]): Promise<{
  payload: { checks: Array<Record<string, unknown>>, summary: { total: number, passed: number, failed: number, requiredFailed: number, optionalFailed: number } }
  anyRequiredFailed: boolean
}> {
  const raw = await runDoctorChecks(overrides)
  const entries: Array<Record<string, unknown>> = []
  let passed = 0
  let requiredFailed = 0
  let optionalFailed = 0

  for (const { check, result } of raw) {
    const entry: Record<string, unknown> = {
      tool: check.tool,
      command: check.command,
      category: check.category,
      required: check.required,
      ok: result.ok,
    }
    if (check.versionRange) {
      entry.versionRange = check.versionRange
    }
    if (result.ok && result.version) {
      entry.version = result.version
    }
    if (!result.ok && result.error) {
      entry.error = result.error
    }
    if (!result.ok && result.installInstructions) {
      entry.installInstructions = result.installInstructions
    }
    entries.push(entry)

    if (result.ok) {
      passed++
    }
    else if (check.required) {
      requiredFailed++
    }
    else {
      optionalFailed++
    }
  }

  const total = entries.length
  const failed = total - passed

  return {
    payload: {
      checks: entries,
      summary: { total, passed, failed, requiredFailed, optionalFailed },
    },
    anyRequiredFailed: requiredFailed > 0,
  }
}

/**
 * Run all doctor checks and display a formatted table.
 */
export async function runDoctor(): Promise<void> {
  // JSON mode (CLI-13): emit one validated envelope and return early.
  // D-23: data envelope is ALWAYS emitted, even on failure.
  // D-24: summary.requiredFailed > 0 drives process.exit(1).
  if (isJsonMode()) {
    const { payload, anyRequiredFailed } = await runDoctorChecksForJson()
    const envelope = DoctorEnvelopeV1Schema.parse({ schemaVersion: 1, command: 'doctor', data: payload })
    emitJson(envelope)
    if (anyRequiredFailed) {
      process.exit(1)
    }
    return
  }

  console.log(pc.bold('\ntinkerise doctor\n'))

  // Group checks by category (preserving insertion order)
  const categories = new Map<string, DoctorCheck[]>()
  for (const check of DOCTOR_CHECKS) {
    const list = categories.get(check.category) ?? []
    list.push(check)
    categories.set(check.category, list)
  }

  // Run all checks
  const results: CheckResult[] = await Promise.all(
    DOCTOR_CHECKS.map(async (check) => {
      const result = await checkPrerequisite({
        command: check.command,
        versionFlag: check.versionFlag,
        versionRange: check.versionRange,
        installInstructions: check.installInstructions,
      })
      return { check, result }
    }),
  )

  // Build results map for lookup
  const resultMap = new Map<string, CheckResult>()
  for (const r of results) {
    resultMap.set(r.check.command, r)
  }

  // Calculate column widths for alignment
  const COL_TOOL = 'Tool'
  const COL_STATUS = 'Status'
  const COL_VERSION = 'Version'
  const COL_REQUIRED = 'Required'

  let maxTool = COL_TOOL.length
  let maxVersion = COL_VERSION.length
  let maxRequired = COL_REQUIRED.length

  for (const r of results) {
    maxTool = Math.max(maxTool, r.check.tool.length)
    const versionStr = r.result.version ?? 'not found'
    maxVersion = Math.max(maxVersion, versionStr.length)
    const requiredStr = r.check.versionRange ?? '-'
    maxRequired = Math.max(maxRequired, requiredStr.length)
  }

  // Status column is fixed width (pass/fail text is just the icon)
  const maxStatus = COL_STATUS.length

  // Print header
  const header = `  ${COL_TOOL.padEnd(maxTool)}  ${COL_STATUS.padEnd(maxStatus)}  ${COL_VERSION.padEnd(maxVersion)}  ${COL_REQUIRED.padEnd(maxRequired)}`
  const separator = `  ${''.padEnd(maxTool, '-')}  ${''.padEnd(maxStatus, '-')}  ${''.padEnd(maxVersion, '-')}  ${''.padEnd(maxRequired, '-')}`

  let passed = 0
  const total = results.length

  // Print by category
  for (const [category, checks] of categories) {
    console.log(pc.bold(category))
    console.log(header)
    console.log(separator)

    for (const check of checks) {
      const cr = resultMap.get(check.command)!
      const statusIcon = cr.result.ok ? pc.green('\u2713') : pc.red('\u2717')
      const _versionStr = cr.result.version ?? pc.dim('not found')
      const versionPad = cr.result.version ? cr.result.version : 'not found'
      const requiredStr = check.versionRange ?? '-'

      if (cr.result.ok)
        passed++

      const row = `  ${check.tool.padEnd(maxTool)}  ${statusIcon}${' '.repeat(Math.max(0, maxStatus - 1))}  ${versionPad.padEnd(maxVersion)}  ${requiredStr.padEnd(maxRequired)}`
      // Replace the plain version with the potentially styled one
      const displayRow = cr.result.version
        ? row
        : `  ${check.tool.padEnd(maxTool)}  ${statusIcon}${' '.repeat(Math.max(0, maxStatus - 1))}  ${pc.dim('not found')}${''.padEnd(Math.max(0, maxVersion - 'not found'.length))}  ${requiredStr.padEnd(maxRequired)}`

      console.log(displayRow)

      // Show install instructions for failures
      if (!cr.result.ok && cr.result.installInstructions) {
        console.log(pc.dim(`    Install: ${cr.result.installInstructions}`))
      }
    }

    console.log() // blank line between categories
  }

  // Summary
  console.log(`${passed}/${total} checks passed`)

  if (passed < total) {
    console.log(pc.dim('\nRun the install commands above, then re-run: tinkerise doctor'))
  }
}
