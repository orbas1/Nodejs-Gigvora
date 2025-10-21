# Environment Updates

- Update `CORS_ALLOWED_ORIGINS` and `CALENDAR_STUB_ALLOWED_ORIGINS` to include production mobile domains (Android App Links and iOS Universal Links) before rollout.
- Ensure `JWT_REFRESH_EXPIRES_IN` (or `JWT_REFRESH_SECRET`) reflect reduced inactivity windows for mobile tokens (12 hours recommended) and rotate secrets prior to launch.
- Populate analytics DSNs (e.g., Amplitude, Datadog) if mobile telemetry is aggregated separately; document values in the secure config vault rather than the repository.
- Confirm `REALTIME_ALLOWED_ORIGINS` aligns with the mobile origin list to avoid socket handshake failures.
