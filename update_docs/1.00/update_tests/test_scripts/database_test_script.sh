#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../../.. && pwd)"
BACKEND_DIR="$ROOT_DIR/gigvora-backend-nodejs"

pushd "$BACKEND_DIR" >/dev/null
npm ci

# Validate schema migrations
npm run db:migrate -- --env staging
npm run db:seed -- --env staging

# Export schema snapshot for contract alignment
npm run schema:export

# Verify backups and retention policies
npm run db:backup
npm run db:verify

# Run targeted database integrity tests
SKIP_SEQUELIZE_BOOTSTRAP=true npm test -- --runTestsByPath tests/database/integrity.test.js

popd >/dev/null

echo "Database governance checks complete."
