/**
 * Phase 33 conformance harness: emits a doctor --json envelope with a
 * deterministic required-check failure (D-23/D-24) by injecting the
 * `runDoctorChecks(overrides?)` seam exported by
 * packages/cli/src/commands/doctor.ts.
 *
 * Invoked by the doctor-json-required-fail scenario in
 * json-output-matrix.json. stdout = doctor envelope; exit code 1 when
 * requiredFailed > 0.
 *
 * Uses jiti to import the TypeScript source directly (matches the
 * existing Phase 31 conformance harness pattern at
 * tests/conformance/runtime-error-matrix.test.ts which writes a similar
 * jiti-based loader at runtime). tsup bundles all of `src/` into a single
 * `dist/index.js` entry, so `runDoctorChecks` is not separately reachable
 * from the dist tree.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DoctorEnvelopeV1Schema } from '@tinkerise/shared'
import { createJiti } from 'jiti'

const here = dirname(fileURLToPath(import.meta.url))
const doctorSource = resolve(here, '../../../src/commands/doctor.ts')

const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: false })
const mod = await jiti.import(doctorSource)
const { runDoctorChecks } = mod

// Single fake required check that always fails — guarantees requiredFailed >= 1.
const overrides = [{
  tool: 'phase33-fake-required',
  command: 'phase33-bogus-cmd-never-installed',
  versionFlag: '--version',
  category: 'Runtimes',
  required: true,
  installInstructions: {
    darwin: 'never install this; conformance fixture only',
    linux: 'never install this; conformance fixture only',
    win32: 'never install this; conformance fixture only',
  },
}]

const raw = await runDoctorChecks(overrides)
const checks = []
let passed = 0
let requiredFailed = 0
let optionalFailed = 0

for (const { check, result } of raw) {
  const entry = {
    tool: check.tool,
    command: check.command,
    category: check.category,
    required: check.required,
    ok: result.ok,
  }
  if (check.versionRange)
    entry.versionRange = check.versionRange
  if (result.ok && result.version)
    entry.version = result.version
  if (!result.ok && result.error)
    entry.error = result.error
  if (!result.ok && result.installInstructions)
    entry.installInstructions = result.installInstructions
  checks.push(entry)

  if (result.ok) {
    passed += 1
  }
  else if (check.required) {
    requiredFailed += 1
  }
  else {
    optionalFailed += 1
  }
}

const total = checks.length
const failed = total - passed

const envelope = DoctorEnvelopeV1Schema.parse({
  schemaVersion: 1,
  command: 'doctor',
  data: {
    checks,
    summary: { total, passed, failed, requiredFailed, optionalFailed },
  },
})

process.stdout.write(`${JSON.stringify(envelope)}\n`)
process.exit(requiredFailed > 0 ? 1 : 0)
