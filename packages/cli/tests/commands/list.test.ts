/**
 * Tests for the tinkerise list command.
 *
 * Verifies:
 * - Category grouping and output format
 * - Detailed view when filtering by category
 * - Invalid category handling
 * - Prerequisite status display
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { listScaffolders } from '../../src/commands/list.js'

// vi.hoisted mock fns
const {
  mockGetAllScaffolders,
  mockGetScaffoldersByCategory,
  mockCheckPrerequisite,
  mockGetScaffolderMetadata,
} = vi.hoisted(() => ({
  mockGetAllScaffolders: vi.fn(),
  mockGetScaffoldersByCategory: vi.fn(),
  mockCheckPrerequisite: vi.fn(),
  mockGetScaffolderMetadata: vi.fn(),
}))

vi.mock('@tinkerise/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tinkerise/core')>()
  return {
    ...actual,
    getAllScaffolders: mockGetAllScaffolders,
    getScaffoldersByCategory: mockGetScaffoldersByCategory,
    checkPrerequisite: mockCheckPrerequisite,
    getScaffolderMetadata: mockGetScaffolderMetadata,
    TEMPLATE_METADATA: [
      { id: 'mcp', command: 'mcp', displayName: 'MCP Server', description: 'MCP server with TypeScript' },
      { id: 'cli', command: 'cli', displayName: 'CLI Tool', description: 'CLI tool with Commander.js' },
      { id: 'lib', command: 'lib', displayName: 'npm Library', description: 'npm library with dual CJS/ESM' },
    ],
    allEnhancementModules: [
      { id: 'eslint', name: 'ESLint', description: 'Linting with ESLint' },
      { id: 'prettier', name: 'Prettier', description: 'Code formatting with Prettier' },
      { id: 'husky', name: 'Husky', description: 'Git hooks with Husky' },
      { id: 'commitlint', name: 'Commitlint', description: 'Commit message linting' },
      { id: 'ci', name: 'CI', description: 'GitHub Actions CI pipeline' },
      { id: 'testing', name: 'Testing', description: 'Testing with Vitest' },
      { id: 'docker', name: 'Docker', description: 'Docker containerization' },
      { id: 'env', name: 'Env', description: 'Type-safe environment variables' },
      { id: 'renovate', name: 'Renovate', description: 'Automated dependency updates' },
      { id: 'editorconfig', name: 'EditorConfig', description: 'Editor configuration' },
    ],
  }
})

vi.mock('picocolors', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    bold: (s: string) => s,
    dim: (s: string) => s,
  },
}))

/** Minimal scaffolder entry for testing */
function makeEntry(name: string, category: string, packageName: string, flags: Array<{ unified: string, native: string }> = []) {
  return {
    name,
    category,
    command: 'npx',
    packageName,
    integration: { type: 'delegate' as const, command: `create-${name}` },
    prerequisites: [{ command: 'node', versionFlag: '--version', versionRange: '>=18.0.0' }],
    flags,
    passthroughArgs: true,
  }
}

const webEntries = [
  makeEntry('next', 'web', 'create-next-app', [
    { unified: 'typescript', native: '--typescript' },
    { unified: 'tailwind', native: '--tailwind' },
  ]),
  makeEntry('vite', 'web', 'create-vite', [
    { unified: 'typescript', native: '' },
  ]),
]

describe('listScaffolders', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    mockCheckPrerequisite.mockResolvedValue({ ok: true })
    mockGetScaffolderMetadata.mockReturnValue({
      displayName: 'Next.js',
      description: 'React framework',
      suggestions: [],
    })
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    exitSpy.mockRestore()
  })

  it('shows all scaffolders grouped by category headers', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    await listScaffolders()

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(output).toContain('Web')
  })

  it('shows detailed view when filtering by category', async () => {
    mockGetScaffoldersByCategory.mockReturnValue(webEntries)
    mockGetScaffolderMetadata.mockImplementation((name: string) => {
      if (name === 'next')
        return { displayName: 'Next.js', description: 'React framework', suggestions: [] }
      if (name === 'vite')
        return { displayName: 'Vite', description: 'Fast build tool', suggestions: [] }
      return undefined
    })

    await listScaffolders('web')

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(output).toContain('React framework')
    expect(output).toContain('Package: create-next-app')
    expect(output).toContain('Flags: --typescript, --tailwind')
  })

  it('throws InvalidCategoryError for invalid category', async () => {
    await expect(listScaffolders('invalid')).rejects.toThrow('Unknown category')
  })

  it('shows checkmark for met prerequisites', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    mockCheckPrerequisite.mockResolvedValue({ ok: true })

    await listScaffolders()

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(output).toContain('\u2713')
    expect(output).not.toContain('\u2717')
  })

  it('shows X for unmet prerequisites', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    mockCheckPrerequisite.mockResolvedValue({ ok: false, command: 'node', error: 'not found' })

    await listScaffolders()

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(output).toContain('\u2717')
  })

  it('shows "No scaffolders available" when empty', async () => {
    mockGetAllScaffolders.mockReturnValue([])

    await listScaffolders()

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(output).toContain('No scaffolders available')
  })

  it('shows Enhancements section in default view', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    await listScaffolders()

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(output).toContain('Enhancements')
  })

  it('lists all 10 enhancement modules', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    await listScaffolders()

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    const enhancementIds = ['eslint', 'prettier', 'husky', 'commitlint', 'ci', 'testing', 'docker', 'env', 'renovate', 'editorconfig']
    for (const id of enhancementIds) {
      expect(output).toContain(id)
    }
  })

  it('does not show Enhancements section with category filter', async () => {
    mockGetScaffoldersByCategory.mockReturnValue(webEntries)
    await listScaffolders('web')

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
    expect(output).not.toContain('Enhancements')
  })
})

