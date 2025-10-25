# Project & Gig Management Status Reference

The project and gig management stack defines a shared vocabulary for timelines, orders, bids, invites, and escrow flows. These
constants live in `src/models/projectGigManagementModels.js` so backend and frontend surfaces can stay aligned. Use this
reference when wiring UI badges, notifications, or analytics that depend on workflow state names.

## Project lifecycle

- **Project statuses** (`PROJECT_STATUSES`): `planning`, `in_progress`, `at_risk`, `completed`, `on_hold`.
- **Workspace risk levels** (`PROJECT_RISK_LEVELS`): `low`, `medium`, `high`.
- **Collaborator statuses** (`PROJECT_COLLABORATOR_STATUSES`): `invited`, `active`, `inactive`.
- **Integration statuses** (`PROJECT_INTEGRATION_STATUSES`): `connected`, `disconnected`, `error`.
- **Retrospective + milestone accents**:
  - Milestone status progression: `planned`, `in_progress`, `waiting_on_client`, `completed`.
  - Workspace lifecycle state flags: `open`, `closed` (stored separately from high-level project status).

## Gig order delivery

- **Gig order statuses** (`GIG_ORDER_STATUSES`): `requirements`, `in_delivery`, `in_revision`, `completed`, `cancelled`.
- **Requirement statuses** (`GIG_REQUIREMENT_STATUSES`): `pending`, `received`, `approved`.
- **Revision statuses** (`GIG_REVISION_STATUSES`): `requested`, `in_progress`, `submitted`, `approved`.
- **Submission statuses** (`GIG_SUBMISSION_STATUSES`): `draft`, `submitted`, `under_review`, `approved`, `rejected`, `needs_changes`.
- **Chat visibility scopes** (`GIG_CHAT_VISIBILITIES`): `internal`, `client`, `vendor`.
- **Timeline visibility scopes** (`GIG_TIMELINE_VISIBILITIES`): `internal`, `client`, `vendor`.
- **Timeline event types** (`GIG_TIMELINE_EVENT_TYPES`):
  `kickoff`, `milestone`, `check_in`, `checkpoint`, `scope_change`, `handoff`, `qa_review`, `client_feedback`, `retro`, `note`, `blocker`.
- **Timeline event statuses** (`GIG_TIMELINE_EVENT_STATUSES`): `scheduled`, `in_progress`, `completed`, `cancelled`.
- **Escrow checkpoint statuses** (`GIG_ORDER_ESCROW_STATUSES`): `pending`, `released`, `refunded`, `cancelled`.
- **Order activity authors** (`GIG_ORDER_ACTIVITY_TYPES`): `system`, `client`, `vendor`, `internal`.

## Marketplace coordination

- **Bid statuses** (`PROJECT_BID_STATUSES`): `draft`, `submitted`, `shortlisted`, `awarded`, `declined`, `expired`.
- **Invitation statuses** (`PROJECT_INVITATION_STATUSES`): `pending`, `accepted`, `declined`, `expired`, `revoked`.
- **Auto-match candidate statuses** (`AUTO_MATCH_STATUS`): `suggested`, `contacted`, `engaged`, `dismissed`.
- **Review subject types** (`REVIEW_SUBJECT_TYPES`): `vendor`, `freelancer`, `mentor`, `project`.

## Escrow transactions

- **Transaction types** (`GIG_ESCROW_TRANSACTION_TYPES`): `deposit`, `release`, `refund`, `fee`, `adjustment`.
- **Transaction statuses** (`GIG_ESCROW_TRANSACTION_STATUSES`): `pending`, `completed`, `failed`.

## Usage guidance

1. **Surface-friendly labels.** Keep UI copy capitalised versions of these identifiers (e.g., `in_revision → In revision`).
2. **Analytics alignment.** When producing dashboards, prefer these enums over derived strings so reporting stays consistent across
   project and gig views.
3. **Validation + DTOs.** Service validators and DTO schemas should explicitly enumerate these values—avoid accepting arbitrary
   strings to prevent silent drift between clients.
4. **Documentation links.** Reference this file from onboarding and product docs whenever you explain gig or project status flows
   so cross-functional teams share the same vocabulary.
