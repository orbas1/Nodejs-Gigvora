# Provider App – Logic Flow Changes

## Entry & Authentication
1. **Adaptive Onboarding:** Flow now branches based on provider type (agency vs. company). Agencies complete team setup and Launchpad enrolment, while companies configure job board access and escrow preferences.
2. **Biometric & MFA Support:** After first login, users are prompted to enable biometric unlock and choose MFA method. The decision tree handles fallback to email/SMS codes if device features are unavailable.

## Home Dashboard Logic
- **Role-Based Widgets:** Dashboard modules are assembled dynamically using role metadata. Example: Finance leads see escrow alerts, HR managers see pending contracts.
- **Smart Alerts Queue:** Notifications are sorted by urgency (compliance > financial > operational) before surfacing in the “Today” rail.
- **Workspace Memory:** App remembers the last workspace visited and restores state on relaunch.
- **Pipeline Snapshot:** Dedicated card summarises application stages, unread messages, and compliance notes per workspace, linking to new review dashboards.

## Project & Talent Management
- **Project Creation Wizard:** Branches into project, contest, or job flow. Each branch asks tailored questions and automatically associates the right escrow template.
- **Auto-Assign Recommendations:** When staffing a project, the flow calls MeiliSearch-backed recommendations filtered by availability, trust score, and Launchpad tier.
- **Dispute Escalation:** Within each project, a three-stage pipeline (Mediation → Investigation → Arbitration) is represented with gating logic to ensure required artefacts are uploaded before progression.
- **Application Review Board:** Provider leads can bulk advance candidates, attach review notes, and trigger interview scheduling from inline actions. Every decision writes to provider audit logs and analytics rollups.

## Financial Operations
- **Escrow Release:** Flow enforces dual-approval for amounts above configured thresholds and logs audit events. If a dispute is open, release is blocked and a modal explains next steps.
- **Invoice Management:** Generates invoice drafts from timesheets. Finance leads can edit line items before sending. Approvals trigger notifications and update analytics dashboards.
- **Budget Alerts:** When burn rate exceeds forecast, system surfaces a modal suggesting adjustments or contacting support.

## Communication & Support
- **Chat Context Switching:** Chat requests inherit context from the screen where they were launched (project ID, job ID). Support hand-offs include SLA classification.
- **Approval Nudges:** Push notifications are batched hourly; if ignored after 24 hours, escalations go to designated backup approvers.
- **Workspace Notes:** Providers can author internal notes against talent profiles with visibility controls (internal/shared/compliance) that sync to provider contact notes and trigger alerts when compliance tags added.
- **Sanitised Service Guardrails:** Application review, messaging, and workspace admin flows display badges when sensitive metadata is withheld by the ORM layer, prompting escalation or refreshed fetches before high-risk actions.

## Workspace Administration
- **Member Lifecycle:** Invite, pending, active, suspended, and revoked states follow structured flows; admin dashboards expose outstanding invites with resend/revoke actions.
- **Role Templates:** Owners can assign preconfigured permission sets or customise combinations, ensuring provider workspace members align to backend role constraints.
- **Compliance Export:** Workspace admins can request data exports of member activity, application decisions, and notes—requests queue background jobs and alert requestors upon completion.

## Settings & Compliance
- **Team Permissions:** Role management flow includes predefined templates (Admin, Finance, HR, Recruiter) with ability to clone/customise.
- **Audit Log Export:** Users can request exports for specific time ranges. Completion triggers a secure download link sent via email and inbox message.

## Error Handling & Recovery
- **Offline Mode:** Key workstreams (project review, approvals, talent search) cache the last-known data. Actions queue locally and sync once connectivity resumes.
- **Session Expiry:** If session expires mid-approval, the user is routed back to the exact context post re-authentication.
