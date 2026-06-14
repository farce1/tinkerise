import { describe, expect, it } from 'vitest'
import { buildStackCommand } from '../../src/stack/serialize.js'

describe('buildStackCommand', () => {
  it('builds a positional scaffold command with flags', () => {
    const cmd = buildStackCommand({
      framework: 'next',
      category: 'web',
      name: 'my-app',
      flags: ['typescript', 'tailwind'],
    })
    expect(cmd.scaffold).toBe('tinkerise web next my-app --typescript --tailwind')
    expect(cmd.add).toBeUndefined()
  })

  it('emits a follow-up add command for enhancements', () => {
    const cmd = buildStackCommand({
      framework: 'next',
      category: 'web',
      name: 'my-app',
      flags: ['typescript'],
      enhancements: ['eslint', 'prettier'],
    })
    expect(cmd.scaffold).toBe('tinkerise web next my-app --typescript')
    expect(cmd.add).toBe('tinkerise add eslint prettier')
  })

  it('omits the name and flags when not provided', () => {
    const cmd = buildStackCommand({ framework: 'vite', category: 'web' })
    expect(cmd.scaffold).toBe('tinkerise web vite')
    expect(cmd.add).toBeUndefined()
  })

  it('honors a custom program name for the tk alias', () => {
    const cmd = buildStackCommand(
      { framework: 'next', category: 'web', name: 'app', enhancements: ['eslint'] },
      'tk',
    )
    expect(cmd.scaffold).toBe('tk web next app')
    expect(cmd.add).toBe('tk add eslint')
  })
})
