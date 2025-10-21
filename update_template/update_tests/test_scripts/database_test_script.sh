#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../.. && pwd)"
BACKEND_DIR="$ROOT_DIR/gigvora-backend-nodejs"
LOG_DIR="$ROOT_DIR/artifacts/aurora/tests"
mkdir -p "$LOG_DIR"

DB_CONTAINER_NAME="gigvora-aurora-mysql"
MYSQL_PORT="3307"

cleanup() {
  if docker ps -a --format '{{.Names}}' | grep -Eq "^${DB_CONTAINER_NAME}$"; then
    docker rm -f "$DB_CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if ! command -v docker >/dev/null 2>&1; then
  echo "[db-test] Docker is required to run database integration tests." >&2
  exit 1
fi

echo "[db-test] Starting ephemeral MySQL container"
docker run --name "$DB_CONTAINER_NAME" -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p "${MYSQL_PORT}:3306" -d mysql:8.0 >/dev/null
sleep 20

pushd "$BACKEND_DIR" >/dev/null
  echo "[db-test] Running Sequelize migrations against test DB"
  env DB_HOST=127.0.0.1 DB_PORT=$MYSQL_PORT DB_USERNAME=root DB_PASSWORD="" DB_NAME=gigvora_test \
    node scripts/runMigrations.js 2>&1 | tee "$LOG_DIR/database-migrations.log"

  echo "[db-test] Executing database integration tests"
  env DB_HOST=127.0.0.1 DB_PORT=$MYSQL_PORT DB_USERNAME=root DB_PASSWORD="" DB_NAME=gigvora_test \
    npm test -- tests/integration --runInBand 2>&1 | tee "$LOG_DIR/database-tests.log"
popd >/dev/null

echo "[db-test] Tests complete; cleaning up container"
