export const AGENCY_DASHBOARD_MENU = [
  {
    id: 'agency-workspace',
    label: 'Workspace',
    items: [
      {
        id: 'agency-overview',
        name: 'Home',
        href: '/dashboard/agency',
      },
      {
        id: 'agency-projects',
        name: 'Projects',
        href: '/dashboard/agency/projects',
      },
    ],
  },
];

export const AGENCY_AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user'];

export default {
  AGENCY_DASHBOARD_MENU,
  AGENCY_AVAILABLE_DASHBOARDS,
};
