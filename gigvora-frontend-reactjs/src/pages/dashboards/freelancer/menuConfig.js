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
    id: 'core',
    label: 'Core',
    items: [
      { id: 'profile-overview', name: 'Profile', description: 'Signals & context', icon: UserCircleIcon },
      { id: 'operations-hq', name: 'Ops', description: 'Workspace HQ', icon: HomeModernIcon },
      { id: 'delivery-ops', name: 'Delivery', description: 'Orders & SLAs', icon: ClipboardDocumentCheckIcon },
      { id: 'task-management', name: 'Tasks', description: 'Boards & sprints', icon: Squares2X2Icon },
      { id: 'planning', name: 'Calendar', description: 'Schedule', icon: CalendarDaysIcon },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    items: [
      { id: 'project-excellence', name: 'Excellence', description: 'Project quality', icon: ClipboardDocumentCheckIcon },
      { id: 'project-lab', name: 'Lab', description: 'Workflow lab', icon: BriefcaseIcon },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      {
        id: 'creation-studio',
        name: 'Create',
        description: 'Studio',
        href: '/dashboard/freelancer/creation-studio',
        icon: SparklesIcon,
      },
      { id: 'gig-marketplace', name: 'Market', description: 'Listings', icon: MegaphoneIcon },
      { id: 'automation', name: 'Signals', description: 'Automation', icon: BoltIcon },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'finance-compliance', name: 'Money', description: 'Cash & trust', icon: BanknotesIcon },
      { id: 'workspace-settings', name: 'Settings', description: 'Preferences', icon: Cog6ToothIcon },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    items: [
      { id: 'profile-showcase', name: 'Showcase', description: 'Portfolio', icon: PhotoIcon },
      { id: 'references', name: 'Social', description: 'Reviews', icon: ChatBubbleBottomCenterTextIcon },
      { id: 'network', name: 'Network', description: 'Community', icon: UserGroupIcon },
      { id: 'growth-partnerships', name: 'Growth', description: 'Pipeline', icon: ArrowTrendingUpIcon },
    ],
  },
  {
    id: 'quick',
    label: 'Quick',
    items: [
      { id: 'quick-access', name: 'Shortcuts', description: 'Dashboards', icon: RectangleStackIcon },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { id: 'support', name: 'Help', description: 'Support desk', icon: LifebuoyIcon },
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
  { id: 'freelancer-pipeline', label: 'Pipeline', href: '/dashboard/freelancer/pipeline' },
  { id: 'freelancer-creation-studio', label: 'Create', href: '/dashboard/freelancer/creation-studio' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
];
