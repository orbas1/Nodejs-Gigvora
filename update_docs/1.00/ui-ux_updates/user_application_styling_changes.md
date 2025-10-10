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

## Feedback & States
- **Offline/Cache banners:** Amber/danger/neutral palettes for offline, error, and cache states with iconography aligning to Material tokens.
- **Skeletons:** Placeholder shimmer for lists while fetching; emphasises continuity of layout to avoid jarring shifts.
- **Snackbars:** Dark slate background, white bold text, floating behaviour for unobtrusive alerts.

## Motion & Transitions
- Material motion defaults at ≤200ms; page transitions use standard fade-through to maintain perception of speed.
- Pull-to-refresh uses stretching overscroll with accent indicator.

## Accessibility
- Minimum touch targets 48x48; haptic feedback for primary CTA presses and pull-to-refresh success.
- Contrast ratios preserved for accent text on light surfaces; focus highlights shown for keyboard/controller navigation scenarios.
- Semantic labelling ensures screen readers announce list counts, filter state, and CTA purpose.
