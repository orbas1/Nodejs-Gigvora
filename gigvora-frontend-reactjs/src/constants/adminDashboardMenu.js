export const ADMIN_DASHBOARD_MENU_SECTIONS = [
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
];

export default ADMIN_DASHBOARD_MENU_SECTIONS;
