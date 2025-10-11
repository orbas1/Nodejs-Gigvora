# Trust & Escrow Operations Runbook – Version 1.00

## Purpose
Document day-to-day procedures for monitoring escrow balances, handling disputes, interacting with the Cloudflare R2 evidence store, and coordinating releases/refunds in alignment with FCA, GDPR, and PCI requirements.

## Contacts
- **Trust & Compliance Lead:** trust@gigvora.com (pager rotation: weekly)
- **Finance Operations:** finance-ops@gigvora.com
- **Cloudflare R2 Administrators:** infra@gigvora.com
- **On-call Escalation:** #trust-ops Slack channel, PagerDuty schedule `trust-ops`

## Daily Checklist
1. Review Trust Center dashboard at start of shift; confirm totals by status match ledger export from previous day.
2. Reconcile release queue items older than 48 hours – either release with documented approval or escalate to finance for investigation.
3. Check dispute queue for overdue deadlines; notify assigned mediator via Slack and update dispute record if extensions granted.
4. Validate Cloudflare R2 evidence health indicator; if degraded, run `npm run trust:r2-healthcheck` in the backend repo and attach results to incident ticket.
5. Export dispute activity log (`SELECT * FROM dispute_events WHERE eventAt > :startOfDay`) for compliance archive.

## Release Process
1. Operator selects transaction in Trust Center release queue and triggers **Release now**.
2. System records `releasedAt`, updates audit trail, and removes transaction from queue.
3. Operator posts confirmation in `#trust-ops` with reference ID, amount, and release justification.
4. Finance system sync (hourly) posts payout to payment provider; monitor for failure webhook.

## Refund Process
1. Operator reviews dispute case; if settlement requires refund, trigger refund via Trust Center or CLI `node scripts/trust/refund.js <reference>`.
2. Ensure dispute status is updated to `settled` with resolution notes.
3. Attach refund receipt to dispute record and notify finance operations.

## Dispute Handling
- **Intake:** Auto-opened when customer raises dispute; assign mediator within 4 business hours.
- **Mediation:** Collect evidence via Trust Center or secure upload; ensure Cloudflare R2 key stored on dispute event.
- **Arbitration:** Engage legal; escalate to compliance lead; document decision in resolution notes.
- **Resolved:** Trigger refund or release, close case, and archive evidence after 180 days via lifecycle policy.

## Incident Response
- If Trust Center overview fails to load, run health checks on `/api/trust/overview` and database; raise incident if outage >10 minutes.
- Evidence upload failures require immediate escalation to Cloudflare team; pause dispute intake and communicate workaround to support.

## Compliance & Audit
- Retain dispute events and evidence metadata for 7 years.
- Weekly export ledger summary and dispute outcomes to finance; store in encrypted S3 bucket `gigvora-compliance/trust/YYYY-MM-DD.csv`.
- Quarterly review runbook and update with new regulatory guidance.

## Appendices
- **CLI Scripts:** Documented in `docs/trust-cli.md` (backend repo) for ad-hoc releases/refunds.
- **API Reference:** `/api/trust/*` endpoints detailed in `backend_updates/api_changes.md`.
- **Dashboard Ownership:** Trust Center maintained by Operations Design; report bugs via Jira component “Trust Operations”.
