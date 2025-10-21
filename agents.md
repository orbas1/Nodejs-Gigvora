# Contributor enablement notes

- Run `npm test` inside `gigvora-backend-nodejs` and `melos run ci:verify` inside the Flutter workspace before submitting any pull request so backend, web, and mobile suites stay green.【F:gigvora-backend-nodejs/package.json†L7-L31】【F:melos.yaml†L9-L22】
- Respect the RBAC vocabulary defined in `.env.example` (`calendar:view`, `calendar:manage`, etc.) when adding new services or routes—the calendar stub and backend enforce these roles and clients should surface tailored UX instead of raw 403s.【F:gigvora-backend-nodejs/.env.example†L44-L61】【F:calendar_stub/server.mjs†L210-L323】
- Keep operational docs (`gigvora-backend-nodejs/docs/`) and progress trackers current whenever you touch compliance, schema, or incident response materials so stakeholders can audit changes quickly.【F:gigvora-backend-nodejs/docs/data-governance.md†L1-L120】
