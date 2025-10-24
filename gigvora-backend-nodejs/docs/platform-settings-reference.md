# Platform Settings Reference

This reference explains each configurable section exposed through the admin platform settings API and dashboard. Every setting is persisted in the `platform_settings` record and feeds live configuration, dependency validation, and compliance guardrails across the platform.

## Commissions
- **Purpose:** Controls platform-wide commission policies applied to marketplace transactions.
- **Key Fields:**
  - `enabled` toggles whether commissions apply to payouts.
  - `rate` sets the percentage service fee (validated between 0 and 100).
  - `minimumFee` enforces the floor value charged on each transaction.
  - `providerControlsServicemanPay`, `servicemanMinimumRate`, and `servicemanPayoutNotes` describe compliance rules for subcontractor payments.
- **Impact:** Updates re-seed billing calculators, payment statements, and trust dashboards. Excessive rates (>100% combined with serviceman minimums) are rejected to protect pricing integrity.

## Subscriptions
- **Purpose:** Governs paid membership tiers and feature gating.
- **Key Fields:**
  - `enabled` toggles whether subscription paywalls are active.
  - `restrictedFeatures` lists feature flags locked behind paid plans.
  - `plans` defines tier metadata (price, interval, description, trials).
- **Impact:** Changes refresh entitlement checks on dashboards and API payloads so users immediately see updated access rights.

## Payments
- **Purpose:** Configures the primary payment processor and escrow controls.
- **Key Fields:**
  - `provider` selects `stripe` or `escrow_com` (validated against the supported list).
  - Provider-specific credentials (Stripe keys, Escrow.com API keys) are encrypted at rest and decrypted only for authorised admins.
  - `escrowControls` manage hold periods, auto-release timers, manual approval thresholds, notification recipients, and descriptors.
- **Impact:** Saving changes re-runs dependency health checks (`syncCriticalDependencies`) so observability dashboards immediately surface configuration issues. Provider transitions trigger admin notifications and audit entries.
- **Security:** Secrets are persisted as `enc:v1:*` ciphertext strings using AES-GCM via `secretStorage`. Diff history masks values but retains hashed previews to confirm rotation.

## SMTP
- **Purpose:** Supplies transactional email credentials and defaults.
- **Key Fields:** Host, port, TLS flag, username, password (encrypted), `fromAddress`, and `fromName`.
- **Impact:** Updates refresh mailer clients and compliance mail logs. Password changes are tracked in audits with masked previews.

## Storage
- **Purpose:** Configures asset storage provider (Cloudflare R2 today).
- **Key Fields:** Provider key, R2 account/bucket identifiers, access keys (encrypted), endpoint, and public base URL.
- **Impact:** Used by upload services, media rendering, and trust centre diagnostics. Credential rotations are audited and notify platform admins.

## App Metadata
- **Purpose:** Declares platform identity for downstream services.
- **Key Fields:** Application name, environment label, client and API URLs.
- **Impact:** Feeds telemetry, policy documents, and runtime clients referencing canonical URLs.

## Database
- **Purpose:** Mirrors runtime database connection hints (non-secret attributes only).
- **Key Fields:** Connection URL, host, port, database name, username.
- **Impact:** Supports diagnostic surfaces and self-healing scripts without exposing passwords (managed separately through database settings service).

## Feature Toggles
- **Purpose:** Enables or disables major subsystems (escrow, subscriptions, commissions).
- **Impact:** Immediate gating of UI routes and backend services. Escrow toggle cannot be disabled when `escrow_com` is the active payment provider, ensuring compliance coverage remains in place.

## Maintenance Windows
- **Purpose:** Communicates planned downtime and support contacts.
- **Key Fields:** Window list with start/end timestamps, impact level, timezone, contact, status page URL.
- **Impact:** Drives status page rendering, in-app alerts, and support runbooks.

## Homepage Experience
- **Purpose:** Administers marketing hero, announcement bar, value propositions, feature sections, testimonials, FAQs, quick links, and SEO metadata for the public site.
- **Impact:** Changes are versioned alongside monetisation settings so audits capture content updates for governance and marketing compliance.

## Audit & Notification Workflow
- Every update produces a `platform_setting_audits` row summarising changed fields, masked before/after snapshots, actor metadata, and the total change count.
- Notifications are queued for platform, compliance, finance, and trust roles so relevant admins receive high-priority alerts describing the modified fields.
- Cached snapshots are invalidated and rebuilt to guarantee deterministic reads from `getPlatformSettings()` across services.

## Operational Notes
- All configuration retrievals honour an in-memory cache (60s TTL). Mutation handlers invalidate the cache and rehydrate it with the decrypted snapshot.
- Validation rejects unsupported providers and enforces required credentials whenever payment processors are toggled.
- Secrets entered through the admin UI are re-encrypted on each save, and masked previews (last four characters) confirm the active credential without exposing full values.
