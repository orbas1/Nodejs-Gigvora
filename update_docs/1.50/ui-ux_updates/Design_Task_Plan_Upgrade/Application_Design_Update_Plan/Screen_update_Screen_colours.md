# Screen Colour Strategy — Application v1.50

## Palette Overview
- Adopt Gigvora Indigo palette with supportive neutrals and accent highlights tailored for provider and consumer experiences.
- Maintain semantic colour tokens for status communication, surfaces, and typography ensuring consistency across screens.

## Colour Token Mapping
| Token | Value | Usage |
|-------|-------|-------|
| `surface.base` | `#FFFFFF` | Primary card backgrounds |
| `surface.alt` | `#F8FAFC` | Section backgrounds, tables |
| `surface.raised` | `#EEF2FF` | Elevated modules, drawers |
| `text.primary` | `#0F172A` | Headlines, primary body |
| `text.secondary` | `#475569` | Supporting copy |
| `text.inverse` | `#FFFFFF` | Text on dark backgrounds |
| `action.primary` | `#3730A3` | Primary buttons, active nav |
| `action.primary.hover` | `#4338CA` | Hover state |
| `action.secondary` | `#4C1D95` | Secondary actions |
| `accent` | `#F97316` | Highlights, metrics |
| `success` | `#16A34A` | Success states |
| `warning` | `#F59E0B` | Pending actions |
| `error` | `#EF4444` | Errors |
| `border.default` | `#CBD5F5` | Dividers, input borders |
| `shadow.base` | `rgba(15,23,42,0.12)` | Drop shadows |

## Screen Application Guidelines
1. **Dashboards**
   - Use `surface.base` for cards, `surface.alt` for background to create depth.
   - KPI deltas use `accent` for positive attention, `warning`/`error` for negative.
2. **Queues & Tables**
   - Alternate row backgrounds `surface.base`/`surface.alt` for readability.
   - Highlight SLA breaches with `warning` background and `text.primary` copy.
3. **Gig Creation Wizard**
   - Provide calming palette with `surface.base` forms, accent CTA, and neutral backgrounds.
   - Use `action.primary` for progress actions, `action.secondary` for back.
4. **Messaging**
   - Sent messages `#E0E7FF`, received messages `#F1F5F9` to differentiate participants.
   - System messages use `surface.raised` with border.
5. **Settings**
   - Ensure high contrast for form labels using `text.primary` with `surface.base` backgrounds.
   - Alerts within settings use `warning` or `error` with matching icons.

## Dark Mode Considerations
- Establish inverse tokens (`surface.base.dark = #0F172A`, `text.primary.dark = #E2E8F0`).
- Validate contrast for `action.primary.dark = #A5B4FC` to ensure accessibility.
- Update shadows to lighten (e.g., `rgba(15,23,42,0.4)` replaced with `rgba(15,23,42,0.7)`).

## Accessibility Guidelines
- Minimum contrast ratio 4.5:1 for text/body, 3:1 for large text and icons.
- Avoid relying solely on colour for status; pair with icons and text.
- Provide high-contrast theme toggle storing preference per user.

## Implementation Notes
- Tokens exported as CSS variables and JSON for cross-platform use.
- Document transitions for hover/focus states with colour adjustments of +6% lightness.
- Provide testing matrix to validate colour combinations under simulated colour blindness filters.
