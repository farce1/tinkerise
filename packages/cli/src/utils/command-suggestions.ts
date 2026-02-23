export interface RankedCommandSuggestion {
  command: string
  score: number
  correctedCommand: string
}

export interface CommandSuggestionResult {
  input: string
  confidence: number
  isHighConfidence: boolean
  suggestions: RankedCommandSuggestion[]
  threshold: number
}

export interface CommandSuggestionOptions {
  candidates?: readonly string[]
  maxSuggestions?: number
  threshold?: number
  commandName?: string
}

const DEFAULT_MAX_SUGGESTIONS = 3
const DEFAULT_THRESHOLD = 0.6
const DEFAULT_LOWEST_PLAUSIBLE_SCORE = 0.35
const PREFIX_BONUS = 0.08
const CONTAINS_BONUS = 0.04

export const CLI_COMMAND_CANDIDATES = [
  'add',
  'backend',
  'cli',
  'config',
  'doctor',
  'lib',
  'list',
  'mcp',
  'mobile',
  'monorepo',
  'preset',
  'update',
  'web',
] as const

function normalizeToken(value: string): string {
  return value.trim().toLowerCase()
}

function clampScore(value: number): number {
  if (value <= 0)
    return 0
  if (value >= 1)
    return 1
  return value
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000
}

function levenshteinDistance(source: string, target: string): number {
  if (source === target)
    return 0

  const rows = source.length + 1
  const cols = target.length + 1
  const matrix: number[][] = Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, () => row))

  for (let col = 0; col < cols; col += 1) {
    matrix[0]![col] = col
  }

  for (let row = 1; row < rows; row += 1) {
    const sourceChar = source[row - 1]
    for (let col = 1; col < cols; col += 1) {
      const targetChar = target[col - 1]
      const substitutionCost = sourceChar === targetChar ? 0 : 1

      matrix[row]![col] = Math.min(
        matrix[row - 1]![col]! + 1,
        matrix[row]![col - 1]! + 1,
        matrix[row - 1]![col - 1]! + substitutionCost,
      )
    }
  }

  return matrix[rows - 1]![cols - 1]!
}

function scoreCandidate(input: string, candidate: string): number {
  const maxLength = Math.max(input.length, candidate.length)
  if (maxLength === 0)
    return 0

  const distance = levenshteinDistance(input, candidate)
  let score = 1 - distance / maxLength

  if (candidate.startsWith(input) || input.startsWith(candidate)) {
    score += PREFIX_BONUS
  }
  else if (candidate.includes(input) || input.includes(candidate)) {
    score += CONTAINS_BONUS
  }

  if (input[0] === candidate[0]) {
    score += 0.06
  }

  if (input[input.length - 1] === candidate[candidate.length - 1]) {
    score += 0.04
  }

  if (Math.abs(input.length - candidate.length) <= 1) {
    score += 0.04
  }

  return roundScore(clampScore(score))
}

export function getCommandSuggestions(inputValue: string, options: CommandSuggestionOptions = {}): CommandSuggestionResult {
  const normalizedInput = normalizeToken(inputValue)
  const threshold = options.threshold ?? DEFAULT_THRESHOLD
  const maxSuggestions = options.maxSuggestions ?? DEFAULT_MAX_SUGGESTIONS
  const commandName = normalizeToken(options.commandName ?? 'tinkerise') || 'tinkerise'
  const candidates = options.candidates ?? CLI_COMMAND_CANDIDATES

  if (!normalizedInput) {
    return {
      input: normalizedInput,
      confidence: 0,
      isHighConfidence: false,
      suggestions: [],
      threshold,
    }
  }

  const ranked = candidates
    .map((command) => {
      const normalizedCommand = normalizeToken(command)
      const score = scoreCandidate(normalizedInput, normalizedCommand)
      const distance = levenshteinDistance(normalizedInput, normalizedCommand)

      return {
        command: normalizedCommand,
        score,
        distance,
      }
    })
    .sort((left, right) => {
      if (right.score !== left.score)
        return right.score - left.score
      if (left.distance !== right.distance)
        return left.distance - right.distance
      if (left.command.length !== right.command.length)
        return left.command.length - right.command.length
      return left.command.localeCompare(right.command)
    })

  const confidence = ranked[0]?.score ?? 0
  const isHighConfidence = confidence >= threshold

  if (!isHighConfidence) {
    return {
      input: normalizedInput,
      confidence,
      isHighConfidence,
      suggestions: [],
      threshold,
    }
  }

  const dynamicFloor = Math.max(DEFAULT_LOWEST_PLAUSIBLE_SCORE, confidence - 0.2)
  const suggestions = ranked
    .filter(candidate => candidate.score >= dynamicFloor)
    .slice(0, maxSuggestions)
    .map(candidate => ({
      command: candidate.command,
      score: candidate.score,
      correctedCommand: `${commandName} ${candidate.command}`,
    }))

  return {
    input: normalizedInput,
    confidence,
    isHighConfidence,
    suggestions,
    threshold,
  }
}
