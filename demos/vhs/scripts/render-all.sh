#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH='' cd -- "$SCRIPT_DIR/../../.." && pwd)
TAPES_DIR="$ROOT_DIR/demos/vhs/tapes"

DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
elif [[ $# -gt 0 ]]; then
  printf 'Unknown argument: %s\n' "$1" >&2
  printf 'Usage: %s [--dry-run]\n' "$(basename "$0")" >&2
  exit 1
fi

MISSING=()

for tool in vhs ffmpeg ttyd; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    MISSING+=("$tool")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  printf 'Missing required tools: %s\n' "${MISSING[*]}" >&2
  printf 'Install with: brew install vhs ffmpeg ttyd\n' >&2
  exit 1
fi

CANONICAL_TAPES=(
  "$TAPES_DIR/scaffold-next-golden-path.tape"
  "$TAPES_DIR/add-quality-tooling.tape"
  "$TAPES_DIR/list-web-catalog.tape"
  "$TAPES_DIR/doctor-recovery-check.tape"
)

printf 'VHS render pipeline (%s)\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

for tape in "${CANONICAL_TAPES[@]}"; do
  if [[ "$DRY_RUN" == true ]]; then
    if [[ ! -f "$tape" ]]; then
      printf '[dry-run] missing tape (planned): %s\n' "${tape#$ROOT_DIR/}"
      continue
    fi
    printf '[dry-run] vhs %s\n' "${tape#$ROOT_DIR/}"
  else
    if [[ ! -f "$tape" ]]; then
      printf 'Missing tape: %s\n' "$tape" >&2
      exit 1
    fi
    printf 'Rendering %s\n' "${tape#$ROOT_DIR/}"
    vhs "$tape"
  fi
done

printf 'Done: %s (%s mode)\n' "${#CANONICAL_TAPES[@]} tape(s)" "$([[ "$DRY_RUN" == true ]] && printf 'dry-run' || printf 'render')"
