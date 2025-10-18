# Pages & Routing Updates

- Registered `/admin/runtime` route that renders `AdminOperationsConsole` within `AdminLayout`. Route metadata now includes
  `requiresOpsToken: true` so the router prompts for MFA when necessary.
- Added lazy-loaded chunk `runtime-ops-console.chunk.js` to isolate heavy observability dependencies from the default admin
  bundle.
- Updated `AppRoutes.jsx` to redirect legacy `/admin/health` links to the new runtime console with a flash message explaining
  the enhanced controls.
