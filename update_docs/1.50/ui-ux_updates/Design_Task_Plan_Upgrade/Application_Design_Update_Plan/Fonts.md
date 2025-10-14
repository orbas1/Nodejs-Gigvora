# Typography Specification — Application v1.50

## Primary Typefaces
- **Space Grotesk** — used for display headings, hero metrics, and key numerals.
- **Inter** — used for body text, labels, buttons, and supporting content.

## Type Scale
| Token | Font | Size/Line Height | Usage |
|-------|------|-----------------|-------|
| Display | Space Grotesk 600 | 40/48 | Hero headlines, landing statements |
| H1 | Space Grotesk 600 | 32/40 | Section titles, dashboard headers |
| H2 | Space Grotesk 500 | 28/36 | Subsection titles, card headers |
| H3 | Space Grotesk 500 | 24/32 | Drawer headers, modal titles |
| H4 | Space Grotesk 500 | 20/28 | Widget titles, table headings |
| Body L | Inter 400 | 18/28 | Long-form copy, help text |
| Body M | Inter 400 | 16/24 | Standard text, form labels |
| Body S | Inter 400 | 14/20 | Captions, helper text |
| Meta | Inter 500 | 12/16 | Metadata, tag labels |
| Button | Inter 600 | 16/24 | Primary and secondary buttons |
| Overline | Inter 600 | 12/16 | Section labels, filters |

## Typographic Guidelines
- Maintain consistent letter spacing: headings 0.01em, body 0em, overlines 0.08em uppercase.
- Use `font-feature-settings: "liga", "kern", "tnum"` to ensure ligatures, kerning, and tabular numerals.
- Apply responsive typography using CSS clamp to scale between breakpoints (e.g., `clamp(1.5rem, 1.2rem + 1vw, 2.5rem)`).
- Limit paragraph width to 72 characters for readability.

## Accessibility Considerations
- Minimum body size 16px for readability on desktop/mobile.
- Provide dynamic type scaling support up to 200% on mobile and 150% on web.
- Ensure heading hierarchy follows semantic HTML structure.

## Implementation Notes
- Define tokens: `font-heading`, `font-body`, `font-mono` (fallback `Menlo, monospace` for code snippets).
- Document fallback stacks: `Space Grotesk, 'Helvetica Neue', Arial, sans-serif`; `Inter, 'SF Pro Text', 'Segoe UI', sans-serif`.
- Provide font files via Google Fonts preconnect and self-hosted WOFF2 for reliability.
- Include preloading for primary weights (400, 500, 600) to avoid layout shifts.

## Testing Checklist
- Verify typographic scale across responsive breakpoints.
- Check alignment and baseline grids for cards, forms, and tables.
- Confirm accessibility compliance for contrast between text and background.
- Validate text rendering on Windows ClearType, macOS, Android, and iOS.
