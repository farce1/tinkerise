import { resolve } from 'node:path'
import { execaNode } from 'execa'
import { describe, expect, it } from 'vitest'

const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js')

describe('tinkerise CLI', () => {
  describe('--version', () => {
    it('outputs version string matching semver', async () => {
      const { stdout, exitCode } = await execaNode(CLI_PATH, ['--version'])
      expect(exitCode).toBe(0)
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
    })

    it('exits with code 0', async () => {
      const { exitCode } = await execaNode(CLI_PATH, ['--version'])
      expect(exitCode).toBe(0)
    })
  })

  describe('--help', () => {
    it('shows program name and description', async () => {
      const { stdout, exitCode } = await execaNode(CLI_PATH, ['--help'])
      expect(exitCode).toBe(0)
      expect(stdout).toContain('tinkerise')
      expect(stdout).toContain('Scaffold any project')
    })

    it('shows example commands', async () => {
      const { stdout } = await execaNode(CLI_PATH, ['--help'])
      expect(stdout).toContain('Examples:')
      expect(stdout).toContain('tinkerise web')
    })

    it('shows available options', async () => {
      const { stdout } = await execaNode(CLI_PATH, ['--help'])
      expect(stdout).toContain('--version')
      expect(stdout).toContain('--help')
    })
  })

  describe('subcommand help', () => {
    it('shows help for list subcommand', async () => {
      const { stdout, exitCode } = await execaNode(CLI_PATH, ['list', '--help'])
      expect(exitCode).toBe(0)
      expect(stdout).toContain('list')
    })
  })

  describe('list command', () => {
    it('runs the list command and shows scaffolders', async () => {
      const { stdout, exitCode } = await execaNode(CLI_PATH, ['list'])
      expect(exitCode).toBe(0)
      expect(stdout).toContain('Web')
      expect(stdout).toContain('Next.js')
    }, 15000)
  })
})
