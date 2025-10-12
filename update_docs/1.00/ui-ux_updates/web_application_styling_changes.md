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
- **Badges & chips:** `rounded-full px-3 py-1` with accent/neutral variants; used in hero metrics, search metadata, and timeline entries, including new remote-role and launchpad eligibility badges sourced from Meilisearch metadata.
- **Status banners:** `border-slate-100 bg-surfaceMuted/80` for subtle messaging, amber/danger variations for alerts.
- **Accordions & tabs:** `border-b border-slate-200` separators, accent indicator for active tab, smooth height transitions.
- **Modal overlays:** `bg-slate-900/70` scrim, panel `rounded-3xl` with `p-8` padding, drop shadow `shadow-2xl shadow-slate-900/20`.
- **Tables:** `table-auto w-full`, header `bg-slate-50 text-slate-500 uppercase tracking-[0.35em]`, row hover `bg-slate-50`.
- **Auto-assign queue:** Dedicated table variant with `border-l-4` accent stripe indicating score tiers (`border-emerald-500` for >=80, `border-amber-500` for 60–79, `border-rose-500` below 60). Countdown badges use `bg-slate-900 text-white` with `font-mono text-xs` for remaining minutes, and action buttons follow the primary/secondary CTA treatments with inline skeletons to reflect async decisions.
- **Project workspace panels:** Two-column layout pairs a form card (`rounded-4xl border border-slate-200 bg-white/95`) with a queue snapshot stack using accent outlines, avatar clusters, and `text-xs text-slate-500` metadata rows; fairness preview card leverages `bg-gradient-to-br from-accent/10 via-white to-emerald-50` to reinforce equitable matching messaging.
- **Launchpad insight cards:** Stat blocks adopt `rounded-4xl` shells with split-tone backgrounds (`from-accent/10 via-white to-emerald-50`) and icon medallions sized `48px` using accent gradients. Delta chips (`bg-emerald-100 text-emerald-700` or `bg-amber-100 text-amber-700`) float top-right to visualise week-over-week movement, while skeleton states pulse using `animate-pulse` across metric bars for parity with live dashboards.
- **Launchpad forms:** Employer/talent forms render within `max-w-5xl` wrappers using `grid-cols-1 lg:grid-cols-2` and `gap-8`. Section headers leverage `uppercase tracking-[0.35em] text-slate-500` labels, while card bodies use `bg-white/95 border border-slate-200 rounded-4xl` with inset shadows `shadow-[0_30px_60px_-35px_rgba(37,99,235,0.35)]`. Submission footers stick to the viewport with `backdrop-blur-md bg-white/80` and inline status chips communicating review SLAs.

## Forms & Inputs
- **Inputs:** `rounded-full` or `rounded-3xl` shapes, `border-slate-200`, `focus:border-accent focus:ring-0`; placeholder text `text-slate-400`.
- **Form sections:** `space-y-6` stacking, helper text `text-xs text-slate-500`, inline validation `text-rose-500` (to be standardised across flows).
- **Multi-step forms:** Progress trackers using accent steps, `divide-y` separators, sticky summary column on desktop.
- **Fairness sliders:** Range inputs adopt accent track + thumb, inline percentage badge `text-slate-400`, and `accent-accent` styling to visually link weight adjustments to queue outcomes; newcomer toggle utilises accent switch with supporting microcopy.
- **File upload:** Dotted `border-2 border-dashed border-slate-300`, accent hover, inline preview thumbnails with `rounded-xl` mask.
- **Launchpad employer brief specifics:** Budget range fields pair numeric inputs with select dropdowns styled using `bg-slate-50` chips and inline prefix tokens for currency, while timeline pickers use dual date inputs with accent connectors. Requirement checklists adopt `grid-cols-2` bullet blocks with accent check icons ensuring parity with backend validation rules.
- **Talent application extras:** Skill proficiency matrix renders as stacked horizontal sliders (accent track, neutral background) and certification upload drop-zones that echo compliance callouts via `bg-amber-50 border-amber-200` when mandatory docs missing. Consent toggle row uses `border border-slate-200 rounded-3xl px-4 py-3` with inline iconography to reinforce regulatory language.

## Imagery & Iconography
- **Logos:** `LOGO_URL` used in header and hero feed card; sized via `h-12 w-auto` and `h-8 w-auto` for brand consistency.
- **Icons:** Heroicons outline for nav toggle, command icons; sized `h-6 w-6` inside `rounded-full` buttons.
- **Illustrations:** Gradient overlays `from-accent/10 via-white to-white` ensuring copy legible; drop shadows align with card system.

## Motion & Interaction
- **Transitions:** `transition hover:-translate-y-0.5` on cards, `duration-300` for underline animations, `hover:shadow-soft` for interactive depth.
- **Scroll behaviour:** Sticky header ensures nav accessible; gradient overlays fade as user scrolls, maintaining focus on content.
- **Accordion animation:** `transition-[max-height] duration-300 ease-in-out` for FAQ/accordion components to convey openness.
- **Button feedback:** `focus-visible:ring-4 focus-visible:ring-accent/30` for strong keyboard cues; `active:translate-y-0.5` for pressed state.
- **Queue timers:** Countdown badges pulse using `animate-pulse` when <10 minutes remain, and entries fade to 50% opacity before collapsing into the history accordion, mirroring backend expiry semantics.

## Accessibility
- **Focus states:** Buttons/links maintain default outline plus accent border on focus for keyboard navigation.
- **Contrast:** Blue accent on white ensures ratio compliance; dark text on light gradients avoids readability issues.
- **Responsive nav:** Mobile drawer ensures touch targets sized `px-4 py-2` with adequate spacing.
- **ARIA labelling:** Tab/accordion components include `aria-expanded` & `aria-controls`; modal containers enforce focus trap.
- **Score explainers:** The scorecard drawer exposes aria-described-by references for each metric row (skills, availability, launchpad) so screen readers narrate the weighting the backend used, matching the tooltip content.
- **Launchpad dashboards:** Insight cards expose `aria-live="polite"` regions to announce refreshed placement totals after submissions, while forms include `aria-describedby` on compliance tooltips and progress summaries. Sticky submit footers maintain focus trap containment to prevent keyboard users from losing context mid-review.
- **Skip links:** `sr-only focus:not-sr-only` pattern ensures accessible skip-to-content anchor at top of page.

## Documentation Reference
- Expanded token tables, CSS variable mappings, and SCSS architecture are detailed in `Web Application Design Update/Version 1.00 update/` to standardise implementation across teams.
