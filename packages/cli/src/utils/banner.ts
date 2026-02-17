/**
 * Intro banner for the tinkerise interactive flow.
 *
 * Shows a branded one-liner via @clack/prompts intro().
 * Design: fast, minimal, one line -- branding should feel instant.
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

/**
 * Display the tinkerise intro banner.
 */
export function showBanner(): void {
  p.intro(`${pc.bgCyan(pc.black(' tinkerise '))} ${pc.dim('scaffold anything')}`)
}
