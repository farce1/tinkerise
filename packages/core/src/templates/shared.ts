/**
 * Shared helpers for utility template generators.
 *
 * writeProjectFile — create a file in the generated project directory.
 * runInstall — run package manager install command.
 * printTemplateSummary — display a styled summary card after generation.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { execa } from 'execa'
import pc from 'picocolors'

/**
 * Write a file into the project directory, creating intermediate directories as needed.
 *
 * @returns The absolute path of the written file
 */
export async function writeProjectFile(
  projectDir: string,
  filename: string,
  content: string,
): Promise<string> {
  const fullPath = join(projectDir, filename)
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, content, 'utf-8')
  return fullPath
}

/**
 * Run the package manager install command in the project directory.
 */
export async function runInstall(projectDir: string, pm: string): Promise<void> {
  const args = ['install']
  await execa(pm, args, { cwd: projectDir, stdio: 'inherit' })
}

/**
 * Print a styled summary card after project generation.
 */
export function printTemplateSummary(
  name: string,
  projectDir: string,
  pm: string,
  templateType: string,
): void {
  const absPath = resolve(projectDir)
  console.log()
  console.log(pc.bold(pc.green(`  ${templateType} project created!`)))
  console.log()
  console.log(`  ${pc.dim('Project:')}  ${name}`)
  console.log(`  ${pc.dim('Path:')}     ${absPath}`)
  console.log(`  ${pc.dim('PM:')}       ${pm}`)
  console.log()
  console.log(pc.dim('  Next steps:'))
  console.log(`    cd ${name}`)
  console.log(`    ${pm === 'npm' ? 'npm run' : pm} build`)
  console.log(`    ${pm === 'npm' ? 'npm run' : pm} dev`)
  console.log()
}
