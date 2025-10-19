# Gigvora Guide

Welcome! This guide explains what the Gigvora platform can do for everyday people ("Standard Joes") and gives beginner-friendly notes for developers. Gigvora blends the best parts of a freelance marketplace, professional network, and hiring hub across a web app and a phone app.

## 1. Gigvora at a Glance

Gigvora is a three-part system:

- **Web app (React + Tailwind)** – The browser experience that covers the landing page, sign-up/login, explorer search, dashboards, and admin tools, all styled with Gigvora's blue-and-white look.【F:gigvora-frontend-reactjs/README.md†L1-L29】
- **Mobile app (Flutter)** – A phone-friendly version with a dark, teal-accented theme that mirrors the marketplace, feed, explorer, and admin experiences.【F:gigvora-flutter-phoneapp/README.md†L1-L25】
- **Backend service (Node.js + MySQL)** – The engine room that handles accounts, security, the timeline, search, reputation, payments, and more for both clients.【F:gigvora-backend-nodejs/README.md†L1-L63】

Together they deliver a unified experience for freelancers, agencies, recruiters, and hiring managers.【F:README.md†L1-L19】

---

## 2. For the Standard Joe

### 2.1 Web app modules (React)

| Module | What you’ll see | Why it’s useful |
| --- | --- | --- |
| **Landing & product tour** | Hero stories, partner logos, feature highlights, testimonials, and CTAs walk newcomers through the value of the platform before they sign up.【F:gigvora-frontend-reactjs/src/pages/HomePage.jsx†L1-L34】 | Gives first-time visitors context and quickly routes returning members to the feed if they’re already signed in.【F:gigvora-frontend-reactjs/src/pages/HomePage.jsx†L14-L21】 |
| **Account & security** | Email/password login, Google sign-in, and email two-factor verification with automatic routing to the right dashboard once you’re authenticated.【F:gigvora-frontend-reactjs/src/pages/LoginPage.jsx†L1-L193】 | Protects accounts while steering each persona (freelancer, mentor, admin, etc.) to the workspace that matches their role.【F:gigvora-frontend-reactjs/src/pages/LoginPage.jsx†L9-L25】【F:gigvora-frontend-reactjs/src/pages/LoginPage.jsx†L64-L107】 |
| **Explorer search** | Faceted filters across jobs, gigs, projects, launchpads, volunteering, mentors, talent, companies, people, groups, and pages; saved searches, map view, and membership-gated access controls.【F:gigvora-frontend-reactjs/src/pages/SearchPage.jsx†L1-L75】【F:gigvora-frontend-reactjs/src/pages/SearchPage.jsx†L76-L119】 | Lets talent and hiring teams scan the whole marketplace from one search bar while keeping premium datasets behind specific memberships.【F:gigvora-frontend-reactjs/src/pages/SearchPage.jsx†L20-L53】【F:gigvora-frontend-reactjs/src/pages/SearchPage.jsx†L90-L107】 |
| **Timeline & engagement** | A LinkedIn-style composer (updates, media drops, jobs, gigs, projects, volunteering, launchpads), reaction controls, comments, and real-time/cached status banners.【F:gigvora-frontend-reactjs/src/pages/FeedPage.jsx†L28-L105】【F:gigvora-frontend-reactjs/src/pages/FeedPage.jsx†L137-L199】 | Keeps the community active with lightweight publishing tools while signalling whether content is streaming live or coming from cache.【F:gigvora-frontend-reactjs/src/pages/FeedPage.jsx†L81-L146】 |
| **Opportunity desks** | Dedicated jobs, gigs, projects, launchpad, and volunteering hubs with tabbed workflows (board, applications, interviews, manage) plus granular filters for work style, freshness, and sort order.【F:gigvora-frontend-reactjs/src/pages/JobsPage.jsx†L13-L176】 | Helps freelancers and recruiters work the funnel: track submissions, filter by remote/on-site, monitor conversion metrics, and trigger analytics events when lists are viewed.【F:gigvora-frontend-reactjs/src/pages/JobsPage.jsx†L178-L199】 |
| **Messaging & calling** | Unified inbox, unread badges, participant context, threaded history, Agora-powered voice/video launch buttons, and auto-mark-as-read helpers.【F:gigvora-frontend-reactjs/src/pages/InboxPage.jsx†L1-L195】 | Keeps conversations, quick calls, and compliance controls in one spot, only unlocking messaging for allowed memberships.【F:gigvora-frontend-reactjs/src/pages/InboxPage.jsx†L93-L151】 |
| **Dashboards & reputation** | Persona dashboards assemble profile summaries, availability badges, active clients, gigs, auto-assign queues, workflow automations, and finance stats for freelancers, agencies, companies, mentors, and admins.【F:gigvora-frontend-reactjs/src/pages/dashboards/FreelancerDashboardPage.jsx†L1-L178】 | Surfaces proof points (completion rates, ratings) and operational shortcuts (pipeline, automations) so members know what to focus on next.【F:gigvora-frontend-reactjs/src/pages/dashboards/FreelancerDashboardPage.jsx†L178-L211】 |
| **Finance control tower** | Escrow balances, automation metrics, upcoming releases, dispute queues, compliance tasks, and cashflow charts – gated behind finance/admin permissions.【F:gigvora-frontend-reactjs/src/pages/FinanceHubPage.jsx†L1-L160】 | Gives administrators a cockpit for releasing funds, chasing evidence, and resolving disputes while respecting role-based access.【F:gigvora-frontend-reactjs/src/pages/FinanceHubPage.jsx†L3-L51】【F:gigvora-frontend-reactjs/src/pages/FinanceHubPage.jsx†L74-L156】 |
| **Admin & support utilities** | Admin-only login with 2FA, auto-assign queue tuning, policy pages, and other specialist workspaces keep staff workflows organised.【F:gigvora-frontend-reactjs/src/pages/AdminLoginPage.jsx†L1-L155】【F:gigvora-frontend-reactjs/src/pages/AutoAssignQueuePage.jsx†L1-L156】 | Ensures every persona – from volunteer organisers to trust & safety teams – has a home inside the browser experience.【F:gigvora-frontend-reactjs/src/pages/AutoAssignQueuePage.jsx†L39-L156】【F:gigvora-frontend-reactjs/src/pages/AdminLoginPage.jsx†L72-L155】 |

