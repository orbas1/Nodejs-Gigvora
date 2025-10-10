# Logic Flow Diagram Reference – Phone Application v1.00

```
[Launch]
   ↓ (Check token)
[Auth?]
   ├─ Yes → [Feed Screen]
   │         ↓ bottom nav selection
   │       [Explorer] ⇄ [Marketplace Hub] ⇄ [Launchpad Dashboard]
   │           ↓ result tap                    ↓ membership gate
   │       [Opportunity Detail] ←──────────────┘
   │         ↓ primary CTA
   │       [Apply/Pitch/Join Flow] → success → [Toast + Return]
   │
   │→ [Notifications Sheet] → [Inbox Conversation]
   │→ [Profile Screen] → [Profile Edit Modal]
   │→ [Settings] → [Support Hub]
   │→ Offline? → [Offline Overlay]
   │→ Error? → [Error Overlay]
   │
   └─ No → [Login Card]
             ├→ [Register Stepper]
             │      └→ [Company Registration]
             ├→ [Forgot Password]
             └→ [Admin Login]
```

- **Data Flow:** `Repository` layer feeds into `Controller` providers which expose state to widgets. Each screen subscribes to relevant providers; updates propagate reactively.
- **Modal Return Paths:** Overlays (search, notifications, offline) return to previous context on dismiss, maintaining scroll state.
- **Analytics Hooks:** Each node emits `screen_view` and action events; success flows trigger confetti Lottie for major achievements (e.g., launchpad milestone completion).
