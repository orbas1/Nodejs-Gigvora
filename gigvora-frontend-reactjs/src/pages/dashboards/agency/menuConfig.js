import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
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
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      {
        id: 'projects',
        name: 'Projects',
        icon: WrenchScrewdriverIcon,
        href: '/dashboard/agency/projects',
        sectionId: 'projects-workspace',
      },
      {
        id: 'gigs',
        name: 'Gigs',
        icon: ClipboardDocumentListIcon,
        href: '/dashboard/agency#delivery',
        sectionId: 'gig-programs',
      },
      {
        id: 'talent',
        name: 'People',
        icon: UsersIcon,
        href: '/dashboard/agency#team-focus',
        sectionId: 'team-focus',
      },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    items: [
      {
        id: 'market',
        name: 'Market',
        icon: MegaphoneIcon,
        href: '/dashboard/agency#marketplace-leadership',
        sectionId: 'marketplace-leadership',
      },
      {
        id: 'ads',
        name: 'Ads',
        icon: MegaphoneIcon,
        href: '/dashboard/agency#ads-operations',
        sectionId: 'ads-operations',
      },
      {
        id: 'playbooks',
        name: 'Playbooks',
        icon: ClipboardDocumentListIcon,
        href: '/pages?category=agency-growth',
        target: '_blank',
      },
    ],
  },
  {
    id: 'trust',
    label: 'Trust',
    items: [
      {
        id: 'governance',
        name: 'Governance',
        icon: ShieldCheckIcon,
        href: '/dashboard/agency#governance',
        sectionId: 'governance',
      },
      {
        id: 'inbox',
        name: 'Inbox',
        icon: MegaphoneIcon,
        href: '/dashboard/agency/inbox',
        sectionId: 'inbox',
      },
    ],
  },
];

export const AGENCY_AVAILABLE_DASHBOARDS = [
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'user', label: 'User', href: '/dashboard/user' },
];

export const AGENCY_DASHBOARD_ALTERNATES = [
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'user', label: 'User', href: '/dashboard/user' },
];

export const AGENCY_DASHBOARD_MENU_SECTIONS = AGENCY_MENU_SECTIONS;

export default AGENCY_MENU_SECTIONS;
