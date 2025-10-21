## Export Changes

- Published enriched TypeScript client definitions for `FeatureFlag` and `RegistrySnapshot`, exposing access control, guard-rail, and observability metadata so admin portals and SDKs can rely on a typed contract instead of ad-hoc casting.
- Regenerated the platform feature flag JSON schema to include assignments, environment rollouts, audit trails, and RBAC metadata, ensuring downstream generators (TypeScript, OpenAPI, analytics tooling) stay consistent.
- Versioned the registry snapshot export with integrity metadata (checksum, expiry), allowing deployment tooling to verify provenance before seeding caches or triggering runtime refreshes.
