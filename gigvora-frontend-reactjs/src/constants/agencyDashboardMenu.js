export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
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

