#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/codebase_checks"
TIMESTAMP="$(date +%Y%m%dT%H%M%S)"
REPORT_FILE="$REPORT_DIR/${TIMESTAMP}_codebase_check.log"

mkdir -p "$REPORT_DIR"
: > "$REPORT_FILE"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to run repository checks." | tee -a "$REPORT_FILE"
  exit 1
fi

log_section() {
  local section="$1"
  printf '\n===== %s =====\n' "$section" | tee -a "$REPORT_FILE"
}

has_npm_script() {
  local workdir="$1"
  local script_name="$2"
  local package_json="$workdir/package.json"
  if [[ ! -f "$package_json" ]]; then
    return 1
  fi

  node -e "const pkg=require(process.argv[1]); process.exit(pkg.scripts && Object.hasOwn(pkg.scripts, process.argv[2]) ? 0 : 1);" \
    "$package_json" "$script_name" >/dev/null 2>&1
}

has_eslint() {
  local workdir="$1"
  local package_json="$workdir/package.json"
  if [[ ! -f "$package_json" ]]; then
    return 1
  fi

  node -e "const pkg=require(process.argv[1]); const has = (deps) => deps && (deps.eslint || deps['@eslint/js']); process.exit(has(pkg.devDependencies) || has(pkg.dependencies) ? 0 : 1);" \
    "$package_json" >/dev/null 2>&1
}

run_logged_command() {
  local label="$1"
  local workdir="$2"
  shift 2
  local cmd=("$@")

  log_section "$label"
  printf 'Directory: %s\n' "$workdir" >> "$REPORT_FILE"
  printf 'Command: %s\n' "${cmd[*]}" >> "$REPORT_FILE"

  if [[ ! -d "$workdir" ]]; then
    echo "Skipping missing directory" | tee -a "$REPORT_FILE"
    return
  fi

  (
    cd "$workdir"
    set +e
    "${cmd[@]}" >> "$REPORT_FILE" 2>&1
    local status=$?
    set -e
    printf 'Exit code: %s\n' "$status" >> "$REPORT_FILE"
  )
}

run_npm_script_if_present() {
  local label="$1"
  local workdir="$2"
  local script_name="$3"

  if has_npm_script "$workdir" "$script_name"; then
    run_logged_command "$label" "$workdir" npm run "$script_name"
  else
    log_section "$label"
    printf 'Directory: %s\nCommand: npm run %s\n' "$workdir" "$script_name" >> "$REPORT_FILE"
    echo "Skipping — npm script not defined" | tee -a "$REPORT_FILE"
  fi
}

run_function_audit() {
  local label="$1"
  local workdir="$2"

  if ! has_eslint "$workdir"; then
    log_section "$label"
    printf 'Directory: %s\nCommand: npm exec eslint\n' "$workdir" >> "$REPORT_FILE"
    echo "Skipping — eslint not available" | tee -a "$REPORT_FILE"
    return
  fi

  run_logged_command "$label" "$workdir" npm exec eslint -- \
    --ext .js,.jsx,.ts,.tsx \
    --max-warnings=0 \
    --rule 'no-undef: error' \
    --rule 'no-empty-function: ["error", {"allow": ["arrowFunctions"]}]' \
    .
}

# Backend checks
run_npm_script_if_present "Backend lint" "$ROOT_DIR/gigvora-backend-nodejs" lint
run_npm_script_if_present "Backend unit tests" "$ROOT_DIR/gigvora-backend-nodejs" test
run_function_audit "Backend function audit" "$ROOT_DIR/gigvora-backend-nodejs"

# Frontend checks
run_npm_script_if_present "Frontend lint" "$ROOT_DIR/gigvora-frontend-reactjs" lint
run_npm_script_if_present "Frontend unit tests" "$ROOT_DIR/gigvora-frontend-reactjs" test
run_function_audit "Frontend function audit" "$ROOT_DIR/gigvora-frontend-reactjs"

# Shared contracts
run_npm_script_if_present "Shared contracts tests" "$ROOT_DIR/shared-contracts" test
run_function_audit "Shared contracts function audit" "$ROOT_DIR/shared-contracts"

# Calendar stub
run_npm_script_if_present "Calendar stub tests" "$ROOT_DIR/calendar_stub" test
run_function_audit "Calendar stub function audit" "$ROOT_DIR/calendar_stub"

# Flutter workspace
if command -v flutter >/dev/null 2>&1; then
  run_logged_command "Flutter analyze" "$ROOT_DIR/gigvora-flutter-phoneapp" flutter analyze
  run_logged_command "Flutter melos verify" "$ROOT_DIR/gigvora-flutter-phoneapp" melos run ci:verify
else
  log_section "Flutter toolchain unavailable"
  echo "Skipping Flutter checks — flutter command not installed" | tee -a "$REPORT_FILE"
fi

log_section "Full codebase check complete. Report saved to $REPORT_FILE"
