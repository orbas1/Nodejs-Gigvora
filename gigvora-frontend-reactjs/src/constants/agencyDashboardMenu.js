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
