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
