/**
 * Fuzzy matching utilities for "Did you mean?" suggestions.
 *
 * Uses Levenshtein distance to find the closest match in a short
 * list of candidates (scaffolder names, config keys, categories).
 */

/**
 * Compute the Levenshtein (edit) distance between two strings.
 *
 * Uses the standard dynamic programming approach. Comparison is
 * case-insensitive so that "Vite" and "vite" are distance 0.
 */
export function levenshteinDistance(a: string, b: string): number {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  const m = al.length
  const n = bl.length

  // Create a (m+1) x (n+1) matrix
  const dp: number[][] = Array.from(
    { length: m + 1 },
    () => Array.from<number>({ length: n + 1 }).fill(0),
  )

  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = al[i - 1] === bl[j - 1] ? 0 : 1
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1, // deletion
        dp[i]![j - 1]! + 1, // insertion
        dp[i - 1]![j - 1]! + cost, // substitution
      )
    }
  }

  return dp[m]![n]!
}

/**
 * Find the closest match for `input` among `candidates`.
 *
 * Returns the candidate with the lowest Levenshtein distance, as long
 * as that distance is at most `maxDistance`. Returns `undefined` if no
 * candidate is close enough.
 */
export function findClosestMatch(
  input: string,
  candidates: string[],
  maxDistance = 3,
): string | undefined {
  let bestMatch: string | undefined
  let bestDistance = maxDistance + 1

  for (const candidate of candidates) {
    const distance = levenshteinDistance(input, candidate)
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = candidate
    }
  }

  return bestDistance <= maxDistance ? bestMatch : undefined
}
