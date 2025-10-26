  - [x] Subcategory 13.A. Design System & Components

Main Category: 13. Frontend Styling & Experience

Sub categories:

13.A. Design System & Components
Components (each individual component):
13.A.1. Design Tokens & Primitives (src/index.css, src/components/ui/Modal.jsx, src/components/common/OverlayModal.jsx, src/components/common/SideDrawer.jsx, src/components/forms/FormStatusMessage.jsx, src/components/TagInput.jsx, src/components/LanguageSelector.jsx, src/components/navigation/RoleSwitcher.jsx, src/components/UserAvatar.jsx)

13.A.1. Design Tokens & Primitives (src/index.css, src/components/ui/Modal.jsx, src/components/common/OverlayModal.jsx, src/components/common/SideDrawer.jsx, src/components/forms/FormStatusMessage.jsx, src/components/TagInput.jsx, src/components/LanguageSelector.jsx, src/components/navigation/RoleSwitcher.jsx, src/components/UserAvatar.jsx)
1. Appraisal.
   - Global CSS tokens establish typography, spacing, color, and elevation primitives that keep surfaces consistent across shells and feature flows.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
   - Layered gradients and smooth scrolling defaults deliver a premium, trust-building backdrop aligned with executive-network expectations.【F:gigvora-frontend-reactjs/src/index.css†L35-L48】
   - Unified focus-ring styling enforces accessible interactions that feel polished on keyboard and assistive-device journeys.【F:gigvora-frontend-reactjs/src/index.css†L57-L66】
   - Modal, overlay, and drawer primitives share rounded-3xl shells, frosted backdrops, and shadow depth, reinforcing a cohesive design language across contexts.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L8-L23】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
2. Functionality
   - The modal listens for Escape presses and detaches its handler on cleanup, ensuring deterministic dismissal and preventing listener leaks.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L5-L18】
   - Side drawers reserve click-to-close overlays on large screens, letting mentors or recruiters exit secondary flows without guesswork.【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Tag inputs normalise, deduplicate, and reactively render chips, supporting multi-value capture for interests, skills, or perks.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L73】
   - Form status messages expose tone-mapped alerts that keep validation, success, and info states legible in dense workflows.【F:gigvora-frontend-reactjs/src/components/forms/FormStatusMessage.jsx†L5-L24】
3. Logic Usefulness
   - Language selection menus adapt variants for header, hero, and mobile contexts, letting the same primitive respect each viewport’s hierarchy.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L9-L49】
   - The selector ties directly into the language context to persist user preference, ensuring localization surfaces everywhere once updated.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L24-L34】
   - Persona switching exposes iconography, timeline status, and deep links per role, ensuring teams access relevant surfaces without navigating blind.【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L17-L80】
   - Avatar primitives generate branded fallbacks when imagery is missing, keeping identity cues consistent in feeds, profiles, or dashboards.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
4. Redundancies
   - Each overlay renders the same “Close” button treatment, signalling an opportunity to centralise icon, casing, and transition tokens once.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L11-L20】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L12-L21】
   - Modal, overlay, and drawer shells repeat nearly identical backdrop, radius, and shadow classes, which could live in a shared primitive to simplify refinements.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L8-L23】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Headless UI transitions are defined separately for language and persona menus, duplicating easing curves and durations that could consolidate.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L51-L58】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L42-L49】
   - Status messaging and tag chips both hand-roll rounded surfaces and shadows; a shared tokenised chip/alert primitive would reduce manual utility strings.【F:gigvora-frontend-reactjs/src/components/forms/FormStatusMessage.jsx†L15-L20】【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L45-L63】
5. Placeholders Or non-working functions or stubs
   - Tag inputs fall back to “Add item…” and “No entries yet,” which should be localised and rephrased for executive tone before broad release.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L27】【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L59-L64】
   - Overlay primitives rely on hard-coded English “Close” strings, leaving multilingual personas without translated affordances.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L38-L45】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L11-L20】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L12-L21】
   - Avatar alt text defaults to “Profile avatar,” indicating we still need localized, role-aware descriptions for accessibility parity.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L30-L35】
   - Role switcher chips label “Timeline setup needed,” which should become actionable guidance with links or tooltips instead of placeholder messaging.【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L75-L79】
