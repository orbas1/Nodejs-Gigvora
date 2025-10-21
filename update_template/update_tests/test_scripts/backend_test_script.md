# Backend Test Script — Aurora Release

## Prerequisites
- Node.js ≥ 18.18.0 and npm ≥ 9 installed.
- `.env.test` populated with ephemeral credentials (see `docs/env/test-backend.env.example`).
- SQLite available for in-memory testing or Dockerized MySQL reachable at `localhost:3307`.
- Redis optional; tests stub redis interactions by default.

## Setup
```bash
cd gigvora-backend-nodejs
npm ci
npm run config:validate # ensure runtime config is valid
```

## Execution Steps
1. **Run unit and integration tests**
   ```bash
   npm test
   ```
   - Uses Jest with `--runInBand` to avoid concurrency issues in CI.
   - Honors environment variables:
     - `SKIP_SEQUELIZE_BOOTSTRAP=true` to bypass heavy DB sync when using SQLite mocks.
     - `CI=true` to enable deterministic reporters.

2. **Optional targeted suites**
   ```bash
   npx jest tests/controllers/creationStudioController.test.js --runInBand
   npx jest tests/controllers/explorerController.test.js --runInBand
   ```
   Use when triaging controller-specific failures.

3. **Coverage report (optional)**
   ```bash
   npm test -- --coverage --collectCoverageFrom="src/**/*.js"
   ```

## Post-Run Validation
- Inspect output for failing suites (controllers, services, lifecycle).
- Archive Jest results: `artifacts/aurora/tests/backend-jest.xml`.
- File or update tickets for any failing tests before go/no-go.

## Troubleshooting Tips
- If Sequelize connection errors appear, ensure `DB_SSL=false` for local SQLite runs.
- For MySQL runs, start dockerized DB: `docker compose -f docker-compose.test.yml up mysql`.
- Clear Jest cache when encountering stale mocks: `npx jest --clearCache`.
