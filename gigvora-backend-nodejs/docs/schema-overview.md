# Gigvora Data Schema Overview

The Version 1.50 schema extends the marketplace with production-ready persistence for applications, messaging, notifications, analytics, and provider workspaces. Every table is normalised, audited, and aligned to the new Sequelize service layer so feature squads can build against a stable contract.

## Application Lifecycle Tables
| Table | Purpose | Key Columns | Relationships |
| --- | --- | --- | --- |
| `applications` | Stores applicant submissions across jobs, gigs, projects, launchpads, and volunteer roles with sanitised metadata and rate expectations. | `applicantId`, `targetType`, `targetId`, `status`, `sourceChannel`, `attachments`, `metadata`, timestamps | `belongsTo(User, as applicant)`, `hasMany(ApplicationReview)` |
| `application_reviews` | Captures reviewer decisions, scores, and audit timestamps for every stage of the hiring funnel. | `applicationId`, `reviewerId`, `stage`, `decision`, `score`, `decidedAt` | `belongsTo(Application)`, `belongsTo(User, as reviewer)` |

**Operational guardrails**
- Unique `(applicantId, targetType, targetId)` combinations prevent duplicate active submissions, enforced through transactional checks in `applicationService`.【F:gigvora-backend-nodejs/src/services/applicationService.js†L156-L191】
- Application metadata is sanitised before exposure so UI surfaces never leak `_internal*` or `private*` keys.【F:gigvora-backend-nodejs/src/models/index.js†L129-L169】【F:gigvora-backend-nodejs/src/services/applicationService.js†L67-L94】

## Messaging Domain
| Table | Purpose | Key Columns | Relationships |
| --- | --- | --- | --- |
| `message_threads` | Represents omnichannel conversations with cached metadata for routing and moderation. | `subject`, `channelType`, `state`, `createdBy`, `lastMessageAt`, `metadata` | `hasMany(MessageParticipant)`, `hasMany(Message)` |
| `message_participants` | Tracks user roles, mute state, and notification settings per conversation. | `threadId`, `userId`, `role`, `notificationsEnabled`, `mutedUntil` | `belongsTo(MessageThread)`, `belongsTo(User)` |
| `messages` | Stores chat events including system notifications, file attachments, and lifecycle timestamps. | `threadId`, `senderId`, `messageType`, `body`, `metadata`, `deletedAt`, `deliveredAt` | `belongsTo(MessageThread)`, `belongsTo(User, as sender)`, `hasMany(MessageAttachment)` |
| `message_attachments` | Persists verified files referenced by message records. | `messageId`, `storageKey`, `fileName`, `mimeType`, `fileSize` | `belongsTo(Message)` |

Caching strategy is codified within `messagingService` using deterministic cache keys and explicit invalidation per thread mutation.【F:gigvora-backend-nodejs/src/services/messagingService.js†L17-L80】【F:gigvora-backend-nodejs/src/services/messagingService.js†L214-L240】

## Notification Domain
| Table | Purpose | Key Columns | Relationships |
| --- | --- | --- | --- |
| `notifications` | Stores user-facing alerts with delivery metadata, quiet hour enforcement, and channel routing. | `userId`, `category`, `priority`, `type`, `status`, `payload`, `deliveredAt`, `readAt`, `expiresAt` | `belongsTo(User)` |
| `notification_preferences` | Holds opt-in flags, digest cadence, quiet hours, and timezone metadata used for routing logic. | `userId`, `emailEnabled`, `pushEnabled`, `smsEnabled`, `inAppEnabled`, `digestFrequency`, `quietHoursStart/End`, `metadata` | `belongsTo(User)` |

The service layer evaluates quiet hours and available channels on every insert, annotating payloads with the selected delivery routes to support downstream worker orchestration.【F:gigvora-backend-nodejs/src/services/notificationService.js†L49-L117】

## Provider Workspace Domain
| Table | Purpose | Key Columns | Relationships |
| --- | --- | --- | --- |
| `provider_workspaces` | Defines agency/company hubs with fiscal settings, timezone, and automation toggles. | `ownerId`, `name`, `slug`, `type`, `timezone`, `defaultCurrency`, `intakeEmail`, `settings` | `hasMany(ProviderWorkspaceMember)`, `hasMany(ProviderWorkspaceInvite)`, `hasMany(ProviderContactNote)` |
| `provider_workspace_members` | Maintains membership roles, invitation provenance, activation status, and audit timestamps. | `workspaceId`, `userId`, `role`, `status`, `invitedById`, `joinedAt`, `removedAt` | `belongsTo(ProviderWorkspace)`, `belongsTo(User, as member)` |
| `provider_workspace_invites` | Persists secure invite tokens and lifecycle timestamps. | `workspaceId`, `email`, `role`, `status`, `inviteToken`, `expiresAt`, `invitedById`, `acceptedAt` | `belongsTo(ProviderWorkspace)` |
| `provider_contact_notes` | Records compliance-grade notes on talent interactions with visibility controls. | `workspaceId`, `subjectUserId`, `authorId`, `note`, `visibility` | `belongsTo(ProviderWorkspace)`, `belongsTo(User, as author)` |

Provider services enforce transactional updates to keep membership and invitation state in sync, while cache invalidation guarantees dashboards refresh instantly for cross-functional teams.【F:gigvora-backend-nodejs/src/services/providerWorkspaceService.js†L21-L130】【F:gigvora-backend-nodejs/src/services/providerWorkspaceService.js†L241-L320】

