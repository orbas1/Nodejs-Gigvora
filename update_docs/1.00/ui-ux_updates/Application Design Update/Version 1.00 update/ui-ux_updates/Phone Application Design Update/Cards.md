# Card System – Phone Application v1.00

## Base Card
- Dimensions: dynamic width up to 344dp on phone, 520dp on tablet column.
- Corner radius: 24dp (primary), 20dp (secondary). Shadow `0 10 30 rgba(15,23,42,0.10)`.
- Padding: 20dp (phone), 24dp (tablet). Divider lines `#E2E8F0` 1dp.

## Variants
1. **Feed Post Card:**
   - Structure: Avatar (48dp) + content stack (title 16/24, body 14/20), metadata row with icon buttons.
   - Reactions row uses 24dp icons, 12dp spacing, counters 14/20.
   - Attachments preview (image 4:3, 8dp radius) below body.
2. **Opportunity Card:**
   - Header chip row for tags (Remote, Hybrid).
   - Title 20/28, organisation 16/24 secondary, meta row (location, pay) with icon chips.
   - CTA button anchored bottom with 16dp top margin, full width minus padding.
3. **Dashboard Metric Card:**
   - Compact 144×144dp, gradient header stripe 6dp high.
   - Content: Icon 32dp, metric value 24/32 bold, caption 12/16 uppercase.
4. **Timeline Card:**
   - Align with vertical timeline line, bullet 12dp accent.
   - Content area 280dp width, includes status pill and CTA link.
5. **Support Card:**
   - Horizontal layout: icon 40dp, text column, CTA button or link right.
   - Background `#FFFFFF`, left border accent `#2563EB` 3dp.

## States
- **Hover/Focus:** Increase elevation to `0 16 40 rgba(15,23,42,0.16)` and apply outline `#38BDF8` for keyboard focus.
- **Selected:** Add accent border 2dp `#2563EB`.
- **Disabled:** Reduce opacity to 60%, remove shadow.

## Motion
- On appear, cards fade/slide up 12dp over 220ms.
- On refresh, use `AnimatedList` for feed (insert/remove) with 200ms animation.
- For timeline updates, highlight new card with background wash `rgba(37,99,235,0.12)` for 3 seconds.

## Implementation Notes
- Compose cards using `Card` widget with `Clip.antiAlias`. Use `InkWell` for ripple effect (ink colour `rgba(37,99,235,0.08)`).
- Provide `CardTheme` in theme file to maintain consistent radius and elevation.
- Define mixins for card content spacing (`CardContentPadding`) to avoid inconsistent padding across surfaces.
- Ensure skeleton cards mimic actual padding and layout structure to prevent layout shift on load.

## Additional Variants
6. **NPS Survey Card:**
   - Modal card width 320dp, padding 24dp, rating chips arranged in grid with 12dp spacing.
   - Includes optional textarea (height 120dp) and CTA row at bottom.
7. **Export Status Card:**
   - Horizontal layout 344×92dp, includes file type icon 32dp, job name 16/24, timestamp 12/16.
   - Progress bar 6dp height spanning width minus 40dp padding; status badge (Ready/Error) 12dp radius.
8. **Hero Metric Card:**
   - 328×156dp, gradient header background (height 56dp) with icon overlay 48dp.
   - Value displayed 32/40 bold, supporting text 14/20; bottom row includes trend arrow and CTA link.

## Accessibility & Testing
- Provide `Semantics` descriptions summarising key information (title + main metric + CTA) for each card.
- Conduct tap target verification ensuring entire card or CTA meets 44dp minimum; where CTA exists inside card, maintain 12dp margin around button.
- Snapshot test cards across light/dark themes and 3 languages (EN, ES, FR) to verify text wrapping.
