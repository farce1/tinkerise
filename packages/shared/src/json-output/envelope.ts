/**
 * Shared envelope schemas for tinkerise --json structured output.
 *
 * Every --json command emits one of two envelope shapes:
 *   { schemaVersion, command, data }   — success path
 *   { schemaVersion, command, error }  — failure path
 * data and error are mutually exclusive (D-05). Per-command versioning
 * (D-01) — each command owns its own schemaVersion integer (D-02).
 */

import { z } from 'zod'

/**
 * Error payload shape used inside the error envelope variant.
 * `code` is a SCREAMING_SNAKE_CASE stable identifier sourced from the
 * TinkeriseError hierarchy or normalized via toStableCode().
 */
export const ErrorPayloadSchema = z.object({
  /** Stable error code (e.g., 'PRESET_NOT_FOUND', 'INTERACTIVE_PROMPT_BLOCKED') */
  code: z.string(),
  /** Human-readable error message */
  message: z.string(),
})

export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>

/**
 * Build the success-or-error union envelope for a command.
 *
 * @param command Literal command identifier (e.g., 'list', 'doctor', 'preset.list')
 * @param dataSchema The success-path payload schema
 * @param schemaVersion Integer version owned by this command (default 1)
 */
export function makeEnvelope<TCommand extends string, TData extends z.ZodTypeAny>(
  command: TCommand,
  dataSchema: TData,
  schemaVersion: number = 1,
) {
  // Use `.strict()` so unknown keys cause rejection. Without it, Zod 4 would
  // strip the offending key (e.g., `error` on the success branch) and accept
  // a `{ data, error }` payload via the success variant, silently violating
  // D-05 mutual exclusion.
  const successEnvelope = z.strictObject({
    schemaVersion: z.literal(schemaVersion),
    command: z.literal(command),
    data: dataSchema,
  })

  const errorEnvelope = z.strictObject({
    schemaVersion: z.literal(schemaVersion),
    command: z.literal(command),
    error: ErrorPayloadSchema,
  })

  return z.union([successEnvelope, errorEnvelope])
}
