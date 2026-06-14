/**
 * Trust store schema (Tier C) — records the external sources a user has
 * explicitly consented to before tinkerise loads or runs anything from them.
 */
import { z } from 'zod'

/** Trust store version. Bump on any breaking shape change. */
export const TRUST_STORE_VERSION = 1

/** A single source the user has consented to trust. */
export const TrustedSourceSchema = z.object({
  /** Canonical source id, e.g. `npm:tinkerise-scaffolder-foo` or `github:org/repo`. */
  id: z.string(),
  /** ISO timestamp of when consent was granted. */
  trustedAt: z.string(),
})

export const TrustStoreSchema = z.object({
  version: z.literal(TRUST_STORE_VERSION),
  sources: z.array(TrustedSourceSchema),
})

export type TrustedSource = z.infer<typeof TrustedSourceSchema>
export type TrustStore = z.infer<typeof TrustStoreSchema>
