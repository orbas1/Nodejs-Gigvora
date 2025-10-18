export const COMPANY_DASHBOARD_MENU_SECTIONS = [
  {
    label: 'Home',
    items: [
      {
        name: 'Overview',
        sectionId: 'hiring-overview',
        href: '/dashboard/company',
      },
      {
        name: 'Timeline',
        sectionId: 'timeline-management',
        href: '/dashboard/company/timeline',
      },
      {
        name: 'Posts',
        sectionId: 'timeline-management',
        href: '/dashboard/company/timeline#posts',
      },
      {
        name: 'Stats',
        sectionId: 'timeline-management',
        href: '/dashboard/company/timeline#analytics',
      },
    ],
  },
  {
    label: 'ATS',
    items: [
      {
        name: 'Jobs',
        sectionId: 'job-lifecycle-ats-intelligence',
        href: '/dashboard/company/ats',
      },
      {
        name: 'Interview',
        sectionId: 'interview-excellence',
      },
      {
        name: 'Offers',
        sectionId: 'offer-onboarding',
      },
    ],
  },
  {
    label: 'Network',
    items: [
      {
        name: 'Sessions',
        sectionId: 'networking-sessions',
        href: '/dashboard/company/networking',
      },
      {
        name: 'Guests',
        sectionId: 'networking-attendee-experience',
        href: '/dashboard/company/networking',
      },
      {
        name: 'Rules',
        sectionId: 'networking-attendance-controls',
        href: '/dashboard/company/networking',
      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      {
        name: 'Summary',
        sectionId: 'analytics-forecasting',
        href: '/dashboard/company/analytics',
      },
      {
        name: 'Workforce',
        sectionId: 'workforce-analytics',
        href: '/dashboard/company/analytics#workforce',
      },
      {
        name: 'Scenarios',
        sectionId: 'scenario-planning',
        href: '/dashboard/company/analytics#scenarios',
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        name: 'Integrations',
        sectionId: 'settings-governance',
        href: '/dashboard/company/integrations',
      },
      {
        name: 'Permissions',
        sectionId: 'settings-governance',
      },
      {
        name: 'Compliance',
        sectionId: 'governance-compliance',
      },
    ],
  },
];
