# Gigvora Platform Monorepo

Gigvora blends the best of Upwork, LinkedIn, and Indeed into a single experience for freelancers, agencies, hiring teams, and career seekers. This monorepo contains the production Node.js backend, React web client, and Flutter mobile app that share a unified design system, marketplace data model, and authentication flows.【F:gigvora-backend-nodejs/README.md†L1-L27】【F:gigvora-frontend-reactjs/README.md†L1-L25】【F:gigvora-flutter-phoneapp/README.md†L1-L18】

---

## Repository layout

| Package | Description |
| --- | --- |
| `gigvora-backend-nodejs/` | Express + Sequelize API surface with messaging, marketplace, platform monetization, and admin controls over commissions, subscriptions, payments, and real-time calling.【F:gigvora-backend-nodejs/README.md†L1-L91】 |
| `gigvora-frontend-reactjs/` | Vite-powered React + Tailwind experience for landing, explorer, authentication, dashboards, and admin console, tuned to the Gigvora palette and Inter font.【F:gigvora-frontend-reactjs/README.md†L1-L33】 |
| `gigvora-flutter-phoneapp/` | Flutter client using Riverpod and GoRouter to mirror the marketplace, explorer, and admin flows for mobile users.【F:gigvora-flutter-phoneapp/README.md†L1-L20】 |

Documentation for the relational schema, governance, and ER diagrams lives under `gigvora-backend-nodejs/docs/`.【F:gigvora-backend-nodejs/docs/schema-overview.md†L1-L78】

---

## System requirements

| Component | Minimum | Recommended |
| --- | --- | --- |
| Host OS | macOS, Linux, or WSL2 | macOS 14 / Ubuntu 22.04 |
| CPU | Dual core | Quad core |
| RAM | 6 GB total (4 GB free after OS) | 12 GB total (8 GB free) to run DB, API, web, and Flutter emulator concurrently |
| Disk | 10 GB free | 20 GB free for node_modules, Flutter toolchains, and MySQL data |
| Node.js | 18.x LTS | 20.x |
| npm | 9.x+ | 10.x |
| MySQL | 8.0+ | 8.0.36 with InnoDB | 
| Flutter SDK | 3.2+ | Latest stable channel |

---

## Prerequisites checklist

1. Install Node.js (includes npm) and ensure `node -v` is 18.x or newer.
2. Install MySQL and create a local user that can create databases.
3. Install the Flutter SDK and add it to your `PATH`.
4. Optional: install Agora, Stripe, and Cloudflare R2 credentials for real-time calling, payments, and asset storage when ready to test those flows.【F:gigvora-backend-nodejs/README.md†L28-L75】

---

## Environment configuration

### Backend (`gigvora-backend-nodejs/.env`)

Copy `.env.example` to `.env` and update the secrets for your stack.【F:gigvora-backend-nodejs/README.md†L8-L27】 Key groups include:

