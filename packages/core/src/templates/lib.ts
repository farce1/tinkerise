/**
 * npm library template generator.
 *
 * Generates a publish-ready npm library with TypeScript, tsup dual CJS/ESM
 * build, package.json exports, Vitest config, and README template.
 */

import { mkdir } from 'node:fs/promises'
import type { TemplateOptions } from './types.js'
import { writeProjectFile, runInstall, printTemplateSummary } from './shared.js'

/**
 * Generate a publish-ready npm library project.
 *
 * @param name — Project name (used as directory name and package name)
 * @param options — Template options (packageManager, noInstall)
 */
export async function generateLib(name: string, options: TemplateOptions = {}): Promise<void> {
  const pm = options.packageManager ?? 'npm'
  const projectDir = name

  // 1. Create project directory
  await mkdir(projectDir, { recursive: true })

  // 2. Generate package.json — types field first in exports per TypeScript resolution order
  const packageJson = {
    name,
    version: '0.0.1',
    type: 'module',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
        require: './dist/index.cjs',
      },
    },
    main: './dist/index.cjs',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    files: ['dist'],
    scripts: {
      build: 'tsup',
      dev: 'tsup --watch',
      test: 'vitest',
      'test:run': 'vitest run',
      typecheck: 'tsc --noEmit',
      prepublishOnly: 'npm run build',
    },
    devDependencies: {
      'tsup': '^8.4.0',
      'typescript': '^5.7.0',
      'vitest': '^3.1.0',
      '@types/node': '^22.0.0',
    },
  }
  await writeProjectFile(projectDir, 'package.json', JSON.stringify(packageJson, null, 2) + '\n')

  // 3. Generate tsconfig.json — with declarationMap and sourceMap for library consumers
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
      declarationMap: true,
      sourceMap: true,
    },
    include: ['src'],
  }
  await writeProjectFile(projectDir, 'tsconfig.json', JSON.stringify(tsconfig, null, 2) + '\n')

  // 4. Generate tsup.config.ts — dual CJS/ESM
  const tsupConfig = `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
});
`
  await writeProjectFile(projectDir, 'tsup.config.ts', tsupConfig)

  // 5. Generate vitest.config.ts
  const vitestConfig = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules", "dist"],
  },
});
`
  await writeProjectFile(projectDir, 'vitest.config.ts', vitestConfig)

  // 6. Generate src/index.ts — minimal library entry
  const libEntry = `/**
 * ${name} — your library description here.
 */

export function hello(name: string): string {
  return \`Hello, \${name}!\`;
}
`
  await writeProjectFile(projectDir, 'src/index.ts', libEntry)

  // 7. Generate README.md
  const readme = `# ${name}

A TypeScript library with dual CJS/ESM build.

## Installation

\`\`\`bash
npm install ${name}
\`\`\`

## Usage

\`\`\`typescript
import { hello } from "${name}";

console.log(hello("World"));
// Hello, World!
\`\`\`

## Development

\`\`\`bash
# Build the library
${pm === 'npm' ? 'npm run' : pm} build

# Watch mode
${pm === 'npm' ? 'npm run' : pm} dev

# Run tests
${pm === 'npm' ? 'npm run' : pm} test

# Run tests once
${pm === 'npm' ? 'npm run' : pm} test:run

# Type check
${pm === 'npm' ? 'npm run' : pm} typecheck
\`\`\`

## Publishing

1. Update version in \`package.json\`
2. Run \`npm run build\` (runs automatically via \`prepublishOnly\`)
3. Run \`npm publish\`
`
  await writeProjectFile(projectDir, 'README.md', readme)

  // 8. Install dependencies
  if (!options.noInstall) {
    await runInstall(projectDir, pm)
  }

  // 9. Print summary card
  printTemplateSummary(name, projectDir, pm, 'npm Library')
}
