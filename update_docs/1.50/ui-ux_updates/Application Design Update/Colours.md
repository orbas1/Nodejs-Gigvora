# Colour System

## Palette Overview
- **Primary:** Sapphire (#1E4ED8), Indigo (#1A3FA4), Sky (#38BDF8).
- **Secondary:** Violet (#7C3AED), Purple (#6D28D9), Teal (#0EA5E9) for specialised modules.
- **Neutrals:** Slate 900–100 scale (#0F172A → #F8FAFC) for backgrounds and typography.
- **Semantic:** Emerald (#10B981), Amber (#F59E0B), Rose (#F43F5E).

## Usage
- Primary gradient for primary actions and hero components.
- Secondary accents highlight Launchpad, volunteer, and ads modules.
- Neutrals ensure readability across data-heavy screens.

## Tokens
- Define tokens: `color.primary.base`, `color.primary.hover`, `color.secondary.launchpad`, `color.semantic.success`, etc.
- Provide JSON token export for integration with Flutter and web.

## Accessibility & Testing
- All combinations tested for WCAG AA compliance.
- Provide dark-mode palette for future expansion (Primary 200–400, Neutral 900 background).

## Implementation
- Update Figma styles and share token documentation with engineering.
- Establish linting rules in Flutter to restrict usage to tokenised colours.
