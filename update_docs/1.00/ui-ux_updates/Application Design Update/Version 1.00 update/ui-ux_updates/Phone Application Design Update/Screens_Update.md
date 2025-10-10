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
