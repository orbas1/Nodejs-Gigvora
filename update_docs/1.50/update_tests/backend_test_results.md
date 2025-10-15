# Backend Test Results — Version 1.50 Update

| Date | Command | Result | Notes |
|------|---------|--------|-------|
| 13 Apr 2024 | `npm test -- databaseLifecycleService` | ✅ Pass | Exercised database lifecycle warm/drain orchestration, confirming audit events and pool telemetry snapshots are emitted as expected. 【0fd77f†L1-L9】 |
| 12 Apr 2024 | `npm test -- dependencyGuardRoutes` | ✅ Pass | Verified payments/compliance guard propagation for `/api/users/:id` and `/api/compliance/documents`; SQLite emitted the expected TEXT warning during forced sync. 【628fa1†L1-L24】 |
| 11 Apr 2024 | `npm test -- runtimeDependencyGuard` | ✅ Pass | Exercised payments/compliance dependency guards across credential gaps, maintenance degradations, and healthy states using SQLite-backed models. 【359896†L1-L9】 |
| 10 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose services/runtimeMaintenanceService` | ✅ Pass | Validated maintenance CRUD sanitisation, status transitions, and filtering logic with Sequelize mocks; chronology guardrails enforced. |
| 10 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose routes/runtimeRoutes` | ⚠️ Blocked | Test harness now loads stubs for Pino and rate limiter, but fails due to missing `zod` optional dependency in CI image; remediation tracked in dependency backlog. |
| 09 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose projectRoutes.validation financeRoutes.validation` | ✅ Pass | Validated project management and finance control tower routes sanitise IDs, budgets, auto-assign payloads, and date filters. 【290e18†L1-L20】 |
| 09 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose searchRoutes.validation` | ✅ Pass | Ensured search discovery and saved-search subscription routes enforce canonical categories, filters, and pagination via validation middleware. 【4ede16†L1-L19】 |
| 08 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose adminRoutes.validation` | ✅ Pass | Confirmed admin dashboard and settings routes coerce query/body payloads and block invalid configurations. 【159616†L1-L14】 |
| 08 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose authRoutes.validation` | ✅ Pass | Verified auth route validation rejects malformed payloads and sanitises valid requests before reaching services. 【9d8cf3†L1-L13】 |
| 07 Apr 2024 | `npm test -- runtimeObservabilityService` | ✅ Pass | Validated runtime snapshot aggregation with SQLite sync warnings noted for TEXT columns. |
| 07 Apr 2024 | `npm test -- rateLimitMetrics` | ✅ Pass | Confirmed rate-limit metrics history, blocked ratios, and window rollovers; same SQLite warning observed. |

> SQLite emits the expected warning about `TEXT` column options during in-memory sync (`tests/setupTestEnv.js`); no functional regressions detected.
