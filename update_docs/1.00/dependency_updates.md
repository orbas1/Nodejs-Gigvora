# Version 1.00 – Dependency Updates

## Flutter Workspace
- Added `integration_test` (Flutter SDK) to enable instrumentation-driven smoke tests executed via GitHub Actions and Codemagic.
- Added `flutter_test` to the `gigvora_foundation` package so foundation services can be unit-tested with widget binding utilities.

## Tooling
- Melos script catalogue expanded with `test:unit`, `test:golden`, `test:integration`, and `ci:verify` entries to standardise local and CI execution.
- GitHub Actions now installs Temurin JDK 17 and Flutter 3.19.6 explicitly, ensuring consistent Gradle and Xcode compatibility across runners.

## Backend
- Added `supertest` to the Node.js backend devDependencies so HTTP controller flows can be validated end-to-end alongside service-level Jest suites.
