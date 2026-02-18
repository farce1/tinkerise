/**
 * Shared types for utility template generators.
 *
 * TemplateOptions is the base interface for all template generators
 * (MCP server, CLI tool, npm library).
 */

export interface TemplateOptions {
  packageManager?: string // 'npm' | 'pnpm' | 'yarn' | 'bun'
  noInstall?: boolean
}
