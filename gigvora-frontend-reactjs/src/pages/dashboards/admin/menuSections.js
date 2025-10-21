export const ADMIN_MENU_SECTIONS = [
  {
    label: 'Command modules',
    items: [
      {
        name: 'Runtime health',
        description: 'Service readiness, dependency posture, and rate-limit utilisation for the API perimeter.',
        tags: ['ops', 'security'],
        sectionId: 'admin-runtime-health',
      },
      {
        name: 'Data governance',
        description: 'PII inventory, retention policies, and audit cadence across bounded contexts.',
        tags: ['compliance', 'data'],
        sectionId: 'admin-domain-governance',
      },
      {
        name: 'Member health',
        description: 'Growth, activation, and readiness scores across the Gigvora network.',
        tags: ['growth', 'activation'],
      },
      {
        name: 'Financial governance',
        description: 'Escrow flows, fee capture, and treasury risk posture.',
        tags: ['finance'],
      },
      {
        name: 'Risk & trust',
        description: 'Dispute lifecycle, escalations, and marketplace safety monitoring.',
        tags: ['compliance'],
      },
      {
        name: 'Compliance cockpit',
        description: 'Frameworks, audits, obligations, and evidence lockers.',
        tags: ['compliance', 'governance'],
        href: '/dashboard/admin/compliance',
      },
      {
        name: 'Support operations',
        description: 'Service desk load, SLAs, and sentiment guardrails.',
      },
      {
        name: 'Community moderation',
        description: 'Flag review queue, mute enforcement, and resolution timelines.',
        tags: ['moderation', 'safety'],
        sectionId: 'admin-moderation',
      },
      {
        name: 'Engagement & comms',
        description: 'Platform analytics, event telemetry, and notification delivery.',
      },
      {
        name: 'Gigvora Ads',
        description: 'Campaign coverage, targeting telemetry, and creative governance.',
        tags: ['ads', 'monetisation'],
        sectionId: 'gigvora-ads',
      },
      {
        name: 'Launchpad performance',
        description: 'Talent placements, interview runway, and employer demand.',
      },
    ],
  },
  {
    label: 'Quick tools',
    items: [
      {
        name: 'Data exports',
        description: 'Pull CSV snapshots or schedule secure S3 drops.',
        tags: ['csv', 'api'],
      },
      {
        name: 'Incident response',
        description: 'Runbooks for security, privacy, and marketplace outages.',
      },
      {
        name: 'Audit center',
        description: 'Trace admin actions, approvals, and configuration changes.',
      },
    ],
  },
  {
    label: 'Configuration stack',
    items: [
      {
        name: 'All platform settings',
        description: 'Govern application defaults, commission policies, and feature gates.',
        tags: ['settings'],
        sectionId: 'admin-settings-overview',
      },
      {
        name: 'Affiliate economics',
        description: 'Tiered commissions, payout cadences, and partner compliance.',
        tags: ['affiliate'],
        sectionId: 'admin-affiliate-settings',
      },
      {
        name: 'CMS controls',
        description: 'Editorial workflow, restricted features, and monetisation toggles.',
        sectionId: 'admin-settings-cms',
      },
      {
        name: 'Environment & secrets',
        description: 'Runtime environment, storage credentials, and database endpoints.',
        sectionId: 'admin-settings-environment',
        tags: ['ops'],
      },
      {
        name: 'Maintenance mode',
        description: 'Global kill switch, downtime orchestration, and stakeholder comms.',
        href: '/dashboard/admin/maintenance',
        tags: ['ops'],
      },
      {
        name: 'Document library',
        description: 'Policies, evidence packs, and approval workflows.',
        href: '/dashboard/admin/documents',
        tags: ['compliance'],
      },
      {
        name: 'API & notifications',
        description: 'REST endpoints, payment gateways, and outbound email security.',
        sectionId: 'admin-settings-api',
        tags: ['api'],
      },
    ],
  },
  {
    label: 'Security operations',
    items: [
      {
        id: 'two-factor-management',
        name: '2FA management',
        description: 'Enforce MFA coverage, approve hardware keys, and govern bypass requests.',
        tags: ['security'],
        href: '/dashboard/admin/security/two-factor',
      },
    ],
  },
];

export default ADMIN_MENU_SECTIONS;
