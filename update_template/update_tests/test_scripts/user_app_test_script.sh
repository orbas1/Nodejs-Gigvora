#!/usr/bin/env bash
# Gigvora User App automated verification pipeline
#
# This script performs the full pre-release test suite for the Flutter mobile
# application. It is designed to run in CI as well as locally for engineers.
# The flow deliberately mirrors the order of the deployment checklist so that
# the build artifacts used for release are guaranteed to match the tested code.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
APP_DIR="${REPO_ROOT}/gigvora-flutter-phoneapp"
COVERAGE_DIR="${APP_DIR}/coverage"

log() {
  local ts
  ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf '[%s] %s\n' "$ts" "$*"
}

warn() {
  log "WARNING: $*"
}

abort() {
  log "ERROR: $*"
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || abort "Required command '$1' is not available on PATH."
}

log "Validating toolchain availability"
require_command flutter

if [ ! -d "$APP_DIR" ]; then
  abort "Unable to locate Flutter app directory at '$APP_DIR'."
fi

log "Switching to Flutter app workspace"
cd "$APP_DIR"

log "Ensuring clean git state"
if ! git diff --quiet; then
  warn "Workspace has uncommitted changes. Tests will continue but results may not reflect mainline code."
fi

log "Fetching Dart and Flutter dependencies"
flutter pub get

log "Verifying formatting (flutter format in check mode)"
format_targets=(lib test integration_test)
for target in "${format_targets[@]}"; do
  if [ -d "$target" ]; then
    flutter format "$target" --set-exit-if-changed
  fi
done

log "Running static analysis (flutter analyze)"
flutter analyze --no-preamble

log "Running unit and widget tests with coverage"
rm -rf "$COVERAGE_DIR"
flutter test --coverage

if [ -d "integration_test" ] && [ -n "$(find integration_test -name '*_test.dart' -print -quit)" ]; then
  log "Executing integration tests"
  flutter test integration_test
else
  warn "Skipping integration tests: no integration_test suite detected"
fi

if [ -f "analysis_options.yaml" ] && grep -q "dart_code_metrics" analysis_options.yaml; then
  if flutter pub deps --json | grep -q '"package":"dart_code_metrics"'; then
    log "Running additional static metrics (dart_code_metrics)"
    flutter pub run dart_code_metrics:metrics analyze lib -r github
  else
    abort "dart_code_metrics configured but dependency missing; run 'flutter pub get'."
  fi
fi

log "Performing security smoke checks"
if [ -f "tool/security_smoke_test.dart" ]; then
  flutter test tool/security_smoke_test.dart
else
  warn "No dedicated security smoke tests detected. Consider adding tool/security_smoke_test.dart for RBAC regression coverage."
fi

run_android_build=false
run_ios_build=false

if flutter doctor -v | grep -q "Android toolchain"; then
  run_android_build=true
else
  warn "Android toolchain not fully configured; skipping APK build."
fi

if [[ "$(uname -s)" == "Darwin" ]] && command -v xcodebuild >/dev/null 2>&1; then
  run_ios_build=true
else
  warn "iOS build prerequisites not detected; skipping IPA build."
fi

if [ "$run_android_build" = true ]; then
  log "Verifying Android build (staging flavor)"
  flutter build apk --flavor staging --dart-define=API_ENV=staging --dart-define=ENABLE_CORS_PROXY=true
fi

if [ "$run_ios_build" = true ]; then
  log "Verifying iOS build (staging flavor)"
  flutter build ipa --flavor staging --dart-define=API_ENV=staging --codesign=off
fi

log "Generating summarized coverage report"
if [ -f "coverage/lcov.info" ]; then
  if command -v genhtml >/dev/null 2>&1; then
    rm -rf "${COVERAGE_DIR}/html"
    genhtml coverage/lcov.info --output-directory "${COVERAGE_DIR}/html" >/dev/null
    log "Coverage HTML report available at ${COVERAGE_DIR}/html/index.html"
  else
    warn "genhtml not available; skipping HTML coverage report generation."
  fi
else
  warn "Coverage file not found; flutter test may have been skipped."
fi

log "All user app checks completed"
