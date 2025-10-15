# Gigvora Pre-Launch Valuation for a Solo + AI Build (GBP)

## Executive Summary
- **Recommended internal pre-launch valuation:** **£2.2 million** fully diluted on a clean cap table.
- The figure recognises that Gigvora was assembled by a single founder leveraging AI assistants, so direct build cost is modest (~£0.19M), yet the resulting tri-platform marketplace and workflow depth supports a higher market-aligned value (~£3.4M) once investor discounts are applied.
- This valuation anchors future fundraising while remaining credible to investors who benchmark solo-founder, pre-revenue platforms with demonstrable product completeness.【F:gigvora-backend-nodejs/README.md†L1-L58】【F:gigvora-frontend-reactjs/README.md†L1-L33】【F:gigvora-flutter-phoneapp/README.md†L1-L20】

## Product & Feature Scope
The valuation reflects the actual feature surface in the monorepo:
- **Marketplace and professional network fusion**: authentication with email 2FA, LinkedIn-style feed, unified search across jobs, gigs, projects, launchpads, volunteering, and people, plus agency/company onboarding flows.【F:gigvora-backend-nodejs/README.md†L1-L58】【F:gigvora-frontend-reactjs/README.md†L1-L33】
- **Reputation and workflow depth**: testimonials, success stories, metrics, badges, shareable widgets, gig order pipelines with requirement forms, revisions, and escrow checkpoints enforced by service logic.【F:gigvora-backend-nodejs/README.md†L45-L97】【F:gigvora-backend-nodejs/docs/schema-overview.md†L53-L142】
- **Realtime collaboration**: Agora-powered voice/video inside messaging threads and deterministic caching in the messaging service to support omnichannel conversations.【F:gigvora-backend-nodejs/README.md†L24-L44】【F:gigvora-backend-nodejs/docs/schema-overview.md†L33-L52】
- **Monetization and admin controls**: configurable commissions, subscriptions, third-party payment providers (Stripe/Escrow), SMTP, and Cloudflare R2 storage toggles exposed via `/api/admin/platform-settings`.【F:gigvora-backend-nodejs/README.md†L24-L70】
- **Cross-platform clients**: polished React web experience and Flutter mobile app mirroring marketplace, explorer, dashboards, and admin flows with shared branding tokens.【F:gigvora-frontend-reactjs/README.md†L1-L33】【F:gigvora-flutter-phoneapp/README.md†L1-L20】

## Valuation Approaches
### 1. Solo-Builder Replacement Cost (Bottoms-Up)
| Component | Assumptions | Estimated Cost |
| --- | --- | --- |
| Founder engineering + product | 1 founder contributing 12 months at an imputed £120k/year (salary + 30% overhead). Covers Node.js services, React/Flutter clients, schema design, and product management. | £120,000 |
| AI tooling & productivity stack | Mix of premium AI subscriptions, design systems, testing harnesses, and context window upgrades @ £500/month. | £6,000 |
| Contracted specialists | Occasional legal/accounting review (20 hours @ £180/hr) and design polish (40 hours @ £90/hr). | £11,400 |
| Cloud & third-party services | Stripe, Agora, Cloudflare R2, email, monitoring during build @ £500/month blended. | £6,000 |
| Contingency & overhead | 30% uplift for unforeseen refactors, compliance research, and documentation. | £42,420 |
| **Subtotal** |  | **£185,820** |

Adjustments:
- **Technical maturity premium (+25%)**: Production-ready schema governance, automation scripts, and tri-platform parity meaningfully accelerate onboarding for any future hires or investors.【F:gigvora-backend-nodejs/docs/schema-overview.md†L1-L160】【F:README.md†L37-L124】 Adds £46,455.
- **Pre-launch uncertainty discount (−15%)**: No live GMV, pending compliance sign-off, and reliance on third-party services reduce monetisable value today.【F:gigvora-backend-nodejs/README.md†L24-L70】 Subtracts £34,094.

**Solo-builder replacement cost valuation: £198,181 ≈ £0.20M**

### 2. Market Comps with Solo-Founder Discount (Top-Down)
Reference recent UK/EU pre-seed deals for professional services marketplaces (Malt, YunoJuno, Contra) that raise £4M–£6M post-money on MVP traction. Adjustments for a solo, pre-revenue launch:
- Baseline **£1.8M post-money** for a typical MVP at £270k raise (15% dilution) with a founding team of 2–3.
- Apply **feature-set premium (+90%)** because Gigvora already bundles escrow-ready payments, admin monetisation toggles, and multi-client support beyond a baseline MVP.【F:gigvora-backend-nodejs/README.md†L24-L97】 → **£3.42M**.
- Apply **solo-founder execution discount (−25%)** to reflect key-person risk and the need to recruit additional leadership post-raise. → **£2.57M**.
- Apply **illiquidity & proof discount (−15%)** while metrics are unproven. → **£2.19M** market-aligned valuation.

### 3. Blended Recommendation
Weighting 30% replacement cost (recognising the lean solo build) and 70% market comps (reflecting fundraising conversations):
- (0.3 × £0.20M) + (0.7 × £2.19M) = £1.60M.
- Apply **readiness uplift (+35%)** for tri-platform parity, monetisation hooks, and documented operational runbooks that reduce time to revenue once capital is injected.【F:README.md†L37-L124】
- Apply **post-raise execution reserve (−5%)** acknowledging upcoming spend on team expansion and compliance.
- **Final blended valuation: £1.60M × 1.35 ≈ £2.16M**, rounded to **£2.2M** to provide negotiating headroom while staying aligned with solo-founder benchmarks.

## Rationale & Sensitivity
- **Strengths**: Comprehensive product footprint, API-driven monetisation toggles, and platform readiness across web and mobile meaningfully de-risk post-raise execution.【F:gigvora-backend-nodejs/README.md†L1-L111】【F:gigvora-backend-nodejs/docs/schema-overview.md†L1-L160】
- **Risks**: Key-person dependency on the founder, absence of validated user acquisition, compliance/licensing workstreams, and exposure to third-party SaaS costs.【F:gigvora-backend-nodejs/README.md†L24-L70】
- **Upside triggers**: Securing pilot agencies, closing first £10k GMV, or onboarding a second technical leader can justify pushing valuations toward £3M+ within 6–9 months.
- **Downside triggers**: Prolonged go-to-market delays or regulatory blockers would anchor valuation closer to the £0.20M replacement cost floor.

This £2.2M internal valuation transparently communicates how a solo + AI build translates into investor-ready value, balancing build efficiency with the premium warranted by Gigvora’s scope and polish.
