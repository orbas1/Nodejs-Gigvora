# Logic Flow Map – Web Application Version 1.00

```mermaid
flowchart TD
  A[Entry: Homepage] --> B{User Type?}
  B -->|Guest| C[Explore Hero CTAs]
  B -->|Authenticated| D[Dashboard Landing]
  C --> C1[Explorer Search]
  C1 --> C2{Find Opportunity?}
  C2 -->|Yes| E[Opportunity Detail]
  C2 -->|No| F[Launchpad Highlights]
  F --> F1{Action?}
  F1 -->|Apply as Talent| G[Launchpad Talent Form]
  F1 -->|Submit Employer Brief| H[Launchpad Employer Form]
  G --> G1{Profile Complete?}
  G1 -->|Yes| I[Submit Talent Application]
  G1 -->|No| J[Profile Completion Flow]
  H --> H1{Budget Valid?}
  H1 -->|Yes| K[Submit Employer Brief]
  H1 -->|No| H2[Adjust Budget/Timeline]
  H2 --> H
  E --> E1[Apply Drawer]
  E1 --> E2{Profile Complete?}
  E2 -->|Yes| I
  E2 -->|No| J
  I --> L[Placements Insights Refresh]
  K --> L
  J --> D
  L --> D
  F --> F2[Launchpad Community Feed]
  F2 --> D
  D --> M[Dashboard Modules]
  M --> M1[Metrics]
  M --> M2[Tasks Queue]
  M --> M3[Notifications]
  M1 --> C1
  M2 --> L
  M3 --> N[Open Messages]
  N --> D
```

## Interaction Notes
- Decision nodes include validation of authentication state and profile completeness.
- Loop from dashboard metrics back to explorer ensures continual discovery.
- Launchpad completion returns to dashboard with updated metric states and celebratory toast.
