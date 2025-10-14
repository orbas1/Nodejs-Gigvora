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
    id: 'mission-control',
    label: 'Mission control',
    items: [
      {
        id: 'profile-overview',
        name: 'Profile overview',
        description: 'Trust signals, live workstreams, and daily context.',
        icon: UserCircleIcon,
      },
      {
        id: 'operations-hq',
        name: 'Freelancer Operations HQ',
        description: 'Memberships, positioning, and enterprise-ready context.',
        icon: HomeModernIcon,
      },
      {
        id: 'delivery-ops',
        name: 'Delivery operations',
        description: 'Jobs, gig orders, and delivery cadences.',
        icon: ClipboardDocumentCheckIcon,
      },
      {
        id: 'task-management',
        name: 'Task management & delegation',
        description: 'Sprint planning, backlog health, and governance approvals.',
        icon: Squares2X2Icon,
      },
      {
        id: 'planning',
        name: 'Calendar & planning',
        description: 'Capacity forecast, rituals, and important dates.',
        icon: CalendarDaysIcon,
      },
    ],
  },
  {
    id: 'workspace-excellence',
    label: 'Workspace excellence',
    items: [
      {
        id: 'project-excellence',
        name: 'Project workspace excellence',
        description: 'Templates, collaboration cockpit, and deliverable vault.',
        icon: ClipboardDocumentCheckIcon,
      },
      {
        id: 'project-lab',
        name: 'Project lab',
        description: 'Compose enterprise-grade project workflows.',
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    id: 'gig-commerce',
    label: 'Gig commerce',
    items: [
      {
        id: 'gig-studio',
        name: 'Gig building studio',
        description: 'Design modular offers and pricing experiments.',
        icon: SparklesIcon,
      },
      {
        id: 'gig-marketplace',
        name: 'Gig marketplace operations',
        description: 'Listings, order pipeline, and client success automation.',
        icon: MegaphoneIcon,
      },
      {
        id: 'automation',
        name: 'Automation & signals',
        description: 'Playbooks, referrals, and health telemetry.',
        icon: BoltIcon,
      },
    ],
  },
  {
    id: 'finance-governance',
    label: 'Finance & governance',
    items: [
      {
        id: 'finance-compliance',
        name: 'Finance, compliance, & reputation',
        description: 'Cash flow, contracts, and reputation programs.',
        icon: BanknotesIcon,
      },
      {
        id: 'workspace-settings',
        name: 'Workspace settings',
        description: 'Personalization, feature toggles, and safety.',
        icon: Cog6ToothIcon,
      },
    ],
  },
  {
    id: 'brand-growth',
    label: 'Brand & growth',
    items: [
      {
        id: 'profile-showcase',
        name: 'Profile showcase',
        description: 'Banner, biography, portfolio, and media.',
        icon: PhotoIcon,
      },
      {
        id: 'references',
        name: 'References & reviews',
        description: 'Manage testimonials, references, and feed posts.',
        icon: ChatBubbleBottomCenterTextIcon,
      },
      {
        id: 'network',
        name: 'Suggested follows',
        description: 'Signal-boosted peers and collaboration pods.',
        icon: UserGroupIcon,
      },
      {
        id: 'growth-partnerships',
        name: 'Growth, partnerships, & skills',
        description: 'Pipeline CRM, alliances, learning, and spotlight.',
        icon: ArrowTrendingUpIcon,
      },
    ],
  },
  {
    id: 'operations-quick',
    label: 'Operational quick access',
    items: [
      {
        id: 'quick-access',
        name: 'Operational quick access',
        description: 'Workspace dashboards, gig commerce, and growth shortcuts.',
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
        name: 'Support desk',
        description: 'Fast help from Gigvora success engineers.',
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
