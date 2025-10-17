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
