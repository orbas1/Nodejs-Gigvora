#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../.. && pwd)"
FRONTEND_DIR="$ROOT_DIR/gigvora-frontend-reactjs"
BACKEND_DIR="$ROOT_DIR/gigvora-backend-nodejs"
LOG_DIR="$ROOT_DIR/artifacts/aurora/tests"
mkdir -p "$LOG_DIR"

pushd "$FRONTEND_DIR" >/dev/null
  echo "[build-test] Installing frontend dependencies"
  npm ci --no-audit --prefer-offline
  echo "[build-test] Running Vite production build"
  npm run build 2>&1 | tee "$LOG_DIR/frontend-build.log"
popd >/dev/null

pushd "$BACKEND_DIR" >/dev/null
  echo "[build-test] Installing backend dependencies"
  npm ci --no-audit --prefer-offline
  echo "[build-test] Validating runtime configuration"
  npm run config:validate 2>&1 | tee "$LOG_DIR/backend-config-validate.log"
  echo "[build-test] Skipping dedicated build step (runtime executed via Node)."
popd >/dev/null

echo "[build-test] Build verification completed. Logs stored in $LOG_DIR"
