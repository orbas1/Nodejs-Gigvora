# Typography System – Web Application Version 1.00

## Typeface Stack
- **Primary:** `Inter` (weights 300, 400, 500, 600, 700).
- **Fallbacks:** `"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif`.
- **Mono:** `"JetBrains Mono", "SFMono-Regular", Menlo, monospace` used for code snippets in knowledge base sections.

## Base Settings
- Root font size `16px`; `html { font-size: clamp(15px, 1vw + 0.5rem, 17px); }` to preserve readability across viewports.
- Body line-height `1.6`; headings line-height `1.2` (h1) and `1.3` (h2–h4).
- Paragraph spacing `margin-block: 0 16px`; lists `margin-left: 24px`.

## Heading Scale
| Token | CSS Size | Weight | Use Case |
| --- | --- | --- | --- |
| `display-xxl` | `clamp(48px, 4vw, 80px)` | 700 | Hero headline |
| `display-xl` | `clamp(36px, 3vw, 56px)` | 600 | Section hero |
| `heading-lg` | `clamp(28px, 2.4vw, 40px)` | 600 | Dashboard headers |
| `heading-md` | `24px` | 600 | Card titles |
| `heading-sm` | `20px` | 500 | Subheaders, modals |
| `heading-xs` | `18px` | 500 | Chips, metadata |

## Body Scale
| Token | Size | Weight | Line Height | Usage |
| --- | --- | --- | --- | --- |
| `body-lg` | 18px | 400 | 1.7 | Longform copy |
| `body-md` | 16px | 400 | 1.6 | Default paragraph |
| `body-sm` | 14px | 400 | 1.5 | Secondary info, form helper |
| `body-xs` | 12px | 500 | 1.4 | Labels, badges |

## Special Treatments
- **Uppercase Labels:** Tracking `0.26em`, weight 600, size 12px; used for eyebrow text above hero headings.
- **Numerical Metrics:** `font-feature-settings: "tnum" 1, "ss01" 1` to ensure tabular alignment for stats.
- **Quotes:** Use `font-style: italic`, `font-weight: 400`, `font-size: 18px`, and include 32px leading quote icon.

## Responsive Behaviour
- Use `clamp` to maintain readability on 4K displays; ensures hero text never exceeds 80px.
- On mobile (≤480px) reduce hero H1 to 40px, CTA copy to 16px.

## Accessibility & Internationalisation
- Provide 1.2 × line height for languages with longer words (German). Support fallback for CJK using `"Noto Sans JP"` when locale requires.
- Ensure text does not break when translated by using `min-width: 0` on flex containers and `hyphens: auto` for paragraphs.
- Use `aria-hidden="true"` on decorative dropcaps to avoid screen reader confusion.
