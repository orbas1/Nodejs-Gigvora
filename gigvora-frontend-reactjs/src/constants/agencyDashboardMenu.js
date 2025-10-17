export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'agency-operations',
    label: 'Operations',
    items: [
      {
        id: 'overview',
        name: 'Overview',
        description: 'Pipeline signals, finance health, and delivery posture.',
        href: '/dashboard/agency',
      },
      {
        id: 'project-workspace',
        name: 'Workspace',
        description: 'Budgeting, delivery, and collaboration inside client projects.',
        href: '/dashboard/agency/workspace',
      },
    ],
  },
  {
    id: 'agency-collaboration',
    label: 'Collab',
    items: [
      {
        id: 'agency-inbox',
        name: 'Inbox',
        description: 'Share updates with finance, compliance, or delivery pods.',
        href: '/inbox',
      },
      {
        id: 'agency-finance',
        name: 'Finance',
        description: 'Invoices, payouts, and sponsorship health.',
        href: '/finance',
      },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU_SECTIONS;
