# Typography System – Web Application v1.50

## Typefaces
- **Primary:** "Inter" for UI copy and numbers; open-source, high legibility across weights.
- **Secondary:** "DM Serif Display" for marketing hero headlines and celebratory states.
- **Mono:** "Roboto Mono" for code snippets, API keys, and ledger references.

## Scale (clamp values)
| Style Token | Weight | Clamp | Usage |
| --- | --- | --- | --- |
| `display-1` | 600 | `clamp(2.5rem, 2.2vw + 1rem, 3.25rem)` | Marketing hero and key celebratory banners. |
| `heading-1` | 600 | `clamp(2rem, 1.6vw + 0.8rem, 2.75rem)` | Page titles (Home, Dashboard, Launchpad). |
| `heading-2` | 600 | `clamp(1.5rem, 1.2vw + 0.6rem, 2.125rem)` | Section headers, card headings. |
| `heading-3` | 600 | `clamp(1.25rem, 1vw + 0.5rem, 1.75rem)` | Widget titles, modals. |
| `body-1` | 500 | `clamp(1rem, 0.5vw + 0.85rem, 1.125rem)` | Primary body copy. |
| `body-2` | 400 | `clamp(0.9375rem, 0.4vw + 0.8rem, 1.05rem)` | Secondary text, metadata. |
| `caption` | 500 | `clamp(0.8125rem, 0.3vw + 0.7rem, 0.9rem)` | Helper text, table headers. |
| `mono` | 500 | `clamp(0.875rem, 0.3vw + 0.74rem, 1rem)` | Code, IDs, amount columns. |

## Line Height & Letter Spacing
- Display/Heading: 120% line-height, -0.01em letter-spacing for headings.
- Body text: 150% line-height, 0em letter-spacing.
- Caption: 140% line-height, 0.02em letter-spacing for legibility.

## Accessibility Considerations
- Minimum text size 14px (`body-2`) except legally required disclaimers (12px) accompanied by tooltip expansion.
- Provide dynamic type scaling respecting browser zoom up to 200% without layout breakage.
- Ensure tabular data maintains fixed numeric widths using the mono type token.
