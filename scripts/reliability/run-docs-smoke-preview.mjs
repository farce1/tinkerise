#!/usr/bin/env node

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')

const targetUrl = process.env.DOCS_SMOKE_TARGET_URL ?? 'http://127.0.0.1:4321/tinkerise'
const previewReadyTimeoutMs = 120000
const previewPollIntervalMs = 1000

const target = new URL(targetUrl)
const previewHost = target.hostname
const previewPort = target.port || '4321'
const previewOrigin = `${target.protocol}//${previewHost}:${previewPort}`
const smokeTarget = `${previewOrigin}${target.pathname}`.replace(/\/$/, '')

let previewProcess = null
let previewStartupError = null

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      ...options,
    })

    child.on('error', reject)

    child.on('exit', (code, signal) => {
      if (code === 0)
        resolve()
      else
        reject(new Error(`${command} ${args.join(' ')} failed with code ${code ?? 'null'} signal ${signal ?? 'none'}`))
    })
  })
}

async function waitForPreview(url, timeoutMs) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (previewStartupError)
      throw previewStartupError

    try {
      const response = await fetch(url, { redirect: 'manual' })
      if (response.status >= 200 && response.status < 500)
        return
    }
    catch {
      // Preview is still starting.
    }

    await new Promise(resolve => setTimeout(resolve, previewPollIntervalMs))
  }

  throw new Error(`Preview did not become ready within ${Math.round(timeoutMs / 1000)}s: ${url}`)
}

async function assertTargetIsFree(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' })
    throw new Error(`Expected preview target to be free, but ${url} responded with HTTP ${response.status}`)
  }
  catch (error) {
    if (error instanceof TypeError)
      return
    throw error
  }
}

async function stopPreview() {
  if (!previewProcess || previewProcess.killed)
    return

  const child = previewProcess

  await new Promise((resolve) => {
    const forceKillTimer = setTimeout(() => {
      if (!child.killed)
        child.kill('SIGKILL')
    }, 10000)

    child.once('exit', () => {
      clearTimeout(forceKillTimer)
      resolve()
    })

    child.kill('SIGTERM')
  })
}

async function main() {
  try {
    await assertTargetIsFree(smokeTarget)

    await runCommand('bun', ['run', '--filter', '@tinkerise/docs', 'build'])

    previewProcess = spawn('bun', [
      'run',
      '--filter',
      '@tinkerise/docs',
      'preview',
      '--',
      '--host',
      previewHost,
      '--port',
      previewPort,
      '--strictPort',
    ], {
      cwd: repoRoot,
      stdio: 'inherit',
    })

    previewProcess.on('error', (error) => {
      previewStartupError = error
    })

    previewProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        previewStartupError = new Error(
          `docs preview exited before smoke checks (code ${code ?? 'null'}, signal ${signal ?? 'none'})`,
        )
      }
    })

    await waitForPreview(smokeTarget, previewReadyTimeoutMs)

    await runCommand('bun', [
      'run',
      '--filter',
      '@tinkerise/docs',
      'docs:smoke',
      '--',
      '--target',
      smokeTarget,
    ])
  }
  finally {
    await stopPreview()
  }
}

main().catch((error) => {
  console.error(`reliability docs preview smoke failed: ${error.message}`)
  process.exit(1)
})
