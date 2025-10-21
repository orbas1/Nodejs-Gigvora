import { createMenuRegistry } from './menuSchema.js';

const sections = [
  {
    label: 'Core',
    items: [
      { name: 'Home', href: '/dashboard/admin' },
      { name: 'Teams', sectionId: 'admin-teams' },
      { name: 'Billing', sectionId: 'admin-billing' },
      { name: 'Inbox', sectionId: 'admin-inbox' },
    ],
  },
  {
    label: 'Trust',
    items: [
      {
        id: 'admin-identity-verification',
        name: 'Identity',
        href: '/dashboard/admin/identity-verification',
      },
      { name: 'Risk', sectionId: 'admin-risk' },
      { name: 'Fraud', sectionId: 'admin-fraud' },
    ],
  },
  {
    label: 'Data',
    items: [
      { name: 'Exports', sectionId: 'admin-exports' },
      { name: 'Logs', sectionId: 'admin-logs' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'General', sectionId: 'admin-settings-general' },
      { name: 'Payments', sectionId: 'admin-settings-payments' },
      { name: 'API', sectionId: 'admin-settings-api' },
    ],
  },
  {
    label: 'Command modules',
    items: [
      {
        id: 'admin-runtime-health',
        name: 'Runtime health',
        description: 'Service readiness and dependency posture across the API perimeter.',
        tags: ['ops', 'security'],
        sectionId: 'admin-runtime-health',
      },
      {
        id: 'admin-domain-governance',
        name: 'Data governance',
        description: 'PII inventory, retention policies, and audit cadence.',
        tags: ['compliance', 'data'],
        sectionId: 'admin-domain-governance',
      },
      {
        name: 'Member health',
        description: 'Growth, activation, and readiness scores for the network.',
        tags: ['growth', 'activation'],
        sectionId: 'admin-member-health',
      },
      {
        name: 'Financial governance',
        description: 'Escrow flows, fee capture, and treasury risk posture.',
        tags: ['finance'],
        sectionId: 'admin-finance-governance',
      },
      {
        name: 'Risk & trust',
        description: 'Dispute lifecycle, escalations, and marketplace safety.',
        tags: ['compliance'],
        sectionId: 'admin-risk-trust',
      },
      {
        name: 'Support operations',
        description: 'Service desk load, SLAs, and sentiment guardrails.',
        sectionId: 'admin-support-operations',
      },
      {
        name: 'Engagement & comms',
        description: 'Platform analytics, event telemetry, and notification delivery.',
        sectionId: 'admin-engagement',
      },
      {
        id: 'gigvora-ads',
        name: 'Gigvora Ads',
        description: 'Campaign coverage, targeting telemetry, and creative governance.',
        tags: ['ads', 'monetisation'],
        sectionId: 'gigvora-ads',
      },
      {
        name: 'Launchpad performance',
        description: 'Talent placements, interview runway, and employer demand.',
        sectionId: 'admin-launchpad',
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
        sectionId: 'admin-data-exports',
      },
      {
        name: 'Incident response',
        description: 'Runbooks for security, privacy, and marketplace outages.',
        sectionId: 'admin-incident-response',
      },
      {
        name: 'Audit center',
        description: 'Trace admin actions, approvals, and configuration changes.',
        sectionId: 'admin-audit-center',
      },
    ],
  },
  {
    label: 'Configuration stack',
    items: [
      {
        id: 'admin-settings-overview',
        name: 'All platform settings',
        description: 'Application defaults, commission policies, and feature gates.',
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
        description: 'Runtime environment, storage credentials, and API endpoints.',
        sectionId: 'admin-settings-environment',
      },
      {
        id: 'admin-settings-api',
        name: 'API & notifications',
        description: 'REST endpoints, payment gateways, and outbound email security.',
        tags: ['api'],
        sectionId: 'admin-settings-api',
      },
      {
        id: 'admin-database-settings',
        name: 'Database settings',
        description: 'Connection profiles, replicas, and credential rotation.',
        tags: ['ops'],
        sectionId: 'admin-database-settings',
        href: '/dashboard/admin/database',
      },
    ],
  },
];

export const ADMIN_DASHBOARD_MENU_SECTIONS = createMenuRegistry(sections, { moduleName: 'adminDashboardMenu' });

export default ADMIN_DASHBOARD_MENU_SECTIONS;
