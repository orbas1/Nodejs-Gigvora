# Colour System – Phone Application v1.00

## Palette Overview
| Token | Hex | Usage |
| --- | --- | --- |
| `color.primary` | #2563EB | Primary CTAs, highlights, icons. |
| `color.primaryDark` | #1D4ED8 | Pressed states, hero gradients. |
| `color.primaryLight` | #60A5FA | Gradient endpoints, background glows. |
| `color.background` | #F8FAFC | App background, list surfaces. |
| `color.surface` | #FFFFFF | Cards, modals. |
| `color.surfaceMuted` | #F1F5F9 | Accordions, timeline backgrounds. |
| `color.border` | #E2E8F0 | Dividers, card outlines. |
| `color.textPrimary` | #0F172A | Primary text. |
| `color.textSecondary` | #475569 | Secondary text. |
| `color.textTertiary` | #94A3B8 | Metadata, placeholders. |
| `color.success` | #16A34A | Positive status, success toasts. |
| `color.warning` | #F59E0B | Offline banners, caution states. |
| `color.error` | #DC2626 | Validation errors, destructive states. |
| `color.info` | #0EA5E9 | Launchpad highlights, informational pills. |

## Gradients
- **Primary Gradient:** `linear-gradient(120deg, #1D4ED8 0%, #2563EB 60%, #60A5FA 100%)` (Feed hero, CTA backgrounds).
- **Launchpad Gradient:** `linear-gradient(160deg, #0EA5E9, #2563EB)` (Launchpad dashboard background).
- **Volunteering Gradient:** `linear-gradient(160deg, #14B8A6, #0EA5E9)` (Volunteering dashboards).
- **Authentication Orb Gradient:** `radial-gradient(circle, rgba(37,99,235,0.6) 0%, rgba(96,165,250,0) 70%)` (Backdrop orbs).

## Shadow Elevation
| Elevation | Parameters | Usage |
| --- | --- | --- |
| Base | `0 2 4 rgba(15,23,42,0.04)` | Card default. |
| Hover | `0 8 20 rgba(15,23,42,0.12)` | Card hover/focus. |
| FAB | `0 12 24 rgba(15,23,42,0.24)` | Floating action button. |
| Modal | `0 24 48 rgba(15,23,42,0.32)` | Bottom sheets, dialogs. |

## State Colours
- **Disabled:** apply `opacity 0.48` on surfaces, `opacity 0.38` on text, maintain background (#E2E8F0 for buttons).
- **Focus Outline:** 2dp stroke `#38BDF8`.
- **Keyboard/Voice Input Indicator:** 2dp underline `#2563EB` when field active.

## Implementation Notes
- Define `ColorScheme` custom in Flutter to align with tokens; ensure dark mode variant (future) uses inverted surfaces (#0F172A background, #1E293B surface) while keeping accent consistent.
- Document tokens in design system JSON for cross-platform alignment (`tokens/color.json`).
- Create semantic aliases (`color.ctaPrimary`, `color.badgeRemote`, `color.badgeUrgent`) to avoid hardcoding hex values in product code.
- Provide swatch documentation with contrast ratios; include `color-contrast-report.md` exported from Stark plugin for accessibility evidence.

## Colour Pairing Guidelines
- Pair `#2563EB` with neutral surfaces for readability; avoid pairing with warm tones (e.g., `#F59E0B`) unless separated by neutral spacing to prevent visual clash.
- Use warning `#F59E0B` only on banners, icons, or status badges—limit to one prominent element per viewport.
- Badge palette: Remote `#0EA5E9`, Hybrid `#6366F1`, Urgent `#DC2626`, Paid `#16A34A`. Ensure text remains white for readability.

## Testing & QA
- Validate gradients on low-end Android devices for banding; if observed, export as high-resolution PNG backgrounds.
- Run automated accessibility tests using `flutter_test` + `accessibility_testers` plugin to confirm colour contrast thresholds across states.
- Keep color tokens in sync with web design system by running weekly diff check between Flutter token JSON and Tailwind config.