describe('listScaffolders --json (CLI-12)', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const { __resetJsonModeForTests, detectJsonMode } = await import('../../src/utils/output-mode.js')
    __resetJsonModeForTests()
    detectJsonMode(['node', 'tinkerise', 'list', '--json'])
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockCheckPrerequisite.mockResolvedValue({ ok: true })
    mockGetScaffolderMetadata.mockImplementation((name: string) => {
      if (name === 'next')
        return { displayName: 'Next.js', description: 'React framework', suggestions: [] }
      if (name === 'vite')
        return { displayName: 'Vite', description: 'Fast build tool', suggestions: [] }
      return undefined
    })
  })

  afterEach(async () => {
    stdoutSpy.mockRestore()
    consoleSpy.mockRestore()
    const { __resetJsonModeForTests } = await import('../../src/utils/output-mode.js')
    __resetJsonModeForTests()
  })

  function readEnvelope(): { schemaVersion: number, command: string, data: Record<string, unknown> } {
    const calls = stdoutSpy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const raw = String(calls[0]![0])
    return JSON.parse(raw)
  }

  it('emits envelope with schemaVersion 1 and command "list"', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    await listScaffolders()

    const envelope = readEnvelope()
    expect(envelope.schemaVersion).toBe(1)
    expect(envelope.command).toBe('list')
    expect(envelope.data).toBeDefined()
  })

  it('data.scaffolders contains entries with required fields', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    await listScaffolders()

    const envelope = readEnvelope()
    const scaffolders = envelope.data.scaffolders as Array<Record<string, unknown>>
    expect(scaffolders.length).toBe(2)

    const next = scaffolders.find(s => s.name === 'next')!
    expect(next.category).toBe('web')
    expect(next.packageName).toBe('create-next-app')
    expect(next.prereqOk).toBe(true)
    expect(next.displayName).toBe('Next.js')
    expect(next.description).toBe('React framework')
    expect(next.supportedFlags).toEqual(['typescript', 'tailwind'])
  })

  it('omits displayName/description when metadata is absent (D-22)', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    mockGetScaffolderMetadata.mockReturnValue(undefined)
    await listScaffolders()

    const envelope = readEnvelope()
    const scaffolders = envelope.data.scaffolders as Array<Record<string, unknown>>
    for (const s of scaffolders) {
      expect(s).not.toHaveProperty('displayName')
      expect(s).not.toHaveProperty('description')
    }
  })

  it('emits templates and enhancements arrays in default view', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    await listScaffolders()

    const envelope = readEnvelope()
    expect(Array.isArray(envelope.data.templates)).toBe(true)
    expect((envelope.data.templates as unknown[]).length).toBe(3)
    expect(Array.isArray(envelope.data.enhancements)).toBe(true)
    expect((envelope.data.enhancements as unknown[]).length).toBe(10)
  })

  it('preserves empty templates/enhancements arrays when category is filtered (D-21)', async () => {
    mockGetScaffoldersByCategory.mockReturnValue(webEntries)
    await listScaffolders('web')

    const envelope = readEnvelope()
    expect(envelope.data.templates).toEqual([])
    expect(envelope.data.enhancements).toEqual([])
  })

  it('throws InvalidCategoryError for bogus category (flows through handleError)', async () => {
    await expect(listScaffolders('bogus')).rejects.toThrow('Unknown category')
  })

  it('does NOT emit human console.log output in JSON mode', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    await listScaffolders()

    expect(consoleSpy).not.toHaveBeenCalled()
  })

  it('emit is exactly one JSON object on stdout with single trailing newline', async () => {
    mockGetAllScaffolders.mockReturnValue(webEntries)
    await listScaffolders()

    expect(stdoutSpy).toHaveBeenCalledTimes(1)
    const raw = String(stdoutSpy.mock.calls[0]![0])
    expect(raw.endsWith('\n')).toBe(true)
    expect(raw.match(/\n/g)?.length).toBe(1)
  })
})
