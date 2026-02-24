#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')

const paths = {
  fixture: path.join(repoRoot, 'scripts/reliability/fixtures/v31-requirements.json'),
  docsReport: path.join(repoRoot, 'apps/docs/scripts/artifacts/docs-smoke-report.json'),
  cliReport: path.join(repoRoot, 'packages/cli/tests/conformance/artifacts/runtime-error-report.json'),
  outputDir: path.join(repoRoot, '.artifacts/reliability/v3.1'),
}

const outputPaths = {
  index: path.join(paths.outputDir, 'closure-index.json'),
  checklist: path.join(paths.outputDir, 'closure-checklist.md'),
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/')
}

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

function buildEvidenceMaps(docsReport, cliReport) {
  const docsByRequirement = new Map()
  for (const check of docsReport.checks ?? []) {
    const requirementIds = check.requirementIds ?? []
    for (const requirementId of requirementIds) {
      const entry = docsByRequirement.get(requirementId) ?? []
      entry.push({
        id: check.id,
        category: check.category,
        status: check.status,
      })
      docsByRequirement.set(requirementId, entry)
    }
  }

  const cliByRequirement = new Map()
  for (const scenario of cliReport.scenarios ?? []) {
    const requirementIds = scenario.requirements ?? []
    for (const requirementId of requirementIds) {
      const entry = cliByRequirement.get(requirementId) ?? []
      entry.push({
        id: scenario.id,
        status: scenario.status,
      })
      cliByRequirement.set(requirementId, entry)
    }
  }

  return { docsByRequirement, cliByRequirement }
}

function ensureMappedCoverage(requirements, evidenceMaps) {
  const unmapped = []

  for (const requirement of requirements) {
    if (requirement.sourceType === 'docs-smoke-report') {
      const mapped = evidenceMaps.docsByRequirement.get(requirement.id) ?? []
      if (mapped.length === 0)
        unmapped.push(`${requirement.id} (docs-smoke-report)`)
    }

    if (requirement.sourceType === 'cli-conformance-report') {
      const mapped = evidenceMaps.cliByRequirement.get(requirement.id) ?? []
      if (mapped.length === 0)
        unmapped.push(`${requirement.id} (cli-conformance-report)`)
    }
  }

  if (unmapped.length > 0) {
    throw new Error(`Missing mapped evidence: ${unmapped.join(', ')}`)
  }
}

function evaluateRequirement(requirement, context) {
  const docsReportPath = toRepoRelative(paths.docsReport)
  const cliReportPath = toRepoRelative(paths.cliReport)
  const fixturePath = toRepoRelative(paths.fixture)

  if (requirement.sourceType === 'docs-smoke-report') {
    const checks = context.evidenceMaps.docsByRequirement.get(requirement.id) ?? []
    const failedChecks = checks.filter(check => check.status !== 'passed')
    const status = failedChecks.length === 0 ? 'pass' : 'fail'

    return {
      status,
      evidencePaths: [docsReportPath],
      evidence: checks.map(check => ({
        ref: `docs.checks.${check.id}`,
        status: check.status,
      })),
      notes: status === 'pass'
        ? 'All mapped docs smoke checks passed.'
        : `Failed docs checks: ${failedChecks.map(check => check.id).join(', ')}`,
    }
  }

  if (requirement.sourceType === 'cli-conformance-report') {
    const scenarios = context.evidenceMaps.cliByRequirement.get(requirement.id) ?? []
    const failedScenarios = scenarios.filter(scenario => scenario.status !== 'pass')
    const status = failedScenarios.length === 0 ? 'pass' : 'fail'

    return {
      status,
      evidencePaths: [cliReportPath],
      evidence: scenarios.map(scenario => ({
        ref: `cli.scenarios.${scenario.id}`,
        status: scenario.status,
      })),
      notes: status === 'pass'
        ? 'All mapped CLI conformance scenarios passed.'
        : `Failed CLI scenarios: ${failedScenarios.map(scenario => scenario.id).join(', ')}`,
    }
  }

  if (requirement.id === 'DOCS-13') {
    const failedChecks = Number(context.docsReport.summary?.failed ?? 0)
    const totalChecks = Number(context.docsReport.summary?.total ?? 0)
    const status = totalChecks > 0 && failedChecks === 0 ? 'pass' : 'fail'

    return {
      status,
      evidencePaths: [docsReportPath],
      evidence: [
        {
          ref: 'docs.summary',
          status: `${context.docsReport.summary?.passed ?? 0}/${totalChecks} passed`,
        },
      ],
      notes: status === 'pass'
        ? 'Docs smoke summary confirms automated production verification passed.'
        : 'Docs smoke summary shows failures or missing checks.',
    }
  }

  if (requirement.id === 'REL-02') {
    const docs13 = context.resultsById.get('DOCS-13')
    const cli08 = context.resultsById.get('CLI-08')
    const status = docs13?.status === 'pass' && cli08?.status === 'pass' ? 'pass' : 'fail'

    return {
      status,
      evidencePaths: [docsReportPath, cliReportPath],
      evidence: [
        { ref: 'DOCS-13', status: docs13?.status ?? 'fail' },
        { ref: 'CLI-08', status: cli08?.status ?? 'fail' },
      ],
      notes: status === 'pass'
        ? 'Docs and CLI reliability verification evidence are both passing.'
        : 'Required gate prerequisites (DOCS-13 and CLI-08) are not both passing.',
    }
  }

  if (requirement.id === 'REL-01') {
    const nonClosureResults = Array.from(context.resultsById.values())
      .filter(result => !result.requirementId.startsWith('REL-'))
    const failures = nonClosureResults.filter(result => result.status !== 'pass')
    const status = failures.length === 0 && nonClosureResults.length === 10 ? 'pass' : 'fail'

    return {
      status,
      evidencePaths: [fixturePath, docsReportPath, cliReportPath],
      evidence: [
        {
          ref: 'closure.requirements-covered',
          status: `${nonClosureResults.length}/10 mapped non-REL requirements`,
        },
        {
          ref: 'closure.non-rel-failures',
          status: `${failures.length}`,
        },
      ],
      notes: status === 'pass'
        ? 'All non-REL requirements are mapped and passing in closure evidence.'
        : 'Closure evidence has missing or failing non-REL requirements.',
    }
  }

  throw new Error(`Unsupported closure metadata requirement: ${requirement.id}`)
}

