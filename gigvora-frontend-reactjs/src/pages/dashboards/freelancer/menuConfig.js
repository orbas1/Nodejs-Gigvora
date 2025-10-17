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
} from '@heroicons/react/24/outline';

export const MENU_GROUPS = [
  {
    id: 'home',
    label: 'Home',
    items: [
      { id: 'overview', name: 'Overview', icon: UserCircleIcon },
      { id: 'ops', name: 'Ops', icon: HomeModernIcon },
      { id: 'delivery', name: 'Delivery', icon: ClipboardDocumentCheckIcon },
      { id: 'tasks', name: 'Tasks', icon: Squares2X2Icon },
      { id: 'plan', name: 'Plan', icon: CalendarDaysIcon },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'excellence', name: 'Excellence', icon: ClipboardDocumentCheckIcon },
      { id: 'lab', name: 'Lab', icon: BriefcaseIcon },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { id: 'studio', name: 'Studio', icon: SparklesIcon },
      { id: 'market', name: 'Market', icon: MegaphoneIcon },
      { id: 'signals', name: 'Signals', icon: BoltIcon },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'ledger', name: 'Ledger', icon: BanknotesIcon },
      { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    items: [
      { id: 'showcase', name: 'Showcase', icon: PhotoIcon },
      { id: 'reviews', name: 'Reviews', icon: ChatBubbleBottomCenterTextIcon },
      { id: 'network', name: 'Network', icon: UserGroupIcon },
      { id: 'growth', name: 'Growth', icon: ArrowTrendingUpIcon },
    ],
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    items: [{ id: 'quick', name: 'Quick', icon: RectangleStackIcon }],
  },
  {
    id: 'support',
    label: 'Support',
    items: [{ id: 'help', name: 'Support', icon: LifebuoyIcon }],
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
