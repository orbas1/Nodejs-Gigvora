# Dependency Evaluation – Version 1.50

## Functionality
- **Cross-platform contracts remain fragmented.** Backend enums live in `src/models/constants/index.js`, the React client duplicates status values in `src/constants`, and Flutter mirrors them inside `packages/gigvora_foundation`. With no shared schema package or OpenAPI client, every enum change requires three manual edits and introduces drift.
- **Critical integrations are speculative.** Product copy references Stripe payouts, Cloudflare R2, Agora calls, and Mapbox visualization, yet the manifests either omit SDKs entirely or include them without wiring. Attempting to enable these features results in `MODULE_NOT_FOUND` errors or stubbed responses, blocking end-to-end validation.
- **Infrastructure automation is absent.** No Terraform/CDK modules, event streaming clients, or feature-flag SDKs exist. The dependency graph cannot satisfy promised infrastructure-as-code, observability, or rollout automation.
- **Data tooling is incomplete.** Analytics and reporting narratives cite Snowflake, Segment, and Amplitude, but no connectors or event SDKs appear in any `package.json`. BI pipelines therefore cannot even be prototyped.
- **Native build prerequisites go unmanaged.** Packages such as `mapbox-gl`, `google-sign-in`, and `sqlite3` require platform toolchains (WebGL, Android/iOS SDKs) yet there are no scripts or docs to help engineers install prerequisites, leading to repeated build failures.
- **Monorepo configuration is inconsistent.** Root-level `melos.yaml` and `codemagic.yaml` hint at automation, but JavaScript packages ignore workspace tooling (`pnpm`, `npm workspaces`). `package-lock.json` files balloon without shared caching, and Flutter packages rely on relative paths that cannot be consumed outside this repository.

## Usability
- **Repository weight slows every workflow.** Committed `node_modules/` and `.dart_tool/` directories add hundreds of megabytes, inflating clone times and wasting CI minutes. Contributors must prune artifacts manually, increasing onboarding friction and merge conflicts.
- **Version management is undefined.** No project declares engine ranges or toolchain files (`.nvmrc`, `.tool-versions`, `.flutter-version`). Engineers alternate between Node 16/18/20 and Flutter 3.x/3.y, breaking native modules (`sqlite3`, `ffi`) and generating non-reproducible builds.
- **Dependency documentation is minimal.** READMEs list the high-level stack but omit upgrade strategies, security policies, or compatibility matrices. Without curated guidance, each team updates packages independently, creating fragmentation.
- **Local package development is brittle.** The Flutter app depends on path-based packages without Melos automation or version pinning. Updating design tokens or foundation widgets requires manual path editing and risks drift once packages are published.
- **Build tooling lacks caching.** Neither backend nor frontend leverages package managers’ cache strategies (`npm ci`, pnpm, Turbo). Every install recompiles native modules, slowing developer feedback loops.
- **Type tooling is inconsistent.** The React project depends on `@types/react` yet the codebase uses `.jsx` files and lacks TypeScript configuration. Editors surface spurious errors and contributors cannot rely on static analysis.
- **Scripts are unreliable.** Shared npm scripts like `lint` and `test` assume global binaries (`cross-env`, `rimraf`) that are not dependencies in each package. Running commands from CI or fresh clones fails until developers install tools manually.

## Errors & Stability
- **Wide semver ranges increase breakage risk.** Critical packages (`sequelize@^6.37.1`, `@aws-sdk/*@^3.590.0`, `mapbox-gl@^2.15.0`) use caret ranges; combined with regularly updated lockfiles, CI may resolve incompatible releases between builds.
- **Transitive vulnerabilities go undetected.** There is no Dependabot, Renovate, `npm audit`, or `flutter pub outdated` automation. Security advisories for packages like `jsonwebtoken` or `lodash` will linger unnoticed.
- **Build pipelines lack resilience.** Vite and Flutter builds reference optional native modules (Mapbox workers, Firebase) without guarding `optionalDependencies`. On machines lacking build tools the install fails entirely instead of skipping unavailable components.
- **Testing dependencies are inconsistent.** Jest exists for the backend, but the frontend omits React Testing Library/Cypress and the Flutter workspace contains no widget/integration testing libraries beyond the default template. CI cannot enforce uniform quality gates.
- **Polyfills and shims are missing.** Browser-targeted packages (Mapbox, Agora) require worker/WebRTC shims. `vite.config.js` ships near-default configuration, so production bundles crash when SDKs access unavailable globals.
- **Duplicate dependency graphs cause runtime drift.** Messaging models re-declare enums and models in `src/models/messagingModels.js`, requiring duplicated Sequelize definitions that are easy to desynchronise from the primary `index.js` exports.
- **Binary artifacts hide state.** Committed SQLite databases under `database/` and generated assets within `gigvora-flutter-phoneapp/build/` (created by past runs) remain unchecked into version control, making it impossible to know whether local builds rely on stale generated code.

