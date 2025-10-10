# Entity Relationship Diagram

```mermaid
erDiagram
  User ||--o{ Profile : owns
  User ||--o{ CompanyProfile : operates
  User ||--o{ AgencyProfile : operates
  User ||--o{ FreelancerProfile : maintains
  User ||--o{ FeedPost : publishes
  User ||--o{ Application : submits
  Application ||--o{ ApplicationReview : receives
  User ||--o{ MessageThread : initiates
  MessageThread ||--o{ MessageParticipant : contains
  User ||--o{ MessageParticipant : joins
  MessageThread ||--o{ Message : streams
  Message ||--o{ MessageAttachment : attaches
  User ||--o{ Notification : receives
  User ||--o{ NotificationPreference : configures
  ProviderWorkspace ||--o{ ProviderWorkspaceMember : includes
  ProviderWorkspace ||--o{ ProviderWorkspaceInvite : issues
  ProviderWorkspace ||--o{ ProviderContactNote : records
  User ||--o{ ProviderWorkspaceMember : participates
  User ||--o{ ProviderContactNote : authors
  Application ||--o{ AnalyticsEvent : triggers
  Message ||--o{ AnalyticsEvent : logs
```

**Diagram conventions**
- Double bars (`||`) indicate mandatory relationships (e.g., every `Application` requires a `User` applicant).
- Circles (`o{`) represent optional multi-valued relationships, reflecting that workspaces can have zero or more invites or members at any time.
- Analytics events are modelled as append-only records linked to the interaction that generated them, providing parity across applications, messaging, and provider operations.

Use the diagram alongside `schema-overview.md` to understand the authorised pathways for API design, caching, and analytics instrumentation.
