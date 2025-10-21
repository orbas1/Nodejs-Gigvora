## Policy & RBAC Changes

- Replaced the legacy role toggles with a centralized `accessControlPolicy` module that maps every route, websocket namespace, and background worker action to scoped permissions (admin.moderation, support.inbox, community.curate, etc.), ensuring least-privilege defaults and auditable overrides.
- Added policy enforcement middleware to `/admin/**`, `/support/**`, `/community/**`, and realtime namespaces so that JWT roles, persona state, and suspension flags are evaluated before any controller executes; mismatches return `403` with correlation IDs for SOC review.
- Introduced signed policy acknowledgements: critical policies (Terms, Privacy, Community Guidelines, Refunds) now require an acknowledgement event stored against the user persona, with dashboards surfacing outstanding acknowledgements for compliance teams.
- Hardened moderation queue actions by requiring two-person review for permanent bans, logging escalation context, and publishing webhook notifications to the incident response Slack channel when thresholds are reached.
- Documented CORS governance: preflight policies now only allow trusted origins per environment, enforce credential flags where required, and expose the policy manifest so frontend teams can request changes through the governance workflow.