### 2.2 Phone app modules (Flutter)

| Module | What you’ll see | Why it’s useful |
| --- | --- | --- |
| **Session & Explorer access** | Authentication-aware explorer that unlocks jobs, gigs, projects, launchpads, volunteering, and people discovery once the right membership is active; includes sign-in prompts and eligibility messaging.【F:gigvora-flutter-phoneapp/lib/features/explorer/presentation/explorer_screen.dart†L12-L198】 | Mirrors the web explorer so you can scout opportunities from the go while keeping premium searches behind workspace roles.【F:gigvora-flutter-phoneapp/lib/features/explorer/presentation/explorer_screen.dart†L60-L131】 |
| **Timeline** | Mobile-friendly feed with role checks, cached/offline banners, explorer shortcuts, composer for quick posts, and reaction/comment instrumentation.【F:gigvora-flutter-phoneapp/lib/features/feed/presentation/feed_screen.dart†L13-L199】 | Keeps community storytelling flowing on mobile, even when network conditions fluctuate.【F:gigvora-flutter-phoneapp/lib/features/feed/presentation/feed_screen.dart†L103-L189】 |
| **Messaging & calling** | Inbox scaffold with membership gating, role badges, refresh controls, composer syncing, and guidance for requesting access if messaging is locked.【F:gigvora-flutter-phoneapp/lib/features/messaging/presentation/inbox_screen.dart†L16-L200】 | Provides the same secure communications hub as the web app, optimised for smaller screens and mobile notifications.【F:gigvora-flutter-phoneapp/lib/features/messaging/presentation/inbox_screen.dart†L65-L179】 |
| **Finance control tower** | Sign-in prompts, demo session launcher, finance-role checks, and detailed telemetry (metrics grid, accounts, releases, disputes, compliance tasks, cashflow) with pull-to-refresh support.【F:gigvora-flutter-phoneapp/lib/features/finance/presentation/finance_screen.dart†L13-L198】 | Lets finance admins reconcile payments, handle disputes, and manage evidence without leaving their phone.【F:gigvora-flutter-phoneapp/lib/features/finance/presentation/finance_screen.dart†L63-L198】 |
| **Pipeline CRM** | Kanban columns, summary metrics, view selector, deal creation forms, follow-up scheduler, and campaign tracking tailored for freelancers managing leads.【F:gigvora-flutter-phoneapp/lib/features/pipeline/presentation/freelancer_pipeline_screen.dart†L12-L200】 | Gives independent talent a full CRM in their pocket so they can log deals, schedule follow-ups, and monitor campaign health anywhere.【F:gigvora-flutter-phoneapp/lib/features/pipeline/presentation/freelancer_pipeline_screen.dart†L111-L200】 |
| **Groups & communities** | Group creation, membership policies, admin moderation actions, invite flows, and inline feedback for community managers.【F:gigvora-flutter-phoneapp/lib/features/groups/presentation/group_management_screen.dart†L13-L200】 | Empowers admins to spin up and govern groups while travelling, keeping community growth momentum high.【F:gigvora-flutter-phoneapp/lib/features/groups/presentation/group_management_screen.dart†L71-L200】 |
| **Push notifications** | Permission wizard, status messaging, device registration, settings shortcuts, and a demo activity timeline to preview alerts.【F:gigvora-flutter-phoneapp/lib/features/notifications/presentation/notifications_screen.dart†L9-L200】 | Encourages members to enable alerts so they never miss invites, comments, or approvals while away from the desktop.【F:gigvora-flutter-phoneapp/lib/features/notifications/presentation/notifications_screen.dart†L22-L200】 |

### 2.3 Why the dual experience matters