## Integration
- **No shared API client or schema.** Each platform rolls its own REST client using Axios, Fetch, or `dio`. Authentication headers, retry logic, and error handling diverge, complicating cross-platform debugging and increasing inconsistent business logic.
- **Observability stack is nonexistent.** No Winston/Pino logger, OpenTelemetry SDKs, or mobile analytics dependencies are configured. Enterprise integrations with SIEM or monitoring providers would require a ground-up dependency strategy.
- **CI/CD dependencies are missing.** GitHub Actions/Bitrise scripts referenced in docs are absent. Without Lerna/Melos/Turborepo, the monorepo cannot coordinate release versions or ensure dependencies resolve before publishing packages.
- **Third-party compliance tooling is absent.** There are no dependencies for security scanning (Trivy, Snyk), privacy management (OneTrust), or consent management, despite marketing claims of compliance readiness.
- **Offline/edge support lacks libraries.** Mobile and web experiences refer to offline caching, yet there are no libraries (Workbox, Service Worker tooling, Hive) to support those behaviours. Integrations with service workers or persistent storage remain aspirational.
- **Secrets management integrations are missing.** There is no AWS/GCP secrets manager client, Vault SDK, or runtime config helper. Credentials remain environment variables or hard-coded tokens.
- **Package boundaries impede partner integrations.** Backend scripts under `scripts/` shell out to `sequelize-cli` without pinning versions, while partner automation expects published CLIs. Without containerized tooling or reproducible Docker images, external integrators cannot rely on the stack.

## Security
- **Security middleware is missing.** Backend dependencies omit `express-rate-limit`, request validation packages (`celebrate`, `joi`, `zod`), and secret management clients, leaving the API exposed to common OWASP threats.
- **Token storage helpers are unsafe.** The web client persists JWTs in `localStorage` (see `src/services/apiClient.js`), and the Flutter app ships a demo admin JWT in `lib/main.dart`. Secure storage libraries (`@react-native-async-storage/async-storage`, `flutter_secure_storage`) are absent, making compromise trivial.
- **Supply chain monitoring is absent.** No Sigstore/Cosign, package integrity checks, or lockfile verification scripts exist. Attackers could tamper with dependencies without detection.
- **Code quality gates are thin.** ESLint rules are minimal, Prettier/stylelint are absent, and Flutter lints are unenforced. Insecure patterns can enter production unnoticed.
- **Binary artifacts are unchecked.** Committed `node_modules/` hides malicious binaries or outdated builds from scanning pipelines. No checksum verification accompanies these blobs.
- **Secrets leak into version control.** Example JWTs, Stripe keys, and SMTP credentials litter `.env.example` and documentation without vault-backed replacements, normalising insecure configuration practices.

## Alignment
- **Enterprise positioning is undermined.** Marketing promises enterprise governance, yet the dependency graph resembles an experimental sandbox lacking observability, compliance, and security tooling expected by auditors.
- **Team scalability is threatened.** Without automation, lockfiles, or shared SDKs, each team must manage dependencies manually. This contradicts the program’s stated goal of delivering coordinated releases across backend, web, and mobile.
- **Future roadmap items require foundational investment.** Planned features—multi-tenant analytics, payment automation, AI matching—demand event streaming, ML, and risk-scoring dependencies. The current stack offers no stepping stones toward those capabilities.
- **Compliance objectives are unrealistic.** SOC 2 / GDPR attestations rely on dependency-driven controls (encryption SDKs, audit loggers). Until these dependencies are introduced, compliance milestones remain aspirational.
- **Partner ecosystem claims are premature.** Documentation references partner-facing SDKs, yet there is no packaging strategy (npm scope, pub.dev releases) to distribute libraries. Ecosystem ambitions cannot materialise without disciplined dependency governance.
