# Gigvora Frontend (React + Tailwind)

This Vite-powered React application delivers the Gigvora experience across landing, registration, marketplace search, live feed, and admin login flows. Tailwind CSS and the Inter font pair with a crisp white-and-blue aesthetic that mirrors the Gigvora brand.

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

### Realtime calls & messaging

Set `VITE_API_BASE_URL` to your backend host and ensure the API is configured with Agora credentials. The web client consumes the `/api/messaging/threads/:id/calls` endpoint and uses `agora-rtc-sdk-ng` to join video and voice sessions directly from the inbox and dock UI.

## Project Structure

- `src/layouts/MainLayout.jsx` – Shared shell with header and footer.
- `src/pages/*` – Individual feature pages (home, login, explorer, marketplace sections, admin console, etc.).
- `src/pages/dashboards/agency/*` – Agency dashboard shell, overview, and calendar workspace surfaces.
- `src/components/agency/*` – Calendar forms, drawers, and future reusable widgets for agency operations.
- `src/components/*` – Reusable UI building blocks such as hero, feature cards, and CTAs.
- `src/constants/branding.js` – Hosted logo and favicon references shared across the app.

This scaffold gives the team a polished foundation to continue iterating on Gigvora’s combined freelance marketplace and professional network experience.
