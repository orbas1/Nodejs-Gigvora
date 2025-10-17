import {
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
