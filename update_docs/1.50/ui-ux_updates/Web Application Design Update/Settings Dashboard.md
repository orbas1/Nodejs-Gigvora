# Settings Dashboard Overview – Web Application v1.50

## Purpose
Provide administrators a consolidated view of workspace health, compliance, billing, and configuration tasks.

## Layout
- **Hero summary:** displays workspace name, plan badge, next invoice date, compliance score.
- **Checklist widget:** outstanding tasks (upload W-9, enable 2FA, connect payroll).
- **Billing snapshot:** current usage, seats, add-ons, quick link to upgrade.
- **Security feed:** recent logins, device approvals, alerts for anomalies.
- **Integration status:** list of connected apps with success/warning badges.

## Actions
- Primary CTA: "Manage subscription" anchored top-right.
- Secondary actions: "Invite admin", "Review compliance", "Open audit log".

## Alerts
- Display top-level alert banner when compliance documents expire within 30 days.
- Payment issues display persistent warning until resolved.

## Data Refresh
- Refresh icon in hero summary triggers GraphQL refetch; auto-refresh every 15 minutes.
