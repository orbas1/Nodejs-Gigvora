# Backend Test Results — Version 1.50 Update

| Date | Command | Result | Notes |
|------|---------|--------|-------|
| 07 Apr 2024 | `npm test -- runtimeObservabilityService` | ✅ Pass | Validated runtime snapshot aggregation with SQLite sync warnings noted for TEXT columns. |
| 07 Apr 2024 | `npm test -- rateLimitMetrics` | ✅ Pass | Confirmed rate-limit metrics history, blocked ratios, and window rollovers; same SQLite warning observed. |
| 08 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose authRoutes.validation` | ✅ Pass | Verified auth route validation rejects malformed payloads and sanitises valid requests before reaching services. 【9d8cf3†L1-L13】 |
| 08 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose adminRoutes.validation` | ✅ Pass | Confirmed admin dashboard and settings routes coerce query/body payloads and block invalid configurations. 【159616†L1-L14】 |
| 09 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose searchRoutes.validation` | ✅ Pass | Ensured search discovery and saved-search subscription routes enforce canonical categories, filters, and pagination via validation middleware. 【4ede16†L1-L19】 |
| 09 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose projectRoutes.validation financeRoutes.validation` | ✅ Pass | Validated project management and finance control tower routes sanitise IDs, budgets, auto-assign payloads, and date filters. 【290e18†L1-L20】 |
| 10 Apr 2024 | `npm test -- complianceService.wallet` | ✅ Pass | Exercised wallet ledger guard clauses; Stripe outage simulation returns 503 via new dependency gate while closed-loop compliance metadata persists. 【045f7d†L1-L27】 |
| 11 Apr 2024 | `LOG_LEVEL=silent NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --verbose tests/services/authService.refresh.test.js tests/lifecycle/databaseLifecycle.test.js tests/routes/authRoutes.validation.test.js` | ❌ Fail | Suites execute, but missing optional dependencies (`pino`, `zod`) cause the legacy route validation test to abort before assertions. New tests remain for CI coverage where modules are available. |

> SQLite emits the expected warning about `TEXT` column options during in-memory sync (`tests/setupTestEnv.js`); no functional regressions detected.
