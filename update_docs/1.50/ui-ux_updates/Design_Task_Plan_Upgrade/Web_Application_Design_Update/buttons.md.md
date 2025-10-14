# Button System — Web Application v1.50

## Button Variants
- **Primary CTA:** Solid gradient background, used for hero, pricing, demo requests.
- **Secondary CTA:** Outlined with primary colour border, transparent background.
- **Tertiary Link Button:** Text with arrow icon for inline actions.
- **Ghost Button:** Transparent with subtle border for secondary hero actions.
- **Destructive Button:** Red fill for critical actions (delete account, cancel trial).
- **Pill Button:** Rounded pill for filter chips and quick toggles.

## Dimensions & Styling
- Default height 52px desktop, 48px tablet, 44px mobile.
- Padding 24px horizontal, 12px vertical for primary; adjust per variant.
- Border radius 12px (pill 999px).
- Icon size 20px with 8px spacing from text.

## States
- Rest, Hover, Active, Focus, Disabled, Loading.
- Hover lighten gradient; active darken; focus ring 3px `#4338CA` with offset.
- Loading uses spinner on left and disables interactions.

## Accessibility
- Minimum contrast 4.5:1 for text; use white text on dark backgrounds.
- Ensure keyboard focus visible; support Enter/Space activation.
- Provide aria labels for icon-only buttons.

## Placement Guidelines
- Primary CTA per section (hero, pricing) to maintain hierarchy.
- Align CTAs consistently (right alignment on desktop, centered on mobile).
- Pair CTAs with supporting text to set expectations ("Book a demo").

## Implementation Notes
- Buttons implemented as design system components with `variant`, `size`, `icon`, `loading` props.
- Provide CSS variables for gradient stops, border, text colour per variant.
- Document analytics events triggered by major CTAs (hero, pricing, demo, contact).
