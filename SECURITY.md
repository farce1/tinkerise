# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | Yes       |
| < 0.2   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in tinkerise, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@tinkerise.dev** or use [GitHub's private vulnerability reporting](https://github.com/farce1/tinkerise/security/advisories/new).

You should receive a response within 72 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Security Model

### Trust Boundaries

tinkerise is a **local CLI scaffolding tool**. It wraps official framework scaffolders (create-next-app, create-vite, etc.) and executes them as child processes on the user's machine.

- **No remote code execution.** tinkerise never downloads or evaluates remote scripts at runtime.
- **No install scripts.** Published packages contain no `preinstall`, `install`, or `postinstall` lifecycle scripts.
- **No telemetry or data collection.** tinkerise does not phone home, collect usage data, or transmit any information to external servers.
- **No eval or dynamic code generation.** The codebase never uses `eval()`, `new Function()`, or any form of dynamic code evaluation.
- **No native/binary dependencies.** All dependencies are pure JavaScript/TypeScript.
- **No obfuscated code.** All published source is readable and auditable.

### Input Validation

All user-provided identifiers (project names, preset names) are validated against a strict allowlist pattern before use:

```
^[a-z0-9][a-z0-9._-]{0,63}$
```

### Command Execution Safety

- Child processes are spawned using **argument arrays** (via `execa`), never shell string interpolation.
- User input is never interpolated into shell command strings.
- All external tool invocations require explicit user approval.

### Network Access

The only network call in the entire codebase is an **optional** npm registry version check (`GET https://registry.npmjs.org/@tinkerise/cli/latest`), which:

- Has a 5-second timeout
- Is cached for 24 hours
- Can be disabled with `TINKERISE_NO_UPDATE_CHECK=1`
- Never downloads or executes code from the response

### Dependency Policy

- All dependencies are well-known, widely-used packages (commander, execa, zod, picocolors, etc.)
- License allowlist: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC only
- Automated license auditing via `bun run license-check`
- Dependency updates managed via Renovate with conservative merge policies
