export const ADMIN_TIMELINE_MENU_ITEM_ID = 'admin-timelines';

export const ADMIN_MENU_SECTIONS = [
  {
    label: 'Core',
    items: [
      {
        name: 'Health',
        sectionId: 'admin-runtime-health',
      },
      {
        name: 'Data',
        sectionId: 'admin-domain-governance',
      },
      {
        name: 'Members',
        sectionId: 'admin-member-health',
      },
      {
        name: 'Finance',
        sectionId: 'admin-finance',
      },
      {
        name: 'Risk',
        sectionId: 'admin-risk',
      },
      {
        name: 'Support',
        sectionId: 'admin-support',
      },
      {
        name: 'Engage',
        sectionId: 'admin-engage',
      },
      {
        name: 'Ads',
        sectionId: 'gigvora-ads',
      },
      {
        name: 'Launch',
        sectionId: 'admin-launchpad',
      },
      {
        id: ADMIN_TIMELINE_MENU_ITEM_ID,
        name: 'Timelines',
        href: '/dashboard/admin/timelines',
        sectionId: ADMIN_TIMELINE_MENU_ITEM_ID,
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      {
        name: 'Exports',
        sectionId: 'admin-exports',
      },
      {
        name: 'Incidents',
        sectionId: 'admin-incidents',
      },
      {
        name: 'Audit',
        sectionId: 'admin-audit',
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        name: 'Settings',
        sectionId: 'admin-settings-overview',
      },
      {
        name: 'Affiliates',
        sectionId: 'admin-affiliate-settings',
      },
      {
        name: 'CMS',
        sectionId: 'admin-settings-cms',
      },
      {
        name: 'Env',
        sectionId: 'admin-settings-environment',
      },
      {
        name: 'APIs',
        sectionId: 'admin-settings-api',
      },
    ],
  },
];

export default ADMIN_MENU_SECTIONS;
