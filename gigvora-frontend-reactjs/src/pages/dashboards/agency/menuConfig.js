import {
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export const AGENCY_MENU_SECTIONS = [
  {
    id: 'core',
    label: 'Core',
    items: [
      {
        id: 'overview',
        name: 'Home',
        icon: HomeModernIcon,
        href: '/dashboard/agency',
        sectionId: 'overview',
      },
      {
        id: 'calendar',
        name: 'Schedule',
        icon: CalendarDaysIcon,
        href: '/dashboard/agency/calendar',
        sectionId: 'calendar',
      },
      {
        id: 'alliances',
        name: 'Pods',
        icon: UserGroupIcon,
        href: '/dashboard/agency#alliances',
        sectionId: 'alliances',
      },
      {
        id: 'networking',
        name: 'Networking',
        icon: UserGroupIcon,
        href: '/dashboard/agency/networking',
        sectionId: 'agency-networking',
      },
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'overview',
        name: 'Overview',
        description: '',
        sectionId: 'agency-overview',
        icon: RocketLaunchIcon,
      },
      {
        id: 'finance',
        name: 'Finance',
        description: '',
        sectionId: 'finance-oversight',
        icon: CurrencyDollarIcon,
      },
      {
        id: 'people',
        name: 'People',
        description: '',
        sectionId: 'resource-intelligence',
        icon: UsersIcon,
      },
      {
        id: 'networking',
        name: 'Networking',
        description: '',
        href: '/dashboard/agency/networking',
        sectionId: 'agency-networking',
        icon: UserGroupIcon,
      },
      {
        id: 'inbox',
        name: 'Inbox',
        description: '',
        href: '/dashboard/agency/inbox',
        icon: ChatBubbleLeftRightIcon,
      },
    ],
  },
  {
    id: 'ops',
    label: 'Ops',
    items: [
      {
        id: 'workrooms',
        name: 'Work',
        icon: ClipboardDocumentListIcon,
        href: '/dashboard/agency#delivery',
        sectionId: 'delivery',
      },
      {
        id: 'governance',
        name: 'Settings',
        icon: AdjustmentsHorizontalIcon,
        href: '/dashboard/agency#governance',
        sectionId: 'governance',
      },
    ],
  },
];

export const AGENCY_AVAILABLE_DASHBOARDS = [
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
  { id: 'mentor', label: 'Mentor', href: '/dashboard/mentor' },
];

export default AGENCY_MENU_SECTIONS;
        id: 'projects',
        name: 'Projects',
        description: '',
        sectionId: 'project-operations',
        icon: WrenchScrewdriverIcon,
      },
      {
        id: 'insights',
        name: 'Insights',
        description: '',
        sectionId: 'insights',
        icon: ChartBarIcon,
      },
    ],
  },
];

export const AGENCY_DASHBOARD_ALTERNATES = [
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'agency-inbox', label: 'Inbox', href: '/dashboard/agency/inbox' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'freelancer', label: 'Talent', href: '/dashboard/freelancer' },
];

export default AGENCY_DASHBOARD_MENU_SECTIONS;
export const MENU_GROUPS = [
  {
    label: 'Gigs',
    items: [
      { id: 'manage', name: 'Manage', sectionId: 'agency-gig-management' },
      { id: 'timeline', name: 'Timeline', sectionId: 'agency-gig-timeline' },
      { id: 'build', name: 'Build', sectionId: 'agency-gig-creation' },
    ],
  },
  {
    label: 'Status',
    items: [
      { id: 'open', name: 'Open', sectionId: 'agency-open-gigs' },
      { id: 'closed', name: 'Closed', sectionId: 'agency-closed-gigs' },
      { id: 'proofs', name: 'Proofs', sectionId: 'agency-gig-submissions' },
    ],
  },
  {
    label: 'Chat',
    items: [{ id: 'chat', name: 'Chat', sectionId: 'agency-gig-chat' }],
  },
];

export const AVAILABLE_DASHBOARDS = [
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'admin', label: 'Admin', href: '/dashboard/admin' },
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
];
