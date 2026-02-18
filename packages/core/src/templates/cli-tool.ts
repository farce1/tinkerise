/**
 * CLI tool template generator.
 *
 * Generates a complete CLI tool project with Commander.js, TypeScript,
 * tsup build, and one example command with bin entry.
 */

import { mkdir } from 'node:fs/promises'
import type { TemplateOptions } from './types.js'
import { writeProjectFile, runInstall, printTemplateSummary } from './shared.js'

/**
 * Generate a complete CLI tool project.
 *
 * @param name — Project name (used as directory name, package name, and bin name)
 * @param options — Template options (packageManager, noInstall)
 */
export async function generateCliTool(name: string, options: TemplateOptions = {}): Promise<void> {
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
      'commander': '^13.0.0',
    },
    devDependencies: {
      'tsup': '^8.4.0',
      'typescript': '^5.7.0',
      '@types/node': '^22.0.0',
    },
  }
  await writeProjectFile(projectDir, 'package.json', JSON.stringify(packageJson, null, 2) + '\n')

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
  await writeProjectFile(projectDir, 'tsconfig.json', JSON.stringify(tsconfig, null, 2) + '\n')

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

  // 5. Generate src/index.ts — Commander.js entry with one example command
  const cliEntry = `#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("${name}")
  .description("A CLI tool built with tinkerise")
  .version("0.0.1");

program
  .command("greet")
  .description("Say hello")
  .argument("<name>", "Name to greet")
  .action((name: string) => {
    console.log(\`Hello, \${name}!\`);
  });

program.parse();
`
  await writeProjectFile(projectDir, 'src/index.ts', cliEntry)

  // 6. Generate README.md
  const readme = `# ${name}

A CLI tool built with Commander.js and TypeScript.

## Installation

\`\`\`bash
${pm} install
${pm === 'npm' ? 'npm run' : pm} build
npm link
\`\`\`

## Usage

\`\`\`bash
${name} greet World
# Hello, World!
\`\`\`

## Development

\`\`\`bash
# Build the CLI
${pm === 'npm' ? 'npm run' : pm} build

# Watch mode
${pm === 'npm' ? 'npm run' : pm} dev

# Run directly
${pm === 'npm' ? 'npm run' : pm} start
\`\`\`

## Adding Commands

Edit \`src/index.ts\` to add more commands:

\`\`\`typescript
program
  .command("my-command")
  .description("Description of my command")
  .argument("<input>", "Input argument")
  .action((input: string) => {
    console.log(\`Processing: \${input}\`);
  });
\`\`\`
`
  await writeProjectFile(projectDir, 'README.md', readme)

  // 7. Install dependencies
  if (!options.noInstall) {
    await runInstall(projectDir, pm)
  }

  // 8. Print summary card
  printTemplateSummary(name, projectDir, pm, 'CLI Tool')
}
