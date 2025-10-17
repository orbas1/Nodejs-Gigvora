import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarSquareIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeModernIcon,
  LifebuoyIcon,
  MegaphoneIcon,
  PhotoIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

export const MENU_GROUPS = [
  {
    id: 'mission-control',
    label: 'Mission',
    items: [
      {
        id: 'profile-overview',
        name: 'Profile',
        description: null,
        icon: UserCircleIcon,
      },
      {
        id: 'operations-hq',
        name: 'Ops',
        description: null,
        icon: HomeModernIcon,
      },
      {
        id: 'delivery-ops',
        name: 'Delivery',
        description: null,
        icon: ClipboardDocumentCheckIcon,
      },
      {
        id: 'task-management',
        name: 'Tasks',
        description: null,
        icon: Squares2X2Icon,
      },
      {
        id: 'planning',
        name: 'Calendar',
        description: null,
        icon: CalendarDaysIcon,
      },
    ],
  },
  {
    id: 'workspace-excellence',
    label: 'Workspace',
    items: [
      {
        id: 'project-excellence',
        name: 'Workspaces',
        description: null,
        icon: ClipboardDocumentCheckIcon,
      },
      {
        id: 'project-lab',
        name: 'Lab',
        description: null,
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    id: 'gig-commerce',
    label: 'Commerce',
    items: [
      {
        id: 'gig-studio',
        name: 'Studio',
        description: null,
        icon: SparklesIcon,
      },
      {
        id: 'gig-marketplace',
        name: 'Marketplace',
        description: null,
        icon: MegaphoneIcon,
      },
      {
        id: 'automation',
        name: 'Signals',
        description: null,
        icon: BoltIcon,
      },
    ],
  },
  {
    id: 'finance-governance',
    label: 'Finance',
    items: [
      {
        id: 'finance-compliance',
        name: 'Cashflow',
        description: null,
        icon: BanknotesIcon,
      },
      {
        id: 'dispute-management',
        name: 'Disputes',
        description: null,
        icon: ScaleIcon,
      },
      {
        id: 'workspace-settings',
        name: 'Settings',
        description: null,
        icon: Cog6ToothIcon,
      },
    ],
  },
  {
    id: 'brand-growth',
    label: 'Growth',
    items: [
      {
        id: 'profile-showcase',
        name: 'Showcase',
        description: null,
        icon: PhotoIcon,
      },
      {
        id: 'references',
        name: 'Reviews',
        description: null,
        icon: ChatBubbleBottomCenterTextIcon,
      },
      {
        id: 'network',
        name: 'Network',
        description: null,
        icon: UserGroupIcon,
      },
      {
        id: 'growth-partnerships',
        name: 'Partnerships',
        description: null,
        icon: ArrowTrendingUpIcon,
      },
    ],
  },
  {
    id: 'operations-quick',
    label: 'Quick',
    items: [
      {
        id: 'quick-access',
        name: 'Access',
        description: null,
        icon: RectangleStackIcon,
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      {
        id: 'support',
        name: 'Support',
        description: null,
        icon: LifebuoyIcon,
      },
    ],
  },
];

export const QUICK_CARD_ICONS = {
  heart: HeartIcon,
  globe: GlobeAltIcon,
  chart: ChartBarSquareIcon,
};

export const AVAILABLE_DASHBOARDS = [
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'freelancer-pipeline', label: 'Pipeline HQ', href: '/dashboard/freelancer/pipeline' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
];
