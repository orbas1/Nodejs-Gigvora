export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    label: 'Agency',
    items: [
      {
    id: 'ops',
    label: 'Ops',
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
    id: 'agency-section',
    label: 'Agency',
    items: [
      { id: 'agency-home', name: 'Home', sectionId: 'agency-overview' },
      { id: 'volunteer-home', name: 'Volunteer', sectionId: 'volunteering-home' },
    ],
  },
  {
    id: 'volunteer-section',
    label: 'Volunteer',
    items: [
      { id: 'volunteer-deals', name: 'Deals', sectionId: 'volunteering-home' },
      { id: 'volunteer-apply', name: 'Apply', sectionId: 'volunteering-home' },
      { id: 'volunteer-replies', name: 'Replies', sectionId: 'volunteering-home' },
      { id: 'volunteer-spend', name: 'Spend', sectionId: 'volunteering-home' },
export const AGENCY_DASHBOARD_MENU = [
  {
    id: 'agency-workspace',
    label: 'Workspace',
    items: [
      {
        id: 'agency-overview',
        name: 'Home',
        sectionId: 'agency-overview',
      },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU_SECTIONS;
  {
    id: 'risk',
    label: 'Risk',
    items: [
      {
        id: 'agency-id-verification',
        name: 'IDs',
        sectionId: 'agency-id-verification',
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
export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'agency-operations',
    label: 'Operations',
    items: [
      {
        id: 'overview',
        name: 'Overview',
        description: 'Pipeline signals, finance health, and delivery posture.',
        href: '/dashboard/agency',
      },
      {
        id: 'project-workspace',
        name: 'Workspace',
        description: 'Budgeting, delivery, and collaboration inside client projects.',
        href: '/dashboard/agency/workspace',
      },
    ],
  },
  {
    id: 'agency-collaboration',
    label: 'Collab',
    items: [
      {
        id: 'agency-inbox',
        name: 'Inbox',
        description: 'Share updates with finance, compliance, or delivery pods.',
        href: '/inbox',
      },
      {
        id: 'agency-finance',
        name: 'Finance',
        description: 'Invoices, payouts, and sponsorship health.',
        href: '/finance',
import {
  ChartBarIcon,
  UsersIcon,
  PencilSquareIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'agency-overview',
        name: 'Overview',
        sectionId: 'agency-overview',
        icon: ChartBarIcon,
      },
      {
        id: 'team-focus',
        name: 'Teams',
        sectionId: 'team-focus',
        icon: UsersIcon,
      },
      {
        id: 'blog-management',
        name: 'Blog',
        href: '/dashboard/agency/blog',
        icon: PencilSquareIcon,
      },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    items: [
      {
        id: 'campaigns-library',
        name: 'Playbooks',
        href: '/pages?category=agency-growth',
        icon: MegaphoneIcon,
        target: '_blank',
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
import {
  BanknotesIcon,
  Cog6ToothIcon,
  HomeIcon,
  RectangleStackIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export const AGENCY_DASHBOARD_MENU = [
  {
    label: 'Main',
    items: [
      {
        id: 'agency-home',
        name: 'Home',
        href: '/dashboard/agency',
        icon: HomeIcon,
      },
      {
        id: 'wallet',
        name: 'Wallet',
        href: '/dashboard/agency/wallet',
        icon: BanknotesIcon,
      },
    ],
  },
  {
    label: 'Wallet',
    items: [
      {
        id: 'wallet-summary',
        name: 'Summary',
        sectionId: 'wallet-summary',
        icon: RectangleStackIcon,
      },
      {
        id: 'wallet-accounts',
        name: 'Accounts',
        sectionId: 'wallet-accounts',
        icon: RectangleStackIcon,
      },
      {
        id: 'wallet-funds',
        name: 'Funds',
        sectionId: 'wallet-funding-sources',
        icon: ArrowPathIcon,
      },
      {
        id: 'wallet-payouts',
        name: 'Payouts',
        sectionId: 'wallet-payouts',
        icon: BanknotesIcon,
      },
      {
        id: 'wallet-settings',
        name: 'Settings',
        sectionId: 'wallet-controls',
        icon: Cog6ToothIcon,
      },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU;
import { BanknotesIcon, BriefcaseIcon, CurrencyDollarIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

export const AGENCY_DASHBOARD_MENU = [
  {
    id: 'agency-core',
    label: 'Core',
    items: [
      {
        id: 'agency-overview',
        sectionId: 'agency-overview',
        name: 'Home',
        icon: BriefcaseIcon,
      },
      {
        id: 'agency-escrow',
        name: 'Escrow',
        href: '/dashboard/agency/escrow',
        icon: CurrencyDollarIcon,
      },
      {
        id: 'agency-projects',
        sectionId: 'agency-projects',
        name: 'Projects',
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    id: 'agency-ops',
    label: 'Ops',
    items: [
      {
        id: 'agency-compliance',
        sectionId: 'agency-compliance',
        name: 'Risk',
        icon: ShieldCheckIcon,
      },
      {
        id: 'agency-automation',
        sectionId: 'agency-automation',
        name: 'Flows',
        icon: SparklesIcon,
      },
    ],
  },
];

export const AGENCY_ESCROW_MENU = [
  {
    id: 'escrow-ops',
    label: 'Escrow',
    items: [
      {
        id: 'escrow-summary',
        sectionId: 'escrow-overview',
        name: 'Home',
        icon: CurrencyDollarIcon,
      },
      {
        id: 'escrow-accounts',
        sectionId: 'escrow-accounts',
        name: 'Accounts',
        icon: BanknotesIcon,
      },
      {
        id: 'escrow-transactions',
        sectionId: 'escrow-transactions',
        name: 'Moves',
        icon: CurrencyDollarIcon,
      },
      {
        id: 'escrow-controls',
        sectionId: 'escrow-controls',
        name: 'Rules',
        icon: ShieldCheckIcon,
      },
      {
        id: 'escrow-audit',
        sectionId: 'escrow-audit',
        name: 'Audit',
        icon: SparklesIcon,
      },
    ],
  },
];

export default {
  AGENCY_DASHBOARD_MENU,
  AGENCY_ESCROW_MENU,
};
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  QueueListIcon,
  RocketLaunchIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export const AGENCY_DASHBOARD_MENU_BASE = [
  {
    label: 'Agency',
    items: [
      {
        name: 'Home',
        description: '',
        href: '/dashboard/agency',
        id: 'agency-home',
        icon: UsersIcon,
      },
      {
        name: 'Pipeline',
        description: '',
        href: '/dashboard/agency/crm',
        id: 'agency-pipeline',
        icon: ChartBarIcon,
      },
    ],
  },
];

export const AGENCY_OVERVIEW_MENU_SECTIONS = [
  ...AGENCY_DASHBOARD_MENU_BASE,
  {
    label: 'Overview',
    items: [
      {
        name: 'Focus',
        description: '',
        sectionId: 'overview-team-focus',
        icon: ClipboardDocumentCheckIcon,
      },
      {
        name: 'Bench',
        description: '',
        sectionId: 'overview-bench-signals',
        icon: QueueListIcon,
      },
      {
        name: 'Money',
        description: '',
        sectionId: 'overview-finance',
        icon: RocketLaunchIcon,
      },
    ],
  },
];

export const AGENCY_CRM_MENU_SECTIONS = [
  ...AGENCY_DASHBOARD_MENU_BASE,
  {
    label: 'Pipeline',
    items: [
      {
        name: 'Deals',
        description: '',
        sectionId: 'crm-deals',
        icon: QueueListIcon,
      },
      {
        name: 'Stats',
        description: '',
        sectionId: 'crm-stats',
        icon: ChartBarIcon,
      },
      {
        name: 'Tasks',
        description: '',
        sectionId: 'crm-tasks',
        icon: ClipboardDocumentCheckIcon,
      },
      {
        name: 'Docs',
        description: '',
        sectionId: 'crm-docs',
        icon: UsersIcon,
      },
      {
        name: 'Campaigns',
        description: '',
        sectionId: 'crm-campaigns',
        icon: RocketLaunchIcon,
      },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU_BASE;
export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'workforce',
    label: 'Workforce',
    items: [
      { id: 'home', name: 'Home', sectionId: 'workforce-overview' },
      { id: 'team', name: 'Team', sectionId: 'team' },
      { id: 'pay', name: 'Pay', sectionId: 'pay' },
      { id: 'projects', name: 'Projects', sectionId: 'projects' },
      { id: 'gigs', name: 'Gigs', sectionId: 'gigs' },
      { id: 'capacity', name: 'Capacity', sectionId: 'capacity' },
      { id: 'availability', name: 'Availability', sectionId: 'availability' },
    id: 'agency-ops',
    label: 'Ops',
    items: [
      {
        id: 'agency-overview',
        name: 'Home',
        description: '',
        href: '/dashboard/agency',
      },
    ],
  },
  {
    id: 'agency-profile',
    label: 'Profile',
    items: [
      {
        id: 'agency-profile-management',
        name: 'Edit',
        description: '',
        href: '/dashboard/agency/profile',
import {
  Squares2X2Icon,
  RectangleStackIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'ops',
    label: 'Ops',
    items: [
      {
        id: 'agency-control-tower',
        name: 'Control',
        href: '/dashboard/agency',
        icon: Squares2X2Icon,
      },
      {
        id: 'agency-client-kanban',
        name: 'Kanban',
        href: '/dashboard/agency/client-kanban',
        icon: RectangleStackIcon,
      },
    ],
  },
  {
    id: 'intel',
    label: 'Intel',
    items: [
      {
        id: 'agency-revenue-analytics',
        name: 'Revenue',
        href: '/dashboard/agency',
        icon: ChartBarIcon,
      },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU_SECTIONS;

