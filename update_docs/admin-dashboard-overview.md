# Gigvora Admin Dashboard Overview

## Purpose
Provide administrators, compliance officers, and operations leads with a unified control plane to govern the Gigvora ecosystem across talent onboarding, marketplace quality, compliance, and financial oversight.

## Core Workspaces
- **Job Post Management** (`components/admin/job-posts/JobPostManagementWorkspace.jsx`)
  - CRUD workflows backed by `adminJobPosts` service endpoints with publication scheduling, version history, and audit logging.
  - Batch publishing, archiving, and deletion guardrails with confirmation modals and success toasts.
  - Inline analytics summarising applicant pipelines, view-to-application ratios, and campaign status.

- **Compliance & GDPR Suite** (`components/admin/compliance`, `components/admin/gdpr`)
  - Tracks regulatory obligations, breach response plans, DPO assignments, and data processor inventories.
  - Tag inputs and retention policy editors provide granular control over regional data handling requirements.
  - Export buttons generate regulator-ready reports leveraging backend compliance services.

- **Trust & Safety Operations**
  - Identity verification queues, dispute escalation boards, and messaging oversight panels surfaced through dedicated admin services (`adminIdentityVerification`, `adminMessaging`, `adminEscrow`).
  - RBAC-enforced views ensure only privileged roles can resolve flags or approve sensitive actions.

- **Workspace Governance**
  - Agency, company, and freelancer management dashboards consolidate account health, subscription status, and feature flag assignments.
  - Automations trigger alerts for expiring documentation, upcoming renewals, and SLA breaches.

## Security & RBAC
- Access controlled by RBAC scopes defined in `.env.example` (e.g., `admin:manage`, `compliance:review`, `finance:oversee`).
- `RoleGate` component enforces scopes client-side, while backend middleware validates tokens before fulfilling requests.
- Sensitive actions (identity approvals, escrow releases) require multi-step confirmation and produce immutable audit trails.

## Observability & Telemetry
- Embedded metrics cards show real-time adoption, incident volumes, and SLA adherence using telemetry sourced from the backend metrics registry.
- Admin activity logs provide chronological records of changes with filters for actor, surface, and impact severity.

## UX & Accessibility
- Dashboard uses responsive grid layouts with consistent spacing tokens, ensuring readability across desktops and tablets.
- Components include keyboard navigation support, focus trapping within modals, and ARIA attributes for assistive technologies.
- Dark mode inherits design system palettes, maintaining contrast ratios that satisfy WCAG AA requirements.

## Testing & Quality
- React Testing Library suites cover critical admin flows (job publishing, compliance edits, approval queues) with deterministic mocks housed under `src/components/admin/**/__tests__`.
- TypeScript/PropTypes validation and ESLint rules run in CI to prevent regressions before deployment.
- Snapshot and interaction tests monitor layout drift when design tokens evolve.

## Roadmap Hooks
- Integration connectors prepared for CRM sync (HubSpot/Salesforce), identity proofing providers, and finance ERP exports.
- Planned enhancements include anomaly detection dashboards, configurable escalation policies, and cross-workspace reporting exports.
