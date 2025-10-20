export const COMPANY_DASHBOARD_MENU_SECTIONS = [
  {
    label: 'Home',
    items: [
      {
        name: 'Snapshot',
        sectionId: 'company-overview',
        href: '/dashboard/company',
      },
      {
        name: 'Profile',
        description: 'Manage brand, fans, and partners.',
        sectionId: 'profile-workspace',
        href: '/dashboard/company/profile',
        tags: ['profile'],
      },
      {
        name: 'Studio',
        description: 'Create employer brand assets with creation studio.',
        sectionId: 'creation-studio',
        href: '/dashboard/company/creation-studio',
        tags: ['studio'],
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
        sectionId: 'timeline-posts',
        href: '/dashboard/company/timeline#posts',
      },
      {
        name: 'Stats',
        sectionId: 'timeline-analytics',
        href: '/dashboard/company/timeline#analytics',
      },
    ],
  },
  {
    label: 'ATS',
    items: [
      {
        name: 'Lifecycle',
        description: 'Plan requisitions and ATS automations.',
        sectionId: 'job-lifecycle-ats-intelligence',
        href: '/dashboard/company/ats',
      },
      {
        name: 'Jobs',
        description: 'Openings, pipeline, and actions.',
        sectionId: 'job-operations-command-center',
        href: '/dashboard/company/job-management',
      },
      {
        name: 'Interviews',
        description: 'Panels, scorecards, and feedback.',
        sectionId: 'interview-excellence',
        href: '/dashboard/company/interviews',
      },
      {
        name: 'Offers',
        description: 'Approvals and onboarding tasks.',
        sectionId: 'offer-onboarding',
        href: '/dashboard/company/offers',
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
      {
        name: 'Care',
        description: 'Candidate comms and experience.',
        sectionId: 'candidate-care-center',
      },
    ],
  },
  {
    label: 'Networking & community',
    items: [
      {
        name: 'Groups',
        description: 'Organise workspace circles and approvals.',
        sectionId: 'company-group-management',
        href: '/dashboard/company/groups',
      },
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
        description: 'Company health, workforce analytics, and engagement insights.',
        sectionId: 'analytics-summary',
      },
      {
        name: 'Team signals',
        sectionId: 'analytics-team-signals',
      },
      {
        name: 'Finance',
        sectionId: 'analytics-finance',
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        name: 'Escrow',
        sectionId: 'escrow-management',
        href: '/dashboard/company/escrow',
      },
      {
        name: 'Wallet',
        sectionId: 'finance-wallet',
        href: '/dashboard/company/finance',
      },
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
  {
    label: 'Settings',
    items: [
      { name: 'Governance', sectionId: 'settings-governance' },
      { name: 'Journeys', sectionId: 'employee-journeys' },
      { name: 'Brand studio', sectionId: 'employer-brand-studio' },
    ],
  },
];

export default COMPANY_DASHBOARD_MENU_SECTIONS;
