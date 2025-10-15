# Backend Integration Updates — User App (11 Apr 2024)

- **Refresh Token Workflow:** The Flutter app now exchanges stored refresh tokens against `/auth/refresh`, mirroring the
  hardened backend audit trail. The app persists the renewed tokens, records login state via the session controller, and clears
  credentials when the backend returns `401`/`403` so compromised sessions cannot linger on-device.
- **Runtime Health Polling:** Bootstrap now calls `/health/ready` prior to attempting a refresh. When the backend responds with
  maintenance or degraded status, the app surfaces maintenance messaging instead of attempting API calls that would fail.
- **Audit Awareness:** Authenticated refresh requests include the device IP (when available) so backend audit logs capture the
  mobile context alongside web refreshes, supporting forensic analysis and rate controls.
