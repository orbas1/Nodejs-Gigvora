# Logic Flow Map – Web Application v1.50

```mermaid
flowchart TD
    A[Landing Page] -->|Select persona| B{Persona}
    B -->|Talent| C[Launchpad]
    B -->|Organisation| D[Home Dashboard]
    C --> C1[Complete onboarding checklist]
    C1 --> C2[Explore gigs]
    C2 --> C3[Apply / Save]
    C3 --> C4[Track applications]
    D --> D1[Create gig]
    D1 --> D2[Review draft]
    D2 --> D3[Publish]
    D3 --> D4[Manage applicants]
    D4 --> D5[Contract talent]
    D5 --> D6[Fund escrow]
    D6 --> D7[Monitor project board]
    D7 --> D8[Release payment]
    C4 --> E[Notifications Centre]
    D8 --> E
    E --> F{Issue?}
    F -->|No| G[Insights]
    F -->|Yes| H[Open dispute flow]
    H --> H1[Submit evidence]
    H1 --> H2[Mediator review]
    H2 --> H3[Resolution + payout]
    G --> I[Export reports]
    I --> J[Settings & Integrations]
    J --> K[Manage billing]
    J --> L[Configure automations]
```

- **Fallback loops:** If onboarding checklist incomplete, Launchpad returns to `C1` before unlocking advanced tabs.
- **Parallel processes:** Notifications centre aggregates events from applications, projects, disputes, and integrations concurrently.
- **Escalations:** Dispute flow triggers support ticket creation and optional live chat session.
