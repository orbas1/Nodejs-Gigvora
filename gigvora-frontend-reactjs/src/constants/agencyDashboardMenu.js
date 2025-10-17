import { BanknotesIcon, BriefcaseIcon, CurrencyDollarIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

export const AGENCY_DASHBOARD_MENU = [
  {
    id: 'agency-core',
    label: 'Core',
    items: [
      {
        id: 'agency-overview',
        sectionId: 'agency-overview',
        name: 'Home',
        icon: BriefcaseIcon,
      },
      {
        id: 'agency-escrow',
        name: 'Escrow',
        href: '/dashboard/agency/escrow',
        icon: CurrencyDollarIcon,
      },
      {
        id: 'agency-projects',
        sectionId: 'agency-projects',
        name: 'Projects',
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    id: 'agency-ops',
    label: 'Ops',
    items: [
      {
        id: 'agency-compliance',
        sectionId: 'agency-compliance',
        name: 'Risk',
        icon: ShieldCheckIcon,
      },
      {
        id: 'agency-automation',
        sectionId: 'agency-automation',
        name: 'Flows',
        icon: SparklesIcon,
      },
    ],
  },
];

export const AGENCY_ESCROW_MENU = [
  {
    id: 'escrow-ops',
    label: 'Escrow',
    items: [
      {
        id: 'escrow-summary',
        sectionId: 'escrow-overview',
        name: 'Home',
        icon: CurrencyDollarIcon,
      },
      {
        id: 'escrow-accounts',
        sectionId: 'escrow-accounts',
        name: 'Accounts',
        icon: BanknotesIcon,
      },
      {
        id: 'escrow-transactions',
        sectionId: 'escrow-transactions',
        name: 'Moves',
        icon: CurrencyDollarIcon,
      },
      {
        id: 'escrow-controls',
        sectionId: 'escrow-controls',
        name: 'Rules',
        icon: ShieldCheckIcon,
      },
      {
        id: 'escrow-audit',
        sectionId: 'escrow-audit',
        name: 'Audit',
        icon: SparklesIcon,
      },
    ],
  },
];

export default {
  AGENCY_DASHBOARD_MENU,
  AGENCY_ESCROW_MENU,
};
