# Card Patterns

## Types
- **Metric Card:** Compact data summary with icon, value, delta, sparkline.
- **Feed Card:** Media-rich card supporting text, images, video, polls, CTA buttons.
- **Project Card:** Displays title, status pill, next milestone, assigned team avatars.
- **Job Card:** Highlights role, rate, location, tags, and actions (Apply, Save).
- **Launchpad Card:** Shows readiness progress, next action, and recommended gigs.
- **Volunteer Card:** Emphasises impact statement, required skills, apply/share CTAs.

## Layout Guidelines
- Use 16px padding, 12px spacing between elements, 16px corner radius.
- Include top metadata row (avatar/icon + label) and bottom action row when necessary.
- Ensure cards support skeleton state with grey placeholders.

## Interactions
- Tap opens detail view; long press allows quick actions (save, share) where relevant.
- Swipe actions available on job and feed cards for save/hide/share.
- Hover states (for future desktop parity) lighten background and show outlines.

## Accessibility
- Maintain minimum 4.5:1 contrast between text and background.
- Provide alt text for media; ensure buttons within cards have accessible labels.
