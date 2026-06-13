/**
 * Flag mapping module — resolution and validation.
 */

export { resolveFlags } from './resolver.js'
export type { ResolvedFlagMapping, ResolveFlagsOptions, ResolveFlagsResult } from './resolver.js'
export { FlagNotApplicableError, validateFlagApplicability } from './validator.js'
