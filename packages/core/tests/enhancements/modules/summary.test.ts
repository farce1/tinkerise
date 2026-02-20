import type { EnhancementNextSteps } from '../../../src/enhancements/summary.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ENHANCEMENT_NEXT_STEPS, showPerEnhancementSummary } from '../../../src/enhancements/summary.js'

const mockTinkeriseLog = vi.hoisted(() => vi.fn())
const mockTinkeriseBlankLine = vi.hoisted(() => vi.fn())

vi.mock('../../../src/executor/framing.js', () => ({
  tinkeriseLog: mockTinkeriseLog,
  tinkeriseBlankLine: mockTinkeriseBlankLine,
}))

function makeInfo(overrides: Partial<EnhancementNextSteps> = {}): EnhancementNextSteps {
  return {
    moduleId: 'eslint',
    moduleName: 'ESLint',
    result: {
      success: true,
      filesModified: [],
      packagesAdded: [],
      warnings: [],
    },
    nextSteps: [],
    ...overrides,
  }
}

describe('showPerEnhancementSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays module name', () => {
    showPerEnhancementSummary(makeInfo())

    // Should log module name (bold is wrapped by picocolors)
    const logCalls = mockTinkeriseLog.mock.calls.map((c: unknown[]) => c[0] as string)
    expect(logCalls.some((s: string) => s.includes('ESLint'))).toBe(true)
  })

  it('lists files modified', () => {
    showPerEnhancementSummary(makeInfo({
      result: {
        success: true,
        filesModified: ['eslint.config.js', 'package.json'],
        packagesAdded: [],
        warnings: [],
      },
    }))

    const logCalls = mockTinkeriseLog.mock.calls.map((c: unknown[]) => c[0] as string)
    expect(logCalls.some((s: string) => s.includes('eslint.config.js'))).toBe(true)
  })

  it('lists packages added', () => {
    showPerEnhancementSummary(makeInfo({
      result: {
        success: true,
        filesModified: [],
        packagesAdded: ['eslint@^9.0.0', '@eslint/js@^9.0.0', 'globals@^17.0.0'],
        warnings: [],
      },
    }))

    const logCalls = mockTinkeriseLog.mock.calls.map((c: unknown[]) => c[0] as string)
    expect(logCalls.some((s: string) => s.includes('eslint@'))).toBe(true)
  })

  it('displays next steps', () => {
    showPerEnhancementSummary(makeInfo({
      nextSteps: ['Run lint', 'Check output'],
    }))

    const logCalls = mockTinkeriseLog.mock.calls.map((c: unknown[]) => c[0] as string)
    expect(logCalls.some((s: string) => s.includes('Run lint'))).toBe(true)
    expect(logCalls.some((s: string) => s.includes('Check output'))).toBe(true)
  })

  it('shows warnings', () => {
    showPerEnhancementSummary(makeInfo({
      result: {
        success: true,
        filesModified: [],
        packagesAdded: [],
        warnings: ['Config already exists'],
      },
    }))

    const logCalls = mockTinkeriseLog.mock.calls.map((c: unknown[]) => c[0] as string)
    expect(logCalls.some((s: string) => s.includes('Config already exists'))).toBe(true)
  })

  it('handles empty result gracefully', () => {
    showPerEnhancementSummary(makeInfo())

    // Should at minimum log the module name and blank line
    expect(mockTinkeriseBlankLine).toHaveBeenCalled()
    expect(mockTinkeriseLog).toHaveBeenCalled()
  })
})

describe('eNHANCEMENT_NEXT_STEPS', () => {
  it('has entries for all six modules', () => {
    expect(ENHANCEMENT_NEXT_STEPS.eslint).toBeDefined()
    expect(ENHANCEMENT_NEXT_STEPS.prettier).toBeDefined()
    expect(ENHANCEMENT_NEXT_STEPS.husky).toBeDefined()
    expect(ENHANCEMENT_NEXT_STEPS.ci).toBeDefined()
    expect(ENHANCEMENT_NEXT_STEPS.changelog).toBeDefined()
    expect(ENHANCEMENT_NEXT_STEPS.testing).toBeDefined()
  })

  it('each entry is a non-empty array', () => {
    for (const [, steps] of Object.entries(ENHANCEMENT_NEXT_STEPS)) {
      expect(Array.isArray(steps)).toBe(true)
      expect(steps.length).toBeGreaterThan(0)
    }
  })

  it('changelog entry mentions changelog and release scripts', () => {
    expect(ENHANCEMENT_NEXT_STEPS.changelog.some(s => s.includes('changelog'))).toBe(true)
    expect(ENHANCEMENT_NEXT_STEPS.changelog.some(s => s.includes('release'))).toBe(true)
  })

  it('testing entry mentions running tests', () => {
    expect(ENHANCEMENT_NEXT_STEPS.testing.some(s => s.includes('test'))).toBe(true)
  })
})
