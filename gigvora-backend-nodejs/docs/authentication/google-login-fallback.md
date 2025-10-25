# Google OAuth Fallback Behaviour

Gigvora's backend disables Google OAuth logins automatically when the runtime is missing the `GOOGLE_CLIENT_ID` environment variable. The `authService.loginWithGoogle` helper inspects the runtime configuration and throws a `503` error with the message "Google login is not configured." before attempting to verify any identity tokens.【F:gigvora-backend-nodejs/src/services/authService.js†L261-L300】

When the guard triggers, the controller still resolves an HTTP response via the standard error middleware. Operators should surface this condition as a temporary outage to clients and confirm the environment is configured with a valid Google OAuth client ID and secret pair. Once the credentials are restored, the service resumes issuing sessions without requiring a deploy or hot reload.

For environments where Google OAuth is intentionally unavailable (for example, development sandboxes), the fallback provides a predictable failure mode while leaving email and 2FA flows unaffected. If you need to suppress the error for sandbox automation, wrap the request in logic that detects the 503 response code and prompts the user to fall back to email login instead of retrying the OAuth flow indefinitely.【F:gigvora-backend-nodejs/src/controllers/authController.js†L69-L108】【F:gigvora-backend-nodejs/src/services/authService.js†L261-L340】
