import { describe, expect, it, vi } from 'vitest'

// Mock the side-effecting collaborators so the test is hermetic:
// - version probe must not shell out
// - spawn must be observable (and asserted NOT called in dry-run)
// - prereq enforcement must not touch the real environment
vi.mock('../process.js', () => ({
  spawnScaffolder: vi.fn(async () => ({ exitCode: 0 })),
}))
vi.mock('../version.js', () => ({
  detectUpstreamVersion: vi.fn(async () => null),
}))
vi.mock('../../prerequisites/checker.js', () => ({
  checkPrerequisites: vi.fn(async () => {}),
}))

const { executeScaffolder } = await import('../index.js')
const { spawnScaffolder } = await import('../process.js')
const { checkPrerequisites } = await import('../../prerequisites/checker.js')

describe('executeScaffolder dry run', () => {
  it('dryRun returns a plan and never spawns or enforces prereqs', async () => {
    vi.mocked(spawnScaffolder).mockClear()
    vi.mocked(checkPrerequisites).mockClear()

    const plan = await executeScaffolder({
      scaffolderName: 'next',
      projectName: 'my-app',
      userFlags: { typescript: true },
      dryRun: true,
    })

    // Dry-run must be side-effect-free: it must work even when the tool/prereqs
    // are absent, so neither spawn nor prerequisite enforcement may run.
    expect(spawnScaffolder).not.toHaveBeenCalled()
    expect(checkPrerequisites).not.toHaveBeenCalled()
    expect(plan.scaffolderName).toBe('next')
    expect(plan.command).toBe('npx')
    expect(plan.args).toContain('my-app')
    expect(plan.resolvedFlags.some(f => f.unified === 'typescript')).toBe(true)
  })

  it('non-dry run returns the plan and spawns exactly once', async () => {
    vi.mocked(spawnScaffolder).mockClear()

    const plan = await executeScaffolder({
      scaffolderName: 'next',
      projectName: 'my-app',
      userFlags: { typescript: true },
    })

    expect(plan).toBeDefined()
    expect(plan.scaffolderName).toBe('next')
    expect(spawnScaffolder).toHaveBeenCalledTimes(1)
    expect(spawnScaffolder).toHaveBeenCalledWith('npx', plan.args, { cwd: undefined })
  })
})
