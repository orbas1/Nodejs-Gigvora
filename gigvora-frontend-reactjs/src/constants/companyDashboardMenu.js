export const COMPANY_DASHBOARD_MENU_SECTIONS = [
  {
    label: 'Profile',
    items: [
      {
        name: 'Profile',
        description: 'Manage brand, fans, and partners.',
        sectionId: 'profile-workspace',
        href: '/dashboard/company/profile',
        tags: ['profile'],
    label: 'Studio',
    items: [
      {
        name: 'Studio',
        description: 'Create assets.',
        sectionId: 'creation-studio',
        href: '/dashboard/company/creation-studio',
        tags: ['studio'],
      },
    ],
  },
  {
    label: 'Talent acquisition',
    label: 'Home',
    items: [
      {
        name: 'Overview',
        description: 'Pipeline, conversion, and alerts.',
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
        name: 'Lifecycle',
        description: 'Plan requisitions and ATS automations.',
        tags: ['ATS'],
        name: 'Jobs',
        sectionId: 'job-lifecycle-ats-intelligence',
        href: '/dashboard/company/ats',
      },
      {
        name: 'Jobs',
        description: 'Openings, pipeline, and actions.',
        sectionId: 'job-operations-command-center',
        tags: ['ATS', 'Operations'],
        href: '/dashboard/company/job-management',
      },
      {
        name: 'Interviews',
        description: 'Panels, scorecards, and feedback.',
        name: 'Interview',
        sectionId: 'interview-excellence',
      },
      {
        name: 'Offers',
        description: 'Approvals and onboarding tasks.',
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
        name: 'Care',
        description: 'Candidate comms and experience.',
        sectionId: 'candidate-care-center',
        name: 'Vendors',
        sectionId: 'projects-vendors',
        href: '/dashboard/company/projects#projects-vendors',
      },
    ],
  },
  {
    label: 'Networking',
    items: [
      {
        name: 'Plan',
        sectionId: 'network-plan',
        href: '/dashboard/company/networking/sessions#plan',
      },
      {
        name: 'Spend',
        sectionId: 'network-spend',
        href: '/dashboard/company/networking/sessions#spend',
      },
      {
        name: 'Follow',
        sectionId: 'network-follow',
        href: '/dashboard/company/networking/sessions#follow',
      },
      {
        name: 'Hub',
        sectionId: 'network-hub',
    label: 'Networking & community',
    label: 'Network',
    items: [
      {
        name: 'Groups',
        description: 'Organise workspace circles and approvals.',
        sectionId: 'company-group-management',
        href: '/dashboard/company/groups',
      },
      {
        name: 'Networking sessions',
        description: 'Launch and monitor speed networking programs with configurable rotations and join limits.',
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
        name: 'Volunteer',
        description: 'Publish volunteer opportunities, manage applicants, and track contracts & stipend spend.',
        sectionId: 'volunteering-management',
        href: '/dashboard/company/volunteering',
        tags: ['community'],
      },
      {
        name: 'Employer brand & workforce intelligence',
        description: 'Promote your culture, understand workforce trends, and connect hiring with employee experience data.',
        sectionId: 'employer-brand-workforce',
      },
      {
        name: 'Employer brand studio',
        description: 'Company profile, culture stories, benefits, and employer marketing assets.',
        sectionId: 'employer-brand-studio',
      },
      {
        name: 'Employee journeys',
        description: 'Onboarding, internal mobility, and performance snapshots for HR teams.',
        sectionId: 'employee-journeys',
      },
      {
        name: 'Settings & governance',
        description: 'Calendar sync, permissions, integrations, compliance, and approvals.',
        sectionId: 'settings-governance',
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
        name: 'Calendar',
        description: '',
        sectionId: 'calendar-communications',
        href: '/dashboard/company/calendar',
      },
      {
        name: 'Settings & governance',
        description: 'Permissions, integrations, compliance, and approval workflows.',
        sectionId: 'settings-governance',
        href: '/dashboard/company/integrations',
      },
      {
        name: 'ID',
        sectionId: 'company-id-verification',
        href: '/dashboard/company/id-verification',
        tags: ['compliance'],
      },
      {
        name: 'Integration command center',
        description: 'Dedicated console for Salesforce, monday.com, Slack, HubSpot, Google Drive, and BYOK AI connectors.',
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
        name: 'CRM',
        description: 'Connector controls.',
        sectionId: 'settings-governance',
        href: '/dashboard/company/integrations/crm',
        tags: ['integrations'],
      },
      {
        name: 'Governance & compliance',
        description: 'Maintain GDPR/CCPA compliance, accessibility standards, and equitable hiring policies.',
        sectionId: 'governance-compliance',
      },
      { name: 'Insight', sectionId: 'employer-brand-workforce' },
      { name: 'Brand', sectionId: 'employer-brand-studio' },
      { name: 'Pages studio', sectionId: 'pages-studio', href: '/dashboard/company/pages' },
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
  {
    label: 'Finance',
    items: [
      {
        name: 'Escrow',
        sectionId: 'escrow-management',
        href: '/dashboard/company/escrow',
      },
    ],
  },
];
