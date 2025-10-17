import { BanknotesIcon, BoltIcon, CalendarDaysIcon, HomeIcon, LifebuoyIcon } from '@heroicons/react/24/outline';

export const MENU_GROUPS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'home', name: 'Home', href: '/dashboard/freelancer', icon: HomeIcon },
      { id: 'auto', name: 'Auto', href: '/dashboard/freelancer/automatch', icon: BoltIcon },
      { id: 'pipeline', name: 'Pipeline', href: '/dashboard/freelancer/pipeline', icon: CalendarDaysIcon },
      { id: 'finance', name: 'Finance', href: '/finance', icon: BanknotesIcon },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [{ id: 'help', name: 'Help', href: '/inbox', icon: LifebuoyIcon }],
  },
];

export const AVAILABLE_DASHBOARDS = [
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'user', label: 'User', href: '/dashboard/user' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
];
