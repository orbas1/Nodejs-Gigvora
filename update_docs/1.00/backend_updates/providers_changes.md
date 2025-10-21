## Provider Integrations

- Finalised Chatwoot integration: OAuth client provisioning per environment, signed HMAC secrets rotated via the secrets manager, webhook verifier shared library, and SLA escalation hooks feeding the messaging domain.
- Refreshed AWS S3-compatible storage providers (Cloudflare R2, Wasabi, and local MinIO) with per-tenant buckets, KMS-managed encryption keys, and lifecycle policies enforcing retention rules for media and legal artefacts.
- Added HubSpot and Salesforce sync providers with rate-limit aware batching, OAuth token refresh daemons, and granular error reporting so CRM teams receive actionable diagnostics without exposing tokens in logs.
- Hardened SMTP/email providers by enforcing TLS 1.2+, STARTTLS verification, DKIM signing, and per-environment sending domains with bounce tracking surfaced in the observability dashboards.
- Wrapped external API clients (LinkedIn, Google, Apple) with defensive retry/backoff policies, idempotency keys, and audit logging so security teams can trace sign-in anomalies and revoke compromised tokens swiftly.
