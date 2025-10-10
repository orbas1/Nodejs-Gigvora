# Functional Design Narrative – Web Application v1.50

## Core Journeys
1. **Discover gigs and opportunities**
   - Home page hero exposes segmented CTAs for talent vs organisations.
   - Launchpad module surfaces personalised recommendations using skill graph and location data.
   - Explore page filters (skill, rate, availability) persist via URL query parameters.

2. **Publish and manage gigs**
   - Guided wizard collects scope, requirements, compliance documents.
   - Dashboard lists gigs with status badges (Draft, Live, Paused) and quick actions.
   - Slide-over editing enables inline updates without leaving context.

3. **Collaborate and deliver work**
   - Project board toggles between Kanban and timeline views; tasks include file attachments, comments, and time tracking.
   - Escrow timeline clarifies payment events; release actions available based on permission tier.
   - Dispute resolution path includes structured evidence submission and mediator chat integration.

4. **Insights & Reporting**
   - Insights page aggregates KPIs (fill rate, completion score, spend) with drill-down charts.
   - Export options (CSV, PDF) accessible via toolbar; operations log tracks downloads.

5. **Account & Settings**
   - Settings hub centralises organisation profile, billing, compliance, integrations, notifications.
   - Workspace switcher allows users to jump between organisations without re-auth.

## Cross-functional Requirements
- **Role-based access control:** UI components respect permission matrix; disabled actions show tooltip explaining restrictions.
- **Real-time sync:** Notifications, tasks, and chat rely on WebSocket channels; offline states degrade gracefully with banners.
- **Auditability:** Activity logs available on each entity (gig, project, payout) accessible via timeline rail.
- **International support:** Currency selection cascades across budgets, invoices, and analytics; metrics convert using backend rates.
- **Help & Support:** Persistent help launcher offering guided tours, documentation links, and live chat escalate path.
