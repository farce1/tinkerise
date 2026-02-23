import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const defaultFixturePath = resolve(here, 'fixtures/docs-smoke-fixtures.json')
const defaultReportPath = resolve(here, 'artifacts/docs-smoke-report.json')
const defaultScreenshotDir = resolve(here, 'artifacts/screenshots')
const routeRetryDelaysMs = [2000, 5000, 10000]
const routeTimeoutMs = 30000
const selectorTimeoutMs = 10000

const requiredFixtureGroups = ['requiredRoutes', 'searchQueries', 'codeRoutes']

function printUsage() {
  console.log(`Usage: node apps/docs/scripts/smoke-production-docs.mjs [options]

Options:
  --target <url>                Explicit smoke target URL (repeatable)
  --deploy-url <url>            Override DEPLOY_URL input
  --canonical-url <url>         Override canonical URL input
  --canonical-only              Run only against canonical URL target
  --deploy-only                 Run only against deploy URL target
  --report <path>               JSON report output path
  --fixture <path>              Fixture file path
  --screenshot-dir <path>       Directory for failed-check screenshots
  --inject-required-failure     Add one deterministic required failure for validation
  --help                        Show this help output

Environment:
  DEPLOY_URL                    Deployed docs URL from CI output
  CANONICAL_URL                 Canonical docs URL override
`)
}

function parseArgs(argv) {
  const args = {
    targets: [],
    reportPath: defaultReportPath,
    fixturePath: defaultFixturePath,
    screenshotDir: defaultScreenshotDir,
    deployUrl: process.env.DEPLOY_URL ?? null,
    canonicalUrl: process.env.CANONICAL_URL ?? null,
    canonicalOnly: false,
    deployOnly: false,
    injectRequiredFailure: false,
    help: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]

    if (token === '--help') {
      args.help = true
      continue
    }

    if (token === '--canonical-only') {
      args.canonicalOnly = true
      continue
    }

    if (token === '--deploy-only') {
      args.deployOnly = true
      continue
    }

    if (token === '--inject-required-failure') {
      args.injectRequiredFailure = true
      continue
    }

    if (token === '--target' || token === '--deploy-url' || token === '--canonical-url' || token === '--report' || token === '--fixture' || token === '--screenshot-dir') {
      const value = argv[i + 1]
      if (!value)
        throw new Error(`Missing value for ${token}`)

      i += 1

      if (token === '--target')
        args.targets.push(value)
      if (token === '--deploy-url')
        args.deployUrl = value
      if (token === '--canonical-url')
        args.canonicalUrl = value
      if (token === '--report')
        args.reportPath = resolve(process.cwd(), value)
      if (token === '--fixture')
        args.fixturePath = resolve(process.cwd(), value)
      if (token === '--screenshot-dir')
        args.screenshotDir = resolve(process.cwd(), value)

      continue
    }

    throw new Error(`Unknown option: ${token}`)
  }

  if (args.canonicalOnly && args.deployOnly)
    throw new Error('Use only one of --canonical-only or --deploy-only')

  return args
}

function toUrl(value) {
  const url = new URL(value)
  return url.toString().replace(/\/$/, '')
}

function toAbsoluteUrl(baseUrl, routePath) {
  return new URL(routePath, `${baseUrl}/`).toString()
}

async function resolveCanonicalUrl(configuredCanonical) {
  if (configuredCanonical)
    return toUrl(configuredCanonical)

  const astroConfigUrl = pathToFileURL(resolve(repoRoot, 'apps/docs/astro.config.mjs')).toString()
  const mod = await import(astroConfigUrl)
  const config = mod.default ?? {}
  const site = config.site
  const base = config.base ?? '/'

  if (!site)
    throw new Error('Unable to resolve canonical URL from apps/docs/astro.config.mjs (missing site)')

  return toUrl(new URL(base, site).toString())
}

function loadFixtures(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const fixtures = JSON.parse(raw)

  for (const group of requiredFixtureGroups) {
    if (!Array.isArray(fixtures[group]) || fixtures[group].length === 0)
      throw new Error(`Fixture group "${group}" must be a non-empty array`)
  }

  if (!fixtures.metadata?.requirementGroupMap)
    throw new Error('Fixture metadata.requirementGroupMap is required')

  return fixtures
}

function dedupeTargets(targets) {
  return [...new Set(targets.map(toUrl))]
}

