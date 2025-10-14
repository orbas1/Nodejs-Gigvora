# Typography Specification — Web Application v1.50

## Typefaces
- **Space Grotesk** for headings and display text.
- **Inter** for body copy, UI labels, and supporting content.
- **Roboto Mono** for code snippets in developer resources.

## Type Scale & Usage
| Token | Font | Size/Line Height | Usage |
|-------|------|-----------------|-------|
| Display | Space Grotesk 600 | 48/56 | Hero headlines |
| H1 | Space Grotesk 600 | 40/48 | Section titles |
| H2 | Space Grotesk 500 | 32/40 | Subheadings |
| H3 | Space Grotesk 500 | 28/36 | Card titles |
| H4 | Space Grotesk 500 | 24/32 | Feature headings |
| Body L | Inter 400 | 18/28 | Long-form copy |
| Body M | Inter 400 | 16/24 | Standard paragraphs |
| Body S | Inter 400 | 14/20 | Captions, metadata |
| Button | Inter 600 | 16/24 | Buttons, CTAs |
| Overline | Inter 600 | 12/16 | Section labels |
| Mono | Roboto Mono 400 | 14/20 | Code snippets |

## Guidelines
- Use responsive typography with CSS clamp to maintain readability across breakpoints.
- Align text to baseline grid for consistent rhythm.
- Limit line length to 72 characters for body copy.
- Maintain consistent letter spacing: headings 0.01em, overlines 0.08em uppercase.

## Accessibility
- Minimum body size 16px; avoid reducing below 14px except metadata.
- Provide high contrast between text and backgrounds.
- Ensure headings follow semantic structure for screen readers.

## Implementation
- Preload primary font weights (400, 500, 600) using `link rel="preload"`.
- Serve fonts via self-hosted WOFF2 with fallback to system fonts.
- Provide CSS variables for font stacks and weight tokens.
- Document usage in design system and Storybook examples.
