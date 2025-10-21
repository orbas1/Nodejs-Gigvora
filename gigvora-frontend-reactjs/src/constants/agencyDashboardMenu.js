import {
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  HomeIcon,
  HomeModernIcon,
  MegaphoneIcon,
  RectangleStackIcon,
  IdentificationIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'agency-main',
    label: 'Main',
    items: [
      {
        id: 'agency-overview',
        name: 'Overview',
        sectionId: 'agency-overview',
        icon: HomeModernIcon,
        href: '/dashboard/agency',
      },
      {
        id: 'creation-studio',
        name: 'Create',
        sectionId: 'creation-studio',
        icon: SparklesIcon,
        href: '/dashboard/agency#creation-studio',
      },
      {
        id: 'team-focus',
        name: 'Teams',
        sectionId: 'team-focus',
        icon: UsersIcon,
        href: '/dashboard/agency#team-focus',
      },
      {
        id: 'bench-signals',
        name: 'Bench',
        sectionId: 'bench-signals',
        icon: ClipboardDocumentListIcon,
        href: '/dashboard/agency#bench-signals',
      },
      {
        id: 'finance-snapshot',
        name: 'Money',
        sectionId: 'finance-snapshot',
        icon: BanknotesIcon,
        href: '/dashboard/agency#finance-snapshot',
      },
    ],
  },
  {
    id: 'agency-growth',
    label: 'Growth',
    items: [
      {
        id: 'marketplace-leadership',
        name: 'Market',
        sectionId: 'marketplace-leadership',
        icon: MegaphoneIcon,
        href: '/dashboard/agency#marketplace-leadership',
      },
      {
        id: 'ads-operations',
        name: 'Ads',
        sectionId: 'ads-operations',
        icon: MegaphoneIcon,
        href: '/dashboard/agency#ads-operations',
      },
      {
        id: 'networking',
        name: 'Networking',
        sectionId: 'agency-networking',
        icon: UserGroupIcon,
        href: '/dashboard/agency/networking',
      },
    ],
  },
  {
    id: 'agency-delivery',
    label: 'Delivery',
    items: [
      {
        id: 'projects-workspace',
        name: 'Projects',
        sectionId: 'projects-workspace',
        icon: WrenchScrewdriverIcon,
        href: '/dashboard/agency/projects',
      },
      {
        id: 'agency-workspace',
        name: 'Workspace',
        sectionId: 'agency-workspace',
        icon: RectangleStackIcon,
        href: '/dashboard/agency/workspace',
      },
      {
        id: 'agency-interviews',
        name: 'Interviews',
        sectionId: 'interviews',
        icon: CalendarDaysIcon,
        href: '/dashboard/agency/interviews',
      },
      {
        id: 'gig-programs',
        name: 'Gigs',
        sectionId: 'gig-programs',
        icon: ClipboardDocumentListIcon,
        href: '/dashboard/agency#delivery',
      },
      {
        id: 'payments-distribution',
        name: 'Payouts',
        sectionId: 'payments-distribution',
        icon: CurrencyDollarIcon,
        href: '/dashboard/agency#finance-snapshot',
      },
    ],
  },
  {
    id: 'agency-operations',
    label: 'Operations',
    items: [
      {
        id: 'inbox',
        name: 'Inbox',
        sectionId: 'inbox',
        icon: ChatBubbleLeftRightIcon,
        href: '/dashboard/agency/inbox',
      },
      {
        id: 'support',
        name: 'Support',
        sectionId: 'support-desk',
        icon: LifebuoyIcon,
        href: '/dashboard/agency/support',
      },
      {
        id: 'id-verification',
        name: 'ID checks',
        sectionId: 'agency-id-verification',
        icon: IdentificationIcon,
        href: '/dashboard/agency/id-verification',
      },
      {
        id: 'governance',
        name: 'Governance',
        sectionId: 'governance',
        icon: ShieldCheckIcon,
        href: '/dashboard/agency#governance',
      },
      {
        id: 'volunteer',
        name: 'Volunteer',
        sectionId: 'volunteering-home',
        icon: UserGroupIcon,
        href: '/dashboard/agency#volunteering-home',
      },
    ],
  },
];

