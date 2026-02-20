/**
 * MCP Server template generator.
 *
 * Generates a complete MCP server project with TypeScript, stdio transport,
 * and one example tool with Zod schema validation.
 *
 * Uses @modelcontextprotocol/sdk v1 import paths.
 */

import type { TemplateOptions } from './types.js'
import { mkdir } from 'node:fs/promises'
import { printTemplateSummary, runInstall, writeProjectFile } from './shared.js'

/**
 * Generate a complete MCP server project.
 *
 * @param name — Project name (used as directory name, package name, and server name)
 * @param options — Template options (packageManager, noInstall)
 */
export async function generateMcpServer(name: string, options: TemplateOptions = {}): Promise<void> {
  const pm = options.packageManager ?? 'npm'
  const projectDir = name

  // 1. Create project directory
  await mkdir(projectDir, { recursive: true })

  // 2. Generate package.json
  const packageJson = {
    name,
    version: '0.0.1',
    type: 'module',
    bin: { [name]: 'dist/index.js' },
    scripts: {
      build: 'tsup',
      dev: 'tsup --watch',
      start: 'node dist/index.js',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.26.0',
      'zod': '^3.24.0',
    },
    devDependencies: {
      'tsup': '^8.4.0',
      'typescript': '^5.7.0',
      '@types/node': '^22.0.0',
    },
  }
  await writeProjectFile(projectDir, 'package.json', `${JSON.stringify(packageJson, null, 2)}\n`)

  // 3. Generate tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'Node16',
      moduleResolution: 'Node16',
      outDir: 'dist',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
    },
    include: ['src'],
  }
  await writeProjectFile(projectDir, 'tsconfig.json', `${JSON.stringify(tsconfig, null, 2)}\n`)

  // 4. Generate tsup.config.ts
  const tsupConfig = `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  shims: true,
});
`
  await writeProjectFile(projectDir, 'tsup.config.ts', tsupConfig)

  // 5. Generate src/index.ts — MCP server entry
  const serverEntry = `#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "${name}",
  version: "1.0.0",
});

// Example tool — replace with your own
server.tool(
  "hello",
  "Say hello to someone",
  { name: z.string().describe("Name to greet") },
  async ({ name }) => ({
    content: [{ type: "text", text: \`Hello, \${name}!\` }],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
`
  await writeProjectFile(projectDir, 'src/index.ts', serverEntry)

  // 6. Generate README.md
  const readme = `# ${name}

An MCP (Model Context Protocol) server built with TypeScript.

## Getting Started

\`\`\`bash
# Build the server
${pm === 'npm' ? 'npm run' : pm} build

# Run in development mode (with file watching)
${pm === 'npm' ? 'npm run' : pm} dev

# Start the built server
${pm === 'npm' ? 'npm run' : pm} start
\`\`\`

## Adding Tools

Edit \`src/index.ts\` to add more tools:

\`\`\`typescript
server.tool(
  "my-tool",
  "Description of my tool",
  { input: z.string().describe("Input description") },
  async ({ input }) => ({
    content: [{ type: "text", text: \`Result: \${input}\` }],
  }),
);
\`\`\`

## Testing with MCP Inspector

\`\`\`bash
npx @modelcontextprotocol/inspector node dist/index.js
\`\`\`

## Configuration

To use this server with an MCP client, add it to your client configuration:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "node",
      "args": ["${name}/dist/index.js"]
    }
  }
}
\`\`\`
`
  await writeProjectFile(projectDir, 'README.md', readme)

  // 7. Install dependencies
  if (!options.noInstall) {
    await runInstall(projectDir, pm)
  }

  // 8. Print summary card
  printTemplateSummary(name, projectDir, pm, 'MCP Server')
}
