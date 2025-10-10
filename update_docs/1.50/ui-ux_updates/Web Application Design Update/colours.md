# Colour System – Web Application v1.50

| Token | Hex | Usage |
| --- | --- | --- |
| `--accent-50` | #EFF5FF | Background tint for info banners and active navigation hover. |
| `--accent-100` | #D6E6FF | Secondary backgrounds, alternating table rows. |
| `--accent-300` | #7FAEF1 | Chart fills, focused form outlines. |
| `--accent-500` | #3F7FE3 | Primary CTAs, active icons, progress bars. |
| `--accent-700` | #1F4F9F | Hover/focus states for key buttons, emphasis text. |
| `--accent-900` | #0C2B5C | Header background, gradient anchor, high contrast text on light backgrounds. |
| `--success-500` | #2F9D69 | Payment released, checklist completed. |
| `--warning-500` | #E6A93A | Pending verification, approaching deadlines. |
| `--danger-500` | #D05252 | Dispute alerts, failed payments. |
| `--neutral-50` | #F8FAFC | Base background. |
| `--neutral-100` | #EDF1F7 | Card backgrounds, skeletons. |
| `--neutral-300` | #C8D0E0 | Borders, dividers. |
| `--neutral-500` | #8793AD | Secondary text, icons. |
| `--neutral-700` | #4C5673 | Body text. |
| `--neutral-900` | #1A2235 | Headings, high-emphasis text. |

## Colour Usage Guidelines
- Maintain minimum 4.5:1 contrast ratio for text on backgrounds.
- Use gradient backgrounds sparingly—only hero sections and key empty states—to keep dashboards performance-focused.
- Charts adopt accent ramp for primary series, neutral ramp for comparative baselines, and semantic colours for status markers.
- Accessibility testing includes dark mode prototyping; tokens stored in theme map to support future theme switcher.
