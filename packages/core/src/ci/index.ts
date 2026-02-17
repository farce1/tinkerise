/**
 * CI Detection — environment detection for non-interactive mode.
 *
 * Wraps ci-info to detect CI environments. When isCI is true, tinkerise
 * should default to non-interactive mode (require all flags or exit with
 * a clear error message).
 */

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ci = require('ci-info') as { isCI: boolean; name: string | null }

/** Whether the current environment is a CI system. */
export const isCI: boolean = ci.isCI

/** Name of the detected CI system, or null if not in CI. */
export const ciName: string | null = ci.name
