export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    label: 'Main',
    items: [
      { id: 'agency-overview', name: 'Home', sectionId: 'agency-overview' },
      { id: 'creation-studio', name: 'Create', sectionId: 'creation-studio' },
      { id: 'team-focus', name: 'Teams', sectionId: 'team-focus' },
      { id: 'bench-signals', name: 'Bench', sectionId: 'bench-signals' },
      { id: 'finance-snapshot', name: 'Money', sectionId: 'finance-snapshot' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { id: 'marketplace-leadership', name: 'Market', sectionId: 'marketplace-leadership' },
      { id: 'ads-operations', name: 'Ads', sectionId: 'ads-operations' },
      { id: 'networking', name: 'Meets', href: '/dashboard/company/networking' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { id: 'projects-workspace', name: 'Projects', sectionId: 'projects-workspace' },
      { id: 'gig-programs', name: 'Gigs', sectionId: 'gig-programs' },
      { id: 'payments-distribution', name: 'Payouts', sectionId: 'payments-distribution' },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU_SECTIONS;
