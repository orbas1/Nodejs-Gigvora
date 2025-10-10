# Dashboard Organisation – Web Application v1.50

## Module Hierarchy
1. **Top rail**: workspace selector, date range filter, export button, help icon.
2. **Primary grid**: metric tiles (Active gigs, Open roles, Pending payouts, Compliance score).
3. **Secondary row**: split view with Project pipeline (left) and Escrow/Compliance alerts (right).
4. **Tertiary row**: tables for Applicants in review, Contracts expiring, Upcoming milestones.
5. **Footer utility**: Quick links to create gig, open insights, contact support.

## Filtering & Personalisation
- Date range filter persists per user; defaults to last 30 days.
- Role-based modules: Finance roles see billing summary; Talent managers see applicant pipeline.
- Users can reorder modules via drag handle; layout stored server-side for cross-device persistence.

## Notifications Integration
- Notification icon displays count; clicking opens side panel overlaying dashboard.
- Inline badges highlight modules with outstanding tasks (e.g., "3 payouts awaiting release").

## Empty States
- When no data, show friendly illustration and CTA (e.g., "Publish your first gig" with button).
- Provide import links if data migration available.
