#!/usr/bin/env bash
# Gigvora user mobile app test orchestrator
#
# This script centralises environment validation, dependency bootstrapping,
# and execution of the Flutter/Melos test suites that protect the Gigvora
# user mobile application. It is intended to be safe for both CI usage and
# local developer workflows.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
WORKSPACE_DIR="${REPO_ROOT}/gigvora-flutter-phoneapp"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
RUN_IDENTIFIER="gigvora-user-app-tests-${TIMESTAMP}"
DEFAULT_REPORT_DIR="${REPO_ROOT}/.gigvora/test-reports/user-app"

# shellcheck disable=SC2034 # referenced via associative arrays
declare -A SUITE_LABELS=(
  [analyze]="Static analysis"
  [unit]="Unit tests"
  [golden]="Golden snapshot tests"
  [integration]="Integration tests"
)

# shellcheck disable=SC2034 # referenced via associative arrays
declare -A SUITE_COMMANDS

print_heading() {
  local message="$1"
  printf '\n\033[1;36m==> %s\033[0m\n' "${message}"
}

log_info() {
  printf '\033[0;32m[INFO]\033[0m %s\n' "$1"
}

log_warn() {
  printf '\033[0;33m[WARN]\033[0m %s\n' "$1"
}

log_error() {
  printf '\033[0;31m[ERROR]\033[0m %s\n' "$1" >&2
}

usage() {
  cat <<'USAGE'
Gigvora User App Test Runner

Usage:
  user_app_test_script.sh [options]

Options:
  -s, --suite <name>        Suite to run (analyze | unit | golden | integration).
                            Provide multiple times to run a subset. Defaults to all.
  -r, --report-dir <path>   Directory for suite logs. Defaults to .gigvora/test-reports/user-app.
      --skip-bootstrap      Skip "melos bootstrap" (assumes dependencies are installed).
      --ci                  Optimise output for CI environments and avoid interactive prompts.
      --env-file <path>     Source environment variables before running suites.
      --fail-fast           Stop at the first failing suite.
  -h, --help                Show this message and exit.

Examples:
  ./user_app_test_script.sh
  ./user_app_test_script.sh --suite unit --suite integration --report-dir ./reports
  CI=true ./user_app_test_script.sh --ci --fail-fast
USAGE
}

FAIL_FAST=false
CI_MODE=false
SKIP_BOOTSTRAP=false
CUSTOM_REPORT_DIR=""
ENV_FILE=""
# shellcheck disable=SC2128 # script must handle empty positional parameters
SUITES=()

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -s|--suite)
        [[ $# -lt 2 ]] && { log_error "Missing value for $1"; exit 1; }
        SUITES+=("$2")
        shift 2
        ;;
      -r|--report-dir)
        [[ $# -lt 2 ]] && { log_error "Missing value for $1"; exit 1; }
        CUSTOM_REPORT_DIR="$2"
        shift 2
        ;;
      --skip-bootstrap)
        SKIP_BOOTSTRAP=true
        shift
        ;;
      --ci)
        CI_MODE=true
        shift
        ;;
      --env-file)
        [[ $# -lt 2 ]] && { log_error "Missing value for $1"; exit 1; }
        ENV_FILE="$2"
        shift 2
        ;;
      --fail-fast)
        FAIL_FAST=true
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      --)
        shift
        break
        ;;
      *)
        log_error "Unknown option: $1"
        usage
        exit 1
        ;;
    esac
  done
}

require_command() {
  local command_name="$1"
  local install_help="$2"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    log_error "${command_name} is required but was not found in PATH."
    [[ -n "${install_help}" ]] && log_info "${install_help}"
    exit 1
  fi
}

initialise_environment() {
  export PATH="${HOME}/.pub-cache/bin:${PATH}"
  if [[ -n "${ENV_FILE}" ]]; then
    if [[ ! -f "${ENV_FILE}" ]]; then
      log_error "Environment file not found: ${ENV_FILE}"
      exit 1
    fi
    log_info "Loading environment variables from ${ENV_FILE}"
    set -a
    # shellcheck disable=SC1090
    source "${ENV_FILE}"
    set +a
  fi
  [[ -f "${REPO_ROOT}/melos.yaml" ]] || {
    log_error "melos.yaml not found. Please run the script from the repository root."
    exit 1
  }
  [[ -d "${WORKSPACE_DIR}" ]] || {
    log_error "Flutter workspace missing at ${WORKSPACE_DIR}"
    exit 1
  }
  require_command "flutter" "Install Flutter and ensure the 'flutter' binary is accessible."
  if command -v melos >/dev/null 2>&1; then
    MELOS_CMD=(melos)
  elif command -v dart >/dev/null 2>&1; then
    log_warn "Melos binary not found. Using 'dart pub global run melos'."
    MELOS_CMD=(dart pub global run melos)
  else
    log_error "Neither 'melos' nor 'dart' is available in PATH."
    exit 1
  fi
}

run_melos() {
  (cd "${REPO_ROOT}" && "${MELOS_CMD[@]}" "$@")
}

