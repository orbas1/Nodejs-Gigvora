# CSS Utility Mapping – Web Application Version 1.00

## Global Variables (Injected via `:root`)
```css
:root {
  --color-accent-primary: #2563eb;
  --color-accent-deep: #1d4ed8;
  --color-accent-sky: #38bdf8;
  --color-neutral-900: #0b1b3f;
  --color-neutral-100: #f1f5f9;
  --color-surface-elevated: rgba(255, 255, 255, 0.92);
  --shadow-soft: 0 12px 24px -12px rgba(15, 23, 42, 0.25);
  --shadow-medium: 0 20px 40px -20px rgba(15, 23, 42, 0.28);
  --shadow-accent: 0 24px 48px -16px rgba(37, 99, 235, 0.35);
  --radius-lg: 24px;
  --radius-pill: 9999px;
  --transition-fast: 150ms;
  --transition-medium: 220ms;
}
```

## Tailwind Utility Bundles
- `.hero-section`: `bg-gradient-to-r from-[#0B1B3F] via-[#1D4ED8] to-[#38BDF8] text-white py-32 lg:grid lg:grid-cols-[1.2fr,0.8fr] gap-16 relative`.
- `.content-wrap`: `max-w-6xl mx-auto px-6 md:px-10`.
- `.card`: `rounded-[24px] border border-slate-200 bg-white/90 shadow-[var(--shadow-soft)] backdrop-blur-sm`.
- `.chip`: `inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium`.
- `.primary-btn`: `inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-semibold transition-transform duration-200 shadow-[var(--shadow-accent)]`.
- `.secondary-btn`: `inline-flex items-center justify-center rounded-full border border-[#2563EB] text-[#2563EB] font-semibold hover:bg-[#DBEAFE]`.

## Media Queries
- `@media (min-width: 1536px) { .hero-section { padding-inline: clamp(48px, 8vw, 120px); } }`
- `@media (max-width: 1023px) { .header-nav { display: none; } .mobile-drawer { transform: translateY(-8px); } }`
- `@media (max-width: 767px) { .hero-section { grid-template-columns: 1fr; padding-block: 96px; } }`

## Animations
```css
@keyframes ctaPulse {
  0%, 100% { box-shadow: 0 20px 40px -16px rgba(37, 99, 235, 0.25); }
  50% { box-shadow: 0 24px 48px -12px rgba(56, 189, 248, 0.35); }
}

.primary-btn {
  animation: ctaPulse 2.5s ease-in-out infinite;
}
```

## Accessibility Helpers
- `.sr-only` for visually hidden text.
- `.focus-outline` adds `outline: 4px solid rgba(37,99,235,0.24); outline-offset: 4px;`.
- `.skip-link` styled with `position: absolute; top: 16px; left: 16px; padding: 12px 16px; background: #0b1b3f; color: white;` and hidden until focused.

## Layout Utilities
- `.grid-12`: `display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: clamp(16px, 2vw, 32px);`.
- `.stack-lg`: `display: flex; flex-direction: column; gap: 32px;`.
- `.stat-row`: `display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px;`.

## Z-Index Layering
| Layer | Value | Usage |
| --- | --- | --- |
| `z-base` | 0 | Content |
| `z-header` | 40 | Sticky header |
| `z-drawer` | 50 | Mobile nav |
| `z-modal` | 60 | Modal dialogs |
| `z-toast` | 70 | Toast notifications |

## Integration Notes
- Utility classes provided as references; continue to rely on Tailwind config. Additional CSS variables declared in `index.css`.
- For IE11 fallback (if required for analytics portal), degrade gradients to solid accent colours and remove blur.
