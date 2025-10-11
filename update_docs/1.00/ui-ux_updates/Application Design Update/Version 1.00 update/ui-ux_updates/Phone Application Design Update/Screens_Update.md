# Screen Updates Overview – Phone Application v1.00

## Feed
- Introduce **hero spotlight** band (120dp height) featuring dynamic background gradient (`linear-gradient(120deg, #1D4ED8 0%, #2563EB 60%, #60A5FA 100%)`) with overlayed copy (Inter 26/32 semibold) and CTA chips (48dp height).
- Refresh feed cards with 24dp corner radius, 30dp blur drop shadow (`rgba(15, 23, 42, 0.08)`), and metadata chips using pill badges (height 28dp, padding 12/8).
- Add inline offline banner (accent `#F59E0B`) and cached timestamp pill anchored at top of list.

## Explorer
- Expand search overlay to full-screen with frosted glass backdrop (background blur 18px, tint `rgba(15, 23, 42, 0.72)`), containing segmented filters and voice mic button sized 40dp.
- Integrate result grouping headers (Inter 16/24 medium) with sticky behaviour and show skeleton loaders (3 shimmer cards) while data loads.

## Marketplace Vertical Lists
- Align Jobs, Gigs, Projects, Launchpad, Volunteering to shared scaffold featuring pinned filter bar (chips height 32dp) and inline analytics pill summarising results found.
- Add CTA stack at bottom (Apply/Pitch/Join) using filled button style (height 52dp, corner 16dp) with icon leading.
- Introduce category-specific accent icons sourced from `assets/icons/marketplace/*.svg` (new vector set described in imagery spec).

## Opportunity Detail
- Rebuild header into layered hero: background image (16:9 ratio) + gradient overlay + floating summary card (width 328dp, elevation 2) containing title, org, location, deadline.
- Requirements and benefits presented as accordion with 4px dividing lines, 16dp padding, and collapse animation 180ms.
- Sticky action bar at bottom (height 68dp) with primary CTA, secondary share, bookmark icon buttons.

## Launchpad & Volunteering Dashboards
- Convert to card grid with alternating gradient ribbons referencing track colours (#0EA5E9 for Launchpad, #14B8A6 for Volunteering).
- Include progress tracker using segmented progress bar (height 12dp, radius 6dp) and milestone timeline with vertical line (2dp) anchored left.

## Profile & Portfolio
- Layered cover treatment: radial gradient orbs (primary/deep accent) behind 96dp avatar, with `Edit` and `Share` pill buttons overlayed bottom right.
- Stats row uses 3 cards (width 104dp each) featuring icon chips, metrics (Inter 20/24 semibold), and caption (12/16 medium).
- Portfolio gallery implements masonry layout with 8dp gaps, each tile having overlay for quick actions.

## Notifications & Inbox
- Notification centre uses grouped list with date headers (uppercase, letter spacing 1.5%). Each entry features icon bubble (48dp) tinted by category.
- Inbox conversation view includes message bubbles with accent gradient for sent messages, neutral slate (#E2E8F0) for received, 16dp corner radius.
- Compose bar anchored bottom with attachments icon, input field (min height 44dp), send button (accent filled circular 44dp).

## Authentication & Admin
- Login and register screens adopt central card with 32dp padding, 24dp radius, and layered gradient background with blurred orbs.
- Company registration adds `Stepper` indicator across top (dots with active accent) and inline validation copy (#DC2626 for errors).
- Admin login toggles dark surface (#0F172A) with accent accent (#2563EB) highlight and security badge icon.

## Offline & Error States
- Full-screen overlay with gradient tinted illustration, supporting copy (Inter 18/26 medium) and CTA pair (primary, outline) sized 52dp height.
- Provide diagnostic detail using code block style container (background `#1E293B`, monospaced Inter 14/20) for error reference IDs.

## Support Hub & Knowledge Base
- Landing hero card spans 344dp width, 180dp height with `linear-gradient(140deg, #1D4ED8, #60A5FA)` background, overlay illustration 160×160 right-aligned.
- Search field 52dp height with inset shadow `0 12 32 rgba(15,23,42,0.08)` and clear button. Autocomplete dropdown uses 44dp rows, 12dp padding.
- Featured articles grid: two-column layout (item width 160dp, height 140dp) on phone, three-column on tablet. Each tile includes icon (32dp), title (16/24 semibold), snippet (14/20 medium), and "Read more" inline CTA.
- Contact options displayed as stacked cards (height 120dp) with icon bubble 48dp, gradient accent stripe 6dp on left (#38BDF8). Buttons follow secondary CTA styling.

## Welcome Tour & Onboarding Carousel
- Carousel height 420dp, card radius 24dp, padding 24dp. Illustrations sized 220×160 with parallax offset 12dp when swiping.
- Pagination dots 8dp diameter, active dot elongated to 24×8dp with accent gradient fill. Buttons pinned bottom with safe-area aware 20dp margins.
- Provide optional skip text button (ghost style) top-right; ensure accessible focus order (Skip → content → Next/CTA).

## Tablet & Fold Optimisations
- For widths >840dp, feed/explorer adopt dual-pane layout (list left 40%, detail preview right 60%). Maintain 24dp gutter and card max width 420dp.
- Foldable portrait (display width ~673dp) uses adaptive navigation rail in lieu of bottom nav; rail buttons 72dp height with icon 28dp.
- Launchpad and Volunteering dashboards support 2-column card grid (card width 328dp, gap 16dp). Progress timeline extends full height with sticky summary column.