- **All-in-one platform** – Instead of juggling separate apps for networking, job hunting, and hiring, Gigvora brings them together with matching modules across web and mobile.【F:README.md†L1-L19】【F:gigvora-flutter-phoneapp/lib/features/explorer/presentation/explorer_screen.dart†L34-L131】
- **Trust and transparency** – Profiles, dashboards, and finance consoles share the same backend reputation and compliance data so decisions stay informed everywhere.【F:gigvora-backend-nodejs/README.md†L45-L103】【F:gigvora-frontend-reactjs/src/pages/dashboards/FreelancerDashboardPage.jsx†L1-L211】
- **Seamless transitions** – Start a search or conversation on the web, continue in the phone app, and manage releases or disputes from either surface because both draw from the same API contracts.【F:gigvora-backend-nodejs/README.md†L1-L63】【F:gigvora-flutter-phoneapp/lib/features/messaging/presentation/inbox_screen.dart†L65-L200】

---

## 3. For the Basic Developer

### 3.1 How the pieces fit

- **Backend** – Express.js server with Sequelize ORM talking to MySQL. It exposes REST endpoints for auth, feed, search, reputation, admin settings, and real-time call tokens. Start it with `npm run dev` after running migrations and seeds.【F:gigvora-backend-nodejs/README.md†L1-L63】
- **Web frontend** – Vite-based React app styled with Tailwind. Run `npm run dev` to get a live-reload server on port 5173; configure `VITE_API_BASE_URL` to point at the backend.【F:gigvora-frontend-reactjs/README.md†L1-L29】
- **Mobile app** – Flutter project using Riverpod for state and GoRouter for navigation. Run `flutter run` with `--dart-define` flags for the API base URL and Agora ID when you need realtime calls.【F:gigvora-flutter-phoneapp/README.md†L1-L25】

### 3.2 Environment setup checklist

1. Install Node.js 18+, npm, MySQL 8+, and the Flutter SDK (3.2+).【F:README.md†L21-L37】
2. Copy `.env.example` in the backend to `.env` and fill in database, JWT, SMTP, monetization, payment, storage, and Agora settings.【F:gigvora-backend-nodejs/README.md†L8-L63】
3. Create `gigvora-frontend-reactjs/.env.local` with your API URL and Agora ID for the web app.【F:README.md†L39-L63】
4. Provide Flutter `--dart-define` values (or add them to `lib/environment.dart`) so the phone app talks to the same backend.【F:README.md†L65-L94】

### 3.3 Typical workflow for local development

1. **Bootstrap the database** – Run the `install.sql` script, then execute Sequelize migrations and seeders to populate sample data.【F:README.md†L96-L119】
2. **Start the backend** – `npm run dev` inside `gigvora-backend-nodejs` to serve the API on port 5000.【F:README.md†L121-L137】
3. **Launch the web client** – `npm run dev` inside `gigvora-frontend-reactjs` and open `http://localhost:5173`. The dev server proxies API calls so you can log in and browse.【F:README.md†L139-L148】
4. **Launch the mobile client** – `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api --dart-define=AGORA_APP_ID=<id>` for Android emulators (adjust host for iOS).【F:README.md†L150-L162】

### 3.4 Key directories worth knowing

- `gigvora-backend-nodejs/src/` – Controllers, services, and models for the API.【F:gigvora-backend-nodejs/README.md†L63-L86】
- `gigvora-frontend-reactjs/src/` – Layouts, pages, components, and branding constants for the web UI.【F:gigvora-frontend-reactjs/README.md†L31-L40】
- `gigvora-flutter-phoneapp/lib/` – Entry point, router, and feature modules for the mobile experience.【F:gigvora-flutter-phoneapp/README.md†L17-L25】

### 3.5 Helpful extras

- Run backend tests with `npm test` to validate messaging, notifications, and workspace governance across an in-memory SQLite DB.【F:gigvora-backend-nodejs/README.md†L86-L103】
- Review `gigvora-backend-nodejs/docs/` for schema, governance, and ER diagrams before making database changes.【F:README.md†L13-L19】【F:gigvora-backend-nodejs/README.md†L63-L86】
- Tailor monetization and payment settings through `/api/admin/platform-settings` or the admin UI when configuring commissions, subscriptions, and providers like Stripe or Escrow.com.【F:gigvora-backend-nodejs/README.md†L29-L63】

---

## 4. Quick FAQ

- **Do I need to run everything at once?** No. Start with the backend and one client. You can add the mobile app later once the API is stable.【F:README.md†L121-L162】
- **Can I skip Agora credentials?** Yes, but realtime calling will be disabled until you supply them in both the backend `.env` and client configs.【F:gigvora-backend-nodejs/README.md†L29-L63】【F:gigvora-frontend-reactjs/README.md†L21-L29】
- **How do I keep data safe?** Follow the docs in `gigvora-backend-nodejs/docs/` for governance rules, and rely on JWT + 2FA auth to protect sessions.【F:gigvora-backend-nodejs/README.md†L1-L63】【F:gigvora-backend-nodejs/README.md†L63-L86】

Keep this guide handy as you explore or build on Gigvora. Whether you’re just getting started or shipping new features, the platform’s shared backend keeps the web and mobile apps in sync so you can focus on creating value.
