# Button Catalogue – Phone Application v1.00

| Button | Style | Dimensions | Colours | Typography | Iconography | Usage |
| --- | --- | --- | --- | --- | --- | --- |
| Primary CTA | Filled rounded pill | Height 52dp, min width 160dp, corner 16dp, padding 20/16 | Background `#2563EB`, pressed `#1D4ED8`, disabled `rgba(37, 99, 235, 0.24)` | Inter 16/24 SemiBold, text `#FFFFFF` | Optional leading icon 24dp white | Apply/Pitch/Join buttons, Save actions |
| Secondary CTA | Filled neutral | Height 52dp, corner 16dp | Background `#0EA5E9`, pressed `#0284C7`, text `#FFFFFF` | Inter 16/24 SemiBold | Optional | Share, Contact support |
| Outline | Outline pill | Height 48dp, corner 16dp, border 1.5dp `#2563EB` | Background transparent, pressed `rgba(37, 99, 235, 0.08)` | Inter 15/22 Medium, text `#2563EB` | Optional accent icon `#2563EB` | Secondary actions, filter reset |
| Ghost | Text button | Height 44dp, padding 12/12 | Background transparent | Inter 15/22 Medium, text `#1D4ED8` | Underline on focus | Inline actions, tertiary options |
| FAB | Circular elevated | 64dp diameter, elevation 8dp | Background gradient `#2563EB→#1D4ED8`, shadow `rgba(15,23,42,0.24)` | Icon only, 28dp white | Add icon | Post update, create opportunity |
| Floating CTA Bar | Dual-button bar | Height 68dp, safe-area aware, 16dp padding | Background `#FFFFFF`, border top `#E2E8F0` | Buttons per primary/outline spec | Primary + secondary icons | Opportunity detail actions |
| Pill Chip | Filter chip | Height 32dp, padding 16/8 | Selected: background `#DBEAFE`, text `#1D4ED8`; Unselected: background `#E2E8F0`, text `#475569` | Inter 14/20 Medium | Leading icon 20dp optional | Filter rows, segmented categories |
| Icon Button | Circular | 44dp diameter | Default background `#E2E8F0`, pressed `#CBD5F5` | Icon 24dp `#1D4ED8` | With/without label | Bookmark, share, voice search |
| Inline CTA Link | Text with chevron | Height 40dp | Transparent | Inter 14/20 Medium `#2563EB` | Trailing chevron icon 16dp | See all, Manage preferences |
| Toggle Button | Switch style | Track 52×28dp, thumb 20dp | On track `#2563EB`, Off `#CBD5F5`, thumb `#FFFFFF` | n/a | n/a | Settings toggles |

## States & Interactions
- **Hover (tablet pointer):** lighten background by 8% (where applicable), maintain 4dp outline `rgba(37,99,235,0.24)` for focus.
- **Focus:** Outline 2dp `#38BDF8`, drop shadow `0 0 0 4 rgba(56, 189, 248, 0.35)`.
- **Loading:** Primary/secondary buttons display circular progress indicator (24dp) replacing icon, text fades to 0%.
- **Disabled:** Reduce opacity to 48%, disable shadows, maintain accessible contrast (text `#94A3B8`).
