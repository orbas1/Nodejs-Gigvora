# Homepage Organisation – Web Application Version 1.00

## Section Order & Dimensions
1. **Hero Narrative** (`HeroCanvas`)
   - Height: 720px desktop (min), 580px tablet, 520px mobile.
   - Left column: content stack (eyebrow, headline, body, CTAs, metrics). Right column: live feed preview card 420×520px with blur backdrop and floating avatars.
   - Background: hero gradient + radial orb 320px.
2. **Partner Logos Strip**
   - `height: 120px`, `background: rgba(15,23,42,0.92)` with 12px blur; logos (monochrome) sized 120×48px on carousel.
3. **Feature Triad**
   - 3 cards each 360×320px, arranged on 12-column grid (span 4 columns). Icon 56px, text aligning to left.
4. **Momentum Metrics**
   - 4 metric badges arranged 4 columns, each 280×200px. Contains number, label, sparkline.
5. **Opportunity Highlights**
   - Split layout: left 6 columns (Jobs, Projects), right 6 columns (Gigs, Volunteering). Each area contains 2 stacked cards with CTA.
6. **Launchpad & Community**
   - Two columns: Launchpad track card (340×360px) + Community groups preview (list of 3 items with join CTA).
7. **Testimonials Carousel**
   - Swiper containing 3 visible cards at desktop, `padding-block: 96px`.
8. **Final CTA Band**
   - Full-width gradient `linear-gradient(90deg,#1D4ED8,#2563EB,#0EA5E9)`, `padding: 96px 0`. Contains copy and button pair.
9. **FooterMatrix**
   - 4 columns at 240px width each, `padding-top: 96px`, `padding-bottom: 64px`.

## Layout Principles
- Use consistent `max-width: 1280px` wrappers except hero (full width) and CTA band (edge-to-edge).
- Section separators use subtle top border `rgba(148,163,184,0.24)` and `padding-top: 96px` to maintain rhythm.
- On mobile, convert sections to stacked layout with `gap: 48px`.

## Content Distribution
- Story arc: Introduce value → Show proof (logos, metrics) → Provide options (opportunities) → Build trust (testimonials) → Convert (CTA band).
- Each section includes analytics ID `data-section="home-<slug>"` for instrumentation.

## Accessibility & Performance
- Lazy-load testimonial slider (intersection threshold 0.3). Hero illustration uses `loading="eager"` but compressed to 280KB.
- Provide alt text for each partner logo ("Partner: <Name>").
- Ensure hero metrics labelled with `aria-describedby` linking to context copy.
