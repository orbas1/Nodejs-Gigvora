# UI/UX Design Change Log — Release Aurora (2024-06)

## Overview
The Aurora release refreshes Gigvora's cross-platform experience to highlight project workspaces, streamline hiring flows, and reinforce trust through transparent escrow management. The following log captures every material change to approved design artifacts and links them to implementation tickets for full traceability.

## Design Updates
| ID | Area | Change Summary | Design Assets | Implementation Tickets | Status |
| --- | --- | --- | --- | --- | --- |
| UX-201 | Project Workspace Hub | Introduced a task-focused dashboard surface with modular panels for budget, deliverables, and communication, aligning mobile and web layouts. | [Figma › Workspace Dashboard Revamp](https://www.figma.com/file/workspace-dashboard) | FE-782, BE-641 | ✅ Approved |
| UX-202 | Escrow Automation Drawer | Simplified decision tree, replacing four-step wizard with contextual checklist and inline dispute guidance. | [Figma › Escrow Automation](https://www.figma.com/file/escrow-automation) | FE-784, BE-655 | ✅ Approved |
| UX-203 | RBAC Role Switcher | Added quick-switch pill for Admin/Manager/Contributor personas with visual feedback on permissions. | [Figma › RBAC Controls](https://www.figma.com/file/rbac-controls) | FE-776, FE-777 | ✅ Approved |
| UX-204 | Global Navigation | Refined responsive breakpoints, consolidated workspace and agency menus, and surfaced “Live Support” entry point. | [Figma › Global Nav](https://www.figma.com/file/global-nav-update) | FE-768 | ✅ Approved |
| UX-205 | Accessibility Palette | Introduced AA-compliant color tokens, dark-mode palette, and high-contrast states for actionable elements. | [Figma › Token Library](https://www.figma.com/file/color-token-refresh) | FE-770 | ✅ Approved |
| UX-206 | Notification Center | Redesigned inbox surfaces to support escalation tags and SLA countdown badges. | [Figma › Notification Center](https://www.figma.com/file/notification-center) | FE-788, BE-662 | ✅ Approved |
| UX-207 | Mobile Wireframes | Synchronized user app flows for project onboarding, live chat, and verification modals with web parity. | [Figma › Mobile Parity](https://www.figma.com/file/mobile-parity) | APP-331, API-512 | ✅ Approved |

## Design QA Checklist
- All updated artboards use the 12-column grid (web) and 8pt spacing system (mobile).
- Tokenized typography scales (Inter family) exported to `shared-contracts/design-tokens.json` for engineering consumption.
- State inventory covers default, hover, focus-visible, pressed, loading, and error for each interactive component.
- Motion specifications for micro-interactions documented in Lottie handoff files (`/ui/motion/aurora`).

## Stakeholder Approvals
- **Product**: Signed off by Director of Product on 2024-06-11.
- **Engineering**: Frontend and backend chapter leads confirmed feasibility on 2024-06-12.
- **Compliance**: Accessibility and data-protection checks approved on 2024-06-13.

## Next Steps
- Archive superseded frames in Figma library and update design tokens changelog (`shared-contracts/design-tokens.md`).
- Sync with localization team to capture new microcopy introduced in the RBAC switcher and notification center.
- Schedule design QA walkthrough with QA Engineering prior to code freeze (2024-06-18).
