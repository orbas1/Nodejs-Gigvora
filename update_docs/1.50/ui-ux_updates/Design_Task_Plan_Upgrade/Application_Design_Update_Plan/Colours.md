# Colour System Specification — Application v1.50

## Purpose
Establish comprehensive colour guidance for application surfaces, interactions, and states to ensure cohesion with the Gigvora brand while meeting accessibility standards.

## Palette Structure
- **Foundational Base:** Neutral greys providing structural backgrounds and typography contrast.
- **Brand Core:** Gigvora Indigo spectrum for primary branding and CTA emphasis.
- **Supportive Accents:** Warm orange, calming teal, and success/error variants to signify status.
- **Semantic Tokens:** Mapped to use cases (background, border, text, icon) with light/dark variants.

## Token Catalogue
| Token | Hex | Usage |
|-------|-----|-------|
| `color.brand.primary` | `#3730A3` | Primary CTAs, nav highlights |
| `color.brand.primaryHover` | `#4338CA` | Hover/focus |
| `color.brand.secondary` | `#4C1D95` | Secondary buttons, gradients |
| `color.brand.accent` | `#F97316` | Highlights, badges |
| `color.background.canvas` | `#F1F5F9` | App background |
| `color.background.surface` | `#FFFFFF` | Cards, panels |
| `color.background.alt` | `#EEF2FF` | Raised surfaces |
| `color.text.primary` | `#0F172A` | Headings |
| `color.text.secondary` | `#475569` | Body |
| `color.text.muted` | `#94A3B8` | Metadata |
| `color.border.default` | `#CBD5F5` | Dividers |
| `color.state.success` | `#16A34A` | Positive alerts |
| `color.state.warning` | `#F59E0B` | Warnings |
| `color.state.error` | `#EF4444` | Errors |
| `color.state.info` | `#2563EB` | Informational banners |
| `color.overlay.backdrop` | `rgba(15,23,42,0.45)` | Modal overlay |

## Usage Guidelines
- Limit palette usage per screen to maintain focus (primary, neutral, accent).
- Use semantic tokens rather than raw hex values to ensure consistency and future flexibility.
- Pair accent colours with neutral backgrounds to avoid overwhelming visuals.
- Provide tonal ramps for charts and data visualisations (lightened/darkened variants of brand colours).

## Accessibility Standards
- Ensure contrast ratio of at least 4.5:1 for text and interactive elements, 3:1 for large text and iconography.
- Provide alternative indicators (icons, text) alongside colour-coded statuses.
- Offer high-contrast theme toggle and store preference per user profile.

## Dark Mode Preparation
- Define inverse tokens (e.g., `color.background.canvas.dark = #0F172A`, `color.text.primary.dark = #E2E8F0`).
- Adjust accent saturation to maintain vibrancy on dark surfaces.
- Update elevation treatments using lighter shadows/glows.

## Implementation Approach
- Export tokens via Style Dictionary into CSS variables, SCSS maps, Tailwind config, and mobile theming files.
- Document animation transitions for colour changes (hover, focus, pressed) with 120ms ease-out.
- Provide design QA checklist verifying colour usage per component and screen.

## Testing & Validation
- Run colour contrast audits using tools (Stark, Axe) on high-fidelity mockups.
- Test palettes under simulated colour blindness filters.
- Validate readability in bright/dim lighting scenarios on mobile devices.

## Governance
- Change requests submitted via DesignOps ticket with rationale and impact analysis.
- Maintain colour swatches in Figma library with locked naming conventions.
- Review palette quarterly to align with evolving brand strategy.
