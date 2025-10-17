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
  StarIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export const MENU_GROUPS = [
  {
    id: 'focus',
    label: 'Focus',
    items: [
      { id: 'profile-overview', name: 'Profile', description: '', icon: UserCircleIcon },
      { id: 'operations-hq', name: 'Ops', description: '', icon: HomeModernIcon },
      { id: 'delivery-ops', name: 'Delivery', description: '', icon: ClipboardDocumentCheckIcon },
      { id: 'task-management', name: 'Tasks', description: '', icon: Squares2X2Icon },
      { id: 'planning', name: 'Calendar', description: '', icon: CalendarDaysIcon },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'project-excellence', name: 'Projects', description: '', icon: ClipboardDocumentCheckIcon },
      { id: 'project-lab', name: 'Lab', description: '', icon: BriefcaseIcon },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { id: 'gig-studio', name: 'Studio', description: '', icon: SparklesIcon },
      { id: 'gig-marketplace', name: 'Market', description: '', icon: MegaphoneIcon },
      { id: 'automation', name: 'Automation', description: '', icon: BoltIcon },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'finance-compliance', name: 'Ledger', description: '', icon: BanknotesIcon },
      { id: 'workspace-settings', name: 'Settings', description: '', icon: Cog6ToothIcon },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    items: [
      { id: 'profile-showcase', name: 'Showcase', description: '', icon: PhotoIcon },
      { id: 'review-management', name: 'Reviews', description: '', icon: StarIcon },
      { id: 'references', name: 'References', description: '', icon: ChatBubbleBottomCenterTextIcon },
      { id: 'network', name: 'Network', description: '', icon: UserGroupIcon },
      { id: 'growth-partnerships', name: 'Growth', description: '', icon: ArrowTrendingUpIcon },
    ],
  },
  {
    id: 'quick',
    label: 'Quick',
    items: [{ id: 'quick-access', name: 'Shortcuts', description: '', icon: RectangleStackIcon }],
  },
  {
    id: 'support',
    label: 'Support',
    items: [{ id: 'support', name: 'Support', description: '', icon: LifebuoyIcon }],
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
