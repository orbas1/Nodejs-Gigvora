# New Backend Files – Communication & Engagement Suite

| File | Purpose |
|------|---------|
| `database/migrations/20240801090000-feed-engagement.cjs` | Creates feed engagement tables (`feed_posts`, `feed_reactions`, `feed_comments`, `feed_shares`, `feed_activity_logs`) with indexes and foreign keys for ranking + moderation workflows. |
| `tests/feedService.test.js` | Validates feed service behaviour: engagement aggregation, moderation visibility updates, and viewer-specific metrics. |
| `tests/feedController.test.js` | Covers HTTP layer for feed endpoints including pagination, reaction toggling, comment creation, and moderation auth gating. |
| `tests/messagingController.test.js` (updated fixture) | Adds JWT-aware authentication helpers and new support escalation cases for messaging endpoints. |
| `src/utils/r2Client.js` | Cloudflare R2 client wrapper using the AWS SDK to upload dispute evidence and mint presigned download URLs. |
| `src/services/trustService.js` | Domain service orchestrating escrow accounts, transactions, dispute workflows, and aggregated trust reporting. |
| `src/controllers/trustController.js` | Express controller exposing escrow lifecycle, dispute, and trust overview endpoints. |
| `src/routes/trustRoutes.js` | Router mounting the `/api/trust` endpoints for escrow, disputes, and reporting. |
| `database/migrations/20240801090000-trust-payments.cjs` | Migration introducing escrow account/transaction tables, dispute case/event tables, and enum types for trust flows. |
| `tests/trustService.test.js` | Jest suite validating escrow initiation, release/refund paths, dispute resolution, and R2 evidence handling. |
| `backend_updates/trust_runbook.md` | Operational runbook outlining daily checks, release/refund procedures, dispute escalation, and compliance retention requirements for the trust domain. |
