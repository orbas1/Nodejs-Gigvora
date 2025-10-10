# Layout Organisation & Component Positioning

## Grid & Spacing
- Utilise 8px base grid with key increments (8, 12, 16, 24, 32). Every screen blueprint references vertical units (V1 = 8px) for clarity.
- Safe area padding: 24px horizontal for large screens, 16px for smaller phones. Critical actions maintain minimum 20px distance from gesture areas.
- Cards and lists maintain 16px spacing between elements; feed uses 12px to maximise density while respecting thumb reach zones.
- Tabs and segmented controls align to columns C2–C11, leaving C1/C12 for breathing room.

## Navigation Placement
- Bottom tab bar anchored with elevation shadow to separate from content. Height 72px including safe area; icons centred at V4.
- FAB centred with offset to avoid interference with navigation gestures. Default offset 24px from right edge, 16px above tab bar.
- Quick settings drawer accessible via right edge swipe or avatar tap. Drawer width 312px, scrim covers remainder of screen.
- Sticky footers use translucent backdrop (rgba(18, 24, 32, 0.88)) with blur radius 24px for readability.

## Content Hierarchy
- Primary action placed top-right within app bar or bottom sticky bar depending on flow complexity. Primary CTAs maintain 56px height.
- Analytics cards appear before detailed tables to provide quick insights. When stacked, maintain 16px between cards and 24px before tables.
- Escrow and compliance banners pinned below app bar for constant visibility. Banners stretch full width and push content down rather than overlaying.
- Form headers align to C2–C11 with helper text at C2–C9; validation errors appear directly beneath associated field.

## Responsive Considerations
- Orientation changes trigger two-column layout for tablets where possible. Column gutters expand to 24px on tablet and 32px on desktop.
- Contextual filters placed at top on larger screens, bottom sheet on smaller. For mobile, filter sheet height default 70% with drag handle.
- Charts condense legend into horizontal pills on mobile; on tablet they appear in right-side column C10–C12.

## Accessibility
- Maintain clear focus order following natural reading pattern (top-to-bottom, left-to-right). Provide focus outlines with 2px accent colour.
- Avoid placing critical controls near screen edges prone to accidental touches. Minimum touch target 48x48px.
- Ensure text-to-background contrast ratio ≥ 4.5:1 for body text and 3:1 for large type.
