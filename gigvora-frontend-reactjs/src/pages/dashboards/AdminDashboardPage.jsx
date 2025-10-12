import DashboardLayout from '../../layouts/DashboardLayout.jsx';

const menuSections = [
  {
    label: 'Platform governance',
    items: [
      {
        name: 'Operations control center',
        description: 'Site uptime, release management, feature flags, and compliance monitoring.',
        tags: ['status', 'flags'],
      },
      {
        name: 'Configuration & settings',
        description: 'Manage branding, localization, legal policies, roles, and access control.',
      },
      {
        name: 'Integrations hub',
        description: 'SMTP, Agora, analytics, and partner APIs with key rotation and health checks.',
      },
    ],
  },
  {
    label: 'Finance & risk',
    items: [
      {
        name: 'Finance settings',
        description: 'Payout windows, currency settings, tax documents, and ledger exports.',
      },
      {
        name: 'Commission structure',
        description: 'Multi-tier commissions, promos, loyalty discounts, and partner splits.',
      },
      {
        name: 'Risk & compliance',
        description: 'KYC/KYB approvals, AML monitoring, chargeback prevention workflows.',
      },
    ],
  },
  {
    label: 'Support & insights',
    items: [
      {
        name: 'Support operations',
        description: 'Agent routing, macros, SLAs, and proactive outreach for high-value members.',
      },
      {
        name: 'Analytics & metrics',
        description: 'Real-time dashboards for growth, retention, revenue, and marketplace health.',
      },
      {
        name: 'Team & security',
        description: 'Admin roster, audit trails, and incident response protocols.',
      },
    ],
  },
];

