import type { ScaffoldPlan } from '@tinkerise/core'
import { ScaffoldPlanEnvelopeV1Schema } from '@tinkerise/shared'
import pc from 'picocolors'
import { emitJson } from './output-mode.js'

export interface RenderOptions {
  explain: boolean
  json: boolean
}

export function renderScaffoldPlan(plan: ScaffoldPlan, opts: RenderOptions): void {
  if (opts.json) {
    const envelope = {
      schemaVersion: 1,
      command: 'scaffold.plan' as const,
      data: {
        scaffolderName: plan.scaffolderName,
        command: plan.command,
        args: plan.args,
        resolvedFlags: plan.resolvedFlags,
        versionUsed: plan.versionUsed,
        upstreamVersion: plan.upstreamVersion,
        prerequisites: plan.prerequisites.map(p => ({
          command: p.command,
          versionRange: p.versionRange ?? null,
        })),
      },
    }
    // parse() before emit guarantees a valid envelope (D-05)
    emitJson(ScaffoldPlanEnvelopeV1Schema.parse(envelope))
    return
  }

  const full = `${plan.command} ${plan.args.join(' ')}`
  process.stdout.write(`\n${pc.bold('Dry run')} ${pc.dim('— no changes made')}\n\n`)
  process.stdout.write(`  ${pc.dim('Command:')}\n    ${pc.cyan(full)}\n`)

  if (opts.explain) {
    if (plan.resolvedFlags.length > 0) {
      process.stdout.write(`\n  ${pc.dim('Flags:')}\n`)
      for (const f of plan.resolvedFlags) {
        process.stdout.write(`    ${f.unified}  ${pc.dim('→')}  ${f.native.join(' ')}\n`)
      }
    }
    if (plan.prerequisites.length > 0) {
      process.stdout.write(`\n  ${pc.dim('Prerequisites:')}\n`)
      for (const p of plan.prerequisites) {
        const range = p.versionRange ? ` (${p.versionRange})` : ''
        process.stdout.write(`    ${p.command}${range}\n`)
      }
    }
  }

  process.stdout.write(`\n${pc.dim('Run without --dry-run to execute.')}\n`)
}
