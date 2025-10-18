# Front-end Evaluation — Version 1.00

## Functionality
- The SPA’s router duplicates protected dashboards in two different render paths, making it easy for one set to drift from the other and causing inconsistent guard behaviour when route props change.【F:gigvora-frontend-reactjs/src/App.jsx†L331-L599】
- API access defaults to `http://localhost:4000/api`, which does not match the backend’s default port 5000, so the app fails to reach local services out of the box.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L1-L88】【F:gigvora-backend-nodejs/src/server.js†L26-L88】
- The API client blindly assumes JSON responses for all non-text payloads and strips the `Content-Type` header on form submissions, preventing file uploads that require multipart boundaries or binary downloads.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L168-L213】
- Route definitions are declared both in static arrays and as explicit `<Route>` elements later in the JSX tree, so changes must be applied in multiple places or users hit mismatched guards and duplicate screens.【F:gigvora-frontend-reactjs/src/App.jsx†L139-L452】
- The router renders dashboard collections twice—first via the route arrays and again with hard-coded `<Route>` elements—so React Router registers duplicate paths like `dashboard/user` and `dashboard/company`, which produces whichever handler mounts first and leaves the other unreachable.【F:gigvora-frontend-reactjs/src/App.jsx†L193-L520】

## Usability
- Route configuration lives in long arrays with manual duplication for every membership variant, making navigation updates error-prone and obscuring which roles see which experiences.【F:gigvora-frontend-reactjs/src/App.jsx†L139-L599】
- Session data is persisted in `localStorage` with homegrown serialization logic instead of a predictable state manager, complicating debugging and multi-tab consistency for support staff.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L85-L145】【F:gigvora-frontend-reactjs/src/services/apiClient.js†L215-L326】
- The API base URL is derived from build-time env vars without runtime discovery or UI cues, leaving end users guessing why the app appears offline when configuration is missing.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L1-L83】
- `App.jsx` sprawls across hundreds of lines with manual role gates, making it extremely difficult for designers or QA to audit which dashboards are reachable and discouraging incremental refactors.【F:gigvora-frontend-reactjs/src/App.jsx†L1-L599】

## Errors
- Failed requests surface only a generic “Request failed” message, discarding server-provided error bodies and hampering user-facing diagnostics.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L202-L213】
- `readStoredSession` swallows JSON parse errors and returns `null`, which silently logs users out without prompting them to reauthenticate or clear corrupt storage.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L85-L140】
- Routes lack a catch-all 404 view, so unknown URLs render a blank screen and trap users in navigation loops when deep links change.【F:gigvora-frontend-reactjs/src/App.jsx†L331-L599】
- Membership gating compares raw membership strings without normalising case, so any backend session that returns capitalised roles fails the client-side check and wrongly blocks access.【F:gigvora-frontend-reactjs/src/components/auth/MembershipGate.jsx†L27-L36】
- React Router sees the same `dashboard` routes defined both in data arrays and explicit JSX, surfacing confusing navigation warnings in development and making it hard for QA to know which handler is active when screens diverge.【F:gigvora-frontend-reactjs/src/App.jsx†L193-L520】

## Integration
- Concurrent requirement of credentials cookies and `Authorization` headers leads to duplicated authentication state across the API boundary, confusing backend expectations and complicating CORS preflight setup.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L168-L213】
- `x-roles` headers are populated from cached membership data with no sync to server-issued role tokens, so stale sessions can misrepresent permissions until the next refresh.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L118-L145】
- The router hardcodes admin-only paths but does not align with backend feature toggles or capability checks, risking UI access to endpoints that may not exist server-side yet.【F:gigvora-frontend-reactjs/src/App.jsx†L269-L383】
- Dashboard fallbacks send unauthorised users to the first membership-specific route rather than a safe default, creating jarring cross-navigation when roles fall out of sync with backend entitlements.【F:gigvora-frontend-reactjs/src/components/auth/RoleProtectedRoute.jsx†L1-L63】
- Dev server defaults in Vite (`5173`) conflict with the npm start script override (`4173`), so integration tests and manual QA often boot two copies of the SPA targeting different ports before anyone notices the mismatch.【F:gigvora-frontend-reactjs/vite.config.js†L5-L12】【F:gigvora-frontend-reactjs/package.json†L6-L24】

## Security
- Persisting access and refresh tokens in `localStorage` exposes them to any XSS payload; there is no in-memory fallback or secure cookie strategy to mitigate theft.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L18-L288】
- Custom headers like `x-user-id` and `x-roles` are sourced from client-controlled storage and can be manipulated by attackers to escalate privileges if backend trust is insufficiently strict.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L118-L145】
- The router renders privileged components client-side before permission checks complete, risking information disclosure through bundled code even when navigation ultimately redirects.【F:gigvora-frontend-reactjs/src/App.jsx†L331-L599】
- Membership gating surfaces raw route labels and access hints to unauthorised users, leaking internal taxonomy (e.g., dashboard names) that should stay server-side to reduce reconnaissance vectors.【F:gigvora-frontend-reactjs/src/components/auth/MembershipGate.jsx†L37-L104】
- Role guards rely on cached `x-roles` headers without verifying them against backend-issued scopes, so any XSS that tampers with local storage can escalate privileges for all client-protected dashboards until the page reloads.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L110-L145】【F:gigvora-frontend-reactjs/src/App.jsx†L331-L520】

## Alignment
- Massive hard-coded route lists signal ambitions for numerous dashboards, yet there is no progressive disclosure or module-based loading, conflicting with UX goals for lean entry experiences.【F:gigvora-frontend-reactjs/src/App.jsx†L139-L599】
- The app still exposes `AdminLoginPage` and dozens of admin routes despite the lack of backend RBAC scaffolding in the evaluated API, indicating roadmap misalignment between teams.【F:gigvora-frontend-reactjs/src/App.jsx†L35-L304】
- Local storage session design contradicts security objectives emphasized in backend audits, highlighting the need for cross-team agreement on authentication posture before shipping.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L18-L288】【F:gigvora-backend-nodejs/src/middleware/errorHandler.js†L4-L28】
- Static imports for every dashboard lock the bundle to the entire product vision, clashing with plans for gradual feature rollouts or micro-frontend experiments.【F:gigvora-frontend-reactjs/src/App.jsx†L1-L304】

## Full Scan Notes
- The SPA bundles Agora, Mapbox, and dozens of dashboard pages eagerly, yet Vite lacks any `build.rollupOptions` splitting hints, so production builds will emit a monolithic chunk that hurts Core Web Vitals for first-time visitors.【F:gigvora-frontend-reactjs/vite.config.js†L1-L15】【F:gigvora-frontend-reactjs/src/App.jsx†L1-L520】
- Storybook or component-level documentation is absent even though the design system is imported directly into feature routes, leaving engineers without a canonical reference for shared UI dependencies during audits.【F:gigvora-frontend-reactjs/src/App.jsx†L1-L304】【F:gigvora-frontend-reactjs/package.json†L6-L33】
