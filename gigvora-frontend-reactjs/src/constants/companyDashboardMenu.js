export const COMPANY_DASHBOARD_MENU_SECTIONS = [
  {
    label: 'Home',
    items: [
      {
        name: 'Overview',
        sectionId: 'hiring-overview',
        name: 'Snapshot',
        sectionId: 'company-overview',
        href: '/dashboard/company',
      },
    ],
  },
  {
    label: 'Hire',
    items: [
      { name: 'Pipeline', sectionId: 'hiring-overview' },
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
    label: 'Project ops',
    items: [
      {
        name: 'Projects',
        sectionId: 'projects-open',
        href: '/dashboard/company/projects',
        tags: ['projects'],
      },
      {
        name: 'Vendors',
        sectionId: 'projects-vendors',
        href: '/dashboard/company/projects#projects-vendors',
      },
    ],
  },
  {
    label: 'Networking & community',
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
        name: 'ATS',
        sectionId: 'job-lifecycle-ats-intelligence',
        href: '/dashboard/company/ats',
      },
      { name: 'Interviews', sectionId: 'interview-excellence' },
      { name: 'Offers', sectionId: 'offer-onboarding' },
      { name: 'Care', sectionId: 'candidate-care-center' },
    ],
  },
  {
    label: 'Design',
    items: [
      { name: 'Roles', sectionId: 'job-design-studio' },
      { name: 'Sourcing', sectionId: 'multi-channel-sourcing' },
      { name: 'CRM', sectionId: 'applicant-relationship-manager' },
    ],
  },
  {
    label: 'Finance & treasury',
    items: [
      {
        name: 'Wallet management',
        description: 'Manage balances, funding sources, payouts, and access controls for every company wallet.',
        sectionId: 'wallet-management',
        href: '/dashboard/company/wallets',
        tags: ['finance'],
      },
    ],
  },
  {
    label: 'Analytics & planning',
    label: 'Network',
    items: [
      { name: 'Sessions', sectionId: 'networking-sessions', href: '/dashboard/company/networking' },
      { name: 'Attendees', sectionId: 'networking-attendee-experience', href: '/dashboard/company/networking' },
      { name: 'Controls', sectionId: 'networking-attendance-controls', href: '/dashboard/company/networking' },
    ],
  },
  {
    label: 'Intel',
    items: [
      { name: 'Reports', sectionId: 'analytics-forecasting', href: '/dashboard/company/analytics' },
      { name: 'Workforce', sectionId: 'workforce-analytics', href: '/dashboard/company/analytics#workforce' },
      { name: 'Scenarios', sectionId: 'scenario-planning', href: '/dashboard/company/analytics#scenarios' },
    ],
  },
  {
    label: 'Partners',
    items: [
      { name: 'Headhunters', sectionId: 'partnerships-headhunter-program' },
      { name: 'Pools', sectionId: 'partnerships-talent-pools' },
      { name: 'Agencies', sectionId: 'partnerships-agency-collaboration' },
      { name: 'Performance', sectionId: 'partner-performance-manager' },
    ],
  },
  {
    label: 'People',
    items: [
      {
        name: 'Project workspace',
        description: 'Coordinate budgets, tasks, meetings, files, and staffing for each project.',
        sectionId: 'project-workspace',
        href: '/dashboard/company/workspace',
      },
      {
        name: 'Calendar & communications',
        description: 'Sync recruiting calendars, digests, integrations, and cross-functional updates.',
        sectionId: 'calendar-communications',
      },
      {
        name: 'Settings & governance',
        description: 'Permissions, integrations, compliance, and approval workflows.',
        sectionId: 'settings-governance',
        href: '/dashboard/company/integrations',
      },
      {
        name: 'Permissions',
        sectionId: 'settings-governance',
      },
      {
        name: 'Compliance',
        name: 'Disputes',
        sectionId: 'dispute-management',
        href: '/dashboard/company/disputes',
        tags: ['trust'],
      },
      {
        name: 'BYOK',
        description: 'Manage OpenAI keys, reply rules, and logs.',
        sectionId: 'automation-byok-openai',
        href: '/dashboard/company/ai-auto-reply',
        tags: ['ai', 'automation'],
      },
      {
        name: 'Governance & compliance',
        description: 'Maintain GDPR/CCPA compliance, accessibility standards, and equitable hiring policies.',
        sectionId: 'governance-compliance',
      },
      { name: 'Insight', sectionId: 'employer-brand-workforce' },
      { name: 'Brand', sectionId: 'employer-brand-studio' },
      { name: 'Journeys', sectionId: 'employee-journeys' },
      { name: 'Governance', sectionId: 'settings-governance' },
    ],
  },
  {
    label: 'Communications & support',
    items: [
      {
        name: 'Inbox',
        description: 'Messaging hub for conversations, support cases, and call workflows.',
        sectionId: 'communications-inbox',
        href: '/dashboard/company/inbox',
        tags: ['messaging'],
      },
    ],
  },
];
