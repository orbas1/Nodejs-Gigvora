# Backend Test Script

This script covers all backend verification required for the Version 1.00 release.

## Prerequisites
- Environment variables loaded from `.env.example` with production-safe overrides (no wildcard CORS, RBAC roles in place).
- MySQL instance available with migrations applied.
- `npm install` completed inside `gigvora-backend-nodejs`.

## Execution Steps
1. **Static analysis**
   ```bash
   npm run lint
   ```
   Ensures coding standards, security rules, and import hygiene hold.

2. **Unit & integration suites**
   ```bash
   SKIP_SEQUELIZE_BOOTSTRAP=true npm test -- --runTestsByPath \
     tests/realtime/channelRegistry.test.js \
     tests/realtime/connectionRegistry.test.js \
     tests/services/communityModerationService.test.js \
     tests/services/liveServiceTelemetryService.test.js \
     tests/services/matchingEngine.test.js \
     tests/services/adsService.test.js
   ```
   Runs realtime, moderation, telemetry, matching, and monetisation suites with the lightweight bootstrap harness.

3. **Database migrations smoke**
   ```bash
   npm run db:migrate -- --env production
   npm run db:seed -- --env production
   npm run db:verify
   ```
   Validates migrations, seed data, and backup verification.

4. **Coverage report**
   ```bash
   npm test -- --coverage
   ```
   Upload coverage to the QA dashboard and ensure critical files stay above 85% statements.

## Exit Criteria
- All commands exit with status code 0.
- Coverage thresholds satisfied.
- No secrets or warnings leaked in console output.
