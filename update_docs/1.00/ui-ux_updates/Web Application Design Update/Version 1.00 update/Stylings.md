# Stylings – Web Application Version 1.00

## Layout Grid
- **Breakpoints:**
  - `xs` 320–479px, `sm` 480–767px, `md` 768–1023px, `lg` 1024–1279px, `xl` 1280–1535px, `2xl` 1536–1919px, `3xl` ≥1920px.
- **Column System:** 12-column grid using CSS clamp: `grid-template-columns: repeat(12,minmax(0,1fr))`. Gutter default 24px, 16px at `sm`, 32px at `xl+`.
- **Section Spacing:** Desktop `padding-block: 120px` hero, `96px` standard sections, `72px` dense sections. Mobile halved.

## Surface Tokens
| Token | Value | Usage |
| --- | --- | --- |
| `surface/base` | `#F8FAFC` | Body background |
| `surface/elevated` | `rgba(255,255,255,0.92)` | Cards, drawers |
| `surface/accent` | `linear-gradient(135deg,#2563EB,#1D4ED8)` | CTA, hero highlight |
| `surface/softBlue` | `rgba(37,99,235,0.12)` | Metric backgrounds |
| `surface/dark` | `#0B1B3F` | Footer, overlays |

## Shadows
- **Shadow Soft:** `0 12px 24px -12px rgba(15,23,42,0.25)`.
- **Shadow Medium:** `0 20px 40px -20px rgba(15,23,42,0.28)`.
- **Shadow Accent:** `0 24px 48px -16px rgba(37,99,235,0.35)` for hero CTA.
- **Focus Ring:** `0 0 0 4px rgba(37,99,235,0.18)` outer glow plus inner `0 0 0 1px #1D4ED8`.

## Border Radii
- `radius-sm`: 12px for input fields.
- `radius-md`: 16px for accordions.
- `radius-lg`: 24px for cards and banners.
- `radius-pill`: 9999px for chips, buttons.

## Gradients & Light Effects
- **Hero background:** `linear-gradient(115deg,#0B1B3F 0%,#1D4ED8 48%,#38BDF8 100%)` with overlay `radial-gradient(circle at 25% 20%, rgba(56,189,248,0.28), transparent 60%)`.
- **Callout band:** `linear-gradient(90deg,#1D4ED8 0%,#2563EB 50%,#0EA5E9 100%)` using 180° rotation on hover for dynamic sheen.
- **Parallax orbs:** 360px diameter blurred circles moving 8px on scroll (disabled for reduced motion).

## Typography
- Documented in `Fonts.md`; base size 16px; `line-height` 1.6 body, 1.2 headings.
- `letter-spacing`: +0.02em for uppercase labels.

## Iconography
- Primary icon weight 2px stroke from Heroicons outline; fill icons only for metrics to emphasise.
- Icon container sizes: 48px (cards), 64px (hero), 32px (buttons).

## Imagery Treatment
- Illustrations tinted to match accent palette using overlay `mix-blend-mode: multiply` with `#2563EB` at 12%.
- Photos use duotone filter (#0B1B3F, #38BDF8) applied via CSS `filter` for hero background photography.

## Motion & Interaction
- **Hover Elevation:** Cards translate Y -4px, shadow accent becomes visible.
- **Underline Animation:** `transform: scaleX(0)` to `scaleX(1)` in 220ms for nav links.
- **Button Glow:** Box-shadow pulses (opacity 0.25 → 0.4) using keyframes `ctaPulse` 2.5s infinite for hero primary button.
- **Skeleton shimmer:** 1400ms linear infinite.

## Accessibility Considerations
- Minimum text contrast ratio 4.5:1. Buttons maintain 3:1 even on hover.
- Focus order matches visual order, skip link located top-left (1px border, becomes visible on focus).
- Support for dark-mode not yet targeted but tokens prepared for inversion (documented for future release).

## Messaging Bubble
- Bubble container: 64px diameter, gradient fill `linear-gradient(135deg,#2563EB,#1D4ED8)` with inner shadow `inset 0 2px 6px rgba(255,255,255,0.28)` and drop shadow `0 16px 32px -16px rgba(37,99,235,0.42)`.
- Unread badge: 18px pill using `surface/softBlue` background, accent text, positioned top-right with translate adjustments for focus ring.
- Expanded panel width 360px desktop, 100% viewport minus 32px margins on mobile; background `surface/elevated` with blur `backdrop-filter: blur(12px)` for overlay feel.
- Input tokens reuse `radius-lg`, `surface/base`, and focus ring tokens; send button uses accent gradient with disabled state 45% opacity.
- Support button uses outline style with `border: 1px solid rgba(37,99,235,0.24)` and hover fill `rgba(37,99,235,0.08)`.

## Feed Engagement Styling
- Reaction chips: pill buttons 36px height, 14px font-size, `surface/base` default with `surface/softBlue` hover and `surface/accent` active state; icons tinted `#1D4ED8`.
- Comment drawer uses `border-top: 1px solid rgba(15,23,42,0.08)`, background `#FFFFFF`, and sticky footer composer with drop shadow `0 -8px 16px -12px rgba(15,23,42,0.12)`.
- Share modal overlay `rgba(15,23,42,0.48)` with glass card `backdrop-filter: blur(18px)` and accent header.
- Moderation badges: uppercase label 10px, `background: rgba(249,115,22,0.16)` with text `#EA580C`.

## Trust Center Styling
- KPI tiles reuse `surface/elevated` with accent underline `linear-gradient(90deg,#2563EB,#1D4ED8)` at 4px height and typography scale `T-Title 700` for amounts.
- Release queue table cells use `font-weight: 600` for references, `font-weight: 500` for amounts; action buttons apply accent gradient with disabled opacity 0.45.
- Dispute cards adopt `border: 1px solid rgba(15,23,42,0.08)` and stage badge colours: intake `rgba(37,99,235,0.12)`, mediation `rgba(14,165,233,0.14)`, arbitration `rgba(249,115,22,0.14)`, resolved `rgba(34,197,94,0.14)`.
- R2 evidence health tile uses dark gradient background (`linear-gradient(120deg,#0B1B3F,#1E3A8A)`) with dot indicators `#22C55E` for nominal state and `#F97316` for degraded.
