# Configuration Changes

- **Runtime Config (`src/config/runtimeConfig.js`)**
  - Mobile bundle origins added to the shared `allowedOrigins` list so security and realtime modules stay in sync.
  - Re-confirmed compression, rate limiting, and worker defaults to ensure mobile traffic does not bypass protections.
- **HTTP Security (`src/config/httpSecurity.js`)**
  - Hardened CORS guard logging for rejected origins and aligned max age with mobile client expectations (10 minutes).
  - Simplified middleware export so downstream routers receive consistent per-request origin evaluations.
- **Realtime Socket Server (`src/realtime/socketServer.js`)**
  - Normalised origin resolution by merging security and realtime allow-lists, preventing configuration drift.
- **Environment Templates (`.env.example`)**
  - Release notes emphasise updating `CORS_ALLOWED_ORIGINS` and `CALENDAR_STUB_ALLOWED_ORIGINS` to include production mobile domains before launch.
