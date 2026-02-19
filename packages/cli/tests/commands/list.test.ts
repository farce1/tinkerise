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

vi.mock('@tinkerise/core', () => ({
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
}))

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

  it('exits with error for invalid category', async () => {
    await expect(listScaffolders('invalid')).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(1)
    const errorOutput = consoleErrorSpy.mock.calls.map(c => c[0]).join('\n')
    expect(errorOutput).toContain('Unknown category')
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
