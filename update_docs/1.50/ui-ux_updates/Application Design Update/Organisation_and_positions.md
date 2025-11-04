# Layout Organisation & Component Positioning

## Grid & Spacing
- Utilise 8px base grid with key increments (8, 12, 16, 24, 32).
- Safe area padding: 24px horizontal for large screens, 16px for smaller phones.
- Cards and lists maintain 16px spacing between elements; feed uses 12px to maximise density.

## Navigation Placement
- Bottom tab bar anchored with elevation shadow to separate from content.
- FAB centred with offset to avoid interference with navigation gestures.
- Quick settings drawer accessible via right edge swipe or avatar tap.

## Content Hierarchy
- Primary action placed top-right within app bar or bottom sticky bar depending on flow complexity.
- Analytics cards appear before detailed tables to provide quick insights.
- Escrow and compliance banners pinned below app bar for constant visibility.

## Responsive Considerations
- Orientation changes trigger two-column layout for tablets where possible.
- Contextual filters placed at top on larger screens, bottom sheet on smaller.

## Accessibility
- Maintain clear focus order following natural reading pattern (top-to-bottom, left-to-right).
- Avoid placing critical controls near screen edges prone to accidental touches.
