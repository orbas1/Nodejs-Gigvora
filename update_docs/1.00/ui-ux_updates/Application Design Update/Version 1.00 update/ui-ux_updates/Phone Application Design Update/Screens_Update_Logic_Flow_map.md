# Logic Flow Map Notes – Phone Application v1.00

```
[App Launch]
   │
   ├── Authenticated? ── Yes ──▶ [Feed]
   │                            │
   │                            ├─ Tap Search ▶ [Explorer Overlay]
   │                            │                  │
   │                            │                  ├─ Select Result ▶ [Opportunity Detail]
   │                            │                  └─ Tap Category ▶ [Marketplace Hub]
   │                            │                                      │
   │                            │                                      ├─ Jobs/Gigs/Projects/Launchpad/Volunteering Lists
   │                            │                                      │        └─ CTA ▶ [Opportunity Detail]
   │                            │                                      └─ View Dashboard ▶ [Launchpad/Volunteering Dashboard]
   │                            │
   │                            ├─ Tap Launchpad Nav ▶ [Launchpad Dashboard]
   │                            ├─ Tap Volunteering Nav ▶ [Volunteering Dashboard]
   │                            ├─ Tap Profile Nav ▶ [Profile]
   │                            │          ├─ Edit ▶ [Profile Edit Modal]
   │                            │          └─ Menu ▶ [Settings] ──▶ [Support Hub]
   │                            ├─ Notifications Icon ▶ [Notifications Sheet]
   │                            │          └─ Message ▶ [Inbox]
   │                            └─ Offline / Error ▶ [Overlay States]
   │
   └── No ──▶ [Login]
                ├─ Register ▶ [Register Stepper]
                │       └─ Company? ▶ [Company Registration Step]
                └─ Admin Entry ▶ [Admin Login]
```

- **State Legend:** Solid arrows denote direct navigation; dotted (not shown) represent background processes (analytics, caching) noted in `Screens_Update_Logic_Flow.md`.
- **Modal vs Full Screen:** Explorer overlay and notifications use modal sheets (retaining underlying context); detail screens and dashboards push to full-screen routes.
- **Conditional Nodes:** Access to Launchpad/Volunteering dashboards contingent on membership flags; otherwise flow returns to list view with promotional CTA.
