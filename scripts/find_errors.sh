#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/error_reports"
TIMESTAMP="$(date +%Y%m%dT%H%M%S)"
REPORT_FILE="$REPORT_DIR/${TIMESTAMP}_errors.log"

mkdir -p "$REPORT_DIR"
: > "$REPORT_FILE"

log_section() {
  local section="$1"
  echo "===== ${section} =====" | tee -a "$REPORT_FILE"
}

run_command() {
  local label="$1"
  local workdir="$2"
  shift 2
  local cmd=("$@")

  log_section "$label"
  echo "Directory: $workdir" >> "$REPORT_FILE"
  echo "Command: ${cmd[*]}" >> "$REPORT_FILE"

  if [ ! -d "$workdir" ]; then
    echo "Skipping missing directory" | tee -a "$REPORT_FILE"
    return
  fi

  (
    cd "$workdir"
    # Ensure dependencies are installed once per workspace if needed.
    if [ -f package.json ] && [ ! -d node_modules ]; then
      echo "Installing dependencies" | tee -a "$REPORT_FILE"
      npm install >> "$REPORT_FILE" 2>&1 || true
    fi
    if [ -f pubspec.yaml ] && [ ! -d .dart_tool ]; then
      echo "Fetching Flutter packages" | tee -a "$REPORT_FILE"
      flutter pub get >> "$REPORT_FILE" 2>&1 || true
    fi

    set +e
    "${cmd[@]}" >> "$REPORT_FILE" 2>&1
    local status=$?
    set -e

    echo "Exit code: $status" >> "$REPORT_FILE"
  )
}

# Backend suites
run_command "Backend Jest tests" "$ROOT_DIR/gigvora-backend-nodejs" npm test -- --runInBand
run_command "Backend lint" "$ROOT_DIR/gigvora-backend-nodejs" npm run lint

# Frontend suites
run_command "Frontend Vitest" "$ROOT_DIR/gigvora-frontend-reactjs" env CI=1 npm test -- --watch=false
run_command "Frontend lint" "$ROOT_DIR/gigvora-frontend-reactjs" npm run lint

# Shared contracts (if applicable)
run_command "Shared contracts tests" "$ROOT_DIR/shared-contracts" npm test

# Calendar stub integration
run_command "Calendar stub tests" "$ROOT_DIR/calendar_stub" npm test

# Flutter workspace verification via melos
run_command "Flutter melos verify" "$ROOT_DIR/gigvora-flutter-phoneapp" melos run ci:verify

# Backend database checks if scripts exist
run_command "Backend migration tests" "$ROOT_DIR/gigvora-backend-nodejs" npm run test:migrations
run_command "Backend seed tests" "$ROOT_DIR/gigvora-backend-nodejs" npm run test:seeders

# Bootstrap/environment validation if script exists
run_command "Runtime bootstrap check" "$ROOT_DIR/gigvora-backend-nodejs" npm run verify:bootstrap
run_command "Environment schema check" "$ROOT_DIR/gigvora-backend-nodejs" npm run verify:env

log_section "Error sweep complete. Consolidated report saved to $REPORT_FILE"
