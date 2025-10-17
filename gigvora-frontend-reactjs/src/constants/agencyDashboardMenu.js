export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    label: 'Ops',
    items: [
      {
        name: 'Home',
        sectionId: 'agency-home',
        href: '/dashboard/agency',
      },
      {
        name: 'Timeline',
        sectionId: 'timeline',
        href: '/dashboard/agency/timeline',
      },
    ],
  },
  {
    label: 'Work',
    items: [
      {
        name: 'Clients',
        sectionId: 'clients',
      },
      {
        name: 'Delivery',
        sectionId: 'delivery',
      },
      {
        name: 'Finance',
        sectionId: 'finance',
      },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU_SECTIONS;
