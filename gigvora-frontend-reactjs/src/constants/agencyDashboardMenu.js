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
      },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU_SECTIONS;
