/**
 * Build-time codegen: convert Zod 4 envelope schemas to JSON Schema files (D-17).
 *
 * Outputs apps/docs/public/schemas/{command}.v1.json. Files are served as
 * static assets by Astro/Starlight under base path '/tinkerise/schemas/...'.
 *
 * Regenerated as part of `bun run --filter @tinkerise/docs build`. A CI drift
 * check (`git diff --exit-code apps/docs/public/schemas`) catches stale
 * commits.
 *
 * Phase 33 plan 04 task 1 (CLI-15, D-17). Uses zod@4 `z.toJSONSchema` with
 * `target: 'draft-2020-12'` per RESEARCH §6. Imports from the `'zod/v4'`
 * subpath: `apps/docs/` keeps zod@3 hoisted at `node_modules/zod` to satisfy
 * Astro/Starlight, but zod@3 re-exports the v4 API under the `v4` subpath
 * for migration. This avoids the zod-major-version conflict documented in
 * the original docs-scaffold commit (Phase 25).
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod/v4'
import {
  DoctorEnvelopeV1Schema,
  ListEnvelopeV1Schema,
  PresetListEnvelopeV1Schema,
  PresetShowEnvelopeV1Schema,
} from '@tinkerise/shared'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../public/schemas')

const targets: Array<readonly [string, z.ZodType]> = [
  ['list.v1.json', ListEnvelopeV1Schema],
  ['doctor.v1.json', DoctorEnvelopeV1Schema],
  ['preset-list.v1.json', PresetListEnvelopeV1Schema],
  ['preset-show.v1.json', PresetShowEnvelopeV1Schema],
]

await mkdir(outDir, { recursive: true })

for (const [filename, schema] of targets) {
  const jsonSchema = z.toJSONSchema(schema, { target: 'draft-2020-12' })
  const outPath = resolve(outDir, filename)
  await writeFile(outPath, `${JSON.stringify(jsonSchema, null, 2)}\n`, 'utf-8')
  console.log(`wrote ${outPath}`)
}
