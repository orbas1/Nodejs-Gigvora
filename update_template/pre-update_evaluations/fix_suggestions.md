# Pre-Update Fix Suggestions

## Critical (Blocker)
1. **Policy Snapshot Testing Gap**
   - *Issue:* No automated regression test verifying conflicting policy imports.
   - *Fix:* Implement Jest contract test + CI smoke test covering policy diff edge cases.
   - *Owner:* Backend Guild — **Due 8 Nov**.

2. **Mission API Rate Limit Tuning**
   - *Issue:* Current limits may throttle burst acknowledgements.
   - *Fix:* Deploy token bucket limiter (200 rpm, burst 60) with per-device keys; monitor via Prometheus alert.
   - *Owner:* Field Ops Engineering — **Due 15 Nov**.

## High Priority
3. **Credential Storage Encryption**
   - *Issue:* Legacy bucket lacked object-level encryption.
   - *Fix:* Completed migration to KMS-encrypted bucket; verify access logs weekly.
   - *Owner:* Platform Infra — **Completed**.

4. **CORS Allowlist Drift**
   - *Issue:* Missing mobile origin `m.gigvora.com` from preference service endpoint.
   - *Fix:* Update configuration service allowlist and add automated check in integration tests.
   - *Owner:* Security — **Completed**.

## Medium Priority
5. **Analytics Backfill Validation**
   - *Issue:* Need reconciliation report for trust score view backfill.
   - *Fix:* Run dbt snapshot comparison, attach report to release checklist.
   - *Owner:* Analytics — **Due 22 Nov**.

6. **Accessibility Audit Follow-ups**
   - *Issue:* Two components missing visible focus state.
   - *Fix:* Apply design token update; retest with Axe and manual keyboard walkthrough.
   - *Owner:* Frontend Guild — **Due 12 Nov**.

## Low Priority
7. **Support Documentation Sync**
   - *Issue:* Knowledge base articles outdated for new credential flow.
   - *Fix:* Update copy, record 3-minute walkthrough, publish before launch.
   - *Owner:* Customer Experience — **Due 9 Dec**.
