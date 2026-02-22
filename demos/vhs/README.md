# VHS Demo Workspace

This directory is the source-of-truth workspace for terminal demos captured with VHS.

## Conventions

- Deterministic setup first: every tape starts by resetting `/tmp/tinkerise-vhs` in a hidden block.
- Shared visual profile: `Builtin Dark`, `1280x720` (16:9), `Framerate 30`, `CursorBlink false`.
- Pacing guardrails: anchor long-running moments with `Wait+Line`, then add short `Sleep` pauses for readability.
- Single-take narrative: one workflow outcome per tape, no chapter splits.
- Naming policy: use workflow-and-outcome filenames (for example `scaffold-next-golden-path.tape`).

## Directory Layout

- `tapes/` - canonical source `.tape` files for scaffold, add, list, and doctor workflows
- `scripts/render-all.sh` - deterministic batch renderer in stable canonical order

## Prerequisites

Install required tools:

```bash
brew install vhs ffmpeg ttyd
```

## Render Commands

From repository root:

```bash
# Validate dependencies and ordered tape execution without rendering
bun run demos:render -- --dry-run

# Render all canonical demos
bun run demos:render
```

The script always validates `vhs`, `ffmpeg`, and `ttyd` before any render step.