export const AGENCY_DASHBOARD_MENU = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'agency-home', name: 'Home', sectionId: 'agency-overview', href: '/dashboard/agency', icon: HomeIcon },
      {
        id: 'agency-events',
        name: 'Events',
        sectionId: 'agency-event-management',
        href: '/dashboard/agency/events',
        icon: ClipboardDocumentListIcon,
      },
      { id: 'agency-calendar', name: 'Schedule', sectionId: 'calendar', href: '/dashboard/agency/calendar', icon: CalendarDaysIcon },
      { id: 'agency-interviews', name: 'Interviews', sectionId: 'interviews', href: '/dashboard/agency/interviews', icon: CalendarDaysIcon },
      { id: 'agency-workspace', name: 'Workspace', sectionId: 'agency-workspace', href: '/dashboard/agency/workspace', icon: RectangleStackIcon },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'agency-projects', name: 'Projects', href: '/dashboard/agency/projects', icon: WrenchScrewdriverIcon },
      { id: 'agency-support', name: 'Support', href: '/dashboard/agency/support', icon: LifebuoyIcon },
      { id: 'agency-id-verification', name: 'ID checks', href: '/dashboard/agency/id-verification', icon: IdentificationIcon },
      { id: 'agency-inbox', name: 'Inbox', href: '/dashboard/agency/inbox', icon: ChatBubbleLeftRightIcon },
      { id: 'agency-settings', name: 'Governance', href: '/dashboard/agency#governance', icon: ShieldCheckIcon },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'wallet-summary', name: 'Wallet', sectionId: 'wallet-summary', icon: BanknotesIcon },
      { id: 'wallet-accounts', name: 'Accounts', sectionId: 'wallet-accounts', icon: RectangleStackIcon },
      { id: 'wallet-payouts', name: 'Payouts', sectionId: 'wallet-payouts', icon: CurrencyDollarIcon },
      { id: 'wallet-controls', name: 'Settings', sectionId: 'wallet-controls', icon: Cog6ToothIcon },
    ],
  },
];

export const AGENCY_ESCROW_MENU = [
  {
    id: 'escrow-ops',
    label: 'Escrow',
    items: [
      { id: 'escrow-overview', name: 'Home', sectionId: 'escrow-overview', icon: CurrencyDollarIcon },
      { id: 'escrow-accounts', name: 'Accounts', sectionId: 'escrow-accounts', icon: BanknotesIcon },
      { id: 'escrow-payouts', name: 'Payouts', sectionId: 'escrow-payouts', icon: CurrencyDollarIcon },
      { id: 'escrow-governance', name: 'Governance', sectionId: 'escrow-governance', icon: ShieldCheckIcon },
    ],
  },
];

export const AGENCY_CRM_MENU_SECTIONS = [
  {
    id: 'agency-pipeline',
    label: 'Pipeline',
    items: [
      { id: 'crm-stats', name: 'Summary', sectionId: 'crm-stats', icon: ChartBarIcon },
      { id: 'crm-deals', name: 'Deals', sectionId: 'crm-deals', icon: BriefcaseIcon },
      { id: 'crm-campaigns', name: 'Campaigns', sectionId: 'crm-campaigns', icon: MegaphoneIcon },
      { id: 'crm-intelligence', name: 'Signals', sectionId: 'crm-intelligence', icon: SparklesIcon },
    ],
  },
  {
    id: 'agency-accounts',
    label: 'Accounts',
    items: [
      { id: 'crm-accounts', name: 'Accounts', sectionId: 'crm-accounts', icon: UsersIcon },
      { id: 'crm-organisations', name: 'Organisations', sectionId: 'crm-organisations', icon: UserGroupIcon },
      { id: 'crm-settings', name: 'Settings', sectionId: 'crm-settings', icon: Cog6ToothIcon },
    ],
  },
];

export const AGENCY_AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user'];

export default AGENCY_DASHBOARD_MENU;
