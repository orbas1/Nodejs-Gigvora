#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../../.. && pwd)"

pushd "$ROOT_DIR/gigvora-backend-nodejs" >/dev/null
npm ci
npm run lint
npm run build
popd >/dev/null

pushd "$ROOT_DIR/gigvora-frontend-reactjs" >/dev/null
npm ci
npm run lint
npm run build
popd >/dev/null

pushd "$ROOT_DIR/gigvora-flutter-phoneapp" >/dev/null
melos bootstrap
melos run build:web
melos run build:android
melos run build:ios
popd >/dev/null

echo "Build verification completed for backend, frontend, and Flutter workspaces."
