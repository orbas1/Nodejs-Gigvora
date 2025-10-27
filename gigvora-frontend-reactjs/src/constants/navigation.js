import {
  BanknotesIcon,
  BellIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  GlobeAltIcon,
  HomeIcon,
  LightBulbIcon,
  MegaphoneIcon,
  PresentationChartBarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import { deepFreeze } from './menuSchema.js';

const marketingNavigationConfig = deepFreeze([
  {
    id: 'discover',
    label: 'Discover',
    description: 'Find the people, organisations, and signals that grow your marketplace reach.',
    theme: {
      button: 'bg-slate-900/5 hover:bg-slate-900/10',
    },
    sections: [
      {
        title: 'People & relationships',
        items: [
          {
            name: 'Connections',
            description: 'View introductions, track touch-points, and stay top of mind.',
            to: '/connections',
            icon: UsersIcon,
          },
          {
            name: 'Mentors & advisors',
            description: 'Invite strategic partners to support your upcoming launches.',
            to: '/mentors',
            icon: LightBulbIcon,
          },
          {
            name: 'Company pages',
            description: 'Showcase announcements and hiring signals from one branded hub.',
            to: '/pages',
            icon: BuildingOffice2Icon,
          },
        ],
      },
      {
        title: 'Communities',
        items: [
          {
            name: 'Professional groups',
            description: 'Host curated discussions and drops for your teams and partners.',
            to: '/groups',
            icon: Squares2X2Icon,
          },
          {
            name: 'Opportunities Explorer',
            description: 'Filter the network for people, teams, and organisations ready to collaborate.',
            to: '/search',
            icon: MegaphoneIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'collaborate',
    label: 'Collaborate',
    description: 'Coordinate delivery workstreams with dashboards built for hybrid teams.',
    theme: {
      button: 'bg-accent/5 hover:bg-accent/10',
      icon: 'text-accent',
    },
    sections: [
      {
        title: 'Team workspaces',
        items: [
          {
            name: 'Freelancer pipeline',
            description: 'Manage briefs, nurture candidates, and convert offers together.',
            to: '/dashboard/freelancer/pipeline',
            icon: BriefcaseIcon,
          },
          {
            name: 'Company analytics',
            description: 'Monitor revenue, growth, and retention across business units.',
            to: '/dashboard/company/analytics',
            icon: ChartBarIcon,
          },
          {
            name: 'Agency CRM',
            description: 'Align accounts, collaborators, and delivery playbooks in real time.',
            to: '/dashboard/agency/crm-pipeline',
            icon: GlobeAltIcon,
          },
        ],
      },
      {
        title: 'Automation',
        items: [
          {
            name: 'Experience Launchpad',
            description: 'Automate onboarding, playbooks, and launch readiness in one hub.',
            to: '/experience-launchpad',
            icon: RocketLaunchIcon,
          },
          {
            name: 'Trust centre',
            description: 'Keep compliance, privacy, and risk controls transparent for partners.',
            to: '/trust-center',
            icon: ShieldCheckIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    description: 'Stay informed with platform updates, billing guides, and customer stories.',
    theme: {
      button: 'bg-amber-500/5 hover:bg-amber-500/10',
      icon: 'text-amber-500',
    },
    sections: [
      {
        title: 'Learn',
        items: [
          {
            name: 'Product blog',
            description: 'Discover the latest Gigvora releases and customer spotlights.',
            to: '/blog',
            icon: ChartBarIcon,
          },
          {
            name: 'Resource hub',
            description: 'Guides, templates, and launch kits to support every team moment.',
            to: '/resources',
            icon: SparklesIcon,
          },
        ],
      },
      {
        title: 'Policies & support',
        items: [
          {
            name: 'Billing & subscriptions',
            description: 'Manage invoices, renewals, and plan usage in one place.',
            to: '/billing',
            icon: BriefcaseIcon,
          },
          {
            name: 'Policy centre',
            description: 'Review security, privacy, and community standards anytime.',
            to: '/policies',
            icon: ShieldCheckIcon,
          },
        ],
      },
    ],
  },
]);

const marketingSearchConfig = deepFreeze({
  id: 'marketing-search',
  label: 'Search Gigvora',
  placeholder: 'Search projects, people, and teams',
  ariaLabel: 'Search the Gigvora workspace catalogue',
  to: '/search',
});

export const marketingNavigation = marketingNavigationConfig;
export const MARKETING_SEARCH = marketingSearchConfig;
export const PRIMARY_NAVIGATION = deepFreeze({
  search: marketingSearchConfig,
  menus: marketingNavigationConfig,
});

export const roleDashboardMapping = deepFreeze({
  user: '/dashboard/user',
  freelancer: '/dashboard/freelancer',
  agency: '/dashboard/agency',
  company: '/dashboard/company',
  mentor: '/dashboard/mentor',
  headhunter: '/dashboard/headhunter',
  launchpad: '/dashboard/launchpad',
  admin: '/dashboard/admin',
});

export const timelineAccessRoles = Object.freeze([
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
  'admin',
]);

export function resolvePrimaryRoleKey(session) {
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  const primary =
    session?.primaryDashboard || session?.primaryMembership || session?.userType || memberships[0] || 'user';
  return primary.toString().toLowerCase();
}

export function resolvePrimaryNavigation(session) {
  const baseNavigation = [
    {
      id: 'home',
      label: 'Home',
      to: '/feed',
      icon: HomeIcon,
      ariaLabel: 'Return to your personalised feed',
      description: 'Catch the latest updates from your network and communities.',
      context: 'core',
      placement: 'dock',
    },
    {
      id: 'network',
      label: 'Network',
      to: '/connections',
      icon: UsersIcon,
      ariaLabel: 'Manage your relationships',
      description: 'Grow followers, nurture introductions, and review connection invites.',
      context: 'core',
      placement: 'dock',
    },
    {
      id: 'jobs',
      label: 'Jobs',
      to: '/jobs',
      icon: BriefcaseIcon,
      ariaLabel: 'Browse open roles and briefs',
      description: 'Explore opportunities tailored to your skills and interests.',
      context: 'core',
      placement: 'dock',
    },
    {
      id: 'projects',
      label: 'Projects',
      to: '/projects',
      icon: FolderIcon,
      ariaLabel: 'Track active projects',
      description: 'Review live collaborations and monitor project delivery health.',
      context: 'core',
      placement: 'dock',
    },
    {
      id: 'messaging',
      label: 'Messaging',
      to: '/inbox',
      icon: ChatBubbleLeftRightIcon,
      ariaLabel: 'Open your inbox',
      description: 'Catch up on conversations, introductions, and follow-ups.',
      context: 'core',
      placement: 'dock',
      type: 'inbox',
    },
    {
      id: 'alerts',
      label: 'Notifications',
      to: '/notifications',
      icon: BellIcon,
      ariaLabel: 'Review alerts and approvals',
      description: 'Respond to mentions, approvals, and platform nudges in one place.',
      context: 'core',
      placement: 'dock',
      type: 'notifications',
    },
    {
      id: 'workspaces',
      label: 'Work',
      to: roleDashboardMapping.user,
      icon: Squares2X2Icon,
      ariaLabel: 'Switch to your workspace hub',
      description: 'Jump into dashboards, analytics, and tools tailored to your role.',
      context: 'core',
      placement: 'dock',
    },
    {
      id: 'studio',
      label: 'Create',
      to: '/dashboard/user/creation-studio',
      icon: SparklesIcon,
      ariaLabel: 'Launch the creation studio',
      description: 'Spin up updates, drops, and briefs without leaving your flow.',
      context: 'core',
      placement: 'quick-action',
    },
  ];

  const primaryKey = resolvePrimaryRoleKey(session);
  const dashboardPath = roleDashboardMapping[primaryKey] ?? roleDashboardMapping.user;
  const workNavIndex = baseNavigation.findIndex((entry) => entry.id === 'workspaces');
  if (workNavIndex >= 0) {
    baseNavigation[workNavIndex] = {
      ...baseNavigation[workNavIndex],
      to: dashboardPath,
      description:
        primaryKey === 'user'
          ? 'Jump into dashboards, analytics, and tools tailored to your role.'
          : `Jump into ${primaryKey} dashboards, analytics, and tools tailored to your role.`,
    };
  }

  const specialisedNav = [];

  if (primaryKey === 'admin') {
    specialisedNav.push({
      id: 'policies',
      label: 'Policies',
      to: '/dashboard/admin/policies',
      icon: ShieldCheckIcon,
      ariaLabel: 'Review policy centre',
      description: 'Manage policies, permissions, and compliance controls.',
      context: 'persona',
      placement: 'toolbar',
    });
  }

  if (primaryKey === 'company') {
    specialisedNav.push({
      id: 'ats',
      label: 'Talent ATS',
      to: '/dashboard/company/ats',
      icon: BriefcaseIcon,
      ariaLabel: 'Open applicant tracking tools',
      description: 'Track hiring pipelines, interviews, and candidate momentum.',
      context: 'persona',
      placement: 'toolbar',
    });
    specialisedNav.push({
      id: 'analytics',
      label: 'Analytics',
      to: '/dashboard/company/analytics',
      icon: ChartBarIcon,
      ariaLabel: 'Explore hiring analytics',
      description: 'Measure growth, revenue, and engagement with real-time dashboards.',
      context: 'persona',
      placement: 'toolbar',
    });
  }

  if (primaryKey === 'freelancer') {
    specialisedNav.push({
      id: 'pipeline',
      label: 'Pipeline',
      to: '/dashboard/freelancer/pipeline',
      icon: PresentationChartBarIcon,
      ariaLabel: 'Track project pipeline',
      description: 'Progress leads into booked work with guided follow-ups.',
      context: 'persona',
      placement: 'toolbar',
    });
    specialisedNav.push({
      id: 'portfolio',
      label: 'Portfolio',
      to: '/dashboard/freelancer/portfolio',
      icon: FolderIcon,
      ariaLabel: 'Showcase your portfolio',
      description: 'Curate case studies and proof points tailored to new clients.',
      context: 'persona',
      placement: 'toolbar',
    });
  }

  if (primaryKey === 'agency') {
    specialisedNav.push({
      id: 'crm',
      label: 'Agency CRM',
      to: '/dashboard/agency/crm-pipeline',
      icon: BuildingOffice2Icon,
      ariaLabel: 'Navigate to agency CRM',
      description: 'Coordinate accounts, collaborators, and delivery cadences.',
      context: 'persona',
      placement: 'toolbar',
    });
    specialisedNav.push({
      id: 'finance',
      label: 'Finance',
      to: '/dashboard/agency/wallet-management',
      icon: BanknotesIcon,
      ariaLabel: 'Review agency finances',
      description: 'Oversee payouts, billing, and budget guardrails.',
      context: 'persona',
      placement: 'toolbar',
    });
  }

  if (primaryKey !== 'user' && primaryKey in roleDashboardMapping) {
    baseNavigation[0] = {
      ...baseNavigation[0],
      to: dashboardPath,
    };
  }

  if (specialisedNav.length) {
    return [baseNavigation[0], ...specialisedNav, ...baseNavigation.slice(1)];
  }

  return baseNavigation;
}

export function buildRoleOptions(session) {
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  if (!memberships.length) {
    return [{ key: 'user', label: 'User workspace', to: roleDashboardMapping.user }];
  }

  const options = memberships
    .map((membership) => {
      const key = membership.toString().toLowerCase();
      const to = roleDashboardMapping[key];
      if (!to) {
        return null;
      }
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const timelineEnabled = timelineAccessRoles.includes(key);
      return {
        key,
        label,
        to,
        timelineEnabled,
      };
    })
    .filter(Boolean);

  const unique = new Map();
  options.forEach((option) => {
    if (!unique.has(option.key)) {
      unique.set(option.key, option);
    }
  });

  return Array.from(unique.values());
}
