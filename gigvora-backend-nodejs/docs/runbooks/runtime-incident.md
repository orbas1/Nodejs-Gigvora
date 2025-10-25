# Runtime Incident Response Runbook

This runbook guides on-call engineers and operations analysts through coordinated response when runtime telemetry, health checks, or perimeter defences degrade. It links the Prometheus metrics exporter, worker telemetry gauges, and shutdown orchestration logs introduced in Version 1.50.

## Table of Contents

- [1. Confirm Incident Context](#1-confirm-incident-context)
- [2. Restore Monitoring Exporter](#2-restore-monitoring-exporter)
- [3. Investigate Rate-Limit & Perimeter Pressure](#3-investigate-rate-limit--perimeter-pressure)
- [4. Guard Database Drains During Shutdowns](#4-guard-database-drains-during-shutdowns)
- [5. Communicate & Document](#5-communicate--document)
- [6. Preventive Follow-up](#6-preventive-follow-up)
- [Contacts](#contacts)

## 1. Confirm Incident Context

1. Check the `/health/metrics` endpoint to confirm scrape freshness. A `gigvora_metrics_seconds_since_last_scrape` value greater than 180 seconds indicates stalled Prometheus collection.
2. Review the admin dashboard runtime panel for matching alerts. Operations cards surface exporter state plus rate-limit, WAF, perimeter, and worker queue health counters.
3. Verify readiness: `/health/ready` should continue to return HTTP 200 when only monitoring is impacted. If readiness degrades, escalate to the broader service outage procedure.

## 2. Restore Monitoring Exporter

1. Inspect Prometheus or scraping job logs. Most failures originate from firewall rule updates or stale service discovery cache entries.
2. If the scraping job is down, restart the Prometheus agent or Kubernetes `ServiceMonitor` targeting the API instance.
3. Confirm the exporter recovers by hitting `/health/metrics` twice—the second response should report `gigvora_metrics_scrapes_total` incremented by 1 and `gigvora_metrics_seconds_since_last_scrape` reset to `0`.
4. Update the incident channel once scrapes resume. The Flutter and web clients automatically clear the stale-alert snackbar on the next healthy poll.

## 3. Investigate Rate-Limit & Perimeter Pressure

1. Use the lifetime counters in the metrics feed:
   - `gigvora_rate_limit_hits_total` and `gigvora_rate_limit_blocked_total` for throttled traffic.
   - `gigvora_perimeter_blocked_requests_total` for blocked origins.
   - `gigvora_waf_blocked_requests_total` for WAF decisions.
    - `gigvora_worker_status` and `gigvora_worker_queue_pending{worker="profileEngagement"}` for background queue health.
2. Cross-reference with the admin runtime panel, which lists top offending keys, origins, and WAF rules. Export the snapshot if further analysis is required.
3. If a single consumer is responsible, raise or extend the corresponding perimeter auto-block window using the admin runtime API (`PATCH /api/admin/runtime/maintenance/...`).

## 4. Guard Database Drains During Shutdowns

1. Metrics feed gauges (`gigvora_database_pool_*`) mirror the lifecycle snapshots used in readiness endpoints.
2. If `gigvora_database_pool_pending` grows steadily and readiness status is degraded, verify whether a shutdown or deployment is draining connections. Check the runtime security audit log for `database.connection.shutdown_failed` events.
3. Initiate the controlled shutdown via `npm run lifecycle:shutdown` only after ensuring worker queues are drained. Monitor the metrics feed until pool sizes return to zero.

## 5. Communicate & Document

1. For sustained incidents (>15 minutes) notify stakeholders through the maintenance registry so public banners reflect current state. Use the existing `operations` channel message template.
2. Capture findings in the incident ticket, referencing metric counters and timestamps (e.g. `gigvora_metrics_last_scrape_timestamp`).
3. After resolution, update the incident retrospective with root cause (network ACLs, scraper crash, etc.) and preventive actions (alerts, runbooks, automation).

## 6. Preventive Follow-up

1. Configure Prometheus alert rules on scrape freshness (`metrics_seconds_since_last_scrape > 240`).
2. Add Grafana dashboards for rate-limit, WAF, and perimeter lifetime counters to give operations continuous visibility outside the admin UI.
3. Ensure runbook links remain visible from the admin runtime panel and the internal Confluence incident response index.

## Contacts

- **Primary On-call:** Platform Engineering PagerDuty rotation.
- **Secondary:** Security Operations rotation (escalate for WAF/perimeter anomalies).
- **Shared Channel:** `#gigvora-operations` for cross-team coordination.

Keep this runbook updated after every major incident to reflect tooling or workflow changes.
