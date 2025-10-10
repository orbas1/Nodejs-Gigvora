# Cards Catalogue – Web Application Version 1.00

## Card Archetypes
1. **FeatureCard**
   - Size: 360×320px desktop, 100% width mobile.
   - Layout: Icon 56px top-left, title `heading-md`, body 16px, CTA link.
   - Styles: `border-radius: 24px`, `border: 1px solid #E2E8F0`, `padding: 32px`, `box-shadow: var(--shadow-soft)`.
2. **OpportunityCard**
   - Detailed in `component_types.md`; includes tag row with chips (height 28px) and CTA row.
3. **TestimonialCard**
   - 360×260px, gradient background `linear-gradient(145deg,#1D4ED8 0%,#2563EB 60%,rgba(56,189,248,0.4) 100%)`.
   - Text white; overlay pattern (SVG dots) at 12% opacity; avatar bottom-left, rating top-right.
4. **MetricCard**
   - 280×240px, includes sparkline area chart; metric value 48px, delta chip 12px.
5. **KnowledgeCard**
   - 320×220px, icon 32px, description 3 lines, `Learn more` link; used in resources section.
6. **BlogCard**
   - 380×400px, cover image 220px height (ratio 16:9). Tag label top-left overlay `#1D4ED8`. Body copy 3 lines, author row with avatar 40px.
7. **LaunchpadTrackCard**
   - 340×360px, features track badge, schedule timeline (list of 3 bullet points). CTA `View track`.

## States
- **Default:** Soft shadow, static gradient or neutral background.
- **Hover:** Translate Y -4px, intensify shadow (use accent). Underline CTA link.
- **Focus:** Outline `4px` `rgba(37,99,235,0.24)` plus `1px` `#1D4ED8` border.
- **Selected (if applicable):** Border `#2563EB`, drop shadow lighten.

## Content Limits
- Titles ≤ 60 characters (wrap to 2 lines). Body text truncated using CSS `line-clamp: 3`.
- CTAs limited to one primary button plus optional tertiary link.

## Imagery Usage
- Opportunity logos: 64px container, background `#F8FAFC`, `border-radius: 16px`.
- Testimonial avatars: 56px circle, border `4px` `rgba(255,255,255,0.28)`.
- Launchpad track icons from [Phosphor Bold/Regular], sized 40px, tinted `#38BDF8`.

## Layout Placement
- Feature cards arranged in `grid-cols-3` on desktop with `gap-8`, degrade to `grid-cols-2` at 1024px, `grid-cols-1` below 768px.
- Testimonials slider uses 3 cards visible at ≥1280px, 2 at 1024px, 1 at ≤768px.

## Implementation Notes
- Use CSS variable `--card-radius-lg` for border radius to maintain consistency.
- Provide `data-component="card"` attribute for instrumentation.
- Provide skeleton variant with grey blocks to preserve layout during loading.
