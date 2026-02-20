/**
 * Utility template generators barrel export.
 *
 * Provides template generators (MCP, CLI, lib) and shared metadata
 * for the list command.
 */

export { generateCliTool } from './cli-tool.js'
export { generateLib } from './lib.js'
export { generateMcpServer } from './mcp.js'
export type { TemplateOptions } from './types.js'

/**
 * Template metadata for display in `tinkerise list`.
 * All three entries included now; cli/lib generators added in plan 09-05.
 */
export const TEMPLATE_METADATA = [
  { id: 'mcp', command: 'mcp', displayName: 'MCP Server', description: 'MCP server with TypeScript' },
  { id: 'cli', command: 'cli', displayName: 'CLI Tool', description: 'CLI tool with Commander.js' },
  { id: 'lib', command: 'lib', displayName: 'npm Library', description: 'npm library with dual CJS/ESM' },
] as const
