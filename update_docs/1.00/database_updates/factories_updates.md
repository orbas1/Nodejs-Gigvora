## Factory Updates

- Refactored user, persona, and organisation factories to consume the new seed manifest IDs, guaranteeing deterministic records when integration tests bootstrap dashboards, moderation queues, and finance workflows.
- Added factories for moderation events, live service telemetry snapshots, and Chatwoot conversation mirrors so realtime test suites can synthesise representative payloads.
- Hardened password, token, and API key generation to use crypto-safe utilities with configurable entropy per environment, replacing ad-hoc string helpers.
- Introduced fixture traits (e.g., `withVerifiedIdentity`, `withEscrowAccount`, `withCommunityBan`) so scenario-driven tests can model compliance edge cases without manual mutations.
- Ensured all factories respect policy acknowledgements and persona suspensions, preventing accidental creation of entities that bypass RBAC or compliance gates during testing.
