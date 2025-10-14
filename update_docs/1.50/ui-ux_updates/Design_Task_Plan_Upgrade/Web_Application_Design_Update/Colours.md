# Colour System Specification — Web Application v1.50

## Palette Overview
- Align marketing and logged-in web experiences with Gigvora Indigo brand family while providing flexibility for campaign theming.
- Ensure tokens support accessibility, dark mode preparation, and charting needs.

## Primary Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `web.primary` | `#312E81` | Primary CTAs, active nav |
| `web.primaryHover` | `#4338CA` | Hover/focus |
| `web.secondary` | `#1D4ED8` | Secondary CTAs, links |
| `web.accent` | `#F97316` | Highlights, badges |
| `web.neutral.900` | `#0F172A` | Headings |
| `web.neutral.700` | `#334155` | Body text |
| `web.neutral.200` | `#E2E8F0` | Borders, dividers |
| `web.surface.base` | `#FFFFFF` | Cards, modals |
| `web.surface.alt` | `#F5F7FB` | Section backgrounds |
| `web.success` | `#16A34A` | Positive indicators |
| `web.warning` | `#F59E0B` | Warnings |
| `web.error` | `#DC2626` | Errors |

## Gradients & Special Treatments
- Hero gradient `linear-gradient(130deg, #312E81 0%, #1E3A8A 100%)` overlayed on photography.
- CTA gradient `linear-gradient(90deg, #4338CA, #312E81)` with hover lighten.
- Pricing highlight gradient `linear-gradient(180deg, rgba(49,46,129,0.08), rgba(67,56,202,0.02))`.

## Usage Guidelines
- Limit palette per section to primary + neutral + accent to maintain hierarchy.
- Provide tonal variations for charts (indigo, blue, teal, orange) with accessible contrast.
- Ensure call-to-action bars use high contrast with white text.
- Use subtle tinted backgrounds to differentiate sections without overwhelming the user.

## Accessibility
- Maintain minimum contrast ratios 4.5:1 for text, 3:1 for large text/icons.
- Provide focus outlines using `#4338CA` with 3px width.
- Include non-colour indicators (icons, patterns) for status messaging.

## Dark Mode Considerations
- Define dark mode tokens (`web.surface.base.dark = #0F172A`, `web.text.primary.dark = #E0E7FF`).
- Adjust accent brightness to remain visible on dark backgrounds.
- Replace shadows with glows where necessary (`rgba(67,56,202,0.45)`).

## Implementation
- Export tokens via Style Dictionary to CSS variables and SCSS maps.
- Provide usage documentation in design system with examples per component.
- Integrate with analytics dashboards to monitor performance impact of colour-heavy sections (e.g., hero backgrounds).

## Testing
- Run Lighthouse accessibility audits on staging builds.
- Evaluate under colour blindness simulators and grayscale.
- Validate readability under high/low brightness conditions on devices.
