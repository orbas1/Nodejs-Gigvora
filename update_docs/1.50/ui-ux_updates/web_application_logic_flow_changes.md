# Web App – Logic Flow Changes

## Authentication & Workspace Selection
- Added unified login that routes users to previously active workspace (talent, provider, admin). Multi-tenant users receive workspace selector immediately after authentication.
- MFA enforcement mirrors phone experience; fallback to hardware keys supported on desktop.

## Dashboard Logic
- Personalised dashboards built from modular widgets; logic prioritises compliance alerts, financial tasks, and pending communications.
- Quick actions adapt based on persona (post job, review applications, approve milestones, publish ad).

## Projects & Jobs
- Project creation wizard matches phone steps but expands to include document upload and collaborator assignment in-line.
- Jobs board integrates ATS pipeline; moving candidates between stages triggers notifications and updates analytics.
- Contest workflows enforce submission windows with automated status changes and scoreboard updates.

## Communication & Support
- Persistent chat panel inherits context from current page. Support tickets spawn side drawers with knowledge base suggestions before submission.
- Video call hand-off now available from chat for escalated disputes or onboarding sessions.

## Financial Operations
- Escrow and invoicing flows include audit trail access, bulk actions, and export options.
- Finance summary pages show trend charts; anomalies trigger insights card with recommended actions.

## Settings & Administration
- Role management expanded to cover workspace-specific permissions; templates can be duplicated across teams.
- Compliance centre aggregates policy acknowledgements, document expirations, and reporting schedule.

## Error Handling & Recovery
- Autosave for long forms (jobs, projects, campaigns) every 30 seconds.
- Unsaved changes modal warns before navigation away; includes "Save draft" or "Discard" options.

## Documentation Alignment
- Detailed component-level logic, flow diagrams, and edge case handling are expanded within `Web Application Design Update/Logic_Flow_update.md` and `Logic_Flow_map.md` for engineering hand-off.
