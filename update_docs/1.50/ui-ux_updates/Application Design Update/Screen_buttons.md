# Button System Updates

## Button Types
- **Primary Gradient Button:** Default for key actions (Submit, Continue, Create). Gradient Sapphire → Sky with white text.
- **Secondary Outline Button:** Used for secondary actions (Preview, Skip). Outline in Primary 500 with transparent fill.
- **Tertiary Text Button:** Inline actions (Learn more, View details) using Primary 500 text only.
- **Destructive Button:** Solid Rose background for irreversible actions (Cancel project, Delete post).
- **Floating Action Button:** Circular gradient button hosting “+”; opens action hub.

## States
- Hover (where applicable), pressed, focused, disabled, and loading states defined with colour shifts and opacity adjustments.
- Loading state replaces label with spinner while keeping width fixed.

## Interaction Patterns
- Buttons sized at minimum width 120px and height 48px; icon buttons 48px square.
- Confirmation dialogs require primary + secondary button pairing (Confirm / Cancel).
- Long forms place primary button at bottom anchored to safe area; sticky CTAs for tasks like milestone approval.
- Accessibility: Provide descriptive `semanticsLabel` for icon-only buttons; maintain sufficient contrast in high-contrast mode.

## Analytics
- Track button taps for core funnels (Apply, Post, Create Project, Release Escrow). Include persona and context metadata.
