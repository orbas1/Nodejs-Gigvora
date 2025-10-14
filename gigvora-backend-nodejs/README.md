# Gigvora Backend (Node.js)

This Express + Sequelize service powers the Gigvora marketplace experience across web and mobile clients. It provides authentication with email 2FA, profile management, a LinkedIn-style live feed, and search endpoints spanning jobs, gigs, projects, launchpads, and volunteering opportunities.

## Getting Started

1. Copy `.env.example` to `.env` and update the credentials for your environment.
2. Install dependencies
   ```bash
   npm install
   ```
3. Ensure MySQL is running and execute the bootstrap script:
   ```bash
   mysql -u <user> -p < install.sql
   ```
4. Run migrations and seed data (using Sequelize CLI or programmatic runner)
   ```bash
   npx sequelize-cli db:migrate --config sequelize.config.cjs --migrations-path database/migrations
   npx sequelize-cli db:seed:all --config sequelize.config.cjs --seeders-path database/seeders
   ```
5. Start the development server
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`.

## Realtime messaging & call configuration

Gigvora uses Agora for realtime voice and video inside message threads. Set the following environment variables before starting the API:

- `AGORA_APP_ID` – Agora project App ID.
- `AGORA_APP_CERTIFICATE` – Primary certificate for the project.
- `AGORA_TOKEN_TTL` – Optional token lifetime override in seconds (defaults to 3600).

Without these credentials call sessions will be disabled and the API will return a 500 error when attempting to request a call token.

## Platform monetization controls

Administrators can manage commissions, subscriptions, and payment credentials through the new `/api/admin/platform-settings` endpoints:

- `GET /api/admin/platform-settings` – Returns the current merged configuration derived from persisted admin settings and `.env` defaults.
- `PUT /api/admin/platform-settings` – Persists validated updates for commission percentages, subscription plans, feature gating, and third-party integrations (Stripe, Escrow.com, SMTP, Cloudflare R2).

The service loads sane defaults from the `.env` file. Copy `.env.example` and provide credentials for:

- **Commission settings** – toggle `PLATFORM_COMMISSIONS_ENABLED`, set `PLATFORM_COMMISSION_RATE`, optional `PLATFORM_COMMISSION_MINIMUM_FEE` and currency.
- **Subscription settings** – toggle `PLATFORM_SUBSCRIPTIONS_ENABLED` and list restricted features via `PLATFORM_SUBSCRIPTION_RESTRICTED_FEATURES`.
- **Payment providers** – configure `STRIPE_*` keys or `ESCROW_COM_*` secrets and choose the active `PAYMENT_PROVIDER`.
- **SMTP** – populate `SMTP_HOST`, port, credentials, and the default from address.
- **Cloudflare R2** – supply bucket credentials via `CLOUDFLARE_R2_*` variables.
- **Feature toggles** – disable earnings features globally using `FEATURE_COMMISSIONS_ENABLED`, `FEATURE_SUBSCRIPTIONS_ENABLED`, and `FEATURE_ESCROW_ENABLED`.

All values entered through the admin panel are validated and persisted to the new `platform_settings` table, enabling centralised management of earnings, paywall features, and infrastructure secrets.

## Key Directories

- `src/controllers` – Request handlers for authentication, feed, user and search flows.
- `src/models` – Sequelize models defining the schema for users, marketplace data, groups, and social graph.
- `src/services` – Business logic for authentication and 2FA email code handling.
- `database/migrations` – Schema definition for the relational data store.
- `database/seeders` – Starter data to explore the platform locally.
- `docs/` – Authoritative schema overview, ER diagrams, and governance policies for engineering and compliance review.

## API Surface (initial draft)

- `POST /api/auth/register` – Register an individual talent.
- `POST /api/auth/register/company` – Register a company account.
- `POST /api/auth/register/agency` – Register an agency profile.
- `POST /api/auth/login` – Begin login and request a 2FA email code.
- `POST /api/auth/verify-2fa` – Complete login using the emailed code.
- `GET /api/feed` – Fetch the live feed, similar to LinkedIn.
- `POST /api/feed` – Create a new feed post.
- `GET /api/users/:id` – Retrieve a unified profile page for any member.
- `GET /api/search` – Explorer search endpoint returning jobs, gigs, projects, launchpads, volunteering, and people.
- `GET /api/reputation/freelancers/:id` – Aggregate testimonials, success stories, metrics, badges, and widgets for a freelancer.
- `POST /api/reputation/freelancers/:id/testimonials` – Capture verified client testimonials including rating, source, and publish status.
- `POST /api/reputation/freelancers/:id/success-stories` – Publish long-form success stories with impact metrics and media links.
- `POST /api/reputation/freelancers/:id/metrics` – Upsert key performance metrics such as on-time delivery and CSAT.
- `POST /api/reputation/freelancers/:id/badges` – Issue custom credential badges for featured freelancer programs.
- `POST /api/reputation/freelancers/:id/widgets` – Generate shareable review widgets for embedding on external sites.

This base delivers the foundational scaffolding for the Gigvora platform so the team can iterate quickly on product features.

## Testing & Quality Gates

- Run `npm test` to execute the Jest integration suite covering application lifecycles, messaging, notifications, and provider workspace governance across an in-memory SQLite database.
- Coverage artefacts are emitted to `coverage/` and should be attached to CI runs for regression tracking.

## Data Governance

- Reference `docs/schema-overview.md` for table-level details and ownership of new entities.
- Consult `docs/er-diagram.md` and `docs/data-governance.md` before designing new features to ensure retention, masking, and access rules remain compliant.
