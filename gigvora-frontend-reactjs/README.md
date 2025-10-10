# Gigvora Frontend (React + Tailwind)

This Vite-powered React application delivers the Gigvora experience across landing, registration, marketplace search, live feed, and admin login flows. Tailwind CSS and the Inter font pair with a dark aesthetic aligned with the Gigvora brand.

## Highlights

- **Home / Landing** with hero, opportunity overviews, and call-to-action.
- **Authentication** flows including stylized login, registration, company/agency onboarding, and dedicated admin console.
- **Explorer surfaces** for jobs, gigs, projects, experience launchpad, volunteering, groups, followers, and connections.
- **Tailwind CSS** design tokens tuned to the Gigvora palette with the Inter font loaded globally.

## Getting Started

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173` and proxies API calls to the Node backend when configured.

## Project Structure

- `src/layouts/MainLayout.jsx` – Shared shell with header and footer.
- `src/pages/*` – Individual feature pages (home, login, explorer, marketplace sections, admin console, etc.).
- `src/components/*` – Reusable UI building blocks such as hero, feature cards, and CTAs.
- `src/assets/logo.svg` – Placeholder SVG logo matching the dark brand treatment.

This scaffold gives the team a polished foundation to continue iterating on Gigvora’s combined freelance marketplace and professional network experience.
