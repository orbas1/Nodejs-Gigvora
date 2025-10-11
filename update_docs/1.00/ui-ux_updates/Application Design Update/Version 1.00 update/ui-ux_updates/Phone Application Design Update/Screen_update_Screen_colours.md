# Screen Colour Specifications – Phone Application v1.00

## Global Tokens
- **Primary Accent:** `#2563EB` (Gigvora Blue)
- **Deep Accent:** `#1D4ED8`
- **Gradient Accent:** `#2563EB` → `#60A5FA`
- **Surface Light:** `#F8FAFC`
- **Surface Elevated:** `#FFFFFF` with shadow `rgba(15, 23, 42, 0.08)`
- **Neutral Text:** `#0F172A` (primary), `#475569` (secondary), `#94A3B8` (tertiary)
- **Status:** Success `#16A34A`, Warning `#F59E0B`, Error `#DC2626`, Info `#0EA5E9`

## Screen Palettes
- **Feed:** Hero gradient `linear-gradient(120deg, #1D4ED8, #2563EB, #60A5FA)`, filter chips background `#E0F2FE`, selected chip text `#0F172A`, offline banner `#F59E0B` background with text `#7C2D12`.
- **Explorer:** Search overlay tinted `rgba(15, 23, 42, 0.72)` with glass blur; result cards `#FFFFFF`, separators `#E2E8F0`, highlight text `#1D4ED8`.
- **Marketplace Lists:** Background `#F8FAFC`, card header gradient per category: Jobs `#2563EB→#1D4ED8`, Gigs `#6366F1→#8B5CF6`, Projects `#0EA5E9→#38BDF8`, Launchpad `#14B8A6→#5EEAD4`, Volunteering `#22C55E→#86EFAC`.
- **Opportunity Detail:** Hero overlay `rgba(15, 23, 42, 0.55)`, summary card `#FFFFFF`, meta chips `#DBEAFE` text `#1D4ED8`, accordion background `#F1F5F9`.
- **Launchpad Dashboard:** Background gradient `linear-gradient(160deg, #0EA5E9, #2563EB)`, card surfaces `#FFFFFF`, progress bars track `#E0F2FE` fill `#2563EB`.
- **Volunteering Dashboard:** Base `linear-gradient(160deg, #14B8A6, #0EA5E9)`, timeline line `#0F766E`, card icons `#10B981`.
- **Profile:** Cover gradient `radial-gradient(circle at 20% 20%, #2563EB, transparent 60%) + radial-gradient(circle at 80% 30%, #38BDF8, transparent 65%)`, stats cards `#FFFFFF`, chip backgrounds `#DBEAFE`.
- **Notifications:** Modal sheet surface `#FFFFFF`, category icon backgrounds: Projects `#1D4ED8`, Launchpad `#0EA5E9`, Volunteering `#22C55E`, Alerts `#F59E0B`.
- **Inbox:** Sent bubble gradient `linear-gradient(120deg, #2563EB, #1D4ED8)`, received bubble `#E2E8F0`, input bar `#FFFFFF`, background `#F8FAFC`.
- **Settings & Support:** Section headers `#E2E8F0`, toggles accent `#2563EB`, support cards accent stripes `#38BDF8`.
- **Authentication:** Background `#0F172A` overlayed with blurred orbs (#2563EB, #60A5FA at 40% opacity), card `#FFFFFF`, text `#0F172A`.
- **Admin Login:** Dark card `#0B1220`, accent button `#2563EB`, warning copy `#F97316`.
- **Offline/Error Overlays:** Background gradient `linear-gradient(180deg, #0F172A, #1D4ED8)`, illustration accent `#60A5FA`, primary button `#2563EB`, secondary button outline `rgba(255, 255, 255, 0.6)`.
- **Support Hub:** Accent hero stripe `#1D4ED8→#60A5FA`, article tiles `#FFFFFF`, icons `#2563EB`, support cards highlight `#38BDF8` with white text.

## Dark Theme Parity
- Maintain `primary` at `#60A5FA`, surfaces `#0B1220`, elevated surfaces `#111B2E`. Text colours lighten to `#E2E8F0` (primary) and `#A5B4FC` for accent labels.
- Chips invert scheme: background `rgba(96,165,250,0.16)`, text `#E0F2FE` when selected; unselected `rgba(148,163,184,0.24)`.
- Notification sheet uses `#111B2E` surface with card dividers `rgba(226,232,240,0.12)`; icon backgrounds rely on tone-specific opacities (success `rgba(22,163,74,0.32)` etc.).

## Colour Interaction Rules
- Ensure gradient overlays never exceed 70% opacity over photography; if text sits on gradient + image, apply additional scrim `rgba(15,23,42,0.35)` for readability.
- Limit category accent usage to two components per screen to avoid saturation (e.g., Jobs accent on hero ribbon + icon only).
- Buttons maintain minimum contrast ratio 4.5:1; disabled states use 48% opacity but keep label text `#F8FAFC` for readability.
- Charts or progress indicators (launchpad, volunteering) use accent fill with desaturated base track `rgba(15,23,42,0.18)` to emphasise progress.
