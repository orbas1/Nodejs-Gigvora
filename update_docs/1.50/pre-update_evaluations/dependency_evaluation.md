# Dependency Evaluation – Version 1.50 Pre-Update

## Functionality
- Backend tooling omits `sequelize-cli` and migration scripts, so despite depending on Sequelize there is no automated way to run migrations or seeders through npm scripts.【F:gigvora-backend-nodejs/package.json†L1-L24】【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L1-L74】
- The React app includes Axios even though no component imports it, signalling unfinished API wiring and increasing bundle size without delivering network functionality.【F:gigvora-frontend-reactjs/package.json†L1-L28】【F:gigvora-frontend-reactjs/src/pages/FeedPage.jsx†L1-L63】
- Flutter declares `http` but every feature screen uses static data; network abstraction layers (clients, repositories) are absent, so dependencies don’t translate into capabilities.【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】【F:gigvora-flutter-phoneapp/lib/features/feed/presentation/feed_screen.dart†L1-L56】

## Usability
- No lockfile strategies are documented (mix of npm + Flutter + future package managers), and there are no helper scripts for installing peer binaries (e.g., pods for iOS), raising onboarding friction.【F:gigvora-backend-nodejs/package.json†L1-L24】【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】
- Missing environment sample files (`.env.example`) paired with `dotenv` leave developers guessing required variables when wiring services like databases or JWT secrets.【F:gigvora-backend-nodejs/src/config/database.js†L1-L16】【F:gigvora-backend-nodejs/src/services/authService.js†L1-L56】
- Front-end dev dependencies lack testing utilities (React Testing Library, Vitest) despite QA expectations, hampering regression coverage setup.【F:gigvora-frontend-reactjs/package.json†L1-L28】

## Errors
- Unused dependencies (`axios`, `http`) drift over time and risk security advisories without any code path justifying their presence, making dependency audits noisy.【F:gigvora-frontend-reactjs/package.json†L1-L28】【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】
- There are no pinned Node or Flutter engine versions, so team members might install incompatible SDKs leading to runtime build failures.【F:gigvora-backend-nodejs/package.json†L1-L24】【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】
- Absence of linting configs for the Flutter project (no `analysis_options.yaml`) allows analyzer warnings to slip through and break builds late in CI.【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】

## Integration
- The backend depends on `jsonwebtoken` but lacks complementary middleware (`express-jwt`, `passport`) to verify tokens, so downstream integrations cannot rely on consistent auth enforcement.【F:gigvora-backend-nodejs/package.json†L1-L20】【F:gigvora-backend-nodejs/src/routes/userRoutes.js†L1-L11】
- React project omits tooling for environment-specific builds (no `.env.development` usage or proxy setup), complicating integration with the API during dev/staging.【F:gigvora-frontend-reactjs/package.json†L1-L28】【F:gigvora-frontend-reactjs/vite.config.js†L1-L20】
- Flutter dependencies like `go_router` and `flutter_riverpod` are present, yet there are no shared packages for models/services to align with the Node API, impeding code reuse across platforms.【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】【F:gigvora-flutter-phoneapp/lib/router/app_router.dart†L1-L34】

## Security
- Lacking dependencies for input sanitization (`validator`, `celebrate`) or rate limiting (`express-rate-limit`) leaves the backend exposed to injection and brute-force attacks despite handling credentials.【F:gigvora-backend-nodejs/package.json†L1-L20】【F:gigvora-backend-nodejs/src/controllers/authController.js†L4-L34】
- No tooling exists for secret scanning or dependency vulnerability monitoring (e.g., `npm audit`, `snyk` integrations), so supply-chain issues may go unnoticed.【F:gigvora-backend-nodejs/package.json†L1-L24】【F:gigvora-frontend-reactjs/package.json†L1-L28】
- Flutter app lacks secure storage packages for tokens (e.g., `flutter_secure_storage`), making it impossible to store JWTs safely once API integration begins.【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】【F:gigvora-flutter-phoneapp/lib/features/auth/presentation/login_screen.dart†L1-L100】

## Alignment
- Dependency stacks do not yet reflect the product’s promise of advanced analytics or messaging (no charting libs, real-time clients, or push notification SDKs), signaling misalignment with roadmap narratives.【F:gigvora-frontend-reactjs/package.json†L1-L28】【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】
- The mobile app references parity with provider/agency tooling, yet there is no package infrastructure (e.g., modular repositories, API clients) to support multi-app ecosystems.【F:gigvora-flutter-phoneapp/pubspec.yaml†L1-L21】【F:gigvora-flutter-phoneapp/lib/router/app_router.dart†L1-L34】
- Without infrastructure-as-code or deployment helper dependencies, DevOps alignment is weak—scripts cannot build Docker images or run migrations automatically for releases.【F:gigvora-backend-nodejs/package.json†L1-L24】【F:gigvora-frontend-reactjs/package.json†L1-L28】
