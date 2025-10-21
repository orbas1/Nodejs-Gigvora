# Services Changes

## Engagement Service
- Implemented AI-assisted matching leveraging `matchEngine.rankCandidates` with explainability metadata returned to clients.
- Added transactional outbox pattern for engagement status changes, ensuring reliable delivery to downstream analytics.

## Payment Service
- Introduced dispute workflow service splitting asynchronous tasks (evidence gathering, processor sync) across dedicated queues.
- Added ledger reconciliation job verifying payout totals versus provider statements nightly.

## Notification Service
- Added templating support for localized agency notifications using `handlebars` with dynamic partials.
- Implemented rate aware delivery prioritizing escalations and compliance alerts.

## Infrastructure Service
- Built service for environment configuration introspection, enabling dynamic toggling of feature flags through secure admin UI.
- Hardened caching layer by requiring signed cache bust requests and logging purge actions.

## Testing
- Achieved 92% coverage across service layer via `npm run test:services` and scenario tests.
- Load tested engagement service at 500 RPS sustained with <350ms p95.
