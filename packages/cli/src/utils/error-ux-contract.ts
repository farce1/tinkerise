export interface ErrorUxContent {
  code: string
  headline: string
  cause: string
  nextStep: string
}

export interface ErrorUxRenderOptions {
  content: ErrorUxContent
  stack?: string
  debug?: boolean
}

export interface ErrorUxRenderResult {
  lines: string[]
  stack?: string
}

function normalizeLine(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function renderErrorContract(content: ErrorUxContent): string[] {
  const code = normalizeLine(content.code)
  const headline = normalizeLine(content.headline)
  const cause = normalizeLine(content.cause)
  const nextStep = normalizeLine(content.nextStep)

  return [
    `Error [${code}] ${headline}`,
    `Cause: ${cause}`,
    `Next step: ${nextStep}`,
  ]
}

export function formatBoundaryError(options: ErrorUxRenderOptions): ErrorUxRenderResult {
  const lines = renderErrorContract(options.content)
  const stack = options.debug && options.stack ? options.stack : undefined

  return {
    lines,
    stack,
  }
}
