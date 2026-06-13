import { describe, expect, it, vi } from 'vitest'
import { renderScaffoldPlan } from '../dry-run.js'

/** A ScaffoldPlan as core would produce it (prerequisites carry extra fields the JSON drops). */
const plan = {
  scaffolderName: 'next',
  command: 'npx',
  args: ['create-next-app@latest', 'my-app', '--typescript'],
  prerequisites: [{ command: 'node', versionFlag: '--version', versionRange: '>=20.11.0' }],
  resolvedFlags: [{ unified: 'typescript', native: ['--typescript'] }],
  versionUsed: null,
  upstreamVersion: null,
}

describe('renderScaffoldPlan', () => {
  it('emits a valid scaffold.plan envelope in JSON mode', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    try {
      renderScaffoldPlan(plan as any, { explain: false, json: true })

      expect(writeSpy).toHaveBeenCalledTimes(1)
      const payload = JSON.parse((writeSpy.mock.calls[0]?.[0] as string).trim())
      expect(payload.schemaVersion).toBe(1)
      expect(payload.command).toBe('scaffold.plan')
      expect(payload.data.command).toBe('npx')
      expect(payload.data.args).toContain('--typescript')
      // JSON projection drops versionFlag, keeps command + versionRange.
      expect(payload.data.prerequisites).toEqual([{ command: 'node', versionRange: '>=20.11.0' }])
    }
    finally {
      writeSpy.mockRestore()
    }
  })

  it('prints the command (and with --explain the flag table + prereqs) in human mode', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    try {
      renderScaffoldPlan(plan as any, { explain: true, json: false })

      const out = writeSpy.mock.calls.map(c => String(c[0])).join('')
      expect(out).toContain('npx create-next-app@latest my-app --typescript')
      expect(out).toContain('typescript')
      expect(out).toContain('node')
    }
    finally {
      writeSpy.mockRestore()
    }
  })

  it('omits the flag table without --explain', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    try {
      renderScaffoldPlan(plan as any, { explain: false, json: false })

      const out = writeSpy.mock.calls.map(c => String(c[0])).join('')
      expect(out).toContain('npx create-next-app@latest my-app --typescript')
      expect(out).not.toContain('Prerequisites')
    }
    finally {
      writeSpy.mockRestore()
    }
  })
})
