#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../.. && pwd)"
FRONTEND_DIR="$ROOT_DIR/gigvora-frontend-reactjs"
LOG_DIR="$ROOT_DIR/artifacts/aurora/tests"
mkdir -p "$LOG_DIR"

pushd "$FRONTEND_DIR" >/dev/null
  echo "[frontend-test] Installing dependencies"
  npm ci --no-audit --prefer-offline

  echo "[frontend-test] Running Vitest in CI mode"
  CI=true npm test -- --run --reporter=junit --outputFile="$LOG_DIR/frontend-vitest.xml" \
    2>"$LOG_DIR/frontend-vitest.warn.log" | tee "$LOG_DIR/frontend-vitest.log"

  echo "[frontend-test] Running ESLint"
  npm run lint 2>&1 | tee "$LOG_DIR/frontend-eslint.log"
popd >/dev/null

echo "[frontend-test] Frontend quality checks complete."
