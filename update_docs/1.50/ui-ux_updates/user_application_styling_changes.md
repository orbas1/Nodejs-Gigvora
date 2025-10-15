# User Mobile Application Styling Changes — Version 1.50

## Design Vision
- **Mood:** Light, optimistic, community-focused with warm accent colours and playful illustrations.
- **Consistency:** Align consumer styling with provider and web updates while preserving a friendly mobile-first feel.
- **Accessibility:** Comply with WCAG AA, support dynamic type, and ensure high contrast in bright outdoor conditions.

## Colour Palette
| Token | Hex | Application |
|-------|-----|-------------|
| `consumer.primary` | `#2563EB` | Primary CTAs, active tab indicator |
| `consumer.accent` | `#F97316` | Highlight chips, promotional banners |
| `consumer.success` | `#22C55E` | Success toasts, confirmation states |
| `consumer.warning` | `#FACC15` | Pending actions, scheduling conflicts |
| `consumer.error` | `#EF4444` | Error alerts, destructive confirmations |
| `consumer.background` | `#F8FAFC` | Screen backgrounds |
| `consumer.surface` | `#FFFFFF` | Cards, sheets |
| `consumer.text.primary` | `#0F172A` | Headings |
| `consumer.text.secondary` | `#475569` | Body copy |

### Gradients & Theming
- Hero gradient `linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)` used on hero cards and splash screen.
- Floating action button uses accent gradient `linear-gradient(135deg, #F97316, #FB923C)` with drop shadow.
- Dark mode palette defined with complementary tones (`#1E293B` backgrounds, `#93C5FD` primary).

## Typography
- **Primary Font:** `Inter` for all text with dynamic type scaling up to 200%.
- **Display Variant:** `Space Grotesk` for large headlines and numbers in hero sections.
- **Type Scale:** Display 32/40, H1 28/36, H2 24/32, H3 20/28, Body 16/24, Caption 14/20, Micro 12/16.
- **Line Height:** Minimum 1.4 for readability; letter-spacing adjustments for uppercase labels.

## Component Styling
### Buttons
- Primary buttons full-width on mobile, 16px padding, 12px radius, subtle elevation (`0 6px 16px rgba(37,99,235,0.25)`).
- Secondary buttons outlined with 2px border using `consumer.primary` and transparent fill; hover states lighten border.
- Tertiary buttons text-only with underline on hover; disable state uses `consumer.text.secondary` at 50% opacity.
- FAB uses circular 64px diameter with inner shadow and icon sized 28px.

### Cards
- Soft shadow `0 12px 24px rgba(15,23,42,0.06)` and 16px corner radius.
- Header includes provider avatar overlap, rating badge, and chip for distance.
- Footer area uses subtle top border and contains Save/Book CTAs.
- Skeleton states mimic card layout with shimmer animation and neutral colours.

### Tabs & Navigation
- Bottom navigation icons use 24px outline style; active tab highlighted with pill indicator and label weight 600.
- Top tabs use segmented controls with animated indicator, haptic feedback, and accessible contrast.
- App bar translucent with blur on scroll, switching to solid background when content scrolls beyond 16px.

### Forms & Inputs
- Input fields with 14px radius, subtle border `#CBD5F5`; focus state with glowing outline `#2563EB` and drop shadow.
- Multi-select chips pill-shaped, accent background when selected, and icon for removal.
- Date & time pickers adopt bottom sheet style with large tap targets and sticky confirmation bar.
- Validation messages appear inline with icon and plain-language guidance.

### Messaging UI
- Sent messages tinted `#E0F2FE`, received messages `#F1F5F9`; both with 16px radius and tail pointer.
- Typing indicator uses dot animation with accent gradient; message timestamps in `consumer.text.secondary` at 70% opacity.
- Quick replies displayed as pill buttons with accent border.

### Overlays & Sheets
- Bottom sheets have 24px top radius, grab handle, and 88% height default with safe area padding.
- Modals use dimmed overlay (`rgba(15,23,42,0.45)`) and drop shadow `0 20px 40px rgba(15,23,42,0.25)`.
- Toast notifications appear at top with slide-in animation, icon, and multi-line support.

## Experience-Specific Styling
### Purchase & Finance Areas
- **Membership Cards:** Gradient backgrounds blending primary and accent, layered iconography, and subtle animated shimmer on active plan.
- **Checkout Forms:** Step indicators use pill badges with checkmarks on completion; error states emphasised with red outline and bounce micro-interaction.
- **Finance Settings:** Accordion headers use chevron icons and badges showing verification status; documents list uses thumbnail previews.
- **Budget Tracker:** Circular progress uses soft shadow and numeric overlay; alerts appear as accent banners with dismiss icon.

