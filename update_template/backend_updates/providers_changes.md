# Providers Changes

## Messaging & Notifications
- Upgraded SendGrid provider integration to use Event Webhook v3 with mutual TLS; fallback uses signed payload verification.
- Added WhatsApp provider via Twilio Conversations for high-urgency agency alerts with opt-in compliance tracking.

## Payments
- Swapped legacy Stripe Connect integration for REST-based onboarding using `stripe.accounts.create` with KYC status polling.
- Added provider abstraction for bank payouts supporting ACH and SEPA through a unified interface consumed by finance services.

## Storage & CDN
- Migrated asset provider from S3 standard buckets to S3 Intelligent-Tiering with lifecycle policies tuned for media workloads, reducing storage costs by 18%.
- Added CloudFront signed URL generation helper for provider profile assets with 5-minute expiry windows.

## Reliability
- Providers now expose standardized health checks consumed by `dependencyHealth` observer; failing providers automatically remove themselves from the routing pool.
- Implemented circuit breaker pattern via `opossum` library for each external provider with custom fallback strategies.