function resolveTargets(args, canonicalUrl) {
  if (args.targets.length > 0)
    return dedupeTargets(args.targets)

  const candidates = []

  if (!args.canonicalOnly && args.deployUrl)
    candidates.push(args.deployUrl)
  if (!args.deployOnly)
    candidates.push(canonicalUrl)

  const targets = dedupeTargets(candidates)

  if (targets.length === 0)
    throw new Error('No target URLs resolved. Provide --target or DEPLOY_URL/CANONICAL_URL.')

  return targets
}

function screenshotName(parts) {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function captureScreenshot(page, screenshotDir, parts) {
  mkdirSync(screenshotDir, { recursive: true })
  const filePath = resolve(screenshotDir, `${screenshotName(parts)}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  return filePath
}

function summarizeChecks(checks) {
  const total = checks.length
  const passed = checks.filter(check => check.status === 'passed').length
  const failed = checks.filter(check => check.status === 'failed').length
  return { total, passed, failed }
}

async function assertRouteAvailability({ page, target, routeFixture }) {
  const url = toAbsoluteUrl(target, routeFixture.path)
  let lastError = null

  for (let attempt = 1; attempt <= routeRetryDelaysMs.length + 1; attempt += 1) {
    try {
      const response = await page.goto(url, {
        timeout: routeTimeoutMs,
        waitUntil: 'domcontentloaded',
      })

      if (!response)
        throw new Error('No HTTP response received')

      if (!response.ok())
        throw new Error(`HTTP ${response.status()} ${response.statusText()}`)

      await page.waitForSelector('main', { timeout: selectorTimeoutMs })
      const title = await page.title()
      if (!title.trim())
        throw new Error('Page title is empty')

      return {
        status: 'passed',
        details: {
          url,
          httpStatus: response.status(),
          attempts: attempt,
        },
      }
    }
    catch (error) {
      lastError = error

      if (attempt <= routeRetryDelaysMs.length)
        await page.waitForTimeout(routeRetryDelaysMs[attempt - 1])
    }
  }

  return {
    status: 'failed',
    details: {
      url,
      attempts: routeRetryDelaysMs.length + 1,
      error: lastError?.message ?? 'Unknown route availability failure',
    },
  }
}

function searchResultLocator(page, hrefContains) {
  const escaped = hrefContains.replace(/"/g, '\\"')
  return page.locator(`a[href*="${escaped}"]`).first()
}

async function assertSearchQuery({ page, target, queryFixture }) {
  const rootUrl = toAbsoluteUrl(target, '/')
  await page.goto(rootUrl, { timeout: routeTimeoutMs, waitUntil: 'domcontentloaded' })

  const openModalButton = page.locator('button[data-open-modal], button[aria-label*="Search"], button[title*="Search"]').first()
  await openModalButton.click({ timeout: selectorTimeoutMs })

  const searchInput = page.locator('dialog[aria-label="Search"] input, [aria-label="Search"] input, input[type="search"]').first()
  await searchInput.fill(queryFixture.query, { timeout: selectorTimeoutMs })

  const resultLink = searchResultLocator(page, queryFixture.expected.hrefContains)
  await resultLink.waitFor({ state: 'visible', timeout: selectorTimeoutMs })

  if (queryFixture.expected.textContains)
    await resultLink.filter({ hasText: queryFixture.expected.textContains }).first().waitFor({ state: 'visible', timeout: selectorTimeoutMs })

  return {
    status: 'passed',
    details: {
      query: queryFixture.query,
      hrefContains: queryFixture.expected.hrefContains,
      target: rootUrl,
    },
  }
}

async function assertCodeRendering({ page, target, codeFixture }) {
  const url = toAbsoluteUrl(target, codeFixture.path)
  await page.goto(url, { timeout: routeTimeoutMs, waitUntil: 'domcontentloaded' })

  const codeFrame = page.locator('.expressive-code figure.frame').first()
  await codeFrame.waitFor({ state: 'visible', timeout: selectorTimeoutMs })

  const highlightedTokenCount = await codeFrame.locator('code span[style*="--"]').count()
  if (highlightedTokenCount === 0)
    throw new Error('No syntax-highlight token spans detected in Expressive Code block')

  const copyButton = codeFrame.locator('button[title="Copy to clipboard"], button[aria-label*="Copy"]').first()
  await copyButton.waitFor({ state: 'visible', timeout: selectorTimeoutMs })

  if (codeFixture.expectedLanguage) {
    const expectedLanguage = codeFixture.expectedLanguage.toLowerCase()
    const languageAttributeCount = await codeFrame.locator(`pre[data-language="${expectedLanguage}"]`).count()
    if (languageAttributeCount === 0)
      throw new Error(`Expected language metadata pre[data-language="${expectedLanguage}"] not found`)
  }

  return {
    status: 'passed',
    details: {
      url,
      expectedLanguage: codeFixture.expectedLanguage ?? null,
      highlightedTokens: highlightedTokenCount,
    },
  }
}

function pushCheck(report, check) {
  report.checks.push(check)

  const statusText = check.status === 'passed' ? 'PASS' : 'FAIL'
  const requirementText = check.requirementIds.join(', ')
  console.log(`[${statusText}] ${check.category}:${check.id} (${requirementText}) @ ${check.target}`)

  if (check.status === 'failed')
    console.error(`  -> ${check.error}`)
}

async function run() {
  const startedAt = new Date().toISOString()
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printUsage()
    return
  }

  const canonicalUrl = await resolveCanonicalUrl(args.canonicalUrl)
  const targets = resolveTargets(args, canonicalUrl)
  const fixtures = loadFixtures(args.fixturePath)

  const report = {
    startedAt,
    finishedAt: null,
    fixturePath: args.fixturePath,
    targets,
    requirementGroupMap: fixtures.metadata.requirementGroupMap,
    retryPolicy: {
      routeRetryDelaysMs,
      routeTimeoutMs,
    },
    checks: [],
    summary: null,
  }

  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch({ headless: true })

  try {
    for (const target of targets) {
      const page = await browser.newPage()

      for (const routeFixture of fixtures.requiredRoutes) {
        const result = await assertRouteAvailability({ page, target, routeFixture })
        const check = {
          category: 'route-availability',
          id: routeFixture.id,
          target,
          requirementIds: routeFixture.requirementIds,
          status: result.status,
          details: result.details,
          screenshot: null,
          error: null,
        }

        if (result.status === 'failed') {
          check.error = result.details.error
          check.screenshot = await captureScreenshot(page, args.screenshotDir, [target, 'route', routeFixture.id])
        }

        pushCheck(report, check)
      }

      for (const queryFixture of fixtures.searchQueries) {
        const check = {
          category: 'search-query',
          id: queryFixture.id,
          target,
          requirementIds: queryFixture.requirementIds,
          status: 'passed',
          details: null,
          screenshot: null,
          error: null,
        }

        try {
          const result = await assertSearchQuery({ page, target, queryFixture })
          check.details = result.details
        }
        catch (error) {
          check.status = 'failed'
          check.error = error.message
          check.details = {
            query: queryFixture.query,
            hrefContains: queryFixture.expected.hrefContains,
          }
          check.screenshot = await captureScreenshot(page, args.screenshotDir, [target, 'search', queryFixture.id])
        }

        pushCheck(report, check)
      }

      for (const codeFixture of fixtures.codeRoutes) {
        const check = {
          category: 'code-rendering',
          id: codeFixture.id,
          target,
          requirementIds: codeFixture.requirementIds,
          status: 'passed',
          details: null,
          screenshot: null,
          error: null,
        }

        try {
          const result = await assertCodeRendering({ page, target, codeFixture })
          check.details = result.details
        }
        catch (error) {
          check.status = 'failed'
          check.error = error.message
          check.details = {
            path: codeFixture.path,
            expectedLanguage: codeFixture.expectedLanguage,
          }
          check.screenshot = await captureScreenshot(page, args.screenshotDir, [target, 'code', codeFixture.id])
        }

        pushCheck(report, check)
      }

      await page.close()
    }

    if (args.injectRequiredFailure) {
      pushCheck(report, {
        category: 'search-query',
        id: 'injected-required-failure',
        target: targets[0],
        requirementIds: ['DOCS-08'],
        status: 'failed',
        details: {
          reason: 'Injected deterministic required failure',
        },
        screenshot: null,
        error: 'Injected required failure via --inject-required-failure',
      })
    }
  }
  finally {
    await browser.close()
  }

  report.finishedAt = new Date().toISOString()
  report.summary = summarizeChecks(report.checks)

  mkdirSync(dirname(args.reportPath), { recursive: true })
  writeFileSync(args.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  console.log(`Smoke report written: ${args.reportPath}`)
  console.log(`Checks: ${report.summary.passed}/${report.summary.total} passed`)

  if (report.summary.failed > 0)
    process.exit(1)
}

run().catch((error) => {
  console.error(`Smoke runner error: ${error.message}`)
  process.exit(1)
})