### Career & Opportunity Modules
- **Job Listing Cards:** Feature employer logo badge, salary chips, remote badge, and gradient apply button; skeleton states mirror layout to reduce layout shift.
- **Interview Room:** Dark-on-light dual theme with accent-coloured status bar, speaking indicator glow, and tactile button styling for mute/video controls.
- **Project & Gig Boards:** Cards adopt accent-colour stripes per status, drag handle icon, and micro drop shadow when active.
- **Mentorship Dashboards:** Soft pastel backgrounds with goal progress arcs and avatar pairs; session cards include accent-coloured timeline dots.
- **Volunteering Listings:** Warm gradient header, iconography for cause categories, and CTA emphasising commitment length.

### Community & Networking Spaces
- **Networking Lounge:** Live tiles with neon accent border pulsing gently, background blur on join overlay, and gradient timer bar.
- **Speed Networking:** Timer widget uses digital font, progress ring around avatar, and celebratory burst on session completion.
- **Creation Studio:** Editor toolbar uses frosted glass effect, snap guides highlighted with accent lines, and success toast includes share CTA button.
- **Messaging Bubble:** Compact overlay with rounded corners, drop shadow, and gradient highlight for unread count badge.

### Runtime Health Alerts
- **Exporter Freshness Snackbar:** Uses warning amber background when scrapes are stale, displays pulse glyph icon, and includes "View telemetry" secondary action linking to runtime panel; copy strings pulled from `Screen_text.md` exporter section with localisation tokens.
- **Runbook CTA:** When exporter error streak > 3, snackbar expands with bordered action row styled as tertiary button linking to runtime incident runbook; ensures contrast ratio ≥ 4.5:1 for text on amber background.
- **Success Reset State:** On recovery, snackbar transitions to success palette with subtle scale animation and resets countdown chip to display last scrape timestamp.

### Settings & Legal Pages
- **Account Preferences:** Toggle groups arranged on raised surfaces with descriptive copy; destructive options flagged with warning icon and background tint.
- **Legal Documents:** Use typographic hierarchy with drop caps for section titles, sticky summary banner, and accent callout boxes for key updates.

## Imagery & Illustration
- Introduced illustration system depicting diverse users in gig scenarios with subtle textures.
- Photo guidelines emphasise natural lighting, candid moments, and consistent colour grading.
- Iconography updated to 24px line icons with 2px stroke, ensuring clarity at small sizes.

## Motion & Interaction
- Standard easing `cubic-bezier(0.2, 0, 0, 1)` for page transitions; durations 250ms for screen transitions, 150ms for micro interactions.
- Loading states use Lottie animation of Gigvora logo loop.
- Confetti effect triggered post-booking uses particle spread limited to 900ms to avoid distraction.

## Accessibility Enhancements
- Minimum contrast 4.5:1 for text; 3:1 for large display text.
- Focus order defined for keyboard and assistive devices; highlight ring uses accent colour.
- VoiceOver hints added for non-text buttons; ensures accessible names for icons.
- Haptics tuned: light impact for button presses, medium for booking confirmation.

## Implementation Guidance
- Provided React Native style tokens for reuse; bridging to Flutter via shared JSON exports.
- Documented platform-specific overrides for iOS (large title support) and Android (Material3 integration).
- Included QA checklist verifying spacing, typography, color usage, and animation timing on iOS/Android.

## Future Styling Tasks
- Expand widget states for upcoming dark mode release.
- Explore seasonal themes with limited-time colour overlays.
- Evaluate dynamic island/live activities styling for iOS 17 features.

## Maintenance Drawer & Banner Styling (10 Apr 2024)
- **Drawer Layout:** Full-width overlay with 24px corner radius, gradient header using `#312E81` to `#1E3A8A`, and sticky action bar containing "Notify me" and "Back to dashboard" buttons. Drawer height 80% viewport with scrollable body.
- **Banner Mini-State:** Compact banner above bottom navigation using severity colour tokens (`maintenance.*`) with 12px radius and progress spinner when countdown <15 minutes.
- **Typography:** Title `Space Grotesk` 20px/26px, message `Inter` 16px/24px, metadata chips `Inter` 12px uppercase.
- **Iconography:** Animated lottie for incident/security states; static vector for info/maintenance. Icons align left with 16px padding.
- **Interactions:** Swipe-down gesture to dismiss allowed only when announcement dismissible; otherwise CTA directs to support article. Offline state shows grey banner with cached message and "Last checked" timestamp.
- **Accessibility:** VoiceOver/ TalkBack announce severity first, followed by timeframe. Drawer focus trap includes manual close button labelled with severity. CTA order respects left-to-right reading and haptic feedback uses medium impact.
