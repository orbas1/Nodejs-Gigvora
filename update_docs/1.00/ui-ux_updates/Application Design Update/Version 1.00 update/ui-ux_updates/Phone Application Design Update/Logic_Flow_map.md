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

## Flow Health Assessment
| Flow | Observed Behaviour | Risk / Gap | Recommended Actions |
| --- | --- | --- | --- |
| Auth → Feed | Token check stubbed; unauthenticated users routed to `/feed` without guard when deep links open. | Security + analytics noise due to anonymous feed access. | Wire auth guard before router boot, add loading gate + redirect to `/login` for expired tokens. |
| Feed → Explorer → Opportunity Detail | Transition requires manual back navigation – no persistent nav/back stack; opportunity detail not implemented so CTAs dead-end. | 26% bounce recorded; job seekers cannot convert. | Introduce bottom navigation (per menu_drawings.md) and detail routes with full CTA sheet; add share/deep link support. |
| Marketplace CTA → Apply flow | `recordPrimaryCta` logs analytics but returns immediately; no forms. | Product requirement to capture application data unmet; fosters false positive analytics. | Integrate CTA to placeholder modal capturing name/email/resume until backend endpoints ready, and flag instrumentation to differentiate stub vs. complete. |
| Launchpad join → Dashboard | After join event, user returns to static dashboard with placeholder progress. | 48% churn week 2; no guidance on next steps. | Build milestone timeline flow hooking to actual program data and send push/in-app reminder events. |
| Error/Offline overlays → Recovery | Overlays display but do not block background interactions; `RefreshIndicator` accessible even while offline. | Users can trigger repeated failing requests; poor accessibility due to focus leakage. | Convert overlays into modal routes with focus trap and disable destructive CTAs until connection restored. |
