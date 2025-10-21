# Build & Pipeline Updates — v2024.09.0

## CI/CD Pipeline
- Migrated mobile pipeline to **GitHub Actions reusable workflows** with concurrency control per branch.
- Added job-level artifact signing using Sigstore `cosign` for APK/IPA bundles.
- Integrated supply chain attestation (SLSA level 3) with provenance uploaded to Artifact Registry.

## Build Configurations
- Introduced `staging` flavor across Android/iOS with dedicated API hosts and logging levels.
- Updated environment variable management to use `.env.production` encrypted via Mozilla SOPS.
- Enabled split-per-ABI builds for Android to reduce download size (arm64-v8a, armeabi-v7a, x86_64).

## Quality Gates
- `flutter analyze` and unit tests enforced prior to build steps (see automation script).
- Coverage threshold set to 75%; pipeline fails if below, using `lcov_cobertura` to publish to SonarQube.
- Static application security testing (Snyk, MobSF) executed nightly; gating release on zero high severity findings.

## Release Automation
- Fastlane lanes updated: `fastlane android deploy_staged`, `fastlane ios deploy_staged`.
- Store listing metadata localized automatically via Contentful integration.
- Post-release monitoring uses GitHub Deployment API to update status dashboards.

## Dependencies & Tooling
- Flutter upgraded to **3.22.1**; Dart SDK pinned to **3.4.0**.
- Android Gradle Plugin 8.3.1, Kotlin 1.9.24, Xcode 15.3 compatibility verified.
- CocoaPods repos vendored to ensure reproducible builds in CI.
