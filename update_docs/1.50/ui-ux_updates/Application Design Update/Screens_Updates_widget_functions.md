# Widget Functions Reference

## Navigation Widgets
- **Bottom Tab Bar (`NAV-TAB`):**
  - **Inputs:** `activeTab`, `badgeCounts`, `personaContext`.
  - **Behaviour:** Persists navigation stacks per tab; animates indicator (200ms slide) when switching; haptic feedback type "soft" on iOS/Android.
  - **Effects:** Elevation increases from 2 → 6 when keyboard hidden to highlight navigation.
- **Floating Action Button Hub (`FAB-CORE`):**
  - **Inputs:** `persona`, `contextualState` (e.g., inside project detail).
  - **Behaviour:** Expands into radial menu with 4 primary options; fallback to linear list if >4 actions. Supports long-press to pin favourite action.
  - **Effects:** Uses scale+fade animation (0.85 → 1.0) with 180ms easeOutBack.
- **Workspace Switcher Chip (`CHP-WRK`):**
  - **Inputs:** `workspaces[]`, `selectedId`.
  - **Behaviour:** Dropdown overlay anchored to avatar; on selection triggers `REFRESH_WORKSPACE` event and logs analytics payload with workspace metadata.

## Content & Cards
- **Feed Card (`CRD-FEED`):** Modular slots for `author`, `timestamp`, `body`, `media`, `poll`, and `footer`. Inline actions emit events (`LIKE_POST`, `OPEN_COMMENTS`, `SHARE_POST`). Creator overlay shows reach graph on tap; card supports lazy-loaded comments preview.
- **Project Summary Card (`CRD-PROJECT`):** Displays status pill, milestone chip, assigned avatars, progress bar. Quick actions (chat, approve, view escrow) appear as icon buttons with tooltip. When status changes to "At Risk" background tint shifts to Amber50.
- **Job Listing Card (`CRD-JOB`):** Contains title, compensation, engagement type, location badges. Swipe left surfaces Save/Hide; swipe right surfaces Share/Assign. Card expands to show skill match percentage and CTA "View Details".

## Data Entry
- **Rich Text Composer (`RTE-POST`):** Autosaves every 30s, surfaces offline banner if sync fails, and provides AI suggestion chips (triggered by `/assist`). Preview mode uses same layout as feed card to minimise visual drift.
- **Form Sections (`FRM-STEP`):** Observes stepper context; each field registers validation rules (sync + async). Inline hints triggered on `focus` event, with optional helper icon linking to documentation.
- **Media Uploaders (`UPL-MEDIA`):** Supports drag-and-drop, clipboard paste, and direct camera capture. Upload queue provides pause/resume, retry with exponential backoff, and duplicate detection via checksum.

## Feedback & Status
- **Escrow Timeline (`TIM-ESCROW`):** Calculates stage completion based on escrow state machine; highlights current stage with glowing halo. Primary action toggles between "Release Funds", "Raise Dispute", or "Approve Deliverable".
- **Trust Score Dial (`SCR-TRUST`):** Animates pointer using spring physics when score updates; tooltip reveals breakdown table (Verification, Reviews, Delivery). Score below 60 triggers badge "Needs Attention".
- **Launchpad Checklist (`CHK-LP`):** Each item stores `status`, `dueDate`, `cta`. Completion triggers confetti micro-animation and increments Launchpad readiness meter.

## Support & Communication
- **Chat Thread Widget (`CHT-THREAD`):** Virtualised list handling 200+ messages, inline attachment previews, voice note playback. Quick action bar surfaces context aware CTAs (Approve Milestone, Request Revision). Transcript export generates PDF via serverless endpoint.
- **Support Ticket Wizard (`FRM-SUPPORT`):** Multi-step form capturing issue category, impact, attachments. Auto-suggests knowledge base articles; displays SLA countdown once submitted.

## Analytics & Insights
- **Metric Tiles (`TIL-METRIC`):** Present primary value, delta (colour-coded), and sparkline. Long-press reveals segmentation menu (persona, date range).
- **Recommendation Carousel (`CAR-RECO`):** Snaps to 80% viewport width, logs `RECO_INTERACTION` events with action type. Contains inline CTAs (Apply, Follow, Dismiss) and exposes `onScrollEnd` to prefetch more results.
