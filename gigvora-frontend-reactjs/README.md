# Gigvora Frontend (React + Tailwind)

This Vite-powered React application delivers the Gigvora experience across landing, registration, marketplace search, timeline, and admin login flows. Tailwind CSS and the Inter font pair with a crisp white-and-blue aesthetic that mirrors the Gigvora brand.

## Highlights

- **Home / Landing** with hero, opportunity overviews, and call-to-action.
- **Authentication** flows including stylized login, registration, company/agency onboarding, and dedicated admin console.
- **Explorer surfaces** for jobs, gigs, projects, experience launchpad, volunteering, groups, followers, and connections.
- **Freelancer dashboard reputation engine** that pulls live testimonials, success stories, metrics, badges, and shareable widgets from the Node API.
- **Agency mission control** with modular layout, navigation, and a full calendar workspace for managing projects, gigs, interviews, mentorship, and volunteering cadences.
- **Tailwind CSS** design tokens tuned to the Gigvora palette with the Inter font loaded globally.

## Getting Started

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173` and proxies API calls to the Node backend when configured.

## Environment configuration

Create a `.env.local` file in the project root (never commit secrets) and supply the runtime keys:

```bash
VITE_API_BASE_URL=https://api.your-gigvora-host.com
VITE_AUTH_DOMAIN=https://auth.your-gigvora-host.com
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client
```

- `VITE_API_BASE_URL` ensures REST calls inherit the correct CORS origin; the backend should allow the web origin and admin
  console origin explicitly.
- `VITE_AUTH_DOMAIN` is used by the RBAC middleware to fetch role claims securely.
- `VITE_GOOGLE_CLIENT_ID` powers Google OAuth login on the landing and admin pages.

When running locally alongside the Node backend, add the frontend origin (`http://localhost:5173`) to `ALLOWED_WEB_ORIGINS` in
the backend configuration so that CORS preflight checks succeed.

### Realtime calls & messaging

Set `VITE_API_BASE_URL` to your backend host and ensure the API is configured with Agora credentials. The web client consumes the `/api/messaging/threads/:id/calls` endpoint and uses `agora-rtc-sdk-ng` to join video and voice sessions directly from the inbox and dock UI.

## Quality gates & testing

```bash
npm run lint        # Enforces JSX accessibility, React, and security lint rules with zero tolerance for warnings
npm run test -- --run --coverage  # Executes the Vitest suite once with coverage reporting
npm run check       # Convenience task to lint and run tests in CI or pre-commit hooks
```

Vitest is configured for a jsdom environment so components render as they do in the browser. ESLint adds
`eslint-plugin-jsx-a11y` to guard against accessibility regressions in interactive components and routing links.

## Project Structure

- `src/layouts/MainLayout.jsx` – Shared shell with header and footer.
- `src/pages/*` – Individual feature pages (home, login, explorer, marketplace sections, admin console, etc.).
- `src/pages/dashboards/agency/*` – Agency dashboard shell, overview, and calendar workspace surfaces.
- `src/components/agency/*` – Calendar forms, drawers, and future reusable widgets for agency operations.
- `src/components/*` – Reusable UI building blocks such as hero, feature cards, and CTAs.
- `src/constants/branding.js` – Hosted logo and favicon references shared across the app.

This scaffold gives the team a polished foundation to continue iterating on Gigvora’s combined freelance marketplace and professional network experience.

## Security, RBAC, and observability

- **RBAC awareness** – Components rely on user role claims (freelancer, employer, admin) provided by the backend session
  endpoint. Guarded routes and menu items live under `src/routes/protected` and check for role membership before rendering.
- **CORS defaults** – The frontend assumes the API enforces an allow-list of origins and uses credentialed requests for session
  APIs. Review `gigvora-backend-nodejs/src/middleware/cors.ts` for production settings.
- **Content security** – User generated content is sanitised with `dompurify`. React Router transitions preserve scroll
  positions and prevent open redirects by restricting external navigation through dedicated helpers.
- **Monitoring hooks** – Axios interceptors log errors to the analytics service so runtime issues surface in the admin runtime
  health dashboard.
