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
  E --> E1[Apply Drawer]
  E1 --> E2{Profile Complete?}
  E2 -->|Yes| G[Submit Application]
  E2 -->|No| H[Profile Completion Flow]
  H --> D
  G --> D
  F --> C3[Join Community]
  C3 --> D
  D --> I[Dashboard Modules]
  I --> I1[Metrics]
  I --> I2[Tasks Queue]
  I --> I3[Notifications]
  I1 --> J[Deep Dive Explorer]
  I2 --> K[Complete Launchpad Steps]
  I3 --> L[Open Messages]
  J --> C1
  K --> G
  L --> D
```

## Interaction Notes
- Decision nodes include validation of authentication state and profile completeness.
- Loop from dashboard metrics back to explorer ensures continual discovery.
- Launchpad completion returns to dashboard with updated metric states and celebratory toast.
