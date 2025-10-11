# Typography Specifications – Phone Application v1.00

## Type Family
- **Primary:** Inter (Google Fonts). Use variable font with optical sizing, enabling weights 400–700.
- **Secondary (Mono):** JetBrains Mono for code/error references.
- **Fallbacks:** `system-ui`, `-apple-system`, `Roboto`, `Segoe UI`, `sans-serif`.

## Scale & Usage
| Style Token | Font Size / Line Height | Weight | Letter Spacing | Use Cases |
| --- | --- | --- | --- | --- |
| Display/L | 32 / 40 | 700 | -0.5 | Hero headlines (Feed spotlight, onboarding slides). |
| Display/M | 28 / 36 | 600 | -0.2 | Section intros (Launchpad header). |
| Title/L | 24 / 32 | 600 | 0 | Opportunity titles, profile headings. |
| Title/M | 20 / 28 | 600 | 0 | Card headings, CTA titles. |
| Title/S | 18 / 26 | 600 | 0 | Dialog titles, dashboard metrics labels. |
| Body/L | 16 / 24 | 500 | 0 | Primary body copy, filter chips. |
| Body/M | 15 / 22 | 500 | 0 | Supporting copy, button secondary text. |
| Body/S | 14 / 20 | 500 | 0.1 | Metadata, tags, inline helper text. |
| Caption | 12 / 16 | 500 | 0.2 | Overline labels, timestamp, chip captions. |
| Micro | 11 / 16 | 600 | 0.4 | Badge text, timeline metadata. |

## Responsive Adjustments
- On small devices (<360dp), reduce Display styles by 2sp to prevent wrapping.
- On tablets (>600dp), allow Display L to scale to 36/44 for hero sections.
- Ensure dynamic type scaling (Flutter `MediaQuery.textScaleFactor`) does not exceed layout boundaries; wrap in `FittedBox` for chips.

## Accessibility Notes
- Maintain minimum 4.5:1 contrast for text on backgrounds; apply `Shadow(color: rgba(15,23,42,0.18), blurRadius: 12)` on hero overlays to boost readability.
- Provide alt text for icons; do not rely solely on colour-coded text for state.

## Implementation
- Define text theme in `ThemeData` using custom `TextTheme` aligning to tokens above (`displayLarge`, `headlineMedium`, etc.).
- Utilise `GoogleFonts.inter()` helper or pre-bundle fonts for offline readiness.
- Register custom `TextTheme` extension `GigvoraTextStyles` with semantic getters (e.g., `GigvoraTextStyles.heroHeadline(context)`). Document usage in engineering wiki to keep hierarchy consistent.
- Ensure kerning adjustments for uppercase overlines (`Caption`) by enabling stylistic set `ss02` in Inter to tighten letter spacing for accessibility.

## Typesetting Rules
- Maximum line length for body copy: 65 characters to maintain readability. On tablets, enforce column width 520dp to avoid overly long lines.
- Headlines should avoid widows; adjust copy or manual line breaks in Figma if necessary. Provide `softWrap: true` but restrict to two lines using `maxLines: 2` + `overflow: TextOverflow.ellipsis`.
- Button labels remain sentence case; avoid all caps to preserve legibility in smaller sizes.

## Localization Considerations
- Reserve fallback fonts for languages requiring extended glyph sets (e.g., Noto Sans for CJK, Devanagari). Define per-locale mapping in Flutter using `localeResolutionCallback`.
- Support right-to-left scripts by ensuring `TextAlign.start` is used in components; verify mirrored layout for Arabic/Hebrew screens.
- Provide style guide for accent characters (é, ñ) ensuring they align with baseline (Inter supports via default metrics).
