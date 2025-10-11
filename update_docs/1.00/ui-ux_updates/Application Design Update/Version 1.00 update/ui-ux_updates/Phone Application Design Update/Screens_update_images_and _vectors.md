# Imagery & Vector Requirements – Phone Application v1.00

## Illustration & Photography Strategy
- **Hero Illustrations:** Use abstract tech-community compositions from Gigvora internal illustration kit (Figma file `Gigvora Illustrations v3`). Exported as PNG @3x (1024×576) with transparent background for layering. Colour adjustments align with hero gradients (#2563EB/#1D4ED8/#60A5FA).
- **Profile Cover Orbs:** Generated via Figma radial gradient components; exported as SVG for dynamic scaling within Flutter.
- **Empty States:** Commissioned vector series `EmptyState_BlueSet` stored in repo `design-system-assets/illustrations/empty_states/`. Use `opportunities_empty.svg`, `launchpad_empty.svg`, `volunteering_empty.svg` at 240×240.

## Iconography
- **Navigation Icons:** Heroicons Solid set, customised with stroke thickness 1.75px, exported as SVG to `assets/icons/nav/`.
- **Marketplace Category Icons:** New glyphs representing Jobs (briefcase), Gigs (lightning), Projects (collaboration nodes), Launchpad (rocket), Volunteering (hands). Stored in `design-system-assets/icons/marketplace/` as multi-tone SVG (primary fill `#2563EB`, secondary accent by category colour).
- **Status Icons:** Outline icons for success/warning/error/information from Heroicons Outline (converted to 24px, stroke `#2563EB` or status tone).

## Photography & Avatars
- **Community Avatars:** Sourced from `unsplash.com` curated collection `Gigvora Community` (ensure licensing). Crop square 240×240, apply subtle gradient overlay (#1D4ED8 @ 12%) for visual unity.
- **Opportunity Thumbnails:** Use partner-provided imagery or fallback gradient backgrounds with vector overlays (pattern library `assets/patterns/opportunity_tile.svg`).

## Export Specifications
- Provide all assets at 1x/2x/3x scales (Flutter `@1x`, `@2x`, `@3x` directories). Vector assets remain as `.svg` and require `flutter_svg` dependency.
- Maintain naming convention: `gigvora_<context>_<descriptor>.<ext>` (e.g., `gigvora_launchpad_badge.svg`).
- Document licensing metadata in `assets/README.md` (include Unsplash photographer credit, usage rights).
- Hero illustrations require layered export groups for parallax (background, midground, foreground). Provide zipped asset package per screen with README referencing stacking order.
- Store Lottie JSON under `assets/lottie/` with preview GIF (320×180) to accelerate stakeholder reviews.

## Delivery Checklist
- [ ] Update Flutter `pubspec.yaml` with new asset paths.
- [ ] Add Lottie animations (`gigvora_confetti.json` for success modals, `gigvora_offline_ping.json` for offline overlay) sourced from internal repo `design-system-assets/lottie/`.
- [ ] Generate favicon-style icons for push notifications using accent gradient backgrounds (size 96×96, 48×48).
- [ ] Provide radial gradient backgrounds for support hub hero (`support_orb_left.svg`, `support_orb_right.svg`) and onboarding carousel.
- [ ] Export quick action radial icons (post, log-hours, share-profile) at 56×56 with white glyph overlays to ensure clarity on gradient backgrounds.
