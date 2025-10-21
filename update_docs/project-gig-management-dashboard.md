# Project & Gig Management Dashboard

## Mission
Equip programme managers and operations leads with a consolidated workspace to monitor delivery health, coordinate teams, and maintain financial discipline across gigs, projects, and launchpad engagements.

## Feature Highlights
- **Role-Aware Access** – `useProjectManagementAccess` enforces RBAC so only authorised roles (operations, agency admins, workspace owners) can enter the workspace. Denied users receive contextual messaging and escalation links.
- **Portfolio Overview** – Summary tiles surface project counts, total allocated budget, average progress, and critical due dates using data returned from `useProjectWorkspace`.
- **Project Navigator** – Left-hand list summarises status, completion percentage, and due date per project. Buttons toggle active selection with accessible focus states.
- **Workspace Tabs** – Detail panel exposes tabs for execution plans, sprint backlogs, staffing, risks, and retrospectives via `ProjectWorkspaceSection` children.
- **Create & Update Workflows** – Modal dialog (`CreateWorkspaceDialog`) enables new project creation with validation, currency formatting, and status presets. Update workflows reuse the same form state and guard against validation gaps.
- **Real-Time Feedback** – Inline banners communicate save success, validation errors, and API issues using `DataStatus` and toast utilities.

## Integrations
- **Calendar & Timeline Sync** – Projects link to timeline data enabling milestone visualisation and dependency tracking.
- **Finance Controls** – Budget fields integrate with finance services to reconcile spend versus allocation, exposing anomalies for review.
- **Resource Planning** – Workspace surfaces staffing data and availability signals sourced from agency/freelancer services.

## Security & Governance
- Every mutation routes through admin project management services (`adminProjectManagement.js`), enforcing server-side RBAC and audit logging.
- Actions are debounced and idempotent to prevent duplicate submissions; optimistic updates roll back on failure with clear messaging.
- Export buttons generate stakeholder-friendly PDFs/CSVs for weekly governance reviews.

## UX & Accessibility
- Layout employs responsive grids with generous spacing for clarity on widescreen monitors while remaining usable on tablets.
- Buttons, dialogs, and tabs provide keyboard navigation, focus outlines, and screen-reader labels.
- Color palette aligns with design tokens used across the platform, maintaining brand consistency.

## Testing & Quality
- Component tests under `components/admin/gigManagement/__tests__` cover list rendering, form validation, RBAC denial paths, and API integration stubs.
- Hooks tests validate `useProjectWorkspace` data mapping, ensuring budgets, progress percentages, and risk summaries are formatted correctly.
- CI verifies linting, unit tests, and build output for the dashboard before deployment.

## Roadmap
- Upcoming additions include predictive capacity modelling, AI-powered status summaries, and JIRA/Linear connectors for enterprise workflows.
