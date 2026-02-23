import { describe, expect, it } from 'vitest'
import { getCommandSuggestions } from '../../src/utils/command-suggestions.js'

describe('getCommandSuggestions', () => {
  it('returns deterministic top-3 ranked suggestions for high-confidence typos', () => {
    const result = getCommandSuggestions('lset', {
      candidates: ['list', 'lib', 'preset', 'update', 'doctor'],
      commandName: 'tinkerise',
    })

    expect(result.isHighConfidence).toBe(true)
    expect(result.suggestions).toHaveLength(3)
    expect(result.suggestions.map(item => item.command)).toEqual(['list', 'preset', 'lib'])
    expect(result.suggestions[0]?.correctedCommand).toBe('tinkerise list')
  })

  it('suppresses output when confidence is below threshold', () => {
    const result = getCommandSuggestions('zzzz', {
      candidates: ['list', 'doctor', 'config'],
      threshold: 0.7,
    })

    expect(result.isHighConfidence).toBe(false)
    expect(result.suggestions).toEqual([])
  })

  it('keeps tie-break ordering stable across equal scores', () => {
    const result = getCommandSuggestions('ca', {
      candidates: ['cab', 'caa', 'cat'],
      maxSuggestions: 3,
      threshold: 0.3,
    })

    expect(result.suggestions.map(item => item.command)).toEqual(['caa', 'cab', 'cat'])
  })

  it('returns top-3 suggestions in ranked order when multiple candidates are plausible', () => {
    const result = getCommandSuggestions('co', {
      candidates: ['config', 'cli', 'mcp', 'list'],
      commandName: 'tk',
      threshold: 0.4,
      maxSuggestions: 3,
    })

    expect(result.isHighConfidence).toBe(true)
    expect(result.suggestions.map(item => item.command)).toEqual(['config', 'cli', 'mcp'])
    expect(result.suggestions.map(item => item.correctedCommand)).toEqual(['tk config', 'tk cli', 'tk mcp'])
  })
})
