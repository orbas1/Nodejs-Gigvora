# User Phone App Change Log — 11 Apr 2024

1. **Secure Session Bootstrap & Refresh:** Replaced the demo bootstrap with the production refresh-token handshake. The
   `session_bootstrapper` now polls `/health/ready`, attempts `/auth/refresh`, records login audits, and clears tokens when
   refresh fails so users receive actionable “secure session expired” messaging.
2. **Runtime Health Awareness:** Added a runtime health repository that calls `/api/admin/runtime/health` (with `/health/ready`
   fallback) so the mobile app mirrors the admin dashboard's maintenance state. The bootstrapper surfaces maintenance copy when
   the backend is degraded and suppresses stale data loads.
3. **Test Automation:** Introduced widget tests covering session bootstrap success/failure scenarios and repository tests
   verifying the runtime health fallback logic. These tests document the refresh workflow and ensure mobile stays in lockstep
   with backend lifecycle changes.
