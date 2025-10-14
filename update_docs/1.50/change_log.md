# Version 1.50 Update Change Log

## 04 Apr 2024
- Decoupled the Node.js API server lifecycle from background workers, added graceful shutdown hooks, and published `/health/live` plus `/health/ready` endpoints with structured telemetry for operators and mobile clients.
- Hardened inbound request handling via correlation-aware logging, configurable payload limits, and environment-tuned rate limiting to align with security remediation goals.
- Delivered design specifications for maintenance-mode messaging, health telemetry widgets, and rate-limit disclosures across web and mobile experiences, updating associated design trackers and task plans.

---

# Historical Note — Version 1.10
- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.
