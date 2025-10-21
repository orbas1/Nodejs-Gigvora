# User Application Styling Updates — Aurora Release

## Token Refresh
- Adopted Aurora token set (`token.v2.json`) aligning with WCAG 2.1 AA contrast requirements.
- Primary brand gradient updated to `linear(195deg, #5C6CFF 0%, #7B5CFF 48%, #A45CFF 100%)` with automatic fallbacks for low-powered devices.
- Typography: switched to Inter weight pairing (400/600) with dynamic type support up to 200% scaling.

## Component-Level Styling
| Component | Update | Rationale |
| --- | --- | --- |
| Workspace Summary Cards | Introduced glassmorphism layer with blur for readability against gradient backgrounds; added iconography for quick scanning. | Boosts visual hierarchy and reduces cognitive load when scanning statuses. |
| Task Kanban Chips | Rounded corners increased to 12px, background tokens now role-aware (`task.role.admin`, `task.role.manager`). | Reinforces RBAC context and improves touch affordances. |
| Escrow Status Pill | Added subtle pulse animation when release pending; colors mapped to compliance states (Pending: `#F5A524`, Released: `#12B76A`, Dispute: `#F97066`). | Provides immediate clarity on escrow health. |
| CTA Buttons | Standardized drop shadow elevation to 2dp with `rgba(92,108,255,0.35)` and introduced pressed state with 96% opacity. | Consistent action feedback across surfaces. |
| Inline Alerts | Migrated to card-based alerts with icon on left, action link on right; background tokens `alert.success`, `alert.warning`, `alert.error`. | Improves accessibility and translation handling. |

## Interaction Guidelines
- Motion reduced to 180ms for transitions; respects OS-level "Reduce Motion" preferences.
- Focus indicators now use 3px outline (#94A6FF) with 4px offset to maintain visibility on gradient backgrounds.
- Haptics: gentle impact triggered for high-risk actions (dispute creation, payment release) using native vibration API.

## Dark Mode
- Introduced dark palette using neutrals (#0E1117 background, #161B22 surfaces) with accent gradient tuned to reduce glare.
- Verified all charts maintain legibility in dark mode with high-contrast accent colors.
- Automatic switching tied to system preference with manual override stored securely via encrypted async storage.

## Asset Management
- Exported updated icons in SVG and PDF for scalable usage; stored in `shared-assets/icons/aurora/`.
- Updated Lottie animations for progress indicators and empty states (workspace, tasks, escrow) with 60fps limit.
- Verified image assets compressed with WebP (quality 85) to minimize load impact.

## QA Checklist
- Snapshot tests updated to capture new color tokens.
- Visual regression coverage executed with Chromatic to ensure parity with web components.
- Manual QA performed on iOS (iPhone 14, iOS 17) and Android (Pixel 7, Android 14) covering light/dark modes.
