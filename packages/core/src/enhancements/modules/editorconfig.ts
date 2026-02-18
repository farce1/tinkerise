/**
 * EditorConfig enhancement module.
 *
 * Generates an .editorconfig file with standard JS/TS ecosystem defaults
 * for cross-editor formatting consistency.
 *
 * Config-only module — no packages to install.
 */

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import type { ProjectContext } from '../types.js'
import { writeConfigFile } from './_utils.js'

/** EditorConfig content with JS/TS ecosystem defaults */
const EDITORCONFIG_CONTENT = `root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
`

export const editorconfigModule = defineEnhancement({
  id: 'editorconfig',
  name: 'EditorConfig',
  description: 'Cross-editor formatting consistency via .editorconfig',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    try {
      await access(join(ctx.rootDir, '.editorconfig'))
      configFiles.push(join(ctx.rootDir, '.editorconfig'))
    }
    catch {
      // File doesn't exist
    }

    return {
      installed: configFiles.length > 0,
      configFiles,
      partial: false,
    }
  },

  async install(ctx: ProjectContext) {
    const configPath = await writeConfigFile(
      ctx.rootDir,
      '.editorconfig',
      EDITORCONFIG_CONTENT,
    )

    return {
      success: true,
      filesModified: [configPath],
      packagesAdded: [],
      warnings: [],
    }
  },
})
