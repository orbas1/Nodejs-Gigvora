# Admin/Operations Dashboard Changes – Version 1.00

- Launched the Trust Center route (`/trust-center`) providing finance, compliance, and support teams with a consolidated operations dashboard.
- Dashboard surfaces escrow balances by status, release ageing buckets, dispute workload by stage, and Cloudflare R2 evidence health messaging.
- Release queue table allows operators to release milestones directly from the UI; actions call the new escrow release endpoint and refresh telemetry without page reloads.
- Inline success and error banners confirm release/refund outcomes and surface remediation steps when API calls fail, keeping operations in the dashboard context.
- Navigation updated to feature the Trust Center entry so operations teams can access the dashboard alongside existing programme surfaces.