## Gig Order Fulfilment Domain
| Table | Purpose | Key Columns | Relationships |
| --- | --- | --- | --- |
| `gig_orders` | Primary record for every gig engagement flowing through the freelancer pipeline, including stage, statuses, financial values, and CSAT. | `freelancerId`, `clientId`, `pipelineStage`, `status`, `intakeStatus`, `kickoffStatus`, `valueAmount`, `escrowTotalAmount`, `deliveryDueAt`, `csatScore` | `belongsTo(User, as freelancer)`, `belongsTo(User, as client)`, `hasMany(GigOrderRequirementForm)`, `hasMany(GigOrderRevision)`, `hasMany(GigOrderEscrowCheckpoint)` |
| `gig_order_requirement_forms` | Stores dynamic intake questionnaires and approvals that advance an order from inquiry through qualification. | `orderId`, `status`, `schemaVersion`, `questions`, `responses`, `requestedAt`, `submittedAt`, `approvedAt`, `reviewerId` | `belongsTo(GigOrder)`, `belongsTo(User, as reviewer)` |
| `gig_order_revisions` | Tracks revision loops with numbering, deadlines, and completion timestamps. | `orderId`, `revisionNumber`, `status`, `summary`, `details`, `requestedById`, `requestedAt`, `dueAt`, `completedAt` | `belongsTo(GigOrder)`, `belongsTo(User, as requestedBy)` |
| `gig_order_escrow_checkpoints` | Captures escrow milestones, release state, CSAT thresholds, and payout references tied to client satisfaction. | `orderId`, `label`, `amount`, `currency`, `status`, `approvalRequirement`, `csatThreshold`, `releasedAt`, `releasedById`, `payoutReference` | `belongsTo(GigOrder)`, `belongsTo(User, as releasedBy)` |

`freelancerOrderPipelineService` layers reporting and workflow automation on top of these tables, deriving metrics (pending requirements, open revisions, escrow exposure) and coordinating stage transitions, requirement approvals, revision resolution, and escrow releases consumed by the freelancer dashboard.【F:gigvora-backend-nodejs/src/services/freelancerOrderPipelineService.js†L17-L618】【F:gigvora-frontend-reactjs/src/pages/dashboards/FreelancerDashboardPage.jsx†L210-L575】

## Analytics & Governance
| Table | Purpose | Key Columns |
| --- | --- | --- |
| `analytics_events` | Event-level tracking with actor type, event payload, and contextual metadata for experimentation. | `actorType`, `actorId`, `eventName`, `payload`, `occurredAt` |
| `analytics_daily_rollups` | Aggregated metrics enabling dashboards and anomaly detection. | `metricDate`, `metricKey`, `count`, `metadata` |

Analytic tables are optimised for append-only workloads and integrate with data governance policies described in `data-governance.md` to enforce retention windows and masking requirements.

## Reference Data & Seeds
The curated seeders provision diverse personas (talent, clients, agencies) plus realistic messaging and notification records so QA flows mirror production traffic patterns.【F:gigvora-backend-nodejs/database/seeders/20240501010000-demo-data.cjs†L6-L160】 When combined with the integration tests in `tests/`, these seeds guarantee migrations and services remain regression-safe across environments.

## Access Control & RBAC Alignment
- Roles and fine-grained permissions follow the shared RBAC vocabulary (for example `calendar:manage`, `talent:disputes`, `admin:networking`) defined in `.env.example`, keeping the backend, React app, and calendar stub aligned on capability names.【F:gigvora-backend-nodejs/.env.example†L44-L61】【F:calendar_stub/server.mjs†L210-L323】
- Controllers enforce those permissions by checking both role membership and delegated capability flags before mutating resources—for instance the mentoring and networking surfaces require either an admin role or the corresponding `admin:*` permission set before allowing updates.【F:gigvora-backend-nodejs/src/controllers/userMentoringController.js†L36-L78】【F:gigvora-backend-nodejs/src/controllers/userNetworkingController.js†L47-L88】
- Two-factor tokens are re-created with hashed verification codes and least-privilege constraints during the governance upgrade migration so credential recovery never exposes plaintext secrets while still allowing automated rollover of existing data.【F:gigvora-backend-nodejs/database/migrations/20241120100000-database-governance-upgrade.cjs†L1-L210】

## Cross-Origin & API Surface Hardening
- The HTTP security module maintains an allowlist-based CORS middleware that mirrors production origins and annotates blocked attempts, ensuring browser clients receive actionable errors while unauthorized origins are denied early.【F:gigvora-backend-nodejs/src/config/httpSecurity.js†L182-L308】
- Dedicated tests assert that allowed origins obtain the correct response headers and disallowed origins are rejected, preventing regressions when environments or staging URLs change.【F:gigvora-backend-nodejs/tests/config/httpSecurity.test.js†L1-L114】
- Socket namespaces inherit the same CORS configuration, so real-time dashboards and notifications respect the identical security posture as the REST layer without duplicating configuration knobs.【F:gigvora-backend-nodejs/tests/realtime/socketServer.test.js†L150-L236】

## Database Provisioning & Least Privilege
- `install.sql` now provisions separate migrator and application roles with enforced TLS requirements and 16+ character password validation, ensuring CI/CD pipelines have the elevated privileges they need while the runtime API is locked to CRUD-only access.【F:gigvora-backend-nodejs/install.sql†L1-L143】
- The migrator role grants schema-altering capabilities for Sequelize migrations, whereas the runtime account receives only the DML grants required by the service layer—keeping production blast radius minimal and aligning with the operational guardrails documented above.【F:gigvora-backend-nodejs/install.sql†L31-L132】【F:gigvora-backend-nodejs/src/services/applicationService.js†L67-L191】
