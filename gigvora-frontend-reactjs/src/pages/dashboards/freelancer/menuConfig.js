import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarSquareIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  FolderIcon,
  DocumentTextIcon,
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
  ShieldCheckIcon,
  ScaleIcon,
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
    id: 'mission',
    label: 'Mission',
    items: [
      { id: 'profile-overview', name: 'Profile', icon: UserCircleIcon },
      { id: 'operations-hq', name: 'Ops', icon: HomeModernIcon },
      { id: 'delivery-ops', name: 'Delivery', icon: ClipboardDocumentCheckIcon },
      { id: 'task-management', name: 'Tasks', icon: Squares2X2Icon },
      { id: 'planning', name: 'Calendar', icon: CalendarDaysIcon },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'project-excellence', name: 'Projects', icon: ClipboardDocumentCheckIcon },
      { id: 'project-lab', name: 'Lab', icon: BriefcaseIcon },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { id: 'gig-studio', name: 'Studio', icon: SparklesIcon },
      { id: 'gig-marketplace', name: 'Market', icon: MegaphoneIcon },
      { id: 'automation', name: 'Signals', icon: BoltIcon },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'finance-compliance', name: 'Finance', icon: BanknotesIcon },
      { id: 'workspace-settings', name: 'Settings', icon: Cog6ToothIcon },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    items: [
      { id: 'profile-showcase', name: 'Showcase', icon: PhotoIcon },
      { id: 'references', name: 'Reviews', icon: ChatBubbleBottomCenterTextIcon },
      { id: 'timeline-management', name: 'Timeline', icon: DocumentTextIcon },
      { id: 'network', name: 'Network', icon: UserGroupIcon },
      { id: 'growth-partnerships', name: 'Growth', icon: ArrowTrendingUpIcon },
    ],
  },
  {
    id: 'quick',
    label: 'Quick',
    items: [{ id: 'quick-access', name: 'Launch', icon: RectangleStackIcon }],
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
        id: 'project-management',
        name: 'Projects',
        description: '',
        icon: ClipboardDocumentListIcon,
      },
      {
        id: 'task-management',
        name: 'Tasks',
        description: null,
        icon: Squares2X2Icon,
      },
      {
        id: 'planning',
        name: 'Planner',
        description: '',
        name: 'Calendar',
        description: null,
        icon: CalendarDaysIcon,
        href: '/dashboard/freelancer/planner',
      },
      {
        id: 'volunteering-management',
        name: 'Volunteer',
        description: 'Keep volunteer work organised.',
        icon: HeartIcon,
        href: '/dashboard/freelancer/volunteer',
      },
    ],
  },
  {
    id: 'workspace-excellence',
    label: 'Workspace',
    items: [
      {
        id: 'workspace',
        name: 'Workspace',
        description: 'Projects, delivery rooms, and collaboration tools.',
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
        id: 'gig-management',
        name: 'Gigs',
        description: 'Timeline, submissions, chat, and compliance for every gig.',
        icon: ClipboardDocumentCheckIcon,
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
      {
        id: 'id-verification',
        name: 'Identity',
        description: 'Verify',
        icon: ShieldCheckIcon,
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
        description: 'Sessions, spend, contacts.',
        href: '/dashboard/freelancer/networking',
        description: null,
        icon: UserGroupIcon,
      },
      {
        id: 'growth-partnerships',
        name: 'Partnerships',
        description: null,
        icon: ArrowTrendingUpIcon,
      },
      {
        id: 'portfolio-management',
        name: 'Portfolio',
        description: '',
        icon: FolderIcon,
        href: '/dashboard/freelancer/portfolio',
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
    items: [{ id: 'support', name: 'Support', description: '', icon: LifebuoyIcon }],
    items: [{ id: 'support', name: 'Help', icon: LifebuoyIcon }],
    items: [
      { id: 'support', name: 'Help', description: 'Support desk', icon: LifebuoyIcon },
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
  { id: 'freelancer-pipeline', label: 'Pipeline', href: '/dashboard/freelancer/pipeline' },
  { id: 'freelancer-creation-studio', label: 'Create', href: '/dashboard/freelancer/creation-studio' },
  { id: 'freelancer-pipeline', label: 'Pipeline HQ', href: '/dashboard/freelancer/pipeline' },
  { id: 'freelancer-networking', label: 'Network', href: '/dashboard/freelancer/networking' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
];
