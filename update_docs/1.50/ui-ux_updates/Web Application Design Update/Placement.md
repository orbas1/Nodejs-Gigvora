# Component Placement Guidelines – Web Application v1.50

## Global Placement Rules
- Keep primary CTA above the fold on marketing and dashboard pages.
- Position notifications panel trigger in header right cluster near profile menu.
- Place search omnibox centrally in header on desktop, accessible via icon-only button on mobile.

## Page-specific Placement
- **Home:** Persona toggle sits directly above hero headline; metrics strip aligned immediately below hero.
- **Dashboard:** Metric tiles occupy first row; compliance alerts pinned top-right for visibility.
- **Gig Detail:** Overview tab shows status and summary left, actions and participants right; attachments below timeline.
- **Settings:** Secondary navigation resides left; content area centre; support/help column optional on right for enterprise.

## Responsiveness
- On smaller screens, reorder layout using CSS grid `order` property to keep primary content first.
- Sticky elements (header, onboarding progress) collapse heights to maintain viewport.

## Accessibility Considerations
- Maintain logical DOM order even if visual placement differs; ensures screen reader coherence.
- Avoid placing critical actions solely in hover states; ensure persistent buttons.