- **Application:** `PORT`, `APP_URL`, `CLIENT_URL`, JWT secrets, and email metadata used for two-factor login codes.【F:gigvora-backend-nodejs/.env.example†L1-L13】
- **Database:** MySQL connection details (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).【F:gigvora-backend-nodejs/.env.example†L15-L22】
- **Monetization:** Feature toggles and commission/subscription settings (`PLATFORM_COMMISSIONS_ENABLED`, `PLATFORM_COMMISSION_RATE`, `PLATFORM_SUBSCRIPTIONS_ENABLED`, `PLATFORM_SUBSCRIPTION_RESTRICTED_FEATURES`).【F:gigvora-backend-nodejs/.env.example†L24-L34】
- **Payments:** Active payment provider, Stripe keys, and Escrow.com credentials (`PAYMENT_PROVIDER`, `STRIPE_*`, `ESCROW_COM_*`).【F:gigvora-backend-nodejs/.env.example†L36-L44】
- **SMTP:** Outbound email server configuration required for verification codes and notifications.【F:gigvora-backend-nodejs/.env.example†L46-L52】
- **Cloudflare R2:** Storage credentials for media uploads used by messaging and reputation widgets.【F:gigvora-backend-nodejs/.env.example†L54-L59】
- **Realtime:** Agora credentials powering video and voice calls in message threads (`AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, `AGORA_TOKEN_TTL`).【F:gigvora-backend-nodejs/.env.example†L61-L64】

### Frontend (`gigvora-frontend-reactjs/.env.local`)

Create `.env.local` with:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Gigvora
VITE_AGORA_APP_ID=<match backend>
```

The Vite build reads any `VITE_` prefixed variables and the Agora ID should match the backend `.env` for joined sessions.【F:gigvora-frontend-reactjs/README.md†L19-L29】

### Mobile (`gigvora-flutter-phoneapp/lib/environment.dart`)

Flutter uses compile-time environment variables. Create `lib/environment.dart` with:

```dart
class Environment {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );
  static const agoraAppId = String.fromEnvironment(
    'AGORA_APP_ID',
    defaultValue: '',
  );
}
```

Pass values via `--dart-define` when running: `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api --dart-define=AGORA_APP_ID=...`.

---

## Database bootstrap

1. Ensure MySQL is running and accessible.
2. Execute the provided bootstrap SQL to create the schema and administrative defaults:
   ```bash
   mysql -u <user> -p < gigvora-backend-nodejs/install.sql
   ```
3. Run Sequelize migrations and seeders:
   ```bash
   cd gigvora-backend-nodejs
   npx sequelize-cli db:migrate --config sequelize.config.cjs --migrations-path database/migrations
   npx sequelize-cli db:seed:all --config sequelize.config.cjs --seeders-path database/seeders
   ```
   These commands apply the schema that powers applications, messaging, notifications, provider workspaces, gig orders, and analytics domains documented in `docs/schema-overview.md`.【F:gigvora-backend-nodejs/README.md†L8-L24】【F:gigvora-backend-nodejs/docs/schema-overview.md†L1-L78】

---

## Backend service

```bash
cd gigvora-backend-nodejs
npm install
npm run dev
```

The API listens on `http://localhost:5000` and exposes authentication, feed, search, reputation, monetization, and admin settings endpoints.【F:gigvora-backend-nodejs/README.md†L8-L91】 Tests can be executed with `npm test` (SQLite in-memory).【F:gigvora-backend-nodejs/README.md†L105-L111】

### Key API routes

| Method & Path | Purpose |
| --- | --- |
| `POST /api/auth/register` | Register individual talent accounts.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `POST /api/auth/register/company` | Register hiring companies.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `POST /api/auth/register/agency` | Register agencies.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `POST /api/auth/login` | Start email + 2FA login flows.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `POST /api/auth/verify-2fa` | Complete login using emailed code.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `GET /api/feed` / `POST /api/feed` | Read/write LinkedIn-style feed content.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `GET /api/users/:id` | Fetch unified profiles.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `GET /api/search` | Explorer search across jobs, gigs, projects, launchpads, volunteering, and people.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `GET /api/reputation/...` suite | Manage testimonials, success stories, metrics, badges, and widgets.【F:gigvora-backend-nodejs/README.md†L81-L100】 |
| `GET/PUT /api/admin/platform-settings` | Configure commissions, subscriptions, payments, and feature toggles.【F:gigvora-backend-nodejs/README.md†L36-L75】 |

---

## Web frontend

```bash
cd gigvora-frontend-reactjs
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` with proxy access to the API when `VITE_API_BASE_URL` is configured. Pages cover landing, authentication, explorer, dashboards, and admin workflows while consuming the backend reputation and messaging services.【F:gigvora-frontend-reactjs/README.md†L1-L33】

---

## Flutter mobile app

```bash
cd gigvora-flutter-phoneapp
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api --dart-define=AGORA_APP_ID=<id>
```

The app mirrors marketplace, feed, explorer, and admin experiences using Riverpod state management and GoRouter navigation.【F:gigvora-flutter-phoneapp/README.md†L1-L20】

---

## Installation wizard UI blueprint

Design a guided setup flow to streamline local onboarding for teammates or customers. Suggested multi-step wizard:

1. **Welcome & system check** – Detect OS, Node.js, npm, Flutter, and MySQL versions. Display minimum vs. detected specs and highlight RAM availability (target ≥6 GB). Provide "Fix issues" links.
2. **Environment secrets** – Collect backend `.env` fields (database credentials, JWT secrets, SMTP, monetization toggles) with validation and secure storage. Offer optional sections for Stripe, Escrow, Agora, and Cloudflare R2.
3. **Database provisioning** – Offer "Run install.sql" and "Run migrations/seeds" buttons that execute the SQL bootstrap and Sequelize CLI commands while streaming logs. Confirm schema objects for applications, messaging, notifications, provider workspaces, gig orders, and analytics match expectations.【F:gigvora-backend-nodejs/docs/schema-overview.md†L1-L78】
4. **Service launch** – Allow users to start/stop the Node API (`npm run dev`) and React web (`npm run dev` in frontend) concurrently, showing port availability, environment variables in effect, and health-check responses.
5. **Mobile integration** – Provide optional Flutter launch instructions with `--dart-define` values, emulator selection, and QR codes for physical devices.
6. **Summary & next steps** – Present API base URLs, generated admin credentials (if seeded), quick links to API docs, and buttons to open the web dashboard or run automated tests (`npm test`).

Each step should be resumable, persist progress, and export a configuration report for teammates.

---

## Quality & governance resources

- Schema, data governance, and ER diagrams: `gigvora-backend-nodejs/docs/`【F:gigvora-backend-nodejs/docs/schema-overview.md†L1-L78】
- Integration tests: `gigvora-backend-nodejs/tests/`
- Seed data: `gigvora-backend-nodejs/database/seeders/`
- Flutter integration tests: `gigvora-flutter-phoneapp/integration_test/`

Follow these references to extend Gigvora safely while keeping user data, monetization logic, and cross-platform experiences aligned.

---

## Security & RBAC checklist

- Configure JWT, refresh tokens, and session cookies using the placeholders provided in `.env.example`, and rotate them whenever production secrets change.【F:gigvora-backend-nodejs/.env.example†L15-L43】
- Restrict cross-origin requests by aligning the API’s `CORS_ALLOWED_*` lists with the frontends you deploy. The calendar stub inherits the same origin and role policies to avoid inconsistent behaviour between services.【F:gigvora-backend-nodejs/.env.example†L30-L61】【F:calendar_stub/server.mjs†L46-L323】
- Honour role-based access grants (`calendar:view`, `calendar:manage`, `platform:admin`, etc.) in your clients before calling protected endpoints to surface helpful UX instead of raw 403 responses.【F:gigvora-backend-nodejs/.env.example†L44-L61】【F:calendar_stub/server.mjs†L210-L323】
- Keep Prometheus metrics behind the `METRICS_BEARER_TOKEN` and transport logs via HTTPS when shipping them to your SIEM of choice.【F:gigvora-backend-nodejs/.env.example†L10-L23】

---

## CI/CD & release automation

- Codemagic orchestrates release builds across Android and iOS with environment validation, formatting enforcement, static analysis, and full test runs before packaging artefacts for distribution.【F:codemagic.yaml†L1-L86】
- Flutter-specific automation lives in `melos.yaml`; use `melos run ci:verify` locally to mirror Codemagic’s gates before pushing changes.【F:melos.yaml†L9-L22】
- Backend releases should run `npm run lint`, `npm test`, and, if database changes exist, `npx sequelize-cli db:migrate --dry-run` to confirm schema safety before promotion.【F:gigvora-backend-nodejs/package.json†L7-L31】

---

## Incident response quick links

- Review the runtime incident runbook for escalation paths, communication templates, and recovery procedures.【F:gigvora-backend-nodejs/docs/runbooks/runtime-incident.md†L1-L120】
- Trigger `npm run db:backup` prior to executing emergency migrations and verify backups via `npm run db:verify` once the change lands.【F:gigvora-backend-nodejs/package.json†L23-L31】
- After any security event, reset API keys (`CALENDAR_STUB_API_KEY`, Stripe, Escrow.com) and JWT secrets, then broadcast forced logout notices through the admin console and email templates.【F:gigvora-backend-nodejs/.env.example†L36-L61】
