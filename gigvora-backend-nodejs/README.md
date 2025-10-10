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

## Key Directories

- `src/controllers` – Request handlers for authentication, feed, user and search flows.
- `src/models` – Sequelize models defining the schema for users, marketplace data, groups, and social graph.
- `src/services` – Business logic for authentication and 2FA email code handling.
- `database/migrations` – Schema definition for the relational data store.
- `database/seeders` – Starter data to explore the platform locally.

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

This base delivers the foundational scaffolding for the Gigvora platform so the team can iterate quickly on product features.
