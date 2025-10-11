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
- **Conditional Branches:**
  - Launchpad enrolment gate surfaces CTA to join; if declined, user redirected to curated programs list.
  - Volunteering log hours flow checks membership + verification; failed verification routes to support contact sheet.
  - Settings → Data export initiates async job with progress banner; completion triggers inbox message with download link.
- **Error Recovery:** Every destructive action (delete account, cancel application) surfaces confirmation modal and logs event `destructive_confirm`. If network error occurs mid-flow, user receives inline banner plus retry option preserving form state.
