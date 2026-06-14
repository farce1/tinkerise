import type { ConflictAction } from '../../src/enhancements/conflict.js'
import { describe, expect, it } from 'vitest'
import {
  formatColoredDiff,
  mergeConfigs,
  parseJsonConfig,
  showFileDiff,
} from '../../src/enhancements/conflict.js'
import { InvalidJsonConfigError } from '../../src/errors/base.js'

describe('formatColoredDiff()', () => {
  it('preserves addition line content', () => {
    const patch = '+added line'
    const result = formatColoredDiff(patch)
    expect(result).toContain('added line')
  })

  it('preserves removal line content', () => {
    const patch = '-removed line'
    const result = formatColoredDiff(patch)
    expect(result).toContain('removed line')
  })

  it('preserves hunk header content', () => {
    const patch = '@@ -1,3 +1,4 @@'
    const result = formatColoredDiff(patch)
    expect(result).toContain('-1,3 +1,4')
  })

  it('treats --- and +++ as file headers (not additions/removals)', () => {
    const patch = '--- a/file.json\n+++ b/file.json'
    const result = formatColoredDiff(patch)
    const lines = result.split('\n')
    expect(lines).toHaveLength(2)
    expect(result).toContain('file.json')
  })

  it('preserves context line content', () => {
    const patch = ' unchanged line'
    const result = formatColoredDiff(patch)
    expect(result).toContain('unchanged line')
  })

  it('processes multi-line patch with all line types', () => {
    const patch = [
      'Index: file.ts',
      '--- file.ts',
      '+++ file.ts',
      '@@ -1,3 +1,4 @@',
      ' context',
      '-old line',
      '+new line',
      ' more context',
    ].join('\n')
    const result = formatColoredDiff(patch)
    // All content should be present
    expect(result).toContain('file.ts')
    expect(result).toContain('context')
    expect(result).toContain('old line')
    expect(result).toContain('new line')
    // Result is split back into the same number of lines
    expect(result.split('\n')).toHaveLength(8)
  })
})

describe('showFileDiff()', () => {
  it('generates valid unified diff between two strings', () => {
    const existing = '{\n  "name": "test"\n}'
    const proposed = '{\n  "name": "test",\n  "version": "1.0"\n}'
    const result = showFileDiff('package.json', existing, proposed)
    // Should contain the file path in the diff header
    expect(result).toContain('package.json')
    // Should contain some diff content
    expect(result).toContain('version')
  })

  it('produces minimal diff for identical content', () => {
    const content = '{\n  "name": "test"\n}'
    const result = showFileDiff('config.json', content, content)
    // Identical content should produce a patch with no +/- lines
    // (just headers). The patch won't contain any green/red lines.
    expect(result).not.toContain('+  "name"')
    expect(result).not.toContain('-  "name"')
  })
})

describe('mergeConfigs()', () => {
  it('merges two objects deeply (nested objects combined)', () => {
    const a = { scripts: { build: 'tsc' }, name: 'foo' }
    const b = { scripts: { test: 'vitest' }, version: '1.0' }
    const result = mergeConfigs(a, b) as Record<string, unknown>
    expect(result).toEqual({
      scripts: { build: 'tsc', test: 'vitest' },
      name: 'foo',
      version: '1.0',
    })
  })

  it('deduplicates primitive arrays when merging two configs', () => {
    const a = { plugins: ['react'] }
    const b = { plugins: ['react'] }
    const result = mergeConfigs(a, b) as Record<string, unknown>
    expect(result).toEqual({ plugins: ['react'] })
  })

  it('merges two plugin arrays without duplicates', () => {
    const a = { plugins: ['a', 'b'] }
    const b = { plugins: ['b', 'c'] }
    const result = mergeConfigs(a, b) as Record<string, unknown>
    expect(result).toEqual({ plugins: ['a', 'b', 'c'] })
  })

  it('is idempotent — merging same config twice produces same result (ENH-05)', () => {
    const config = {
      plugins: ['eslint', 'prettier'],
      rules: { semi: 'error' },
      extends: ['recommended'],
    }
    const merged1 = mergeConfigs(config, config)
    const merged2 = mergeConfigs(merged1, config)
    expect(merged2).toEqual(merged1)
  })

  it('concatenates object arrays without deduplication', () => {
    const a = { overrides: [{ files: '*.ts', rules: {} }] }
    const b = { overrides: [{ files: '*.js', rules: {} }] }
    const result = mergeConfigs(a, b) as Record<string, unknown>
    expect((result as { overrides: unknown[] }).overrides).toHaveLength(2)
    expect((result as { overrides: unknown[] }).overrides).toEqual([
      { files: '*.ts', rules: {} },
      { files: '*.js', rules: {} },
    ])
  })

  it('handles empty objects gracefully', () => {
    const a = { name: 'test' }
    const result = mergeConfigs(a, {}) as Record<string, unknown>
    expect(result).toEqual({ name: 'test' })
  })

  it('handles merging empty with empty', () => {
    const result = mergeConfigs({}, {}) as Record<string, unknown>
    expect(result).toEqual({})
  })
})

describe('parseJsonConfig()', () => {
  it('parses valid JSON', () => {
    const result = parseJsonConfig('{"name": "test", "version": "1.0"}')
    expect(result).toEqual({ name: 'test', version: '1.0' })
  })

  it('throws a structured InvalidJsonConfigError for invalid JSON', () => {
    expect(() => parseJsonConfig('{name: invalid}')).toThrow(InvalidJsonConfigError)
    expect(() => parseJsonConfig('{name: invalid}')).toThrow('Failed to parse JSON config')
  })

  it('surfaces the trailing-comma hint via the error suggestion', () => {
    try {
      parseJsonConfig('{"a": 1,}')
      expect.unreachable('parseJsonConfig should throw on malformed JSON')
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidJsonConfigError)
      expect((err as InvalidJsonConfigError).code).toBe('INVALID_JSON_CONFIG')
      expect((err as InvalidJsonConfigError).suggestion).toContain('trailing commas')
    }
  })
})

describe('conflictAction type', () => {
  it('accepts valid conflict actions', () => {
    const actions: ConflictAction[] = ['skip', 'merge', 'replace']
    expect(actions).toHaveLength(3)
  })
})
