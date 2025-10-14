# Campaign Colour Extensions — Web Application v1.50

## Purpose
Define secondary palette options for seasonal campaigns, industry landing pages, and promotional microsites while preserving alignment with the core brand system.

## Secondary Palettes
1. **Professional Services**
   - Primary: `#1F2937`
   - Accent: `#10B981`
   - Supporting: `#F59E0B`
2. **Creative Economy**
   - Primary: `#7C3AED`
   - Accent: `#EC4899`
   - Supporting: `#FCD34D`
3. **Logistics & Field Ops**
   - Primary: `#0EA5E9`
   - Accent: `#F97316`
   - Supporting: `#94A3B8`

## Usage Guidelines
- Campaign palettes apply to hero backgrounds, highlight modules, and CTA bars; maintain core navigation/footer colours.
- Ensure text remains accessible by pairing with neutral surfaces or using gradient overlays.
- Limit campaign-specific colours to targeted sections to avoid brand fragmentation.

## Implementation
- Define CSS variables `campaign.primary`, `campaign.accent`, `campaign.supporting` for each theme.
- Provide toggles within CMS to switch palette per page.
- Document sample combinations in design system with accessibility notes.

## Accessibility
- Verify contrast ratios for each palette combination using automated checks.
- Provide fallback to standard palette if dynamic theming not supported by browser.

## Testing & Governance
- QA each campaign theme before launch to confirm visual integrity on major browsers.
- Maintain log of active campaigns and expiration dates to revert to base theme.
- Review campaign palettes quarterly with brand team for relevancy and consistency.
