import {
  BoltIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';

export const valuePillars = [
  {
    id: 'launch-velocity',
    eyebrow: 'Launch velocity',
    title: 'Coordinate launches across product, marketing, and talent in one place.',
    description:
      'Brief experts, capture approvals, and sync mentor feedback without juggling fragmented tools or email chains.',
    metric: { value: '9 days', label: 'average time-to-launch after onboarding' },
    icon: RocketLaunchIcon,
    cta: { label: 'Explore launch workflows', action: 'view_workflows' },
  },
  {
    id: 'talent-orchestration',
    eyebrow: 'Talent orchestration',
    title: 'Match vetted talent and mentors in hours with contextual insights.',
    description:
      'Signal-driven recommendations surface specialists, mentors, and volunteers with availability, reviews, and risk flags.',
    metric: { value: '12,400+', label: 'curated specialists ready to engage' },
    icon: SquaresPlusIcon,
    cta: { label: 'See talent playbooks', action: 'view_talent' },
  },
  {
    id: 'trust-controls',
    eyebrow: 'Trust & compliance',
    title: 'Operate with enterprise-grade compliance, payouts, and governance.',
    description:
      'Automated contracts, payout controls, and audit trails keep every portfolio compliant across regions.',
    metric: { value: '99.95%', label: 'platform uptime backed by enterprise SLAs' },
    icon: ShieldCheckIcon,
    cta: { label: 'Review trust architecture', action: 'view_trust' },
  },
  {
    id: 'intelligence',
    eyebrow: 'Live intelligence',
    title: 'Decisions stay aligned with live metrics and AI-assisted summaries.',
    description:
      'Status pills, forecast chips, and AI briefings surface risks and wins for executives, operators, and clients.',
    metric: { value: '4x', label: 'faster insight loops reported by pilot teams' },
    icon: BoltIcon,
    cta: { label: 'Tour the intelligence hub', action: 'view_insights' },
  },
];
