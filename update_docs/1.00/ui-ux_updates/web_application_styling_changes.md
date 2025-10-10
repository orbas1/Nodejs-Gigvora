# Web Application Styling Changes – Version 1.00

## Foundations
- **Tailwind base:** Utility-first styling with custom classes for gradients, shadows, and rounded cards; `index.css` sets Inter font, gradient body background, and neutral text colour.
- **Color system:** Accent blue classes (`text-accent`, `bg-accent`, `bg-accentSoft`, `text-accentDark`) applied across nav, buttons, chips, and hero badges; neutral slate palette for copy.
- **Surface treatments:** Cards utilise `border-slate-200`, `shadow-soft`, and `rounded-3xl`; surfaces layered with radial gradient overlays for depth.

## Typography & Layout
- **Headlines:** Tailwind text sizes `text-4xl`–`text-6xl` for hero, `text-2xl` for section headers, `font-semibold` to emphasise key data.
- **Body copy:** `text-slate-600`/`text-slate-500` for supporting text, ensuring contrast on pale backgrounds; `tracking-[0.35em]` used for uppercase labels.
- **Spacing:** Consistent `px-6` horizontal gutters, `py-20` vertical breathing room, `gap-6/8/10` for grid spacing.
- **Grid system:** `max-w-6xl/7xl` wrappers, `grid-cols-1 sm:grid-cols-3` responsive grids, `lg:flex` for split sections.

## Components
- **Header:** Sticky `bg-white/95` with backdrop blur, accent underline animation for active nav, responsive mobile drawer with `rounded-2xl` links.
- **Buttons:** Primary CTA `bg-accent text-white shadow-soft hover:bg-accentDark`; secondary CTA `border-slate-200 hover:border-accent hover:text-accent`; pill forms for nav chips.
- **Cards:** Hero feed preview, search results, testimonial quotes use consistent `border`, `bg-surface`, `rounded-3xl`, `shadow-xl shadow-accent/10` for emphasis.
- **Badges & chips:** `rounded-full px-3 py-1` with accent/neutral variants; used in hero metrics, search metadata, and timeline entries.
- **Status banners:** `border-slate-100 bg-surfaceMuted/80` for subtle messaging, amber/danger variations for alerts.

## Forms & Inputs
- **Inputs:** `rounded-full` or `rounded-3xl` shapes, `border-slate-200`, `focus:border-accent focus:ring-0`; placeholder text `text-slate-400`.
- **Form sections:** `space-y-6` stacking, helper text `text-xs text-slate-500`, inline validation `text-rose-500` (to be standardised across flows).

## Imagery & Iconography
- **Logos:** `LOGO_URL` used in header and hero feed card; sized via `h-12 w-auto` and `h-8 w-auto` for brand consistency.
- **Icons:** Heroicons outline for nav toggle, command icons; sized `h-6 w-6` inside `rounded-full` buttons.

## Motion & Interaction
- **Transitions:** `transition hover:-translate-y-0.5` on cards, `duration-300` for underline animations, `hover:shadow-soft` for interactive depth.
- **Scroll behaviour:** Sticky header ensures nav accessible; gradient overlays fade as user scrolls, maintaining focus on content.

## Accessibility
- **Focus states:** Buttons/links maintain default outline plus accent border on focus for keyboard navigation.
- **Contrast:** Blue accent on white ensures ratio compliance; dark text on light gradients avoids readability issues.
- **Responsive nav:** Mobile drawer ensures touch targets sized `px-4 py-2` with adequate spacing.