6. Duplicate Functions
   - Every overlay checks `if (!open) { return null; }`, signalling a duplicated guard that belongs inside a shared base component.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L20-L22】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L3-L6】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L3-L6】
   - Tag input ships its own `normalizeUnique` helper; extracting it to a shared utility would prevent future tag-capable widgets from reimplementing deduping.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L4-L19】
   - Both menu-based selectors duplicate transition definitions for open/close, highlighting the need for a centralised animation hook.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L51-L58】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L42-L49】
   - Close buttons across overlays restyle the same rounded-full, border, and hover behaviour separately; a shared `SurfaceDismissButton` would cut repetition.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L11-L20】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L12-L21】
7. Improvements need to make
   - Introduce focus trapping and initial focus hand-offs in the modal so keyboard flows remain anchored inside the surface, beyond the existing Escape listener.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L5-L18】
   - Consolidate overlay shells into a slot-driven primitive that can output modal, drawer, or sheet variants without copying layout classes.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L8-L23】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Localise default strings for tags, buttons, and alt text through the shared language context to avoid English-only fallbacks.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L64】【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L24-L34】
   - Replace external Dicebear avatars with branded SVG templates or cached assets to strengthen premium perception and reduce third-party reliance.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
8. Styling improvements
   - Align overlay typography weights with global tokens so headings, body copy, and buttons ladder correctly across shells.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L11-L20】
   - Swap ad-hoc utility mixes on alerts and chips for token-driven classes that reflect palette intent and reduce manual tweaking.【F:gigvora-frontend-reactjs/src/components/forms/FormStatusMessage.jsx†L15-L20】【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L45-L63】
   - Extend root tokens with dark-mode counterparts so the design system can ship parity for night-friendly dashboards.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
   - Inject subtle backdrop blur or grain overlays behind modals and drawers to elevate the executive feel already seeded by gradients.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/index.css†L40-L48】
9. Effeciency analysis and improvement
   - Confirm modal listeners detach reliably when unmounted to avoid memory churn, and migrate to scoped refs instead of window bindings for multiple instances.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L5-L18】
   - Profile tag input rerenders when typing long chip lists; memoising chip spans or virtualising large sets can keep typing latency low for power recruiters.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L63】
   - Evaluate redundant shadow utilities that compile into CSS repeatedly across overlays, potentially moving them into shared component classes.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L8-L23】
   - Audit external avatar fetches to ensure remote SVG generation does not block renders in timeline-heavy views.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
10. Strengths to Keep
   - Maintain the comprehensive token sheet that already harmonises typography, spacing, and chroma across marketing and app shells.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
   - Preserve the menu-driven language and role selectors that communicate persona sophistication with iconography, badges, and transitions.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L9-L96】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L17-L88】
   - Keep the chip-based tag editing experience, which mirrors modern professional tools and avoids intrusive dialogs.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L73】
   - Retain the tone-aware form feedback panels that already deliver reassuring, legible messaging during high-stakes submissions.【F:gigvora-frontend-reactjs/src/components/forms/FormStatusMessage.jsx†L5-L24】
11. Weaknesses to remove
   - Eliminate repeated overlay markup by composing from a single primitive so updates propagate instantly across modals, drawers, and sheets.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L8-L23】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Replace hard-coded English copy with localized strings, matching the multi-language capabilities already exposed via the language context.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L24-L34】
   - Address missing focus management to avoid screen-reader traps or lost keyboard focus when overlays open.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L5-L18】
   - Reconsider external avatar seeds so executive audiences see tailored imagery rather than generic Dicebear illustrations.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
12. Styling and Colour review changes
   - Map existing accent blues and teals to brand tiers, ensuring alerts, chips, and language menus signal hierarchy consistently.【F:gigvora-frontend-reactjs/src/index.css†L24-L29】【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L70-L90】
   - Refresh overlay backgrounds with gradient overlays that echo the shell gradient while improving separation from content below.【F:gigvora-frontend-reactjs/src/index.css†L40-L48】【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】
   - Harmonise status palettes across form messages and role badges so success, warning, and neutral cues align visually.【F:gigvora-frontend-reactjs/src/components/forms/FormStatusMessage.jsx†L5-L24】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L60-L79】
   - Introduce high-contrast theme tokens for accessibility modes without rewriting component markup.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
