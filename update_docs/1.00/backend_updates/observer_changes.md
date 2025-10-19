## Observability Changes

- Added realtime connection registry metrics (active sockets, user counts) to the runtime logger, providing operators with visibility into socket churn during scale events.
- Logged SKIP_SEQUELIZE_BOOTSTRAP usage to the test telemetry feed so CI output captures when suites exercise the lightweight bootstrap path.
- Streamed moderation event lifecycle logs (created, escalated, resolved) with severity tags to support SOC review and ensure queue movements are observable.
