# App Screens Drawings — Runtime Health & Alerts (v1.50)

## Purpose
Document the annotated mobile layouts that visualise runtime maintenance and Prometheus exporter telemetry so Flutter engineers can implement the alerts without reinterpreting specs.

## Exporter Alert Snackbar
- **Layout:** Anchored above the bottom navigation with 16px horizontal margin, 12px radius, and elevation `6dp` to clear FAB shadows.
- **Content Blocks:** Pulse glyph (24px) leading icon, headline "Metrics exporter stale", supporting text showing `Last scrape {{relativeTime}}`, and stacked CTA buttons (`View telemetry`, optional `Runbook`).
- **States:**
  - Healthy dismissed state hidden; no UI.
  - Warning uses amber background `#FACC15` with dark text, retains single CTA.
  - Error uses crimson background `#DC2626`, displays both CTAs and an inline countdown chip.
- **Accessibility:** aria-live `assertive` for warning/error, `polite` for success reset; haptic medium impact on show.

## Telemetry Drawer
- **Entry:** Triggered from `View telemetry` CTA or long-press on snackbar.
- **Header:** Exporter icon, status chip (Healthy/Warning/Error), close icon.
- **Body:**
  - Uptime gauge (semi-circle) labelled in % with caption "Past 24h".
  - Scrape history sparkline covering last 12 scrapes with tooltip dots.
  - Failure streak list enumerating timestamps, each row with severity dot and copy.
  - Runbook CTA (secondary button) and manual refresh ghost button.
- **Footer:** Support contact chip, note "Follow incident runbook if streak > 3".

## Success Dismissal
- After recovery, snackbar returns briefly with green background `#22C55E`, text "Metrics exporter restored", and subtle confetti overlay.
- Drawer displays success badge, disables runbook CTA, and swaps failure list for timeline summary showing downtime duration.

## Linkages
- Strings reference localisation keys (`runtime.exporter.snackbar.warning`, etc.).
- Telemetry data bound to runtime health repository (`RuntimeHealthSnapshot.exporter`).
- Interactions emit analytics events: `runtime_exporter_snackbar_viewed`, `runtime_exporter_runbook_clicked`, `runtime_exporter_manual_refresh`.

## Domain Governance Summary Card (Added 23 Apr)
- **Layout:** Placed within admin home dashboard below runtime telemetry row;
  card uses 16px padding, 8px spacing between summary metrics row and remediation
  list. Avatar stack positioned top-right with steward initials.
- **Summary Metrics:** Three chips (Approved, Monitoring, Remediation Required)
  show counts with inline icons. Overdue countdown pill sits above remediation
  list when tasks exist.
- **Remediation List:** Each row includes context name, severity badge, steward
  initials, and CTA chevron. Tap opens governance detail sheet.
- **Empty/Healthy States:** Empty uses clipboard illustration + CTA `Plan review cadence`; healthy uses shield ribbon graphic and copy referencing next review.
- **Accessibility:** Entire card accessible via VoiceOver group; status chips
  announce severity and time until next review. Analytics event
  `governance_summary_card_viewed` fires on mount.

## Governance Detail Sheet (Added 23 Apr)
- **Entry:** Triggered from summary card or alerts menu.
- **Header:** Context name, classification pill (PII tier), steward avatar + role
  label, close icon.
- **Body:**
  - Review timeline vertical stepper with badges for Approved/Remediation.
  - Scorecard progress bars for privacy, retention, classification.
  - Remediation checklist with toggles; notes field surfaces latest audit
    summary.
  - Support contact chips (email, Slack) and export button anchored bottom.
- **States:** Loading shimmer replicates layout; offline state surfaces cached
  snapshot message with timestamp; error state offers retry CTA.
- **Analytics:** `governance_detail_export_clicked`, `governance_remediation_toggle`,
  `governance_contact_clicked` events emitted with context metadata.
