## Admin Dashboard Enhancements

- Registered the moderation dashboard route in `adminMenuConfig`/`menuSections` so operations teams can navigate to the new workspace without manual URL entry.
- Added modular components (`ModerationOverviewCards`, `ModerationQueueTable`, `ModerationAuditTimeline`) to render analytics, actionable queues, and historical audits in the admin layout system.
- Implemented resolution flows with confirmation dialogs, SLA breach indicators, and optimistic queue refreshes tied to the realtime moderation namespace.
