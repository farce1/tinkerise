#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const REQUIRED_CATEGORIES = ['Features', 'Fixes', 'Docs', 'Maintenance']
const API_VERSION = '2022-11-28'

function parseArgs(argv) {
  const args = {
    dryRun: false,
    input: null,
    output: null,
    repo: process.env.GITHUB_REPOSITORY ?? null,
    releaseId: process.env.RELEASE_ID ?? null,
    token: process.env.GH_PAT ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (arg === '--input') {
      args.input = argv[i + 1] ?? null
      i += 1
      continue
    }
    if (arg === '--output') {
      args.output = argv[i + 1] ?? null
      i += 1
      continue
    }
    if (arg === '--repo') {
      args.repo = argv[i + 1] ?? null
      i += 1
      continue
    }
    if (arg === '--release-id') {
      args.releaseId = argv[i + 1] ?? null
      i += 1
      continue
    }
    if (arg === '--token') {
      args.token = argv[i + 1] ?? null
      i += 1
      continue
    }
    if (arg === '--help') {
      printHelp()
      process.exit(0)
    }
  }

  return args
}

function printHelp() {
  console.log(`normalize-release-notes

Usage:
  node scripts/release/normalize-release-notes.mjs [--dry-run] [--input file] [--output file]

Options:
  --dry-run            Print normalized body without API update
  --input <file>       Use local release JSON fixture instead of GitHub API
  --output <file>      Write normalized body to a file
  --repo <owner/name>  Override repository (default: GITHUB_REPOSITORY)
  --release-id <id>    Normalize a specific release id
  --token <token>      Override GitHub token (default: GH_PAT/GITHUB_TOKEN/GH_TOKEN)
`)
}

async function fetchJson(url, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
  }

  if (token)
    headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}): ${url}`)
  }
  return response.json()
}

async function loadRelease(args) {
  if (args.input) {
    const raw = await readFile(args.input, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      id: parsed.id,
      tag_name: parsed.tag_name ?? 'fixture',
      html_url: parsed.html_url ?? '',
      body: parsed.body ?? '',
      source: 'fixture',
    }
  }

  if (!args.repo)
    throw new Error('Missing repository. Set GITHUB_REPOSITORY or pass --repo.')

  const baseUrl = `https://api.github.com/repos/${args.repo}/releases`
  if (args.releaseId) {
    const release = await fetchJson(`${baseUrl}/${args.releaseId}`, args.token)
    return { ...release, source: 'api' }
  }

  const releases = await fetchJson(`${baseUrl}?per_page=20`, args.token)
  const latestPublished = releases.find(release => !release.draft)
  if (!latestPublished)
    throw new Error('No published releases found to normalize.')

  return { ...latestPublished, source: 'api' }
}

function classifyBucket(sourceHeading, bullet) {
  const signal = `${sourceHeading} ${bullet}`.toLowerCase()

  if (/\b(feat|feature|enhancement|add|added|new)\b/.test(signal))
    return 'Features'
  if (/\b(fix|fixed|bug|bugfix|patch|regression|hotfix)\b/.test(signal))
    return 'Fixes'
  if (/\b(doc|docs|documentation|readme)\b/.test(signal))
    return 'Docs'
  return 'Maintenance'
}

function extractBullets(body) {
  const lines = body.split(/\r?\n/)
  const buckets = Object.fromEntries(REQUIRED_CATEGORIES.map(category => [category, []]))
  const seen = new Set()
  let currentHeading = ''

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line)
      continue

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/)
    if (headingMatch) {
      currentHeading = headingMatch[1].trim()
      continue
    }

    const bulletMatch = line.match(/^([-*]|\d+\.)\s+(.+)$/)
    if (!bulletMatch)
      continue

    const bullet = `- ${bulletMatch[2].trim()}`
    const signature = `${currentHeading}::${bullet}`
    if (seen.has(signature))
      continue

    seen.add(signature)
    const bucket = classifyBucket(currentHeading, bullet)
    buckets[bucket].push(bullet)
  }

  const hasAnyBullets = REQUIRED_CATEGORIES.some(category => buckets[category].length > 0)
  if (hasAnyBullets)
    return buckets

  const fallbackLine = lines.map(line => line.trim()).find(line => line.length > 0)
  if (fallbackLine)
    buckets.Maintenance.push(`- ${fallbackLine.replace(/^[-*]\s+/, '')}`)

  return buckets
}

function renderNormalizedBody(buckets) {
  const sections = REQUIRED_CATEGORIES.map((category) => {
    const bullets = buckets[category]
    const bulletBlock = bullets.length > 0 ? bullets.join('\n') : '- None'
    return `## ${category}\n\n${bulletBlock}`
  })

  return sections.join('\n\n').trim()
}

async function updateReleaseBody(args, releaseId, body) {
  const url = `https://api.github.com/repos/${args.repo}/releases/${releaseId}`
  const headers = {
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': API_VERSION,
  }

  if (args.token)
    headers.Authorization = `Bearer ${args.token}`

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ body }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update release body (${response.status})`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const release = await loadRelease(args)

  const originalBody = (release.body ?? '').trim()
  const normalizedBody = renderNormalizedBody(extractBullets(originalBody))
  const changed = normalizedBody !== originalBody

  if (args.output)
    await writeFile(args.output, `${normalizedBody}\n`, 'utf8')

  if (args.dryRun || release.source === 'fixture') {
    console.log(normalizedBody)
    console.log(`\nNormalized release: ${release.tag_name} (${changed ? 'changed' : 'unchanged'})`)
    return
  }

  if (!changed) {
    console.log(`Release ${release.tag_name} already normalized.`)
    return
  }

  if (!release.id)
    throw new Error('Release id is required for API updates.')

  await updateReleaseBody(args, release.id, normalizedBody)
  console.log(`Normalized release notes for ${release.tag_name}.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
