import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CATEGORIES = ['Features', 'Fixes', 'Docs', 'Maintenance']
const API_VERSION = '2022-11-28'
const REPO = 'farce1/tinkerise'
const PAGE_SIZE = 100

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const outputPath = resolve(repoRoot, 'apps/docs/src/content/docs/reference/changelog-data.json')

function normalizeLineEndings(value) {
  return value.replace(/\r\n/g, '\n')
}

function mapHeadingToCategory(heading) {
  const normalized = heading.trim().toLowerCase()

  if (/\b(feat|feature|features|enhancement|enhancements|added|new)\b/.test(normalized))
    return 'Features'
  if (/\b(fix|fixes|bug|bugs|bugfix|regression|patch|hotfix)\b/.test(normalized))
    return 'Fixes'
  if (/\b(doc|docs|documentation|readme)\b/.test(normalized))
    return 'Docs'
  if (/\b(chore|maintenance|internal|deps|dependency|dependencies|build|ci|refactor)\b/.test(normalized))
    return 'Maintenance'

  return null
}

function classifyBullet(text) {
  const normalized = text.toLowerCase()

  if (/\b(feat|feature|enhancement|added|new)\b/.test(normalized))
    return 'Features'
  if (/\b(fix|bug|regression|patch|hotfix)\b/.test(normalized))
    return 'Fixes'
  if (/\b(doc|docs|documentation|readme)\b/.test(normalized))
    return 'Docs'

  return 'Maintenance'
}

function emptySections() {
  return {
    Features: [],
    Fixes: [],
    Docs: [],
    Maintenance: [],
  }
}

function parseReleaseBody(body) {
  const sections = emptySections()
  const seen = new Set()
  const lines = normalizeLineEndings(body ?? '').split('\n')
  let currentCategory = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line)
      continue

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/)
    if (headingMatch) {
      currentCategory = mapHeadingToCategory(headingMatch[1])
      continue
    }

    const bulletMatch = line.match(/^([-*]|\d+\.)\s+(.+)$/)
    if (!bulletMatch)
      continue

    const text = bulletMatch[2].trim()
    if (!text)
      continue

    const key = text.toLowerCase()
    if (seen.has(key))
      continue

    seen.add(key)
    const category = currentCategory ?? classifyBullet(text)
    sections[category].push(text)
  }

  return sections
}

function toEntry(release) {
  return {
    version: release.tag_name ?? 'unknown',
    publishedAt: release.published_at ?? null,
    url: release.html_url ?? `https://github.com/${REPO}/releases`,
    sections: parseReleaseBody(release.body ?? ''),
  }
}

function sortNewestFirst(releases) {
  return [...releases].sort((a, b) => {
    const left = new Date(a.publishedAt ?? 0).getTime()
    const right = new Date(b.publishedAt ?? 0).getTime()
    return right - left
  })
}

async function fetchReleases(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
    'User-Agent': 'tinkerise-docs-changelog-generator',
  }

  if (token)
    headers.Authorization = `Bearer ${token}`

  const releases = []

  for (let page = 1; ; page += 1) {
    const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=${PAGE_SIZE}&page=${page}`, { headers })
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')

    if (!response.ok) {
      const details = await response.text()
      const error = new Error(`GitHub releases request failed (${response.status}): ${details}`)
      error.code = response.status === 401 || response.status === 403
        ? (token ? 'AUTH_OR_RATE_LIMIT' : 'RATE_LIMIT_NO_TOKEN')
        : 'REQUEST_FAILED'
      throw error
    }

    if (rateLimitRemaining === '0') {
      const error = new Error('GitHub API rate limit exceeded')
      error.code = token ? 'RATE_LIMIT' : 'RATE_LIMIT_NO_TOKEN'
      throw error
    }

    const pageItems = await response.json()
    const published = pageItems.filter(release => !release.draft)
    releases.push(...published)

    if (pageItems.length < PAGE_SIZE)
      break
  }

  return releases
}

function writeOutput(entries) {
  mkdirSync(dirname(outputPath), { recursive: true })
  const json = `${JSON.stringify(entries, null, 2)}\n`
  writeFileSync(outputPath, json, 'utf8')
}

async function main() {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null

  if (!token)
    console.warn('Warning: GITHUB_TOKEN is not set. Proceeding unauthenticated may hit GitHub API rate limits.')

  try {
    const releases = await fetchReleases(token)
    const entries = sortNewestFirst(releases.map(toEntry))
    writeOutput(entries)
    console.log(`Generated ${entries.length} changelog entries at ${outputPath}`)
  }
  catch (error) {
    if (['AUTH_OR_RATE_LIMIT', 'RATE_LIMIT', 'RATE_LIMIT_NO_TOKEN'].includes(error.code)) {
      console.warn(`Warning: ${error.message}. Writing empty changelog data fallback.`)
      writeOutput([])
      return
    }

    throw error
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
