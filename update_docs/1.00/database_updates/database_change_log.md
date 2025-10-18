# Database Change Log — Task 1

- Added connection pool validation hooks executed during runtime bootstrap to ensure charset, collation, and SSL options align
  with configuration before the API accepts traffic.
- Exposed pool saturation metrics (`used`, `available`, `queued`) to the readiness endpoint and admin dashboards.
- Documented transaction-safe shutdown workflow that drains long-running transactions before worker teardown to avoid dangling
  locks during restarts.
