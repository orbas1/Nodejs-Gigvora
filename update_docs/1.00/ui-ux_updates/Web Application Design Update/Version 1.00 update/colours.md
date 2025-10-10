# Colour Tokens – Web Application Version 1.00

## Primary Palette
| Token | Hex | Usage | Contrast Pairing |
| --- | --- | --- | --- |
| `accent.primary` | `#2563EB` | Primary buttons, nav underline, chips | Use with `#FFFFFF` text (WCAG 8.6:1) |
| `accent.deep` | `#1D4ED8` | Hover states, gradients base | Use with `#FFFFFF` text |
| `accent.light` | `#60A5FA` | Metrics backgrounds, icons | Use with `#0B1B3F` text |
| `accent.sky` | `#38BDF8` | Gradient orbs, info highlights | Use with `#0B1B3F` text |

## Neutral Palette
| Token | Hex | Usage |
| --- | --- | --- |
| `neutral.900` | `#0B1B3F` | Headings, dark surfaces |
| `neutral.800` | `#1E293B` | Body text on light surfaces |
| `neutral.600` | `#475569` | Secondary text |
| `neutral.400` | `#94A3B8` | Placeholder, divider lines |
| `neutral.200` | `#E2E8F0` | Borders, card outlines |
| `neutral.100` | `#F1F5F9` | Surface tints |
| `neutral.050` | `#F8FAFC` | Page background |

## Semantic Palette
| Context | Background | Border | Text | Icon |
| --- | --- | --- | --- | --- |
| Success | `#DCFCE7` | `#22C55E` | `#166534` | `#15803D` |
| Warning | `#FEF3C7` | `#F59E0B` | `#92400E` | `#B45309` |
| Danger | `#FEE2E2` | `#EF4444` | `#991B1B` | `#DC2626` |
| Info | `#E0F2FE` | `#0EA5E9` | `#0369A1` | `#0284C7` |

## Gradients
1. **Hero Gradient:** `linear-gradient(115deg,#0B1B3F 0%,#1D4ED8 45%,#2563EB 65%,#38BDF8 100%)`.
2. **CTA Button Gradient:** `linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)`.
3. **Stats Halo:** `radial-gradient(circle at center, rgba(37,99,235,0.24) 0%, rgba(14,165,233,0) 70%)`.
4. **Footer Glow:** `linear-gradient(180deg,rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)` overlay on dark base.

## Colour Usage Ratios
- **Primary surfaces**: 65% neutral, 25% accent, 10% semantic.
- **Charts:** Use accent with complementary teal `#0EA5E9`, amber `#F59E0B`, violet `#7C3AED`, ensuring accessible colourblind palette.

## Accessibility Testing
- Buttons and links tested with `axe-core` to guarantee 3:1 ratio. Provide `:focus-visible` outlines `#2563EB` on `#FFFFFF` surfaces.
- Dark backgrounds (footer, modals) pair `#E2E8F0` text with `#0B1B3F` surfaces to achieve 7.8:1 ratio.

## Theming Notes
- Colour tokens exposed via CSS variables: `--color-accent-primary`, etc. They map to SCSS placeholders for maintainability.
- Future dark mode: invert neutrals, maintain accent tokens but adjust brightness to `#3B82F6` for readability on dark surfaces.
