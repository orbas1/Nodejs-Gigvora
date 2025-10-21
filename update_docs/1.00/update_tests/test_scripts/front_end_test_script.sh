#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../../.. && pwd)"
FRONTEND_DIR="$ROOT_DIR/gigvora-frontend-reactjs"

pushd "$FRONTEND_DIR" >/dev/null
npm ci
npm run lint
npm run test -- --coverage
npm run test -- components/__tests__/CreationStudioWizard.test.jsx
npm run test -- pages/__tests__/FinanceDashboard.test.jsx
popd >/dev/null

echo "Front-end test suite finished successfully."
