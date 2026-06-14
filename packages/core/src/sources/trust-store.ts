/**
 * Source trust store (Tier C) — persists which external sources the user has
 * explicitly consented to. The consent prompt itself is UI, so `ensureSourceTrusted`
 * takes a callback (mirroring the enhancement conflict/approval callbacks); core
 * never prompts directly.
 */

import type { TrustedSource, TrustStore } from '@tinkerise/shared'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { TRUST_STORE_VERSION, TrustStoreSchema } from '@tinkerise/shared'
import { getConfigDir } from '../config/index.js'

/** Trust store filename in the config dir. */
export const TRUST_STORE_FILENAME = 'trusted-sources.json'

export function getTrustStorePath(): string {
  return path.join(getConfigDir(), TRUST_STORE_FILENAME)
}

/** Details passed to the consent callback so the UI can describe what is being trusted. */
export interface SourceConsentRequest {
  id: string
}

export type OnSourceConsent = (source: SourceConsentRequest) => Promise<boolean>

async function readTrustStore(): Promise<TrustStore> {
  const empty: TrustStore = { version: TRUST_STORE_VERSION, sources: [] }
  try {
    const parsed = TrustStoreSchema.safeParse(JSON.parse(await readFile(getTrustStorePath(), 'utf-8')))
    return parsed.success ? parsed.data : empty
  }
  catch {
    return empty
  }
}

async function writeTrustStore(store: TrustStore): Promise<void> {
  // Validate before persisting so a logic regression can never write a malformed
  // trust store (mirrors saveGlobalConfig; this file gates external-source trust).
  const validated = TrustStoreSchema.parse(store)
  await mkdir(getConfigDir(), { recursive: true })
  await writeFile(getTrustStorePath(), `${JSON.stringify(validated, null, 2)}\n`, 'utf-8')
}

export async function listTrustedSources(): Promise<TrustedSource[]> {
  return (await readTrustStore()).sources
}

export async function isSourceTrusted(id: string): Promise<boolean> {
  return (await readTrustStore()).sources.some(s => s.id === id)
}

/** Persist consent for a source. Idempotent — re-trusting keeps the original entry. */
export async function trustSource(id: string): Promise<void> {
  const store = await readTrustStore()
  if (store.sources.some(s => s.id === id))
    return
  store.sources.push({ id, trustedAt: new Date().toISOString() })
  await writeTrustStore(store)
}

/**
 * Gate any use of an external source on explicit per-source consent. Returns true
 * if the source is already trusted, or if the consent callback grants it (which
 * also persists the trust). Returns false — without trusting — when consent is denied.
 */
export async function ensureSourceTrusted(id: string, onConsent: OnSourceConsent): Promise<boolean> {
  if (await isSourceTrusted(id))
    return true

  const granted = await onConsent({ id })
  if (granted)
    await trustSource(id)
  return granted
}