13. Css, orientation, placement and arrangement changes
   - Convert repeated flex utility stacks into reusable layout classes, simplifying responsive adjustments across overlays and selectors.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L47】【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L36-L97】
   - Provide tablet-specific widths for drawers rather than relying on a single `max-w-xl`, improving ergonomics on mid-size screens.【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L3-L24】
   - Ensure menus anchor correctly in RTL contexts by parameterising origin classes instead of hard-coding `right-0` or `left-0` positions.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L18-L64】
   - Extend modal padding tokens so dense data modules can adopt more granular spacing tiers inside the shared shell.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L47】
14. Text analysis, text placement, text length, text redundancy and quality of text analysis
   - Audit overlay headings to confirm they stay within enterprise-friendly length limits and support dynamic copy injection via props.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L37】
   - Update tag and status helper text to adopt action-first phrasing (e.g., “Start adding skills”) aligned with executive voice.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L64】
   - Replace all-caps helper labels with sentence-case or small-caps variants to improve readability across cultures.【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L37-L80】
   - Localise alt text, button labels, and placeholder copy so translation systems can output nuanced, region-specific phrasing.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L30-L35】【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】
15. Text Spacing
   - Standardise vertical rhythm inside overlays by mapping header, body, and footer paddings to the spacing scale instead of arbitrary values.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L47】
   - Align menu typography spacing with the 8pt grid so persona lists feel balanced on high-density dashboards.【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L51-L80】
   - Revisit chip padding to ensure long executive titles remain legible without crowding their dismissal affordances.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L45-L63】
   - Keep form alerts aligned with surrounding inputs by referencing shared padding tokens rather than inline utility mixes.【F:gigvora-frontend-reactjs/src/components/forms/FormStatusMessage.jsx†L15-L20】
16. Shaping
   - Maintain rounded-3xl modal corners while introducing tokenised alternatives for dense admin panels that require tighter radii.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】
   - Evaluate chip and button corner radii to ensure they harmonise with shell radii while communicating affordance tiers.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L45-L73】【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】
   - Offer avatar shape variants (square, pill) for contexts like leaderboards while preserving the signature glow option.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L20-L37】
   - Create tokenised radius definitions for drawers to match modal adjustments and reduce manual tweaking per component.【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
17. Shadow, hover, glow and effects
   - Expand beyond Tailwind’s `shadow-2xl` by defining design-system elevation levels for overlays, badges, and menus.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L36-L90】
   - Preserve avatar glow treatments as a differentiator while exposing tokenised intensity controls for varied backgrounds.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L20-L34】
   - Add hover micro-interactions to tag chips and persona options so executive users feel immediate responsiveness.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L45-L63】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L60-L79】
   - Align focus-visible outlines with the global focus token to prevent mismatched glows across components.【F:gigvora-frontend-reactjs/src/index.css†L57-L66】
18. Thumbnails
   - Provide avatar size tokens beyond `xs–lg` to cover hero banners or condensed activity feeds without manual class overrides.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L4-L24】
   - Offer thumbnail guidelines for menu icons so persona glyphs stay crisp within 6px–8px containers.【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L53-L74】
   - Document chip imagery patterns should a design call for logos or product marks inside tag surfaces.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L45-L63】
   - Preload default avatars for offline states so thumbnails never pop in late during professional walkthroughs.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L20-L38】
19. Images and media & Images and media previews
   - Cache Dicebear responses or replace them with in-house CDN assets to avoid flashes of unstyled avatars on slower networks.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
   - Ensure modal and drawer content areas support responsive imagery without overflow by offering media-aware layout slots.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L47】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Introduce skeletons or shimmer placeholders within overlay bodies for image-heavy experiences such as portfolio previews.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L47】
   - Add lazy-loading guidance for menu iconography so remote SVGs or badges don’t delay persona switching.【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L53-L74】
20. Button styling
   - Standardise dismiss, confirm, and secondary button variants across overlays to avoid bespoke utility stacks per surface.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L11-L20】
   - Extend tag add buttons with loading, disabled, and success states for parity with enterprise productivity apps.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L66-L73】
   - Align menu trigger buttons with brand token casing and spacing so header, hero, and mobile variants feel part of one system.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L9-L49】
   - Document icon+label spacing patterns for persona buttons to maintain clarity as new roles emerge.【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L36-L80】