bootstrap_workspace_if_needed() {
  if [[ "${SKIP_BOOTSTRAP}" == true ]]; then
    log_info "Skipping melos bootstrap as requested."
    return
  fi
  print_heading "Bootstrapping Flutter workspace"
  if ! run_melos bootstrap; then
    log_error "Melos bootstrap failed."
    exit 1
  fi
}

prepare_suites() {
  if [[ ${#SUITES[@]} -eq 0 ]]; then
    SUITES=(analyze unit golden integration)
  fi
  local validated_suites=()
  for suite in "${SUITES[@]}"; do
    if [[ -z "${SUITE_LABELS[${suite}]:-}" ]]; then
      log_error "Unknown suite '${suite}'. Valid options: ${!SUITE_LABELS[*]}"
      exit 1
    fi
    validated_suites+=("${suite}")
  done
  SUITES=($(printf '%s\n' "${validated_suites[@]}" | awk '!seen[$0]++'))
  SUITE_COMMANDS[analyze]="run analyze"
  SUITE_COMMANDS[unit]="run test:unit"
  SUITE_COMMANDS[golden]="run test:golden"
  SUITE_COMMANDS[integration]="run test:integration"
}

create_report_dir() {
  REPORT_DIR="${CUSTOM_REPORT_DIR:-${DEFAULT_REPORT_DIR}}/${RUN_IDENTIFIER}"
  mkdir -p "${REPORT_DIR}"
  log_info "Reports will be stored in ${REPORT_DIR}"
}

run_suite() {
  local suite="$1"
  local melos_subcommand="${SUITE_COMMANDS[${suite}]}"
  local log_file="${REPORT_DIR}/${suite}.log"
  local status=0

  print_heading "Running ${SUITE_LABELS[${suite}]}"

  if [[ -n "${melos_subcommand}" ]]; then
    local command=("${MELOS_CMD[@]}" ${melos_subcommand})
    if [[ "${suite}" == "unit" && "${CI_MODE}" == true ]]; then
      command+=(--coverage)
    fi
    if [[ "${suite}" == "integration" && "${CI_MODE}" == true ]]; then
      command+=(--machine)
    fi
    if [[ "${CI_MODE}" == true ]]; then
      export CI=true
    fi
    if [[ -n "${REPORT_DIR}" ]]; then
      if (cd "${REPO_ROOT}" && "${command[@]}" 2>&1 | tee "${log_file}"); then
        status=0
      else
        status=$?
      fi
    else
      if (cd "${REPO_ROOT}" && "${command[@]}"); then
        status=0
      else
        status=$?
      fi
    fi
  else
    log_error "No command configured for suite ${suite}"
    return 1
  fi

  if [[ ${status} -eq 0 ]]; then
    log_info "${SUITE_LABELS[${suite}]} succeeded"
  else
    log_error "${SUITE_LABELS[${suite}]} failed with exit code ${status}"
  fi

  return ${status}
}

summarise_results() {
  local -n suite_statuses_ref=$1
  local -n log_files_ref=$2
  local summary_file="${REPORT_DIR}/summary.md"

  {
    printf '# Gigvora User App Test Summary\n\n'
    printf '* Run identifier: %s\n' "${RUN_IDENTIFIER}"
    printf '* Timestamp: %s\n\n' "${TIMESTAMP}"
    printf '## Suite Results\n\n'
    printf '| Suite | Status | Log |\n'
    printf '|-------|--------|-----|\n'
    for suite in "${SUITES[@]}"; do
      local status_label='Pass'
      [[ ${suite_statuses_ref[${suite}]} -ne 0 ]] && status_label='Fail'
      local log_path="${log_files_ref[${suite}]}"
      if [[ -n "${log_path}" ]]; then
        printf '| %s | %s | %s |\n' "${SUITE_LABELS[${suite}]}" "${status_label}" "${log_path#${REPO_ROOT}/}"
      else
        printf '| %s | %s | n/a |\n' "${SUITE_LABELS[${suite}]}" "${status_label}"
      fi
    done
  } > "${summary_file}"

  log_info "Summary written to ${summary_file}"
}

main() {
  parse_args "$@"
  initialise_environment
  prepare_suites
  create_report_dir
  bootstrap_workspace_if_needed

  declare -A SUITE_STATUSES
  declare -A SUITE_LOG_FILES
  local overall_status=0

  for suite in "${SUITES[@]}"; do
    local log_file="${REPORT_DIR}/${suite}.log"
    if run_suite "${suite}"; then
      SUITE_STATUSES["${suite}"]=0
    else
      SUITE_STATUSES["${suite}"]=$?
      overall_status=1
      if [[ "${FAIL_FAST}" == true ]]; then
        log_warn "Fail-fast enabled; aborting remaining suites."
        break
      fi
    fi
    [[ -f "${log_file}" ]] && SUITE_LOG_FILES["${suite}"]="${log_file}"
  done

  summarise_results SUITE_STATUSES SUITE_LOG_FILES

  if [[ ${overall_status} -ne 0 ]]; then
    log_error "One or more test suites failed."
    exit 1
  fi

  log_info "All requested suites completed successfully."
}

main "$@"