const capabilitySections = [
  {
    title: 'Enterprise-grade control',
    description:
      'Administer the Gigvora ecosystem with robust governance controls, policy automation, and compliance observability.',
    features: [
      {
        name: 'Site management console',
        description:
          'Live status boards, feature flag toggles, release pipelines, and rollback automation with audit trails.',
        bulletPoints: [
          'Environment-specific configuration snapshots and comparisons.',
          'Incident command center with on-call rotations and war rooms.',
        ],
      },
      {
        name: 'Policy and access engine',
        description:
          'Define granular roles, permissions, approval workflows, and region-specific compliance policies.',
        bulletPoints: [
          'Policy simulator to test new permission sets before launch.',
          'Automated expirations for temporary elevated access.',
        ],
      },
      {
        name: 'Globalization toolkit',
        description:
          'Localization settings, currency configuration, legal disclaimers, and privacy preferences per geography.',
        bulletPoints: [
          'Auto-detect regulatory requirements and highlight gaps.',
          'Collaboration room for legal, finance, and support teams.',
        ],
      },
      {
        name: 'API integration governance',
        description:
          'Manage SMTP, Agora, analytics, video, payment, and HRIS integrations with heartbeat monitoring.',
        bulletPoints: [
          'Key rotation scheduler with approval workflows.',
          'Alerting for latency, error spikes, or quota exhaustion.',
        ],
      },
    ],
  },
  {
    title: 'Financial stewardship & monetization',
    description:
      'Optimize revenue streams with transparent commissions, finance policy management, and auditing discipline.',
    features: [
      {
        name: 'Commission architect',
        description:
          'Design marketplace fees, success bonuses, referral sharing, and subscription bundles with scenario planning.',
        bulletPoints: [
          'A/B test commission models for cohorts or seasons.',
          'Forecasting for cash flow, gross margin, and profitability.',
        ],
      },
      {
        name: 'Financial operations hub',
        description:
          'Centralize payouts, invoicing, reconciliation, and tax reporting with granular ledger exports.',
        bulletPoints: [
          'Automated compliance for VAT/GST, 1099, and digital services taxes.',
          'Dispute workflows with escalation routing to finance analysts.',
        ],
      },
      {
        name: 'Risk intelligence',
        description:
          'Monitor fraud signals, chargebacks, AML alerts, and policy breaches with machine learning scoring.',
        bulletPoints: [
          'Case management with evidence lockers and action plans.',
          'Integrations to sanctions lists and KYB providers.',
        ],
      },
      {
        name: 'Strategic planning board',
        description:
          'Plan scenario budgets, OKRs, forecast models, and board-ready reporting packages.',
        bulletPoints: [
          'Versioned financial models with collaboration comments.',
          'Link KPIs directly to experiments or feature releases.',
        ],
      },
    ],
  },
  {
    title: 'Support, trust, & safety',
    description:
      'Deliver best-in-class member support while keeping the marketplace secure, inclusive, and compliant.',
    features: [
      {
        name: 'Support mission control',
        description:
          'Omnichannel ticketing, live chat, phone routing, satisfaction tracking, and knowledge base governance.',
        bulletPoints: [
          'AI suggested responses trained on Gigvora playbooks.',
          'Predictive staffing to meet SLAs across global teams.',
        ],
      },
      {
        name: 'Community safety center',
        description:
          'Moderation queues, risk scoring, dispute mediation, and escalation with legal or compliance teams.',
        bulletPoints: [
          'Escalation ladders aligned to severity and contractual terms.',
          'Automated detection for spam, harassment, and policy abuse.',
        ],
      },
      {
        name: 'Quality assurance lab',
        description:
          'Secret shopper programs, QA scripts, satisfaction surveys, and improvement roadmaps by team.',
        bulletPoints: [
          'Blend qualitative and quantitative insights into actions.',
          'Share insights with product and marketing stakeholders instantly.',
        ],
      },
      {
        name: 'Executive communications',
        description:
          'Broadcast updates, incident notifications, and stakeholder briefings to keep leadership aligned.',
        bulletPoints: [
          'Templates for board reporting and regulatory updates.',
          'Automated translation and accessibility compliance.',
        ],
      },
    ],
  },
  {
    title: 'Data intelligence & experimentation',
    description:
      'Drive growth with real-time analytics, experimentation, cohort insights, and executive-ready storytelling.',
    features: [
      {
        name: 'Marketplace health analytics',
        description:
          'Dashboards for supply/demand balance, fulfillment velocity, retention cohorts, and NPS performance.',
        bulletPoints: [
          'Drill into segments by geography, category, or membership tier.',
          'Export-ready executive summaries and investor snapshots.',
        ],
      },
      {
        name: 'Experimentation platform',
        description:
          'Set up A/B, multivariate, or holdout experiments across product, pricing, and messaging.',
        bulletPoints: [
          'Statistical significance monitoring with guardrails.',
          'Automated learnings library to inform product roadmaps.',
        ],
      },
      {
        name: 'Data governance hub',
        description:
          'Control data retention, privacy requests, schema catalogs, and lineage tracking.',
        bulletPoints: [
          'Data stewardship assignments and review workflows.',
          'Compliance with GDPR, CCPA, and SOC2 controls.',
        ],
      },
      {
        name: 'Executive scorecard',
        description:
          'Weekly briefing pack covering key results, risks, opportunities, and required decisions for leadership.',
        bulletPoints: [
          'Auto-generate slides with commentary and attribution.',
          'Integrate commitments into leadership follow-up tasks.',
        ],
      },
    ],
  },
];

const profile = {
  name: 'Jordan Kim',
  role: 'Chief Platform Administrator',
  initials: 'JK',
  status: 'On duty',
  badges: ['Super admin', 'Security cleared'],
  metrics: [
    { label: 'Active alerts', value: '4' },
    { label: 'Tickets in SLA', value: '98%' },
    { label: 'Monthly GMV', value: '$12.6M' },
    { label: 'System uptime', value: '99.99%' },
  ],
};

const availableDashboards = ['admin'];

export default function AdminDashboardPage() {
  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gigvora Admin Control Tower"
      subtitle="Enterprise governance & compliance"
      description="Centralize every lever that powers Gigvora—from site settings and financial operations to integrations, support, analytics, and safety."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profile}
      availableDashboards={availableDashboards}
    />
  );
}
