# Layout Organisation — Web Application v1.50

## Grid & Breakpoints
- Desktop: 12-column grid (max width 1200px), 24px gutters, 80px section spacing.
- Tablet: 8-column grid, 16px gutters, 64px section spacing.
- Mobile: 4-column grid, 12px gutters, 48px section spacing.

## Page Structure
1. **Hero Region** — Occupies first viewport height with headline, subhead, CTA, trust proof.
2. **Value Sections** — Alternating image/text blocks to maintain engagement.
3. **Social Proof** — Testimonials, logos, case studies placed mid-page.
4. **Conversion Blocks** — Pricing cards, CTA bar near end of page.
5. **Footer** — Comprehensive navigation, contact info, compliance links.

## Component Placement
- Hero illustration aligned right on desktop, below copy on mobile.
- Mega-menu anchored to top nav with sticky behaviour.
- CTA bars inserted after major sections (value pillars, testimonials).
- Resource grid uses masonry layout to avoid whitespace gaps.
- Support CTA (chat, contact) anchored bottom-right on desktop, floating button on mobile.

## Responsiveness Patterns
- Collapse alternating layouts to stacked vertical order on mobile.
- Replace multi-column lists with accordions for small screens.
- Maintain readability by adjusting typography scale and spacing via responsive tokens.

## Accessibility
- Preserve logical reading order when reflow occurs.
- Ensure sticky elements do not overlap content; add offset for anchor links.
- Provide skip links and maintain focus order consistent with layout.

## Implementation Notes
- Provide layout templates for hero, content sections, CTA bars, resource grids in design system.
- Annotate responsive behaviours directly in Figma with variant frames.
- Validate prototypes in responsive testing tools before handoff.
