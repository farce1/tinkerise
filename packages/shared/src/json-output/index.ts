/**
 * JSON output module — Zod 4 schemas for tinkerise --json envelopes (Phase 33).
 *
 * Per-command versioning (D-01): each Envelope schema pins its own schemaVersion.
 * The envelope is a union of success ({data}) or error ({error}) variants (D-05).
 */

export {
  DoctorCheckResultSchema,
  DoctorEnvelopeV1Schema,
  DoctorPayloadV1Schema,
  DoctorSummarySchema,
} from './doctor.js'

export type { DoctorEnvelopeV1, DoctorPayloadV1 } from './doctor.js'

export { ErrorPayloadSchema, makeEnvelope } from './envelope.js'

export type { ErrorPayload } from './envelope.js'

export {
  ListEnhancementEntrySchema,
  ListEnvelopeV1Schema,
  ListPayloadV1Schema,
  ListScaffolderEntrySchema,
  ListTemplateEntrySchema,
} from './list.js'

export type { ListEnvelopeV1, ListPayloadV1 } from './list.js'
export {
  PresetListEnvelopeV1Schema,
  PresetListLocalEntrySchema,
  PresetListNpmEntrySchema,
  PresetListPayloadV1Schema,
} from './preset-list.js'
export type { PresetListEnvelopeV1, PresetListPayloadV1 } from './preset-list.js'
export {
  PresetShowDataV1Schema,
  PresetShowEnvelopeV1Schema,
} from './preset-show.js'
export type { PresetShowEnvelopeV1, PresetShowPayloadV1 } from './preset-show.js'
