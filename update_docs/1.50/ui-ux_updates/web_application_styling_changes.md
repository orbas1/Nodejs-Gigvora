# Web App – Styling Changes

## Visual Language
- Adopted responsive grid system with 12-column base and 16px baseline grid. Gutters adjust at each breakpoint for optimal density.
- Introduced blue gradient hero treatments with animated particle overlay for marketing surfaces; product surfaces use subdued neutrals.

## Typography
- Heading hierarchy uses **Inter** across weights with clamp-based scaling defined in the Web Application Design Update. Display and hero marketing copy may optionally use **DM Serif Display**.
- Data tables use **Roboto Mono** subset for numeric alignment and code references.

## Components
- Buttons retain 12px radius with accent solid, outline, ghost, and destructive variants; loading states display inline spinner and disable repeated submission.
- Tabs redesigned with underline indicator, responsive overflow dropdown, and preserved filter state in URL parameters.
- Data visualisation updated with brand palette tokens (accent ramp, semantic success/warning/danger) and enriched tooltips referencing definitions.

## Imagery & Iconography
- Updated icon library to duotone style on 24px grid with 1.5px stroke, aligning with new tokenised colour ramp.
- Hero illustrations depict collaboration between talent, agencies, and companies, matching marketing messaging and following `images_and _vectors.md` export guidelines.

## Motion & Interaction
- Reduced motion preference respected by disabling parallax and large-scale transitions.
- Microinteractions highlight row hover, selection states, and inline validations.

## Accessibility
- Ensured WCAG AA compliance across backgrounds/text combos.
- Keyboard navigation improved with visible focus states and skip links.

## Documentation Alignment
- Detailed styling tokens, component variants, and SCSS structure are captured in `Web Application Design Update/Stylings.md`, `Css.md`, and `Scss.md` to guide development implementation.