21. Interactiveness
   - Ensure menu triggers retain focus-visible outlines and keyboard activation parity already provided by Headless UI wrappers.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L36-L64】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L36-L85】
   - Expand tag input keyboard shortcuts (e.g., arrow navigation) so power users can edit chips without leaving the keyboard.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L34-L55】
   - Propagate drawer overlay clicks to close interactions on mobile as well, matching large-screen affordances for consistency.【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Offer optional haptic cues in Flutter counterparts while keeping the React primitives as the canonical spec.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
22. Missing Components
   - Add a global theming switcher component so execs can toggle dark mode or high-contrast palettes atop the existing token set.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
   - Introduce a design-system documentation surface (e.g., Storybook shell) to showcase modal, drawer, and chip variants in isolation.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L73】
   - Provide a unified toast/banner primitive aligned with form alerts to cover transient messaging across workflows.【F:gigvora-frontend-reactjs/src/components/forms/FormStatusMessage.jsx†L5-L24】
   - Ship token visualisers (swatch, spacing, radius) so designers can preview the CSS variables already defined in the root.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
23. Design Changes
   - Recompose overlays into a configurable `Surface` component with slots for header, body, and footer to streamline future enhancements.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Hook overlay close buttons into the language context so copy swaps automatically when locales change.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L24-L34】
   - Integrate avatar seeds with profile data so brand photography or initials render without third-party lookups.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
   - Bake animation tokens into menus and overlays, replacing one-off transition strings with design-system defined timing curves.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L51-L58】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L42-L49】
24. Design Duplication
   - Consolidate the repeating close-button UI into a shared primitive to avoid drift across modal, overlay, and drawer contexts.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L33-L45】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L11-L20】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L12-L21】
   - Merge shared menu trigger styling between language and role switchers so updates to casing or spacing happen once.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L36-L49】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L36-L41】
   - Extract tag chip styling into a reusable component for other multi-select needs like interest pickers or skill taxonomies.【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L45-L63】
   - Publish standard alert tokens so FormStatusMessage and future banners derive from the same palette and elevation primitives.【F:gigvora-frontend-reactjs/src/components/forms/FormStatusMessage.jsx†L15-L20】
25. Design framework
   - Document how CSS variables map to design tokens, enabling designers to tweak radii, spacing, or chroma centrally with confidence.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
   - Define canonical overlay anatomy (header, body, footer, actions) and share guidance on when to choose modal vs. drawer experiences.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Specify menu behaviour guidelines covering icon usage, badge indicators, and keyboard flows as seen in role and language selectors.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L36-L97】【F:gigvora-frontend-reactjs/src/components/navigation/RoleSwitcher.jsx†L36-L88】
   - Align avatar usage policies, glow treatments, and fallback logic across marketing, product, and messaging to preserve continuity.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
26. Change Checklist Tracker Extensive
   - Track extraction of shared overlay primitives, including component scaffolding, regression snapshots, and QA charters before release.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Schedule localization sweeps for buttons, placeholders, and alt text once the language context wiring is in place.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L24-L34】【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L64】
   - Plan avatar asset migration by cataloguing current usage, integrating storage APIs, and validating fallbacks in staging.【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
   - Outline design documentation updates, from token tables to overlay usage guidelines, before announcing the refreshed system.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】
27. Full Upgrade Plan & Release Steps Extensive
   - Phase 1 – Discovery: audit existing overlay usage across product areas and capture screenshots to inform shared component requirements.【F:gigvora-frontend-reactjs/src/components/ui/Modal.jsx†L24-L48】【F:gigvora-frontend-reactjs/src/components/common/OverlayModal.jsx†L8-L23】
   - Phase 2 – Build: implement the new surface primitive, localise strings via the language context, and wire avatar assets with feature flags for gradual rollout.【F:gigvora-frontend-reactjs/src/components/LanguageSelector.jsx†L24-L34】【F:gigvora-frontend-reactjs/src/components/UserAvatar.jsx†L10-L38】
   - Phase 3 – Validation: run visual regression and accessibility passes on modal, drawer, and menu variants to ensure focus, contrast, and spacing meet enterprise standards.【F:gigvora-frontend-reactjs/src/index.css†L57-L66】【F:gigvora-frontend-reactjs/src/components/common/SideDrawer.jsx†L8-L24】
   - Phase 4 – Launch & Iterate: release updated primitives to targeted cohorts, monitor feedback on responsiveness and localization, and iterate with design tokens as needed.【F:gigvora-frontend-reactjs/src/index.css†L5-L32】【F:gigvora-frontend-reactjs/src/components/TagInput.jsx†L24-L73】
