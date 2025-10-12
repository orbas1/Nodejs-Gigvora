# User Application Styling Changes – Version 1.00

## Core Theme Tokens
- **Accent palette:** Seeded from `#2563EB` with secondary `#1D4ED8`; used for primary buttons, chips, and active navigation states.
- **Surface & backgrounds:** White base, subtle gradient overlays, and soft-muted fills (`#F8FAFC`) for inputs and cards; supports dark text `#0F172A`.
- **Typography:** Google Fonts Inter applied to entire text theme with body/display colours set to slate dark; ensures readability across dynamic type scales.

## Components & Interaction Patterns
- **App bars:** Material 3 app bar with white background, zero elevation, accent foreground; houses title/subtitle stack in scaffold helper.
- **Buttons:** Elevated buttons share accent background, 16px radius, medium-weight label; outlined buttons use `#93C5FD` border with accent text.
- **Inputs:** Rounded 16px corners, filled backgrounds, accent-focused border on focus, label text in `#475569` for softer guidance.
- **Chips:** Rounded 20px, pale blue background `#EFF6FF`, accent text; used for filters, metadata, and statuses.
- **Cards:** Shared `GigvoraCard` widget with 24px radius, light border, and drop shadow `rgba(30,41,59,0.08)` to mimic web cards.
- **Auto-assign queue cards:** `GigvoraCard` variant introduces `borderLeft` accent stripes keyed off score tiers (emerald/amber/rose) with countdown chips rendered as `FilledButton.tonal` using the mono type ramp (`LabelSmall`) to keep timers legible. Accept/Decline buttons map to primary/destructive styles with progress indicators that overlay while awaiting backend acknowledgement.
- **Volunteers Hub panels:** Invitation cards adopt accent left stripes keyed to urgency, timeline tiles use `LinearProgressIndicator` with accent gradient, and impact KPIs reuse `GigvoraMetricTile` with cause-specific accent overlays. Safeguarding checklist chips rely on amber-toned backgrounds with icon circles sized 40px and emphasised uppercase labels.
- **Detail sections:** Section headers `text-lg font-semibold`, content blocks separated by `Divider()` using `Color(0xFFE2E8F0)`.
- **Bottom sheets:** `RoundedRectangleBorder` radius 28px, top drag handle, accent-coloured confirm button pinned to safe area.
- **List tiles:** 20px leading icons, 16px vertical padding, trailing arrow tinted accent for navigation clarity.

## Feedback & States
- **Offline/Cache banners:** Amber/danger/neutral palettes for offline, error, and cache states with iconography aligning to Material tokens.
- **Skeletons:** Placeholder shimmer for lists while fetching; emphasises continuity of layout to avoid jarring shifts.
- **Snackbars:** Dark slate background, white bold text, floating behaviour for unobtrusive alerts.
- **Queue nudges:** Dedicated snackbar style with `Color(0xFF0F172A)` background and accent outline, reserved for “assignment expiring” alerts so they stand out from general notifications without clashing with destructive banners.
- **Success states:** `SnackBar` variant with accent background and white text for confirmation actions; confetti animation reserved for major milestones (profile completion, launchpad graduation).
- **Volunteer confirmations:** Hour logging success triggers `SnackBar` variant with emerald background and subtle haptic `success` feedback; compliance blockers surface amber banners with inline CTA to resolve.
- **Error dialogs:** Use accent outline around modal, emphasise destructive CTA with red fill and safe secondary action.

## Motion & Transitions
- Material motion defaults at ≤200ms; page transitions use standard fade-through to maintain perception of speed.
- Pull-to-refresh uses stretching overscroll with accent indicator.
- Shared axis transition for stepping through onboarding forms; hero animations for card-to-detail expansions.

## Accessibility
- Minimum touch targets 48x48; haptic feedback for primary CTA presses and pull-to-refresh success.
- Contrast ratios preserved for accent text on light surfaces; focus highlights shown for keyboard/controller navigation scenarios.
- Semantic labelling ensures screen readers announce list counts, filter state, and CTA purpose.
- Text scaling tested up to 200%; dynamic layout prevents truncated CTAs by enabling vertical scroll sections; voice control hints provided via tooltip overlays.
