# Module Changes

## New Modules
- **EngagementLifecycleModule** (`src/modules/engagementLifecycle/index.js`): orchestrates agency-client engagements, combining handlers, services, and event emitters into a cohesive lifecycle package with opinionated defaults.
- **SecurityHardeningModule** (`src/modules/securityHardening/index.js`): bundles middleware, helpers, and health checks required for SOC2 certification, optionally exportable for partner deployments.

## Refactored Modules
- Split `userModule` into `userProfiles` and `userAccess` to decouple profile enrichment from authentication flows, reducing circular dependencies and improving testability.
- Extracted payment dispute logic from `financeModule` into dedicated `disputeResolution` submodule with its own repository class and queue consumers.

## Module Registration
- Updated `src/bootstrap/modules.js` to load modules based on environment feature flags, enabling incremental rollout through configuration rather than code toggles.
- Added health probes ensuring each module exposes `ready()` and `shutdown()` hooks for graceful restarts.

## Documentation
- Refreshed module README files with dependency diagrams generated via `npx depcruise` and stored under `docs/architecture/modules/`.
