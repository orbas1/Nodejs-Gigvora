# Provider Application Styling Changes – Version 1.00

## Color & Surfaces
- **Primary accent:** Gigvora blue `#2563EB` for CTAs, steppers, charts, and key alerts; deep accent `#1D4ED8` for hover/pressed states.
- **Support palette:** Success `#16A34A`, warning `#F59E0B`, danger `#DC2626`, info `#0EA5E9`; each paired with soft background tints for banners.
- **Surface tiers:**
  - Base background: gradient wash from white to `#EEF2FF`.
  - Surface: white cards with 24px radius, 1px `#E2E8F0` border.
  - Surface muted: `#F8FAFC` for sidebars, tables, and inline callouts.
- **Shadow system:** Subtle `rgba(15,23,42,0.08)` drop for cards; deeper `rgba(37,99,235,0.15)` for hover to signal interactivity.

## Typography & Iconography
- **Font stack:** Inter (400 body, 500 buttons, 600 subtitles, 700 headlines). Numeric data uses tabular figures for alignment.
- **Heading scale:** H1 40px/48, H2 32px/40, H3 24px/32, Body 16px/26, Caption 13px/20.
- **Icon style:** Outline heroicons for nav/actions; filled variants for success/warning states. Icon buttons maintain 48px hit area.
- **Badge & chip text:** Uppercase letter spacing 0.35em for status labels to match live feed aesthetic.

## Components
- **Buttons:**
  - Primary: filled accent, 16px radius, medium weight, drop shadow on hover.
  - Secondary: outlined with `#93C5FD` border, tinted hover fill.
  - Ghost: transparent background, accent text, used for tertiary actions.
- **Inputs:** Rounded 18px corners, filled backgrounds, 14px padding, inline validation message in `#DC2626` with icon.
- **Tables:** Zebra striping using `#F1F5F9`; sticky headers with subtle shadow for horizontal scroll contexts.
- **Cards:** Compose header (title + status chip), body text, CTA row; optional footer for metadata like "Last updated".
- **Stepper:** Accent progress bar with numbered dots, tooltips for upcoming steps, and inline error summary.
- **Data visualisations:** Charts use monochromatic accent gradients with white gridlines; tooltips adopt dark slate background with white text.
- **Modals/drawers:** Elevated surfaces `rgba(15,23,42,0.16)` overlay, `rounded-3xl`, `shadow-2xl` for clarity.
- **Tag pills:** Soft `#E0F2FE` fill, uppercase 12px text, inner shadow for tactile feel.

## States & Feedback
- **Loading:** Skeleton cards with animated shimmer; spinner reserved for blocking operations (publishing, exports).
- **Empty:** Friendly illustration, message, and CTA (e.g., "Post your first opportunity").
- **Error:** High-contrast banner with action button (Retry, Contact support); inline field errors highlight border in danger hue.
- **Offline:** Amber banner pinned top-of-screen with reconnect CTA; cached data flagged with italic note.
- **Success:** Toasts with green border accent, checkmark icon, auto-dismiss after 4 seconds unless action present.
- **Warning:** Goldenrod border with subtle striped background to emphasise compliance alerts.

## Responsive Behaviour
- Breakpoints align with 320/480/768/1024/1280/1536.
- On tablet, cards stack vertically and steppers convert to vertical timeline.
- On mobile, sticky bottom bar surfaces main actions; tables collapse into card lists with key fields stacked.
- Large monitor (>1536px) introduces content max-width to prevent overly long line lengths and anchors analytics charts centrally.

## Accessibility & Compliance
- Minimum contrast ratio 4.5:1 for text; 3:1 for large display type.
- Focus state uses 3px accent outline + 2px white offset to ensure visibility on dark backgrounds.
- Motion reduced mode disables parallax/blur backgrounds and uses fade transitions.
- Support for keyboard/assistive navigation: skip-to-content link, logical tab order, ARIA labels on icons.
- Descriptive alt text required on uploaded assets; modals trap focus until closed; high contrast mode toggles available in settings.
