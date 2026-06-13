import { describe, expect, it, vi } from 'vitest'

const mockRunDirectExecution = vi.hoisted(() => vi.fn())
vi.mock('../../src/commands/scaffold.js', () => ({
  runDirectExecution: mockRunDirectExecution,
}))

const { runStackMode, tokensToScaffold } = await import('../../src/commands/stack.js')

describe('tokensToScaffold', () => {
  it('maps tokens to framework/category/name/preselected/enhancements', () => {
    const r = tokensToScaffold(['my-app', 'next', 'ts', 'tailwind', 'eslint'])
    expect(r.framework).toBe('next')
    expect(r.category).toBe('web')
    expect(r.name).toBe('my-app')
    expect(r.preselected.sort()).toEqual(['tailwind', 'typescript'])
    expect(r.enhancements).toEqual(['eslint'])
  })

  it('throws a did-you-mean error on an unknown token', () => {
    expect(() => tokensToScaffold(['my-app', 'nextt'])).toThrow(/did you mean/i)
  })

  it('throws when no framework is resolved', () => {
    expect(() => tokensToScaffold(['my-app', 'ts'])).toThrow(/framework/i)
  })
})

describe('runStackMode', () => {
  it('folds kebab-case flags onto camelCase options and calls runDirectExecution', async () => {
    mockRunDirectExecution.mockClear()
    const options: any = {}
    await runStackMode(['my-app', 'next', 'src-dir', 'app-router'], {} as any, options)

    expect(options.srcDir).toBe(true)
    expect(options.appRouter).toBe(true)
    expect(mockRunDirectExecution).toHaveBeenCalledWith('web', 'next', 'my-app', expect.anything(), options)
  })
})
