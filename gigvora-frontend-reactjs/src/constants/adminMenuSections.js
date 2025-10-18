export const ADMIN_MENU_SECTIONS = [
  {
    label: 'Command modules',
    items: [
      {
        id: 'admin-runtime-health',
        name: 'Runtime health',
        description: 'Service readiness, dependency posture, and rate-limit utilisation for the API perimeter.',
        tags: ['ops', 'security'],
        sectionId: 'admin-runtime-health',
      },
      {
        id: 'admin-domain-governance',
        name: 'Data governance',
        description: 'PII inventory, retention policies, and audit cadence across bounded contexts.',
        tags: ['compliance', 'data'],
        sectionId: 'admin-domain-governance',
      },
      {
        id: 'admin-member-health',
        name: 'Member health',
        description: 'Growth, activation, and readiness scores across the Gigvora network.',
        tags: ['growth', 'activation'],
      },
      {
        id: 'admin-financial-governance',
        name: 'Financial governance',
        description: 'Escrow flows, fee capture, and treasury risk posture.',
        tags: ['finance'],
      },
      {
        id: 'admin-risk-trust',
        name: 'Risk & trust',
        description: 'Dispute lifecycle, escalations, and marketplace safety monitoring.',
        tags: ['compliance'],
      },
      {
        id: 'admin-support-operations',
        name: 'Support operations',
        description: 'Service desk load, SLAs, and sentiment guardrails.',
      },
      {
        id: 'admin-engagement-comms',
        name: 'Engagement & comms',
        description: 'Platform analytics, event telemetry, and notification delivery.',
      },
      {
        id: 'gigvora-ads',
        name: 'Gigvora Ads',
        description: 'Campaign coverage, targeting telemetry, and creative governance.',
        tags: ['ads', 'monetisation'],
        sectionId: 'gigvora-ads',
      },
      {
        id: 'admin-launchpad-performance',
        name: 'Launchpad performance',
        description: 'Talent placements, interview runway, and employer demand.',
      },
    ],
  },
  {
    label: 'Quick tools',
    items: [
      {
        id: 'admin-data-exports',
        name: 'Data exports',
        description: 'Pull CSV snapshots or schedule secure S3 drops.',
        tags: ['csv', 'api'],
      },
      {
        id: 'admin-incident-response',
        name: 'Incident response',
        description: 'Runbooks for security, privacy, and marketplace outages.',
      },
      {
        id: 'admin-audit-center',
        name: 'Audit center',
        description: 'Trace admin actions, approvals, and configuration changes.',
      },
    ],
  },
  {
    label: 'Configuration stack',
    items: [
      {
        id: 'admin-settings-overview',
        name: 'All platform settings',
        description: 'Govern application defaults, commission policies, and feature gates.',
        tags: ['settings'],
        sectionId: 'admin-settings-overview',
      },
      {
        id: 'admin-affiliate-settings',
        name: 'Affiliate economics',
        description: 'Tiered commissions, payout cadences, and partner compliance.',
        tags: ['affiliate'],
        sectionId: 'admin-affiliate-settings',
      },
      {
        id: 'admin-settings-cms',
        name: 'CMS controls',
        description: 'Editorial workflow, restricted features, and monetisation toggles.',
        sectionId: 'admin-settings-cms',
      },
      {
        id: 'admin-settings-environment',
        name: 'Environment & secrets',
        description: 'Runtime environment, storage credentials, and database endpoints.',
        sectionId: 'admin-settings-environment',
        tags: ['ops'],
      },
      {
        id: 'admin-settings-api',
        name: 'API & notifications',
        description: 'REST endpoints, payment gateways, and outbound email security.',
        sectionId: 'admin-settings-api',
        tags: ['api'],
      },
      {
        id: 'admin-seo-settings',
        name: 'SEO & discovery',
        description: 'Control search metadata, structured data, verification codes, and indexation policies.',
        tags: ['seo', 'growth'],
        sectionId: 'admin-seo-settings',
        href: '/dashboard/admin/seo',
      },
    ],
  },
];

export default ADMIN_MENU_SECTIONS;
