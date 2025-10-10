# Button System – Web Application v1.50

## Variants
| Variant | Usage | Styling |
| --- | --- | --- |
| Primary | Primary actions such as "Publish gig", "Create invoice" | Background `--accent-500`, text `#FFFFFF`, shadow level 1, hover `--accent-700`. |
| Secondary | Supporting actions, modal confirmations | Border `--accent-500`, text `--accent-700`, transparent background, hover adds tint `--accent-50`. |
| Tertiary | Low-emphasis actions ("View details") | Text `--accent-500`, underline on hover, no background. |
| Danger | Destructive actions ("Cancel contract") | Background `--danger-500`, text white, hover darken to #B73A3A. |
| Success | Positive actions ("Mark complete") | Background `--success-500`, text white. |
| Ghost | Used on dark hero backgrounds | Text white, 1px white border, hover adds 12% white fill. |

## Sizes
- **Large:** Height 52px, horizontal padding 24px. Used in onboarding CTAs.
- **Medium:** Height 44px, horizontal padding 20px. Default for dashboards.
- **Small:** Height 36px, horizontal padding 16px. Inline actions.
- **Icon-only:** Square (44px/36px/32px). Provide accessible `aria-label`.

## States
- Hover: lighten/darken background by 8%, apply elevation level 1 if not already.
- Focus: 2px outline using `--accent-300` with 2px offset.
- Active: compress shadow, translateY(1px).
- Disabled: reduce opacity to 0.45, remove pointer events.

## Accessibility & Behaviour
- Buttons must be reachable via keyboard (tab order) and respond to Enter/Space.
- Loading state overlays spinner left-aligned with label; disable double submission.
- Provide progress feedback for long-running actions using inline statuses.
