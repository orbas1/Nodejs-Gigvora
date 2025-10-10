# Buttons Specification – Web Application Version 1.00

## Button Catalogue
| Variant | Height | Padding | Font | Border Radius | Default | Hover | Active | Focus |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Primary | 56px | 0 28px | Inter 600 16px | 9999px | Gradient `#2563EB → #1D4ED8`, white text | Brighten to `#3B82F6`, raise shadow | `transform: scale(0.99)`, darken `#1E40AF` | Outline `#2563EB` + 4px glow |
| Secondary | 52px | 0 26px | Inter 600 16px | 9999px | Border `#2563EB`, text `#2563EB` | Fill `rgba(37,99,235,0.12)` | Border `#1D4ED8` | Outline same |
| Tertiary Link | 48px | 0 16px | Inter 500 16px | 12px | Text `#2563EB` underline hidden | Underline appears | Underline persists, text `#1D4ED8` | Outline `#93C5FD` |
| Destructive | 56px | 0 28px | Inter 600 16px | 9999px | `#EF4444` background | `#DC2626` | `#B91C1C` | Outline `rgba(239,68,68,0.35)` |
| Icon Circle | 48px | 0 | Inter 500 14px | 9999px | `rgba(255,255,255,0.9)` with border `#E2E8F0` | Shadow accent | Pressed state removes shadow | Outline `#2563EB` |
| Floating CTA | 64px | 0 32px | Inter 600 18px | 32px | Gradient background, drop shadow accent | Glow intensifies | `transform: translateY(1px)` | Outline `#2563EB` |

## Icon Placement
- Icon size 20px, placed 12px left/right of label; maintain `gap: 12px`.
- For icon-only button: maintain `min-width` equal to height, centre icon.

## Disabled State
- Background `#CBD5F5`, text `#94A3B8`, cursor default. Keep 4.5:1 ratio vs background.
- Remove hover/active transitions but preserve focus outline for accessibility.

## Loading State
- Replace label with spinner (Tailwind `animate-spin` 1s). Maintain button width by reserving space using `min-width` property.
- Provide `aria-live="assertive"` message "Action in progress".

## Responsive Adjustments
- On ≤480px, primary/secondary buttons expand to full width, `height: 52px`, font size 15px.
- For stacked CTAs, maintain `gap: 16px` desktop, `12px` mobile.

## Usage Guidelines
- Limit to one primary button per surface; pair with secondary or tertiary if multiple actions exist.
- Destructive reserved for irreversible actions (delete project). Provide confirmation modal.
- Floating CTA appears after scroll 600px; hide on modals to reduce clutter.

## Implementation Tokens
- CSS variables: `--button-radius-pill`, `--button-shadow-primary`, `--button-gradient-primary` defined in `Css.md`.
- SCSS mixins for button variants in `Scss.md` to ensure consistent hover/active behaviour.
