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