function buildChecklist(results, summary) {
  const lines = [
    '# v3.1 Reliability Closure Checklist',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '| Requirement | Source Type | Status | Evidence Paths | Notes |',
    '| --- | --- | --- | --- | --- |',
  ]

  for (const result of results) {
    const status = result.status === 'pass' ? 'PASS' : 'FAIL'
    const evidencePaths = result.evidencePaths.length > 0
      ? result.evidencePaths.join('<br>')
      : 'missing evidence'
    lines.push(`| ${result.requirementId} | ${result.sourceType} | ${status} | ${evidencePaths} | ${result.notes} |`)
  }

  lines.push('')
  lines.push(`Summary: ${summary.passed}/${summary.total} passing, ${summary.failed} failing.`)

  return `${lines.join('\n')}\n`
}

async function main() {
  const [fixture, docsReport, cliReport] = await Promise.all([
    readJson(paths.fixture),
    readJson(paths.docsReport),
    readJson(paths.cliReport),
  ])

  const requirements = fixture.requirements ?? []
  const evidenceMaps = buildEvidenceMaps(docsReport, cliReport)
  ensureMappedCoverage(requirements, evidenceMaps)

  const resultsById = new Map()

  for (const requirement of requirements) {
    const evaluation = evaluateRequirement(requirement, {
      docsReport,
      cliReport,
      evidenceMaps,
      resultsById,
    })

    resultsById.set(requirement.id, {
      requirementId: requirement.id,
      sourceType: requirement.sourceType,
      minimumPassCondition: requirement.minimumPassCondition,
      ...evaluation,
    })
  }

  const results = requirements.map(requirement => resultsById.get(requirement.id))
  const failedRequirements = results.filter(result => result.status !== 'pass')

  const index = {
    version: '3.1',
    generatedAt: new Date().toISOString(),
    fixturePath: toRepoRelative(paths.fixture),
    evidenceSources: {
      docsSmokeReport: toRepoRelative(paths.docsReport),
      cliConformanceReport: toRepoRelative(paths.cliReport),
    },
    summary: {
      total: results.length,
      passed: results.length - failedRequirements.length,
      failed: failedRequirements.length,
    },
    requirements: results,
  }

  await mkdir(paths.outputDir, { recursive: true })
  await writeFile(outputPaths.index, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
  await writeFile(outputPaths.checklist, buildChecklist(results, {
    generatedAt: index.generatedAt,
    total: index.summary.total,
    passed: index.summary.passed,
    failed: index.summary.failed,
  }), 'utf8')

  if (failedRequirements.length > 0) {
    const failedIds = failedRequirements.map(result => result.requirementId).join(', ')
    throw new Error(`Closure requirements failed: ${failedIds}`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
