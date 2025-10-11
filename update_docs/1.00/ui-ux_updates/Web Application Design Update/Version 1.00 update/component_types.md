# Component Types – Web Application Version 1.00

## Structural Components
1. **HeaderShell**
   - **Dimensions:** 88px tall desktop, 64px tablet, 56px mobile.
   - **Layout:** Flex row with 24px padding, max width `1440px`, centred via `mx-auto`.
   - **Surfaces:** `background: rgba(255,255,255,0.95)` with 12px backdrop blur and 1px bottom border `#E2E8F0`.
   - **Responsiveness:** Breaks nav links into slide-in drawer at <1024px using transform transitions.
2. **FooterMatrix**
   - 320px vertical stack containing 4 columns (Products, Company, Resources, Legal) at 240px width each; collapses to accordions under 768px.
   - Gradient overlay `linear-gradient(180deg, #0F172A 0%, #0B1B3F 100%)`, text `#E2E8F0`.
3. **HeroCanvas**
   - Two-column CSS grid (`grid-template-columns: 1.2fr 0.8fr`) with 128px top padding and 96px bottom padding.
   - Background radial `circle at 20% 20%` using `rgba(37,99,235,0.35)` blur 120px layered over base gradient.
4. **ContentContainer**
   - `max-width: 1280px`, `padding-inline: 32px` desktop, `24px` tablet, `16px` mobile.
   - Utilises CSS clamp to manage width for large displays: `width: min(1280px, 100% - 2 * clamp(16px, 4vw, 48px))`.

## Interactive Components
1. **CTAButton**
   - Primary height 56px, pill radius 9999px, horizontal padding 28px.
   - Contains icon `Heroicons solid` sized 20px if present.
   - States: default gradient `linear-gradient(135deg,#2563EB,#1D4ED8)`, hover lighten to `#3B82F6`, active drop shadow removed.
2. **ChipToggle**
   - 40px height, text `14px`, `gap: 8px`, leading icon optional.
   - Selected state uses `background: #DBEAFE`, border `#1D4ED8`, text `#1D4ED8`.
3. **MetricBadge**
   - Circle 64px diameter with subtle inner shadow `0 8px 16px rgba(37,99,235,0.18)`.
   - Houses numeric headline `32px` and label `12px uppercase`.
4. **StatusBanner**
   - Full-width `border-radius: 24px`, `padding: 20px 28px`, icon container `48px`.
   - Variants: Info (`#E0F2FE` background, `#0369A1` text), Warning (`#FEF3C7`, `#B45309`), Danger (`#FEE2E2`, `#B91C1C`).

## Content Components
1. **OpportunityCard**
   - `width: 100%`, `min-height: 240px`, `padding: 24px`, `border-radius: 24px`, `border: 1px solid #E2E8F0`, `box-shadow: 0 24px 40px -24px rgba(15,23,42,0.18)`.
   - Layout: Header row (logo avatar 56px, title, meta chips), body summary (clamp to 3 lines), footer CTA + meta stats.
2. **TestimonialSlider**
   - Card width 360px, `height: 260px`, uses `swiper.js` implementation with 24px gaps.
   - Quote mark icon 32px accent, avatar 56px, rating stars 20px.
3. **TimelineSection**
   - Vertical rail 8px width running full height with gradient accent tick marks every 120px.
   - Cards 320×180px attach to rail via 24px connector lines; each card uses `border-radius: 24px`, `padding: 24px`, optional badge top-left.
   - Scroll container `max-height: 520px` with `scroll-snap-type: y mandatory`.
4. **ResourceList**
   - List rows 96px height with 64px icon container, metadata column, CTA button. Alternating row background `rgba(15,23,42,0.02)`.
   - Supports inline tags and `aria-describedby` for summary text.

## Utility & Overlay Components
1. **NavigationMenu**
   - Desktop mega menu 720px width, `padding: 32px`, 2-column grid with column gap 32px, heading row 48px height.
   - Mobile overlay full viewport height with `padding: 32px`, `gap: 20px`, `background: #0B1B3F`, `border-radius: 32px` on sheet edges.
2. **FilterDrawer**
   - Panel width 360px desktop, 100% viewport width on ≤768px; `padding: 32px`, `border-radius: 28px 0 0 28px` when sliding from right.
   - Contains segmented header (chips) 48px height, body uses accordion groups with `gap: 24px`.
   - Footer houses primary/secondary buttons separated by `16px` gap.
3. **ModalShell**
   - Default width 640px (desktop), 90vw (mobile), `padding: 40px` with header/ body/ footer slots.
   - Top corners `border-radius: 32px`, drop shadow `0 32px 60px -24px rgba(15,23,42,0.35)`. Optional side illustration column 240px.
4. **ToastBanner**
   - Width 360px, `padding: 16px 20px`, `border-radius: 20px`. Icon container 32px, message area 2-line clamp.
   - Success/info/warning/danger map to semantic palette backgrounds with accent border 2px.

## Informational Components
1. **NavigationMenu**
   - Horizontal list with 20px spacing; indicator bar `height: 3px`, width matches link text + 12px; animation uses transform.
2. **ResourceList**
   - Multi-column list `grid-template-columns: repeat(auto-fit,minmax(220px,1fr))`, cards with icon 32px, link text 16px.
3. **FAQAccordion**
   - Panels width 720px, `border: 1px solid #CBD5F5`, arrow icon rotates 180° using CSS transform.
4. **ProfileSummaryPanel**
   - 320px width sidebar, `padding: 24px`, `gap: 16px`, includes avatar 96px, contact chips, CTA stack.

## Utility Components
1. **SkeletonLoader**
   - Uses gradient shimmer `background: linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 37%,#F1F5F9 63%)`, animation 1400ms infinite.
   - Radii match target component (24px for cards, 9999px for pills).
2. **FloatingSupportButton**
   - 64px circle anchored bottom-right 32px from edges, `box-shadow: 0 20px 40px -16px rgba(15,23,42,0.28)`.
   - Expands to panel width 320px on click showing quick links.
3. **ToastNotification**
   - Stacks top-right, max width 380px, `padding: 18px 24px`, entry `transform: translateY(-20px)` to `0` over 200ms.

## Assets & Sources
- Illustrations: `storyset remote-team blue` pack for hero and onboarding glimpses.
- Logos: Monochrome partner logos stored under `assets/brands/web/v1/` at 120px width, grayscale `#F8FAFC` background.
- Icons: `@heroicons/react/24/outline` for nav & system; `phosphor-react` for data-heavy dashboards.
