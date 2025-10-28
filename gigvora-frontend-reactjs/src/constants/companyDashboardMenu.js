import { createMenuRegistry } from './menuSchema.js';

const companyDashboardMenuSections = [
  {
    label: 'Home',
    items: [
      {
        name: 'Snapshot',
        sectionId: 'company-overview',
        href: '/dashboard/company',
      },
      {
        name: 'Hub',
        description: 'Followers, partners, and workspace relationships.',
        sectionId: 'company-hub',
        href: '/dashboard/company/hub',
        tags: ['community'],
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
        name: 'Job hub',
        sectionId: 'job-hub-workspace',
        href: '/dashboard/company/job-management#job-hub-workspace',
      },
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
        name: 'Launchpad jobs',
        description: 'Pair Experience Launchpad cohorts with priority requisitions.',
        sectionId: 'experience-launchpad-jobs',
        href: '/dashboard/company/launchpad-jobs',
        tags: ['launchpad'],
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
        name: 'Orders',
        sectionId: 'orders-control-center',
        href: '/dashboard/company/orders',
        tags: ['operations'],
      },
      {
        name: 'Gigvora Ads',
        description: 'Manage Gigvora Ads campaigns, creatives, and placements.',
        sectionId: 'gigvora-ads',
        href: '/dashboard/company/ads',
        tags: ['marketing'],
      },
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
        href: '/dashboard/company/analytics',
      },
      {
        name: 'Metrics',
        description: 'Operational KPIs, conversion rates, and alerts.',
        sectionId: 'company-metrics',
        href: '/dashboard/company/metrics',
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
      {
        name: 'Workspace settings',
        description: 'Governance, journeys, and collaboration defaults.',
        sectionId: 'company-settings',
        href: '/dashboard/company/settings',
      },
      {
        name: 'System preferences',
        description: 'Automation, webhooks, and API controls.',
        sectionId: 'company-system-preferences',
        href: '/dashboard/company/system-preferences',
      },
      {
        name: 'ID verification',
        description: 'Identity reviews and compliance checks.',
        sectionId: 'company-id-verification',
        href: '/dashboard/company/id-verification',
      },
    ],
  },
];

export const COMPANY_DASHBOARD_MENU_SECTIONS = createMenuRegistry(companyDashboardMenuSections, {
  moduleName: 'companyDashboardMenu',
});

export default COMPANY_DASHBOARD_MENU_SECTIONS;
